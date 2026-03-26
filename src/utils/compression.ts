import {
  COMPRESSION_MAX_SIZE_BYTES,
  COMPRESSION_QUALITY_START,
  COMPRESSION_QUALITY_MIN,
  COMPRESSION_QUALITY_STEP,
} from '../constants';
import type { ExportFormat } from '../types';

export async function compressCanvas(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
): Promise<Blob> {
  if (format === 'png') {
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('PNG toBlob failed'));
      }, 'image/png');
    });
  }

  // JPEG or WebP — progressive quality loop
  const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
  let quality = COMPRESSION_QUALITY_START;
  let blob: Blob | null = null;

  do {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), mimeType, quality);
    });
    if (!blob) throw new Error(`${mimeType} toBlob failed`);
    if (blob.size <= COMPRESSION_MAX_SIZE_BYTES) break;
    quality = parseFloat((quality - COMPRESSION_QUALITY_STEP).toFixed(2));
  } while (quality >= COMPRESSION_QUALITY_MIN);

  return blob!;
}
