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
  onSetHeight: (height: number) => void;
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
  onSetHeight,
}: CanvasItemProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [heightDraft, setHeightDraft] = useState(item.canvasHeight);

  // Sync height input when image is loaded (height recomputed from aspect ratio)
  useEffect(() => {
    setHeightDraft(item.canvasHeight);
  }, [item.canvasHeight]);

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

  const commitHeight = () => {
    const h = Math.max(100, Math.min(3000, heightDraft || 100));
    setHeightDraft(h);
    onSetHeight(h);
  };

  return (
    <div
      className={`canvas-item${item.isActive ? ' canvas-item--active' : ''}`}
      style={{ width: project.width }}
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

        {/* Canvas size display with editable height */}
        <div className="canvas-item__size" onClick={(e) => e.stopPropagation()}>
          <span>{project.width}</span>
          <span className="canvas-item__size-sep">×</span>
          <input
            type="number"
            className="canvas-item__height-input"
            value={heightDraft}
            min={100}
            max={3000}
            step={10}
            onChange={(e) => setHeightDraft(Number(e.target.value))}
            onBlur={commitHeight}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitHeight();
            }}
          />
          <span>px</span>
        </div>

        <div className="canvas-item__actions">
          <button
            className="btn btn--sm btn--primary"
            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
            disabled={!item.hasImage}
            title={item.hasImage ? `Download as ${format.toUpperCase()}` : 'No image loaded'}
          >
            Download
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
          {/* No height prop — React updating height would clear canvas content */}
          <canvas
            ref={onRegisterCanvas}
            width={project.width}
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
