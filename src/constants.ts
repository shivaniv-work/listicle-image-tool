import type { ProjectConfig } from './types';

export const PROJECT_CONFIGS: ProjectConfig[] = [
  { id: 'soi',            name: 'SOI',            width: 683, defaultHeight: 400 },
  { id: 'soa',            name: 'SOA',            width: 800, defaultHeight: 500 },
  { id: 'mcb',            name: 'MCB',            width: 995, defaultHeight: 500 },
  { id: 'soc',            name: 'SOC',            width: 995, defaultHeight: 500 },
  { id: 'textbolt',       name: 'Textbolt',       width: 960, defaultHeight: 500 },
  { id: 'contentbridge',  name: 'Content Bridge', width: 708, defaultHeight: 500 },
  { id: 'mixbit',         name: 'Mixbit',         width: 912, defaultHeight: 500 },
  { id: 'welco',          name: 'Welco',          width: 912, defaultHeight: 500 },
];

export const COMPRESSION_MAX_SIZE_BYTES = 100_000; // 100 KB
export const COMPRESSION_QUALITY_START  = 0.85;
export const COMPRESSION_QUALITY_MIN    = 0.30;
export const COMPRESSION_QUALITY_STEP   = 0.10;
