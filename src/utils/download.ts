import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { CanvasItemState, ExportFormat } from '../types';
import { compressCanvas } from './compression';

function getFilename(item: CanvasItemState, index: number, ext: string): string {
  return item.customName ? `${item.customName}.${ext}` : `${index + 1}.${ext}`;
}

export async function downloadSingle(
  item: CanvasItemState,
  index: number,
  format: ExportFormat,
): Promise<void> {
  const canvas = item.canvasRef.current;
  if (!canvas || !item.hasImage) return;

  const ext = format === 'jpeg' ? 'jpg' : format;
  const blob = await compressCanvas(canvas, format);
  saveAs(blob, getFilename(item, index, ext));
}

export async function downloadBatch(
  selectedItems: CanvasItemState[],
  allItems: CanvasItemState[],
  format: ExportFormat,
): Promise<void> {
  const zip = new JSZip();
  const ext = format === 'jpeg' ? 'jpg' : format;

  // Use position in allItems for numbering
  for (const item of selectedItems) {
    const canvas = item.canvasRef.current;
    if (!canvas || !item.hasImage) continue;
    const index = allItems.indexOf(item);
    const blob = await compressCanvas(canvas, format);
    zip.file(getFilename(item, index, ext), blob);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'listicle-images.zip');
}
