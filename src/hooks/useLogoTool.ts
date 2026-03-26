import { useCallback, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { LOGO_PROJECT_SPECS } from '../constants';
import type { LogoProjectSpec } from '../constants';
import type { LogoEntry, LogoStatus } from '../types';
import { extractDomain, resolveLogos } from '../utils/logoFetch';
import { downloadLogoSvg, downloadLogoZip } from '../utils/svgExport';

type CanvasKey = string; // `${entryId}-${projectId}`

function drawToCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  spec: LogoProjectSpec,
): void {
  const { margin } = spec;

  if (spec.canvasWidth === 'auto') {
    const logoHeight = spec.canvasHeight - margin.top - margin.bottom;
    const logoWidth = Math.round((img.naturalWidth / img.naturalHeight) * logoHeight);
    canvas.width = logoWidth;
    canvas.height = spec.canvasHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, logoWidth, spec.canvasHeight);
    ctx.drawImage(img, 0, margin.top, logoWidth, logoHeight);
  } else {
    const canvasW = spec.canvasWidth as number;
    const canvasH = spec.canvasHeight;
    const availW = canvasW - margin.left - margin.right;
    const availH = canvasH - margin.top - margin.bottom;
    const scale = Math.min(availW / img.naturalWidth, availH / img.naturalHeight);
    const logoW = Math.round(img.naturalWidth * scale);
    const logoH = Math.round(img.naturalHeight * scale);
    const x = margin.left + Math.round((availW - logoW) / 2);
    const y = margin.top + Math.round((availH - logoH) / 2);
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.drawImage(img, x, y, logoW, logoH);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Blob URLs are same-origin — no crossOrigin needed, canvas stays clean.
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${url}`));
    img.src = url;
  });
}

export function useLogoTool() {
  const [entries, setEntries] = useState<LogoEntry[]>([]);
  const entriesRef = useRef<LogoEntry[]>([]);
  entriesRef.current = entries;
  const canvasRefsMap = useRef<Map<CanvasKey, HTMLCanvasElement | null>>(new Map());

  const registerCanvas = useCallback(
    (entryId: string, projectId: string, el: HTMLCanvasElement | null) => {
      canvasRefsMap.current.set(`${entryId}-${projectId}`, el);
    },
    [],
  );

  const drawEntryCanvases = useCallback(async (entry: LogoEntry, specId: string) => {
    const spec = LOGO_PROJECT_SPECS.find((s) => s.id === specId);
    if (!spec) return;
    const canvas = canvasRefsMap.current.get(`${entry.id}-${spec.id}`);
    if (!canvas) return;
    const imageUrl = spec.logoType === 'full' ? entry.fullLogoUrl : entry.faviconUrl;
    if (!imageUrl) return;
    try {
      const img = await loadImage(imageUrl);
      drawToCanvas(canvas, img, spec);
    } catch {
      // silently skip failed draw
    }
  }, []);

  const fetchLogos = useCallback(async (urlsText: string) => {
    const rawLines = urlsText.split('\n').map((s) => s.trim()).filter(Boolean);

    // Deduplicate by domain
    const seenDomains = new Set<string>();
    const validUrls: string[] = [];
    for (const line of rawLines) {
      const domain = extractDomain(line);
      if (domain && !seenDomains.has(domain)) {
        seenDomains.add(domain);
        validUrls.push(line);
      }
    }
    if (validUrls.length === 0) return;

    // Revoke old blob URLs to avoid memory leaks
    for (const e of entriesRef.current) {
      if (e.fullLogoUrl?.startsWith('blob:')) URL.revokeObjectURL(e.fullLogoUrl);
      if (e.faviconUrl?.startsWith('blob:')) URL.revokeObjectURL(e.faviconUrl);
    }

    // Clear old canvas refs for fresh entries
    canvasRefsMap.current.clear();

    const newEntries: LogoEntry[] = validUrls.map((url) => ({
      id: uuidv4(),
      inputUrl: url,
      domain: extractDomain(url),
      fullLogoUrl: null,
      faviconUrl: null,
      status: 'loading' as LogoStatus,
      errorMessage: null,
    }));

    setEntries(newEntries);

    await Promise.all(
      newEntries.map(async (entry) => {
        try {
          const logos = await resolveLogos(entry.inputUrl);
          const hasLogo = logos.fullLogoUrl !== null || logos.faviconUrl !== null;
          setEntries((prev) =>
            prev.map((e) =>
              e.id === entry.id
                ? {
                    ...e,
                    fullLogoUrl: logos.fullLogoUrl,
                    faviconUrl: logos.faviconUrl,
                    status: hasLogo ? 'ready' : ('error' as LogoStatus),
                    errorMessage: hasLogo ? null : `No logo found for ${logos.domain}`,
                  }
                : e,
            ),
          );
        } catch {
          setEntries((prev) =>
            prev.map((e) =>
              e.id === entry.id
                ? { ...e, status: 'error' as LogoStatus, errorMessage: `Failed to fetch logo for ${e.domain}` }
                : e,
            ),
          );
        }
      }),
    );
  }, []);

  const downloadSingle = useCallback(
    (entryId: string, projectId: string, domain: string) => {
      const canvas = canvasRefsMap.current.get(`${entryId}-${projectId}`);
      if (!canvas) return;
      downloadLogoSvg(canvas, `${domain}-${projectId}.svg`);
    },
    [],
  );

  const downloadAllZip = useCallback(async () => {
    const canvases: Array<{ canvas: HTMLCanvasElement; filename: string }> = [];
    for (const entry of entriesRef.current) {
      if (entry.status !== 'ready') continue;
      for (const spec of LOGO_PROJECT_SPECS) {
        const canvas = canvasRefsMap.current.get(`${entry.id}-${spec.id}`);
        if (canvas) canvases.push({ canvas, filename: `${entry.domain}-${spec.id}.svg` });
      }
    }
    if (canvases.length > 0) await downloadLogoZip(canvases);
  }, []);

  return {
    entries,
    fetchLogos,
    registerCanvas,
    drawEntryCanvases,
    downloadSingle,
    downloadAllZip,
  };
}
