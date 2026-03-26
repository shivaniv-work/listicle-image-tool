import { useState } from 'react';
import './App.css';
import { Header } from './components/Header';
import { CanvasList } from './components/CanvasList';
import { LogoTool } from './components/LogoTool';
import { useImageTool } from './hooks/useImageTool';
import { usePasteHandler } from './hooks/usePasteHandler';

type ActiveTab = 'images' | 'logos';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('images');

  const {
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
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="main">
        {activeTab === 'images' ? (
          <CanvasList
            items={items}
            project={project}
            format={format}
            onImageDrop={drawImageToCanvas}
            onRename={renameCanvas}
            onDelete={removeCanvas}
            onSetActive={setActiveCanvas}
            onAddCanvas={addCanvas}
            onRegisterCanvas={registerCanvasRef}
            onSetCanvasHeight={setCanvasHeight}
          />
        ) : (
          <LogoTool />
        )}
      </main>
    </div>
  );
}

export default App;
