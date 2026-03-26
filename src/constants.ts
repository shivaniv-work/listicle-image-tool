import type { ProjectConfig } from './types';

export const PROJECT_CONFIGS: ProjectConfig[] = [
  { id: 'soi',            name: 'SOI',            width: 683, defaultHeight: 400 },
  { id: 'soa',            name: 'SOA',            width: 800, defaultHeight: 500 },
  { id: 'mcb',            name: 'MCB',            width: 800, defaultHeight: 400 },
  { id: 'soc',            name: 'SOC',            width: 995, defaultHeight: 500 },
  { id: 'textbolt',       name: 'Textbolt',       width: 960, defaultHeight: 500 },
  { id: 'contentbridge',  name: 'Content Bridge', width: 708, defaultHeight: 500 },
  { id: 'mixbit',         name: 'Mixbit',         width: 912, defaultHeight: 500 },
  { id: 'welco',          name: 'Welco',          width: 912, defaultHeight: 500 },
];

export interface LogoProjectSpec {
  id: string;
  name: string;
  logoType: 'full' | 'favicon';
  canvasWidth: number | 'auto';
  canvasHeight: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

export const LOGO_PROJECT_SPECS: LogoProjectSpec[] = [
  { id: 'soa', name: 'SOA', logoType: 'full',    canvasWidth: 100,    canvasHeight: 100, margin: { top: 0,  right: 0,  bottom: 0,  left: 0  } },
  { id: 'mcb', name: 'MCB', logoType: 'favicon', canvasWidth: 100,    canvasHeight: 100, margin: { top: 10, right: 10, bottom: 10, left: 10 } },
  { id: 'soi', name: 'SOI', logoType: 'favicon', canvasWidth: 100,    canvasHeight: 100, margin: { top: 10, right: 10, bottom: 10, left: 10 } },
  { id: 'soc', name: 'SOC', logoType: 'full',    canvasWidth: 'auto', canvasHeight: 40,  margin: { top: 5,  right: 0,  bottom: 5,  left: 0  } },
];

export const COMPRESSION_MAX_SIZE_BYTES = 100_000; // 100 KB
export const COMPRESSION_QUALITY_START  = 0.85;
export const COMPRESSION_QUALITY_MIN    = 0.30;
export const COMPRESSION_QUALITY_STEP   = 0.10;
