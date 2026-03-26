import { useCallback, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PROJECT_CONFIGS } from '../constants';
import type { CanvasItemState, ExportFormat, ProjectConfig } from '../types';

function makeItem(): CanvasItemState {
  return {
    id: uuidv4(),
    customName: null,
    canvasRef: { current: null } as React.RefObject<HTMLCanvasElement | null>,
    hasImage: false,
    imageHeight: 400,
    isSelected: false,
    isActive: false,
  };
}

export function useImageTool() {
  const [project, setProject] = useState<ProjectConfig>(PROJECT_CONFIGS[0]);
  const [format, setFormat] = useState<ExportFormat>('jpeg');
  const [items, setItems] = useState<CanvasItemState[]>([makeItem()]);
  const activeIdRef = useRef<string | null>(null);

  // Register canvas ref from CanvasItem's ref callback
  const registerCanvasRef = useCallback((id: string, el: HTMLCanvasElement | null) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, canvasRef: { current: el } as React.RefObject<HTMLCanvasElement | null> } : it,
      ),
    );
  }, []);

  const setActiveCanvas = useCallback((id: string | null) => {
    activeIdRef.current = id;
    setItems((prev) => prev.map((it) => ({ ...it, isActive: it.id === id })));
  }, []);

  const addCanvas = useCallback(() => {
    setItems((prev) => [...prev, makeItem()]);
  }, []);

  const removeCanvas = useCallback((id: string) => {
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

  const toggleSelect = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, isSelected: !it.isSelected } : it)),
    );
  }, []);

  const toggleSelectAll = useCallback((selectAll: boolean) => {
    setItems((prev) => prev.map((it) => ({ ...it, isSelected: selectAll })));
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
        // No active canvas — create one and draw after React commits
        const newItem = makeItem();
        setItems((prev) => [...prev, newItem]);
        setTimeout(() => drawImageToCanvas(newItem.id, file), 0);
      }
    },
    [drawImageToCanvas],
  );

  const handleProjectChange = useCallback((newId: string) => {
    const newProject = PROJECT_CONFIGS.find((p) => p.id === newId)!;
    setProject(newProject);
    // Clear all canvases
    setItems([makeItem()]);
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
    toggleSelect,
    toggleSelectAll,
    drawImageToCanvas,
    handleImagePaste,
    handleProjectChange,
    setActiveCanvas,
    registerCanvasRef,
  };
}
