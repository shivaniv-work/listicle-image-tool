import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export function canvasToSvgBlob(canvas: HTMLCanvasElement): Blob {
  const w = canvas.width;
  const h = canvas.height;
  const base64 = canvas.toDataURL('image/png').split(',')[1];
  const svg = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    `  <image href="data:image/png;base64,${base64}" x="0" y="0" width="${w}" height="${h}"/>`,
    '</svg>',
  ].join('\n');
  return new Blob([svg], { type: 'image/svg+xml' });
}

export function downloadLogoSvg(canvas: HTMLCanvasElement, filename: string): void {
  saveAs(canvasToSvgBlob(canvas), filename);
}

export async function downloadLogoZip(
  canvases: Array<{ canvas: HTMLCanvasElement; filename: string }>,
): Promise<void> {
  const zip = new JSZip();
  for (const { canvas, filename } of canvases) {
    zip.file(filename, canvasToSvgBlob(canvas));
  }
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'logos.zip');
}
