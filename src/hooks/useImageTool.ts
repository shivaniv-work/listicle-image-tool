import { useCallback, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { v4 as uuidv4 } from 'uuid';
import { PROJECT_CONFIGS } from '../constants';
import type { CanvasItemState, ExportFormat, ProjectConfig } from '../types';

function makeItem(
  refsMap: Map<string, { current: HTMLCanvasElement | null }>,
  defaultHeight: number,
): CanvasItemState {
  const id = uuidv4();
  const canvasRef = { current: null } as React.RefObject<HTMLCanvasElement | null>;
  refsMap.set(id, canvasRef);
  return { id, customName: null, canvasRef, hasImage: false, isActive: false, canvasHeight: defaultHeight, imageFile: null };
}

export function useImageTool() {
  const [project, setProject] = useState<ProjectConfig>(PROJECT_CONFIGS[0]);
  const [format, setFormat] = useState<ExportFormat>('jpeg');

  const canvasRefsRef = useRef<Map<string, { current: HTMLCanvasElement | null }>>(new Map());
  const activeIdRef = useRef<string | null>(null);

  const [items, setItems] = useState<CanvasItemState[]>(() => [
    makeItem(canvasRefsRef.current, PROJECT_CONFIGS[0].defaultHeight),
  ]);

  // Always-current snapshots — safe to read in callbacks without stale closure.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const projectRef = useRef(project);
  projectRef.current = project;

  const registerCanvasRef = useCallback((id: string, el: HTMLCanvasElement | null) => {
    const ref = canvasRefsRef.current.get(id);
    if (ref) ref.current = el;
  }, []);

  const setActiveCanvas = useCallback((id: string | null) => {
    activeIdRef.current = id;
    setItems((prev) => prev.map((it) => ({ ...it, isActive: it.id === id })));
  }, []);

  const addCanvas = useCallback(() => {
    setItems((prev) => [...prev, makeItem(canvasRefsRef.current, projectRef.current.defaultHeight)]);
  }, []);

  const removeCanvas = useCallback((id: string) => {
    setItems((prev) => {
      if (prev.length <= 1) {
        // Only one canvas — reset it to blank instead of removing
        const item = prev[0];
        const canvas = item.canvasRef.current;
        const defaultHeight = projectRef.current.defaultHeight;
        if (canvas) {
          canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
          canvas.height = defaultHeight;
        }
        if (activeIdRef.current === id) activeIdRef.current = null;
        return [{ ...item, hasImage: false, isActive: false, canvasHeight: defaultHeight, imageFile: null }];
      }
      canvasRefsRef.current.delete(id);
      if (activeIdRef.current === id) activeIdRef.current = null;
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
            // Set dimensions first — this clears the canvas intentionally
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            canvas.getContext('2d')!.drawImage(img, 0, 0, canvasWidth, canvasHeight);
            URL.revokeObjectURL(url);
            return { ...it, hasImage: true, canvasHeight, imageFile: file };
          }),
        );
      };
      img.src = url;
    },
    [project],
  );

  const setCanvasHeight = useCallback((id: string, height: number) => {
    const item = itemsRef.current.find((it) => it.id === id);
    if (!item) return;

    const canvas = item.canvasRef.current;
    if (canvas) {
      if (item.imageFile) {
        const url = URL.createObjectURL(item.imageFile);
        const img = new Image();
        img.onload = () => {
          const w = projectRef.current.width;
          canvas.width = w;
          canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, w, height);
          URL.revokeObjectURL(url);
        };
        img.src = url;
      } else {
        canvas.height = height;
      }
    }

    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, canvasHeight: height } : it)),
    );
  }, []);

  const handleImagePaste = useCallback(
    (file: File) => {
      const activeId = activeIdRef.current;
      if (activeId) {
        drawImageToCanvas(activeId, file);
        return;
      }

      // If there is exactly one blank canvas, draw into it directly
      const current = itemsRef.current;
      if (current.length === 1 && !current[0].hasImage) {
        activeIdRef.current = current[0].id;
        drawImageToCanvas(current[0].id, file);
        return;
      }

      // Otherwise create a new canvas. flushSync forces React to commit the
      // new canvas to the DOM (and fire its ref callback) before we draw,
      // so canvasRef.current is guaranteed to be set.
      const newItem = makeItem(canvasRefsRef.current, projectRef.current.defaultHeight);
      flushSync(() => setItems((prev) => [...prev, newItem]));
      drawImageToCanvas(newItem.id, file);
    },
    [drawImageToCanvas],
  );

  const handleProjectChange = useCallback((newId: string) => {
    const newProject = PROJECT_CONFIGS.find((p) => p.id === newId)!;
    setProject(newProject);
    canvasRefsRef.current.clear();
    setItems([makeItem(canvasRefsRef.current, newProject.defaultHeight)]);
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
    setCanvasHeight,
  };
}
