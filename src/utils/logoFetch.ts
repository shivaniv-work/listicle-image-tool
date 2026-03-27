export interface LogoUrls {
  domain: string;
  fullLogoUrl: string | null; // blob: URL when non-null (canvas-safe)
  faviconUrl: string | null;  // blob: URL when non-null
}

export function extractDomain(url: string): string {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    return new URL(normalized).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  }
}

/** Wrap any URL through wsrv.nl (CORS: Access-Control-Allow-Origin: *, converts SVG→PNG) */
function wsrv(urlWithoutProtocol: string): string {
  return `https://wsrv.nl/?url=${urlWithoutProtocol}`;
}

/** Google's favicon service — returns best available icon for any domain */
function gstaticFavicon(domain: string, size: number): string {
  return wsrv(
    `t1.gstatic.com/faviconV2?client=SOCIAL%26type=FAVICON%26fallback_opts=TYPE,SIZE,URL%26url=https://${domain}%26size=${size}`,
  );
}

/** Download URL as a blob: URL (canvas-safe, no taint). Returns null if not a valid image. */
async function fetchToBlobUrl(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob.size < 200) return null;
    const t = blob.type.toLowerCase();
    if (t && !t.startsWith('image/') && t !== 'application/octet-stream') return null;
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/**
 * Fetch homepage HTML via a server-side proxy (CORS-safe).
 * Tries codetabs.com first (plain HTML response, reliable),
 * falls back to allorigins.win (JSON response).
 */
async function fetchPageHtml(domain: string): Promise<string> {
  // ── codetabs.com — returns raw HTML, has Access-Control-Allow-Origin: * ──
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch(
      `https://api.codetabs.com/v1/proxy/?quest=https://${domain}`,
      { signal: controller.signal },
    );
    clearTimeout(timer);
    if (res.ok) {
      const text = await res.text();
      if (text.length > 200) return text;
    }
  } catch { /* fall through */ }

  // ── allorigins.win fallback — returns JSON {contents: "...html..."} ──
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch(
      `https://api.allorigins.win/get?url=${encodeURIComponent(`https://${domain}`)}`,
      { signal: controller.signal },
    );
    clearTimeout(timer);
    if (res.ok) {
      const data = (await res.json()) as { contents: string };
      if (data.contents && data.contents.length > 200) return data.contents;
    }
  } catch { /* fall through */ }

  return '';
}

/**
 * Extract all <link rel="preload" as="image" href="..."> URLs from HTML.
 * These are the images a site tells the browser to load first — the logo
 * is almost always in this list on modern React/Next.js sites.
 */
function extractPreloadImageUrls(html: string): string[] {
  const urls: string[] = [];
  const tagRegex = /<link\s[^>]*as=["']image["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(html)) !== null) {
    const hrefMatch = m[0].match(/href=["']([^"']+)["']/i);
    if (hrefMatch?.[1]) urls.push(hrefMatch[1]);
  }
  return urls;
}

async function resolveFromHtml(html: string, domain: string, patterns: RegExp[]): Promise<string | null> {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;
    const raw = match[1];
    if (raw.startsWith('data:')) continue;
    const absolute = raw.startsWith('http')
      ? raw
      : `https://${domain}${raw.startsWith('/') ? '' : '/'}${raw}`;
    const result = await fetchToBlobUrl(wsrv(absolute.replace(/^https?:\/\//, '')));
    if (result) return result;
  }
  return null;
}

/**
 * Extract the full brand logo from the homepage HTML.
 * Strategy (in priority order):
 *   1. <link rel="preload" as="image"> with "logo" in the href  ← catches Next.js / React sites
 *   2. og:image                                                  ← brand social card
 *   3. apple-touch-icon                                          ← square app icon
 *   4. First preloaded image (fetchPriority="high")              ← generic fallback
 */
async function fetchFullLogoFromHtml(domain: string): Promise<string | null> {
  const html = await fetchPageHtml(domain);
  if (!html) return null;

  // 1. Preloaded images — filter for ones with "logo" in the URL (most reliable)
  const preloadUrls = extractPreloadImageUrls(html);
  const logoPreloads = preloadUrls.filter((u) => /logo/i.test(u));
  for (const raw of logoPreloads) {
    const absolute = raw.startsWith('http') ? raw : `https://${domain}${raw.startsWith('/') ? '' : '/'}${raw}`;
    const result = await fetchToBlobUrl(wsrv(absolute.replace(/^https?:\/\//, '')));
    if (result) return result;
  }

  // 2. og:image and apple-touch-icon via regex
  const metaResult = await resolveFromHtml(html, domain, [
    /og:image[^>]*\scontent=["']?([^"'\s>]+)/i,
    /content=["']?([^"'\s>]+)["']?[^>]*og:image/i,
    /apple-touch-icon[^>]*\shref=["']?([^"'\s>]+)/i,
    /href=["']?([^"'\s>]+)["']?[^>]*apple-touch-icon/i,
  ]);
  if (metaResult) return metaResult;

  // 3. First preloaded image marked fetchPriority="high" (often the hero/logo)
  const highPriorityPreloads = preloadUrls.filter((u) => {
    const tagStart = html.lastIndexOf('<link', html.indexOf(u));
    const tag = html.slice(tagStart, html.indexOf('>', tagStart) + 1);
    return /fetchpriority=["']high["']/i.test(tag);
  });
  for (const raw of highPriorityPreloads) {
    const absolute = raw.startsWith('http') ? raw : `https://${domain}${raw.startsWith('/') ? '' : '/'}${raw}`;
    const result = await fetchToBlobUrl(wsrv(absolute.replace(/^https?:\/\//, '')));
    if (result) return result;
  }

  return null;
}

export async function resolveLogos(inputUrl: string): Promise<LogoUrls> {
  const domain = extractDomain(inputUrl);

  // ── Full logo (SOA / SOC) ──────────────────────────────────────────────
  // 1. Clearbit — best for well-known brands (returns 404 for unknown ones)
  let fullLogoUrl = await fetchToBlobUrl(wsrv(`logo.clearbit.com/${domain}`));

  // 2. HTML extraction: preload logo → og:image → apple-touch-icon
  if (!fullLogoUrl) {
    fullLogoUrl = await fetchFullLogoFromHtml(domain);
  }

  // ── Favicon (MCB / SOI) ───────────────────────────────────────────────
  // 1. DuckDuckGo favicon service
  let faviconUrl = await fetchToBlobUrl(wsrv(`icons.duckduckgo.com/ip3/${domain}.ico`));

  // 2. Google faviconV2 at 128px
  if (!faviconUrl) {
    faviconUrl = await fetchToBlobUrl(gstaticFavicon(domain, 128));
  }

  return { domain, fullLogoUrl, faviconUrl };
}
