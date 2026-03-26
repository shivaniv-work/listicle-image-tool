export type ExportFormat = 'jpeg' | 'png' | 'webp';

export interface ProjectConfig {
  id: string;
  name: string;
  width: number;
  defaultHeight: number;
}

export interface CanvasItemState {
  id: string;
  customName: string | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  hasImage: boolean;
  isActive: boolean;
}
