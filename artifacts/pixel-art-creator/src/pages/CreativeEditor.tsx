import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Project, ToolCreative } from "@/lib/types";
import { MAX_HISTORY, CREATIVE_MAX_ZOOM, MIN_ZOOM } from "@/lib/types";
import { createEmptyGrid, generateThumbnail, saveProject } from "@/lib/storage";
import PixelCanvas from "@/components/PixelCanvas";
import ShadeAndTintPicker from "@/components/ShadeAndTintPicker";
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
  { id: 'hand', label: 'Pan', icon: '✋', tip: 'Grab and scroll canvas' },
];

export default function CreativeEditor({ project, allProjects, onProjectsChange, onBack }: CreativeEditorProps) {
  const [grid, setGrid] = useState(project.grid);
  const [palette, setPalette] = useState(project.palette);
  const [activeTool, setActiveTool] = useState<ToolCreative>('pen');
  const [activeColor, setActiveColor] = useState(palette.colors[0] || '#FF0000');
  const [paletteBasisColor, setPaletteBasisColor] = useState(palette.colors[0] || '#FF0000');
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [toolbarMinimized, setToolbarMinimized] = useState(false);
  const [history, setHistory] = useState<string[][]>([project.grid.data]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [projectName, setProjectName] = useState(project.name);
  const [saved, setSaved] = useState(true);
  const [squareSize, setSquareSize] = useState(0);

  const currentProjectId = useRef(project.id);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const zoomInitialized = useRef(false);

  // Measure outer wrapper to compute square size
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSquareSize(Math.min(width, height));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-fit initial integer zoom once we know the square size
  useEffect(() => {
    if (squareSize <= 0 || zoomInitialized.current) return;
    const maxDim = Math.max(grid.width, grid.height);
    const fit = Math.max(MIN_ZOOM, Math.min(CREATIVE_MAX_ZOOM, Math.floor((squareSize * 0.95) / maxDim)));
    setZoom(fit);
    zoomInitialized.current = true;
  }, [squareSize, grid.width, grid.height]);

  // Pan with hand tool
  useEffect(() => {
    const area = canvasAreaRef.current;
    if (!area || activeTool !== 'hand') return;
    let active = false, sx = 0, sy = 0, sL = 0, sT = 0;
    const onDown = (e: MouseEvent) => {
      active = true; sx = e.clientX; sy = e.clientY;
      sL = area.scrollLeft; sT = area.scrollTop;
      area.style.cursor = 'grabbing'; e.preventDefault();
    };
    const onMove = (e: MouseEvent) => {
      if (!active) return;
      area.scrollLeft = sL - (e.clientX - sx);
      area.scrollTop = sT - (e.clientY - sy);
    };
    const onUp = () => { active = false; area.style.cursor = 'grab'; };
    area.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    area.style.cursor = 'grab';
    return () => {
      area.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      area.style.cursor = '';
    };
  }, [activeTool]);

  // Wheel zoom (non-passive, integer steps)
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const step = e.deltaY < 0 ? 1 : -1;
    setZoom(prev => Math.max(MIN_ZOOM, Math.min(CREATIVE_MAX_ZOOM, prev + step)));
  }, []);

  useEffect(() => {
    const el = canvasAreaRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

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
    const idx = historyIndex - 1;
    setHistoryIndex(idx);
    setGrid(prev => ({ ...prev, data: history[idx] }));
    setSaved(false);
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const idx = historyIndex + 1;
    setHistoryIndex(idx);
    setGrid(prev => ({ ...prev, data: history[idx] }));
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
    onProjectsChange(saveProject(allProjects, updated));
    setSaved(true);
  }, [project, projectName, grid, palette, allProjects, onProjectsChange]);

  const handlePaletteUpdate = (index: number, color: string) => {
    const newColors = [...palette.colors];
    newColors[index] = color;
    setPalette({ colors: newColors });
    setSaved(false);
  };

  const handlePaletteSelect = (color: string) => {
    setActiveColor(color);
    setPaletteBasisColor(color);
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

  const zoomIn = () => setZoom(z => Math.min(CREATIVE_MAX_ZOOM, z + 1));
  const zoomOut = () => setZoom(z => Math.max(MIN_ZOOM, z - 1));

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card/50 flex-wrap flex-shrink-0">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0" data-testid="btn-editor-back">← Menu</button>
        <div className="font-pixel text-xs text-primary hidden sm:block">CREATIVE MODE</div>
        <input
          type="text"
          value={projectName}
          onChange={e => { setProjectName(e.target.value); setSaved(false); }}
          className="flex-1 max-w-48 text-sm font-semibold bg-transparent border-b border-transparent hover:border-white/20 focus:border-primary outline-none px-1"
          data-testid="input-project-name"
        />
        <div className="flex items-center gap-1 ml-auto flex-wrap">
          <button onClick={undo} disabled={historyIndex <= 0} className="px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80 disabled:opacity-40 transition-colors" title="Undo (Ctrl+Z)" data-testid="btn-undo">⟲ Undo</button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80 disabled:opacity-40 transition-colors" title="Redo (Ctrl+Shift+Z)" data-testid="btn-redo">⟳ Redo</button>
          <button onClick={() => setShowGrid(g => !g)} className={cn("px-2 py-1 text-xs rounded transition-colors", showGrid ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80")} data-testid="btn-toggle-grid"># Grid</button>
          <button onClick={zoomOut} className="px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80 transition-colors" data-testid="btn-zoom-out">−</button>
          <span className="text-xs text-muted-foreground w-10 text-center">{zoom}×</span>
          <button onClick={zoomIn} className="px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80 transition-colors" data-testid="btn-zoom-in">+</button>
          <button onClick={handleClear} className="px-2 py-1 text-xs rounded bg-destructive/80 text-white hover:bg-destructive transition-colors" data-testid="btn-clear">Clear</button>
          <button onClick={handleSave} className={cn("px-3 py-1 text-xs rounded font-semibold transition-colors", saved ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90")} data-testid="btn-save">{saved ? '✓ Saved' : '💾 Save'}</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left toolbar */}
        <div className={cn("flex flex-col border-r border-border bg-card/30 transition-all duration-200 overflow-y-auto flex-shrink-0", toolbarMinimized ? "w-10" : "w-56")}>
          <button
            onClick={() => setToolbarMinimized(m => !m)}
            className="p-2 text-xs text-muted-foreground hover:text-foreground transition-colors border-b border-border flex items-center justify-center"
            title={toolbarMinimized ? "Expand toolbar" : "Minimize toolbar"}
            data-testid="btn-minimize-toolbar"
          >{toolbarMinimized ? '▶' : '◀'}</button>

          {!toolbarMinimized && (
            <div className="p-3 flex flex-col gap-4">
              {/* Tools */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tools</div>
                <div className="grid grid-cols-3 gap-1">
                  {TOOLS.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id)}
                      className={cn("flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-xs", activeTool === tool.id ? "tool-active border-primary" : "border-transparent bg-muted/40 hover:bg-muted/70")}
                      title={tool.tip}
                      data-testid={`tool-${tool.id}`}
                    >
                      <span className="text-base">{tool.icon}</span>
                      <span className="text-[9px] leading-none">{tool.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active color */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Active Color</div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded border-2 border-white/20" style={{ backgroundColor: activeColor }} />
                  <span className="text-xs font-mono text-muted-foreground">{activeColor}</span>
                </div>
              </div>

              {/* Custom Palette — FIRST (swapped) */}
              <div>
                <CustomPalettePanel
                  colors={palette.colors}
                  selectedColor={paletteBasisColor}
                  onSelectColor={handlePaletteSelect}
                  onUpdateColor={handlePaletteUpdate}
                />
              </div>

              {/* Shade & Tint — SECOND (swapped, replaces Spectrum) */}
              <div>
                <ShadeAndTintPicker
                  baseColor={paletteBasisColor}
                  selectedColor={activeColor}
                  onSelectColor={setActiveColor}
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
                  className={cn("w-8 h-8 rounded flex items-center justify-center text-base transition-all border-2", activeTool === tool.id ? "tool-active border-primary" : "border-transparent bg-muted/40 hover:bg-muted/70")}
                  title={tool.tip}
                  data-testid={`tool-mini-${tool.id}`}
                >{tool.icon}</button>
              ))}
              <div className="w-8 h-5 rounded border border-white/20 mx-auto mt-1" style={{ backgroundColor: activeColor }} />
            </div>
          )}
        </div>

        {/* Outer wrapper — fills remaining space, centers the square */}
        <div ref={outerRef} className="flex-1 overflow-hidden flex items-center justify-center bg-background/50">
          {/* Square scrollable canvas area */}
          <div
            ref={canvasAreaRef}
            style={{
              width: squareSize > 0 ? squareSize : '100%',
              height: squareSize > 0 ? squareSize : '100%',
              overflow: 'scroll',
              flexShrink: 0,
            }}
          >
            <div style={{ minWidth: '100%', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
              <PixelCanvas
                grid={grid}
                zoom={zoom}
                showGrid={showGrid}
                activeTool={activeTool}
                activeColor={activeColor}
                onGridChange={handleGridChange}
                onPickColor={(color) => { setActiveColor(color); setPaletteBasisColor(color); setActiveTool('pen'); }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
