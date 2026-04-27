import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Project, ToolCreative } from "@/lib/types";
import { MAX_HISTORY, CREATIVE_MAX_ZOOM, MIN_ZOOM } from "@/lib/types";
import { createEmptyGrid, generateThumbnail, saveProject } from "@/lib/storage";
import PixelCanvas from "@/components/PixelCanvas";
import ColorSpectrum from "@/components/ColorSpectrum";
import CustomPalettePanel from "@/components/CustomPalettePanel";

interface CreativeEditorProps {
  project: Project;
  allProjects: Project[];
  onProjectsChange: (projects: Project[]) => void;
  onBack: () => void;
}

const TOOLS: Array<{ id: ToolCreative; label: string; icon: string; tip: string }> = [
  { id: 'pen', label: 'Pen', icon: '✏️', tip: 'Draw single pixels' },
  { id: 'eraser', label: 'Eraser', icon: '🧹', tip: 'Erase pixels' },
  { id: 'blotch', label: 'Blotch', icon: '💦', tip: 'Blend & texture pixels' },
  { id: 'fill', label: 'Fill', icon: '🪣', tip: 'Flood fill an area' },
  { id: 'line', label: 'Line', icon: '📏', tip: 'Draw a straight line' },
  { id: 'eyedropper', label: 'Pick', icon: '💉', tip: 'Pick color from canvas' },
];

