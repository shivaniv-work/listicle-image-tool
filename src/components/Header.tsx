import type { CanvasItemState, ExportFormat, ProjectConfig } from '../types';
import { PROJECT_CONFIGS } from '../constants';
import { downloadBatch } from '../utils/download';

interface HeaderProps {
  project: ProjectConfig;
  format: ExportFormat;
  items: CanvasItemState[];
  onProjectChange: (id: string) => void;
  onFormatChange: (f: ExportFormat) => void;
  onToggleSelectAll: (all: boolean) => void;
}

export function Header({
  project,
  format,
  items,
  onProjectChange,
  onFormatChange,
  onToggleSelectAll,
}: HeaderProps) {
  const selectedItems = items.filter((it) => it.isSelected && it.hasImage);
  const allSelected = items.length > 0 && items.every((it) => it.isSelected);
  const anyWithImage = items.some((it) => it.hasImage);

  const handleBatchDownload = async () => {
    const targets = selectedItems.length > 0 ? selectedItems : items.filter((it) => it.hasImage);
    await downloadBatch(targets, items, format);
  };

  const batchLabel =
    selectedItems.length > 0
      ? `Download Selected (${selectedItems.length}) ZIP`
      : 'Download All ZIP';

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

        {/* Select all */}
        <label className="header__select-all">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => onToggleSelectAll(e.target.checked)}
          />
          <span>All</span>
        </label>

        {/* Batch download */}
        <button
          className="btn btn--primary"
          onClick={handleBatchDownload}
          disabled={!anyWithImage}
          title={anyWithImage ? batchLabel : 'No images loaded'}
        >
          {batchLabel}
        </button>
      </div>
    </header>
  );
}
