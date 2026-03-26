import React, { useEffect, useRef, useState } from 'react';
import type { CanvasItemState, ExportFormat, ProjectConfig } from '../types';
import { downloadSingle } from '../utils/download';
import { DropZone } from './DropZone';

interface CanvasItemProps {
  item: CanvasItemState;
  index: number;
  project: ProjectConfig;
  format: ExportFormat;
  onImageDrop: (file: File) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onSetActive: () => void;
  onRegisterCanvas: (el: HTMLCanvasElement | null) => void;
}

export function CanvasItem({
  item,
  index,
  project,
  format,
  onImageDrop,
  onRename,
  onDelete,
  onSetActive,
  onRegisterCanvas,
}: CanvasItemProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const displayLabel = item.customName ?? `Image ${index + 1}`;

  const startEdit = () => {
    setDraftName(item.customName ?? '');
    setEditing(true);
  };

  const commitEdit = () => {
    onRename(draftName);
    setEditing(false);
  };

  const cancelEdit = () => setEditing(false);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImageDrop(file);
    e.target.value = '';
  };

  const handleDownload = async () => {
    await downloadSingle(item, index, format);
  };

  const openFilePicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`canvas-item${item.isActive ? ' canvas-item--active' : ''}`}
      onClick={onSetActive}
    >
      {/* Top bar */}
      <div className="canvas-item__bar">
        {editing ? (
          <input
            ref={inputRef}
            className="canvas-item__name-input"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
            onClick={(e) => e.stopPropagation()}
            placeholder={`Image ${index + 1}`}
          />
        ) : (
          <span
            className="canvas-item__label"
            onDoubleClick={(e) => { e.stopPropagation(); startEdit(); }}
            title="Double-click to rename"
          >
            {displayLabel}
          </span>
        )}

        <div className="canvas-item__actions">
          <button
            className="btn btn--sm btn--primary"
            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
            disabled={!item.hasImage}
            title={item.hasImage ? `Download as ${format.toUpperCase()}` : 'No image loaded'}
          >
            {format === 'jpeg' ? 'JPG' : format === 'png' ? 'PNG' : 'WebP'}
          </button>
          <button
            className="btn btn--sm btn--danger"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete canvas"
          >
            ✕
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {/* Canvas area */}
      <DropZone onImageDrop={onImageDrop} className="canvas-item__drop-zone">
        <div
          className="canvas-item__canvas-wrapper"
          style={{ width: project.width }}
        >
          {!item.hasImage && (
            <div
              className="canvas-item__placeholder"
              onClick={openFilePicker}
              title="Click to upload an image"
            >
              <span>Drag image, paste, or click to upload</span>
            </div>
          )}
          <canvas
            ref={onRegisterCanvas}
            width={project.width}
            height={item.imageHeight}
            style={{ display: item.hasImage ? 'block' : 'none' }}
          />
        </div>
      </DropZone>

      {format === 'png' && item.hasImage && (
        <p className="canvas-item__png-note">PNG is lossless — file may exceed 100 KB</p>
      )}
    </div>
  );
}
