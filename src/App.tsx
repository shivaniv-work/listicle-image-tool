import './App.css';
import { Header } from './components/Header';
import { CanvasList } from './components/CanvasList';
import { useImageTool } from './hooks/useImageTool';
import { usePasteHandler } from './hooks/usePasteHandler';

function App() {
  const {
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
  } = useImageTool();

  usePasteHandler(handleImagePaste);

  return (
    <div className="app">
      <Header
        project={project}
        format={format}
        items={items}
        onProjectChange={handleProjectChange}
        onFormatChange={setFormat}
        onToggleSelectAll={toggleSelectAll}
      />

      <main className="main">
        <CanvasList
          items={items}
          project={project}
          format={format}
          onImageDrop={drawImageToCanvas}
          onRename={renameCanvas}
          onDelete={removeCanvas}
          onToggleSelect={toggleSelect}
          onSetActive={setActiveCanvas}
          onAddCanvas={addCanvas}
          onRegisterCanvas={registerCanvasRef}
        />
      </main>
    </div>
  );
}

export default App;
