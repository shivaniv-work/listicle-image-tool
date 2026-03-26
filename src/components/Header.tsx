import type { CanvasItemState, ExportFormat, ProjectConfig } from '../types';
import { PROJECT_CONFIGS } from '../constants';
import { downloadBatch } from '../utils/download';

interface HeaderProps {
  project: ProjectConfig;
  format: ExportFormat;
  items: CanvasItemState[];
  onProjectChange: (id: string) => void;
  onFormatChange: (f: ExportFormat) => void;
}

export function Header({
  project,
  format,
  items,
  onProjectChange,
  onFormatChange,
}: HeaderProps) {
  const imagesReady = items.filter((it) => it.hasImage);
  const anyWithImage = imagesReady.length > 0;

  const handleDownloadAll = async () => {
    await downloadBatch(imagesReady, items, format);
  };

  return (
    <header className="header">
      <div className="header__left">
        <h1 className="header__title">Listicle Image Tool</h1>

        <select
          className="header__select"
          value={project.id}
          onChange={(e) => onProjectChange(e.target.value)}
        >
          {PROJECT_CONFIGS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.width}px)
            </option>
          ))}
        </select>
      </div>

      <div className="header__right">
        {/* Format toggle */}
        <div className="format-toggle">
          <button
            className={`btn btn--sm${format === 'jpeg' ? ' btn--active' : ''}`}
            onClick={() => onFormatChange('jpeg')}
          >
            JPG
          </button>
          <button
            className={`btn btn--sm${format === 'png' ? ' btn--active' : ''}`}
            onClick={() => onFormatChange('png')}
          >
            PNG
          </button>
          <button
            className={`btn btn--sm${format === 'webp' ? ' btn--active' : ''}`}
            onClick={() => onFormatChange('webp')}
          >
            WebP
          </button>
        </div>

        {/* Batch download — always downloads ALL loaded images */}
        <button
          className="btn btn--primary"
          onClick={handleDownloadAll}
          disabled={!anyWithImage}
          title={anyWithImage ? `Download all ${imagesReady.length} image(s) as ZIP` : 'No images loaded'}
        >
          Download All ZIP
        </button>
      </div>
    </header>
  );
}
