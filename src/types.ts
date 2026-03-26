export type ExportFormat = 'jpeg' | 'png' | 'webp';

export type LogoStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface LogoEntry {
  id: string;
  inputUrl: string;
  domain: string;
  fullLogoUrl: string | null;
  faviconUrl: string | null;
  status: LogoStatus;
  errorMessage: string | null;
}

export interface LogoCanvasState {
  entryId: string;
  project: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isReady: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

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
  canvasHeight: number;
  imageFile: File | null;
}
