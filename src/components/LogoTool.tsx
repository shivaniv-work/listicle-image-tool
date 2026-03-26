import { useEffect, useRef, useState } from 'react';
import { LOGO_PROJECT_SPECS } from '../constants';
import type { LogoEntry } from '../types';
import { useLogoTool } from '../hooks/useLogoTool';

export function LogoTool() {
  const [urlInput, setUrlInput] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(LOGO_PROJECT_SPECS[0].id);
  const { entries, fetchLogos, registerCanvas, drawEntryCanvases, downloadSingle, downloadAllZip } =
    useLogoTool();

  const hasReady = entries.some((e) => e.status === 'ready');

  const handleFetch = () => {
    const trimmed = urlInput.trim();
    if (trimmed) fetchLogos(trimmed);
  };

  // Redraw all ready entries when the selected project changes
  useEffect(() => {
    for (const entry of entries) {
      if (entry.status === 'ready') {
        drawEntryCanvases(entry, selectedProjectId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  return (
    <div className="logo-tool">
      <div className="logo-tool__input">
        <label className="logo-tool__label">Enter website URLs (one per line):</label>
        <textarea
          className="logo-tool__textarea"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder={'https://google.com\nhttps://stripe.com'}
          rows={4}
        />
        <div className="logo-tool__controls">
          {/* Project selector */}
          <div className="logo-tool__project-selector">
            {LOGO_PROJECT_SPECS.map((spec) => (
              <button
                key={spec.id}
                className={`btn btn--sm${selectedProjectId === spec.id ? ' btn--active' : ''}`}
                onClick={() => setSelectedProjectId(spec.id)}
              >
                {spec.name}
              </button>
            ))}
          </div>
          <button className="btn btn--primary" onClick={handleFetch}>
            Fetch Logos
          </button>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="logo-tool__results">
          <div className="logo-tool__results-header">
            <button
              className="btn btn--primary btn--sm"
              onClick={downloadAllZip}
              disabled={!hasReady}
            >
              Download All SVG ZIP
            </button>
          </div>

          {entries.map((entry) => (
            <LogoEntryCard
              key={entry.id}
              entry={entry}
              selectedProjectId={selectedProjectId}
              registerCanvas={registerCanvas}
              drawEntryCanvases={drawEntryCanvases}
              downloadSingle={downloadSingle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface EntryCardProps {
  entry: LogoEntry;
  selectedProjectId: string;
  registerCanvas: (entryId: string, projectId: string, el: HTMLCanvasElement | null) => void;
  drawEntryCanvases: (entry: LogoEntry, specId: string) => Promise<void>;
  downloadSingle: (entryId: string, projectId: string, domain: string) => void;
}

function LogoEntryCard({
  entry,
  selectedProjectId,
  registerCanvas,
  drawEntryCanvases,
  downloadSingle,
}: EntryCardProps) {
  const drawnKey = useRef('');

  useEffect(() => {
    const key = `${entry.id}-${selectedProjectId}-${entry.status}`;
    if (entry.status === 'ready' && drawnKey.current !== key) {
      drawnKey.current = key;
      drawEntryCanvases(entry, selectedProjectId);
    }
  }, [entry, selectedProjectId, drawEntryCanvases]);

  const spec = LOGO_PROJECT_SPECS.find((s) => s.id === selectedProjectId)!;
  const sizeLabel =
    spec.canvasWidth === 'auto'
      ? `auto×${spec.canvasHeight}`
      : `${spec.canvasWidth}×${spec.canvasHeight}`;

  return (
    <div className="logo-entry">
      <div className="logo-entry__header">
        <span className="logo-entry__domain">{entry.domain}</span>
        {entry.status === 'loading' && (
          <span className="logo-entry__spinner" aria-label="Loading" />
        )}
        {entry.status === 'error' && (
          <span className="logo-entry__error">{entry.errorMessage}</span>
        )}
      </div>

      {entry.status !== 'error' && (
        <div className="logo-entry__grid">
          <div className="logo-project-card">
            <div className="logo-project-card__header">
              <span className="logo-project-card__name">{spec.name}</span>
              <span className="logo-project-card__size">{sizeLabel}</span>
            </div>
            <div className="logo-project-card__canvas-wrap">
              {entry.status === 'loading' ? (
                <div className="logo-project-card__loading" />
              ) : (
                <canvas
                  ref={(el) => registerCanvas(entry.id, selectedProjectId, el)}
                  className="logo-project-card__canvas"
                />
              )}
            </div>
            <button
              className="btn btn--sm logo-project-card__dl"
              disabled={entry.status !== 'ready'}
              onClick={() => downloadSingle(entry.id, selectedProjectId, entry.domain)}
            >
              Download SVG
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
