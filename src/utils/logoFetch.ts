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

/** Wrap any URL through wsrv.nl which adds Access-Control-Allow-Origin: * */
function wsrv(urlWithoutProtocol: string): string {
  return `https://wsrv.nl/?url=${urlWithoutProtocol}`;
}

/** Google's high-quality favicon service (returns apple-touch-icon / best available) */
function gstaticFavicon(domain: string, size: number): string {
  // Inner & must be encoded as %26 so wsrv.nl parses its own query string correctly
  return wsrv(
    `t1.gstatic.com/faviconV2?client=SOCIAL%26type=FAVICON%26fallback_opts=TYPE,SIZE,URL%26url=https://${domain}%26size=${size}`,
  );
}

/**
 * Downloads a URL and returns a blob: URL (canvas-safe, no taint).
 * Returns null if the response is not a valid image.
 */
async function fetchToBlobUrl(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob.size < 200) return null; // filter tiny error/placeholder responses
    const t = blob.type.toLowerCase();
    if (t && !t.startsWith('image/') && t !== 'application/octet-stream') return null;
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/** Try to extract a logo URL from the page's HTML meta tags */
async function fetchHtmlFallback(domain: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    // allorigins.win proxies the HTML fetch server-side
    const res = await fetch(
      `https://api.allorigins.win/get?url=${encodeURIComponent(`https://${domain}`)}`,
      { signal: controller.signal },
    );
    clearTimeout(timer);
    const data = (await res.json()) as { contents: string };
    const html = data.contents ?? '';

    const patterns: RegExp[] = [
      /apple-touch-icon[^>]*\shref=["']?([^"'\s>]+)/i,
      /href=["']?([^"'\s>]+)["']?[^>]*apple-touch-icon/i,
      /og:image[^>]*\scontent=["']?([^"'\s>]+)/i,
      /content=["']?([^"'\s>]+)["']?[^>]*og:image/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (!match?.[1]) continue;
      const raw = match[1];
      if (raw.startsWith('data:')) continue;
      const absolute = raw.startsWith('http')
        ? raw
        : `https://${domain}${raw.startsWith('/') ? '' : '/'}${raw}`;
      // Proxy the extracted image URL through wsrv for CORS
      const result = await fetchToBlobUrl(wsrv(absolute.replace(/^https?:\/\//, '')));
      if (result) return result;
    }
  } catch {
    // HTML fetch failed — fall through
  }
  return null;
}

export async function resolveLogos(inputUrl: string): Promise<LogoUrls> {
  const domain = extractDomain(inputUrl);

  // ── Full logo ──────────────────────────────────────────────────────────
  // 1. Clearbit (great for well-known companies, returns 404 otherwise)
  let fullLogoUrl = await fetchToBlobUrl(wsrv(`logo.clearbit.com/${domain}`));

  // 2. Google faviconV2 at 256px (fetches apple-touch-icon quality from the site)
  if (!fullLogoUrl) {
    fullLogoUrl = await fetchToBlobUrl(gstaticFavicon(domain, 256));
  }

  // 3. HTML meta tag extraction (og:image / apple-touch-icon)
  if (!fullLogoUrl) {
    fullLogoUrl = await fetchHtmlFallback(domain);
  }

  // ── Favicon ────────────────────────────────────────────────────────────
  // 1. DuckDuckGo favicon (reliable, covers almost every domain)
  let faviconUrl = await fetchToBlobUrl(wsrv(`icons.duckduckgo.com/ip3/${domain}.ico`));

  // 2. Google faviconV2 at 128px
  if (!faviconUrl) {
    faviconUrl = await fetchToBlobUrl(gstaticFavicon(domain, 128));
  }

  return { domain, fullLogoUrl, faviconUrl };
}
