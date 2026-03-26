import type { CanvasItemState, ExportFormat, ProjectConfig } from '../types';
import { CanvasItem } from './CanvasItem';

interface CanvasListProps {
  items: CanvasItemState[];
  project: ProjectConfig;
  format: ExportFormat;
  onImageDrop: (id: string, file: File) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onSetActive: (id: string) => void;
  onAddCanvas: () => void;
  onRegisterCanvas: (id: string, el: HTMLCanvasElement | null) => void;
}

export function CanvasList({
  items,
  project,
  format,
  onImageDrop,
  onRename,
  onDelete,
  onToggleSelect,
  onSetActive,
  onAddCanvas,
  onRegisterCanvas,
}: CanvasListProps) {
  return (
    <div className="canvas-list">
      {items.map((item, index) => (
        <CanvasItem
          key={item.id}
          item={item}
          index={index}
          project={project}
          format={format}
          onImageDrop={(file) => onImageDrop(item.id, file)}
          onRename={(name) => onRename(item.id, name)}
          onDelete={() => onDelete(item.id)}
          onToggleSelect={() => onToggleSelect(item.id)}
          onSetActive={() => onSetActive(item.id)}
          onRegisterCanvas={(el) => onRegisterCanvas(item.id, el)}
        />
      ))}

      <button className="fab" onClick={onAddCanvas} title="Add canvas">
        +
      </button>
    </div>
  );
}
