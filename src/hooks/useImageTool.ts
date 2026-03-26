import { useCallback, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PROJECT_CONFIGS } from '../constants';
import type { CanvasItemState, ExportFormat, ProjectConfig } from '../types';

// canvasRefsRef is passed in so the Map is populated at item-creation time,
// before any render. This means registerCanvasRef can always find the slot
// immediately when the ref callback fires — no timing issues.
function makeItem(
  refsMap: Map<string, { current: HTMLCanvasElement | null }>,
): CanvasItemState {
  const id = uuidv4();
  const canvasRef = { current: null } as React.RefObject<HTMLCanvasElement | null>;
  refsMap.set(id, canvasRef);
  return { id, customName: null, canvasRef, hasImage: false, imageHeight: 400, isActive: false };
}

export function useImageTool() {
  const [project, setProject] = useState<ProjectConfig>(PROJECT_CONFIGS[0]);
  const [format, setFormat] = useState<ExportFormat>('jpeg');

  // Stable Map: id → canvasRef object. Populated synchronously inside makeItem,
  // so it is always ready before React calls the ref callback.
  const canvasRefsRef = useRef<Map<string, { current: HTMLCanvasElement | null }>>(new Map());
  const activeIdRef = useRef<string | null>(null);

  const [items, setItems] = useState<CanvasItemState[]>(() => [makeItem(canvasRefsRef.current)]);

  // Directly mutates the canvasRef slot — no setState, so no re-render loop.
  const registerCanvasRef = useCallback((id: string, el: HTMLCanvasElement | null) => {
    const ref = canvasRefsRef.current.get(id);
    if (ref) ref.current = el;
  }, []);

  const setActiveCanvas = useCallback((id: string | null) => {
    activeIdRef.current = id;
    setItems((prev) => prev.map((it) => ({ ...it, isActive: it.id === id })));
  }, []);

  const addCanvas = useCallback(() => {
    setItems((prev) => [...prev, makeItem(canvasRefsRef.current)]);
  }, []);

  const removeCanvas = useCallback((id: string) => {
    canvasRefsRef.current.delete(id);
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((it) => it.id !== id);
    });
  }, []);

  const renameCanvas = useCallback((id: string, name: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, customName: name.trim() || null } : it)),
    );
  }, []);

  const drawImageToCanvas = useCallback(
    (id: string, file: File) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvasWidth = project.width;
        const canvasHeight = Math.round((img.naturalHeight / img.naturalWidth) * canvasWidth);
        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== id) return it;
            const canvas = it.canvasRef.current;
            if (!canvas) return it;
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
            URL.revokeObjectURL(url);
            return { ...it, hasImage: true, imageHeight: canvasHeight };
          }),
        );
      };
      img.src = url;
    },
    [project],
  );

  const handleImagePaste = useCallback(
    (file: File) => {
      const activeId = activeIdRef.current;
      if (activeId) {
        drawImageToCanvas(activeId, file);
      } else {
        // No active canvas — create one. The canvasRefsRef Map is populated
        // immediately inside makeItem, so by the time setTimeout fires
        // (after React commits + ref callbacks run), canvasRef.current is set.
        const newItem = makeItem(canvasRefsRef.current);
        setItems((prev) => [...prev, newItem]);
        setTimeout(() => drawImageToCanvas(newItem.id, file), 0);
      }
    },
    [drawImageToCanvas],
  );

  const handleProjectChange = useCallback((newId: string) => {
    const newProject = PROJECT_CONFIGS.find((p) => p.id === newId)!;
    setProject(newProject);
    canvasRefsRef.current.clear();
    setItems([makeItem(canvasRefsRef.current)]);
    activeIdRef.current = null;
  }, []);

  return {
    project,
    format,
    setFormat,
    items,
    addCanvas,
    removeCanvas,
    renameCanvas,
    drawImageToCanvas,
    handleImagePaste,
    handleProjectChange,
    setActiveCanvas,
    registerCanvasRef,
  };
}