export default function CreativeEditor({ project, allProjects, onProjectsChange, onBack }: CreativeEditorProps) {
  const [grid, setGrid] = useState(project.grid);
  const [palette, setPalette] = useState(project.palette);
  const [activeTool, setActiveTool] = useState<ToolCreative>('pen');
  const [activeColor, setActiveColor] = useState(palette.colors[0] || '#FF0000');
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [toolbarMinimized, setToolbarMinimized] = useState(false);
  const [history, setHistory] = useState<string[][]>([project.grid.data]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [projectName, setProjectName] = useState(project.name);
  const [saved, setSaved] = useState(true);
  const currentProjectId = useRef(project.id);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const zoomInitialized = useRef(false);

  useEffect(() => {
    if (zoomInitialized.current) return;
    const el = canvasAreaRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    const fitW = (width * 0.95) / grid.width;
    const fitH = (height * 0.95) / grid.height;
    const fit = Math.min(fitW, fitH);
    const clamped = Math.max(MIN_ZOOM, Math.min(CREATIVE_MAX_ZOOM, fit));
    setZoom(parseFloat(clamped.toFixed(2)));
    zoomInitialized.current = true;
  }, [grid.width, grid.height]);

  const pushHistory = useCallback((newData: string[]) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      const next = [...trimmed, newData];
      if (next.length > MAX_HISTORY) next.shift();
      return next;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);

  const handleGridChange = useCallback((newData: string[], pushHist = false) => {
    setGrid(prev => ({ ...prev, data: newData }));
    setSaved(false);
    if (pushHist) pushHistory(newData);
  }, [pushHistory]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setGrid(prev => ({ ...prev, data: history[newIndex] }));
    setSaved(false);
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setGrid(prev => ({ ...prev, data: history[newIndex] }));
    setSaved(false);
  }, [historyIndex, history]);

  const handleClear = () => {
    if (!confirm('Clear the canvas? This cannot be undone.')) return;
    const cleared = createEmptyGrid(grid.width, grid.height).data;
    handleGridChange(cleared, true);
  };

  const handleSave = useCallback(() => {
    const thumbnail = generateThumbnail(grid);
    const updated = { ...project, name: projectName, grid, palette, thumbnail, id: currentProjectId.current };
    const newProjects = saveProject(allProjects, updated);
    onProjectsChange(newProjects);
    setSaved(true);
  }, [project, projectName, grid, palette, allProjects, onProjectsChange]);

  const handlePaletteUpdate = (index: number, color: string) => {
    const newColors = [...palette.colors];
    newColors[index] = color;
    setPalette({ colors: newColors });
    setSaved(false);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
        if (e.key === 's') { e.preventDefault(); handleSave(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, handleSave]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const step = e.deltaY < 0 ? 0.25 : -0.25;
    setZoom(prev => {
      const next = prev + step;
      return parseFloat(Math.max(MIN_ZOOM, Math.min(CREATIVE_MAX_ZOOM, next)).toFixed(2));
    });
  }, []);

  useEffect(() => {
    const el = canvasAreaRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const zoomIn = () => setZoom(z => parseFloat(Math.min(CREATIVE_MAX_ZOOM, z + 0.5).toFixed(2)));
  const zoomOut = () => setZoom(z => parseFloat(Math.max(MIN_ZOOM, z - 0.5).toFixed(2)));

  const zoomLabel = zoom >= 1 ? `${zoom}x` : `${zoom}x`;

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card/50 flex-wrap flex-shrink-0">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          data-testid="btn-editor-back"
        >
          ← Menu
        </button>
        <div className="font-pixel text-xs text-primary hidden sm:block">CREATIVE MODE</div>

        <input
          type="text"
          value={projectName}
          onChange={e => { setProjectName(e.target.value); setSaved(false); }}
          className="flex-1 max-w-48 text-sm font-semibold bg-transparent border-b border-transparent hover:border-white/20 focus:border-primary outline-none px-1"
          data-testid="input-project-name"
        />

        <div className="flex items-center gap-1 ml-auto flex-wrap">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80 disabled:opacity-40 transition-colors"
            title="Undo (Ctrl+Z)"
            data-testid="btn-undo"
          >⟲ Undo</button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80 disabled:opacity-40 transition-colors"
            title="Redo (Ctrl+Shift+Z)"
            data-testid="btn-redo"
          >⟳ Redo</button>
          <button
            onClick={() => setShowGrid(g => !g)}
            className={cn("px-2 py-1 text-xs rounded transition-colors", showGrid ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80")}
            data-testid="btn-toggle-grid"
          ># Grid</button>
          <button onClick={zoomOut} className="px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80 transition-colors" data-testid="btn-zoom-out">−</button>
          <span className="text-xs text-muted-foreground w-10 text-center">{zoomLabel}</span>
          <button onClick={zoomIn} className="px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80 transition-colors" data-testid="btn-zoom-in">+</button>
          <button onClick={handleClear} className="px-2 py-1 text-xs rounded bg-destructive/80 text-white hover:bg-destructive transition-colors" data-testid="btn-clear">Clear</button>
          <button
            onClick={handleSave}
            className={cn("px-3 py-1 text-xs rounded font-semibold transition-colors", saved ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90")}
            data-testid="btn-save"
          >{saved ? '✓ Saved' : '💾 Save'}</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left toolbar */}
        <div
          className={cn(
            "flex flex-col border-r border-border bg-card/30 transition-all duration-200 overflow-y-auto flex-shrink-0",
            toolbarMinimized ? "w-10" : "w-56"
          )}
        >
          <button
            onClick={() => setToolbarMinimized(m => !m)}
            className="p-2 text-xs text-muted-foreground hover:text-foreground transition-colors border-b border-border flex items-center justify-center"
            title={toolbarMinimized ? "Expand toolbar" : "Minimize toolbar"}
            data-testid="btn-minimize-toolbar"
          >
            {toolbarMinimized ? '▶' : '◀'}
          </button>

          {!toolbarMinimized && (
            <div className="p-3 flex flex-col gap-4">
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tools</div>
                <div className="grid grid-cols-3 gap-1">
                  {TOOLS.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-xs",
                        activeTool === tool.id ? "tool-active border-primary" : "border-transparent bg-muted/40 hover:bg-muted/70"
                      )}
                      title={tool.tip}
                      data-testid={`tool-${tool.id}`}
                    >
                      <span className="text-base">{tool.icon}</span>
                      <span className="text-[9px] leading-none">{tool.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Active Color</div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded border-2 border-white/20" style={{ backgroundColor: activeColor }} />
                  <span className="text-xs font-mono text-muted-foreground">{activeColor}</span>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Spectrum</div>
                <ColorSpectrum selectedColor={activeColor} onSelectColor={setActiveColor} />
              </div>

              <div>
                <CustomPalettePanel
                  colors={palette.colors}
                  selectedColor={activeColor}
                  onSelectColor={setActiveColor}
                  onUpdateColor={handlePaletteUpdate}
                />
              </div>
            </div>
          )}

          {toolbarMinimized && (
            <div className="flex flex-col gap-2 p-1 pt-2">
              {TOOLS.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={cn(
                    "w-8 h-8 rounded flex items-center justify-center text-base transition-all border-2",
                    activeTool === tool.id ? "tool-active border-primary" : "border-transparent bg-muted/40 hover:bg-muted/70"
                  )}
                  title={tool.tip}
                  data-testid={`tool-mini-${tool.id}`}
                >
                  {tool.icon}
                </button>
              ))}
              <div className="w-8 h-5 rounded border border-white/20 mx-auto mt-1" style={{ backgroundColor: activeColor }} />
            </div>
          )}
        </div>

        {/* Canvas area — scrollable, 95% of available space */}
        <div
          ref={canvasAreaRef}
          className="flex-1 overflow-auto bg-background/50"
        >
          <div
            style={{ minWidth: '100%', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}
          >
            <PixelCanvas
              grid={grid}
              zoom={zoom}
              showGrid={showGrid}
              activeTool={activeTool}
              activeColor={activeColor}
              onGridChange={handleGridChange}
              onPickColor={(color) => { setActiveColor(color); setActiveTool('pen'); }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
