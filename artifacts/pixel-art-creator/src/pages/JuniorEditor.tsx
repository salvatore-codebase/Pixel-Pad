import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Project, ToolJunior, StampShape } from "@/lib/types";
import { MAX_HISTORY, JUNIOR_MAX_ZOOM, MIN_ZOOM, JUNIOR_COLORS } from "@/lib/types";
import { createEmptyGrid, generateThumbnail, saveProject } from "@/lib/storage";
import PixelCanvas from "@/components/PixelCanvas";
import StampPanel from "@/components/StampPanel";

interface JuniorEditorProps {
  project: Project;
  allProjects: Project[];
  onProjectsChange: (projects: Project[]) => void;
  onBack: () => void;
}

const TOOLS: Array<{ id: ToolJunior; label: string; icon: string; tip: string }> = [
  { id: 'pen', label: 'Pencil', icon: '✏️', tip: 'Draw pixels' },
  { id: 'eraser', label: 'Erase', icon: '🧹', tip: 'Erase pixels' },
  { id: 'fill', label: 'Fill', icon: '🪣', tip: 'Fill with color' },
  { id: 'stamp', label: 'Stamp', icon: '🎭', tip: 'Stamp a shape' },
  { id: 'circle', label: 'Circle', icon: '⭕', tip: 'Draw a circle dot' },
  { id: 'square', label: 'Square', icon: '🟦', tip: 'Draw a square dot' },
  { id: 'star', label: 'Star', icon: '⭐', tip: 'Draw a star' },
  { id: 'rainbow', label: 'Rainbow', icon: '🌈', tip: 'Rainbow pen!' },
  { id: 'hand', label: 'Pan', icon: '✋', tip: 'Grab and scroll canvas' },
];

export default function JuniorEditor({ project, allProjects, onProjectsChange, onBack }: JuniorEditorProps) {
  const [grid, setGrid] = useState(project.grid);
  const [activeTool, setActiveTool] = useState<ToolJunior>('pen');
  const [activeColor, setActiveColor] = useState(JUNIOR_COLORS[0]);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [toolbarMinimized, setToolbarMinimized] = useState(false);
  const [showStamps, setShowStamps] = useState(false);
  const [selectedStamp, setSelectedStamp] = useState<StampShape | null>(null);
  const [history, setHistory] = useState<string[][]>([project.grid.data]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [projectName, setProjectName] = useState(project.name);
  const [saved, setSaved] = useState(true);

  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const zoomInitialized = useRef(false);

  // Auto-fit initial integer zoom using ResizeObserver on the scrollable area
  useEffect(() => {
    const el = canvasAreaRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (zoomInitialized.current) return;
      const { width, height } = entry.contentRect;
      const squareFit = Math.min(width, height) * 0.95;
      const maxDim = Math.max(grid.width, grid.height);
      const fit = Math.max(MIN_ZOOM, Math.min(JUNIOR_MAX_ZOOM, Math.floor(squareFit / maxDim)));
      setZoom(fit);
      zoomInitialized.current = true;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [grid.width, grid.height]);

  // Pan with hand tool — attach to the scrollable area
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
    setZoom(prev => Math.max(MIN_ZOOM, Math.min(JUNIOR_MAX_ZOOM, prev + step)));
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
    if (!confirm('Start over? This will clear your drawing!')) return;
    const cleared = createEmptyGrid(grid.width, grid.height).data;
    handleGridChange(cleared, true);
  };

  const handleSave = useCallback(() => {
    const thumbnail = generateThumbnail(grid);
    const updated = { ...project, name: projectName, grid, thumbnail };
    onProjectsChange(saveProject(allProjects, updated));
    setSaved(true);
  }, [project, projectName, grid, allProjects, onProjectsChange]);

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

  const handleSelectStamp = (stamp: StampShape) => {
    setSelectedStamp(stamp);
    setActiveTool('stamp');
  };

  const zoomIn = () => setZoom(z => Math.min(JUNIOR_MAX_ZOOM, z + 1));
  const zoomOut = () => setZoom(z => Math.max(MIN_ZOOM, z - 1));

  return (
    <div className="junior-mode min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b-2 border-border bg-gradient-to-r from-purple-100/30 to-blue-100/30 flex-wrap flex-shrink-0">
        <button onClick={onBack} className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors flex-shrink-0" data-testid="btn-junior-back">← Back</button>
        <div className="font-pixel text-xs text-[hsl(var(--primary))] hidden sm:block">JUNIOR MODE</div>
        <input
          type="text"
          value={projectName}
          onChange={e => { setProjectName(e.target.value); setSaved(false); }}
          className="flex-1 max-w-40 text-sm font-bold bg-transparent border-b-2 border-transparent hover:border-purple-300 focus:border-purple-500 outline-none px-1"
          data-testid="input-junior-name"
        />
        <div className="flex items-center gap-1 ml-auto flex-wrap">
          <button onClick={undo} disabled={historyIndex <= 0} className="px-2 py-1 text-xs rounded-lg font-bold bg-yellow-200 text-yellow-800 hover:bg-yellow-300 disabled:opacity-40 transition-colors" data-testid="btn-junior-undo">⟲</button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="px-2 py-1 text-xs rounded-lg font-bold bg-yellow-200 text-yellow-800 hover:bg-yellow-300 disabled:opacity-40 transition-colors" data-testid="btn-junior-redo">⟳</button>
          <button onClick={() => setShowGrid(g => !g)} className={cn("px-2 py-1 text-xs rounded-lg font-bold transition-colors", showGrid ? "bg-blue-400 text-white" : "bg-blue-100 text-blue-700 hover:bg-blue-200")} data-testid="btn-junior-grid"># Grid</button>
          <button onClick={zoomOut} className="px-2 py-1 text-base rounded-lg bg-muted hover:bg-muted/80 transition-colors" data-testid="btn-junior-zoom-out">−</button>
          <span className="text-xs text-muted-foreground w-10 text-center">{zoom}×</span>
          <button onClick={zoomIn} className="px-2 py-1 text-base rounded-lg bg-muted hover:bg-muted/80 transition-colors" data-testid="btn-junior-zoom-in">+</button>
          <button onClick={handleClear} className="px-2 py-1 text-xs rounded-lg font-bold bg-red-400 text-white hover:bg-red-500 transition-colors" data-testid="btn-junior-clear">🗑 Clear</button>
          <button onClick={handleSave} className={cn("px-3 py-1 text-xs rounded-lg font-bold transition-colors", saved ? "bg-green-200 text-green-800" : "bg-green-500 text-white hover:bg-green-600")} data-testid="btn-junior-save">{saved ? '✓ Saved!' : '💾 Save!'}</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left toolbar */}
        <div className={cn("flex flex-col border-r-2 border-border bg-gradient-to-b from-purple-50/30 to-blue-50/30 transition-all duration-200 overflow-y-auto flex-shrink-0", toolbarMinimized ? "w-12" : "w-64")}>
          <button onClick={() => setToolbarMinimized(m => !m)} className="p-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors border-b-2 border-border flex items-center justify-center bg-white/20" data-testid="btn-junior-minimize">
            {toolbarMinimized ? '▶' : '◀'}
          </button>

          {!toolbarMinimized && (
            <div className="p-3 flex flex-col gap-4">
              <div>
                <div className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-2">Tools</div>
                <div className="grid grid-cols-3 gap-2">
                  {TOOLS.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => {
                        setActiveTool(tool.id);
                        if (tool.id === 'stamp') setShowStamps(true);
                        else setShowStamps(false);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-xl border-3 transition-all text-xs font-bold",
                        activeTool === tool.id ? "border-purple-500 bg-purple-100 text-purple-800 scale-95 shadow-md" : "border-gray-200 bg-white/50 hover:bg-white/80 hover:border-gray-300 text-gray-700"
                      )}
                      title={tool.tip}
                      data-testid={`junior-tool-${tool.id}`}
                    >
                      <span className="text-xl">{tool.icon}</span>
                      <span className="text-[9px]">{tool.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-2">Colors</div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl border-4 border-white shadow-md" style={{ backgroundColor: activeColor }} />
                  <span className="text-xs font-bold text-muted-foreground">Active</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {JUNIOR_COLORS.map((color) => (
                    <button
                      key={color}
                      className={cn("w-9 h-9 rounded-xl border-4 transition-all hover:scale-110", activeColor === color ? "border-white scale-110 shadow-lg" : "border-transparent")}
                      style={{ backgroundColor: color }}
                      onClick={() => setActiveColor(color)}
                      data-testid={`junior-color-${color}`}
                    />
                  ))}
                </div>
              </div>

              {showStamps && activeTool === 'stamp' && (
                <div className="border-t-2 border-border pt-3">
                  <StampPanel selectedStamp={selectedStamp} onSelectStamp={handleSelectStamp} />
                </div>
              )}
            </div>
          )}

          {toolbarMinimized && (
            <div className="flex flex-col gap-1 p-1 pt-2 items-center">
              {TOOLS.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => { setActiveTool(tool.id); if (tool.id === 'stamp') setToolbarMinimized(false); }}
                  className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all border-3", activeTool === tool.id ? "border-purple-500 bg-purple-100" : "border-transparent bg-white/50 hover:bg-white/80")}
                  title={tool.tip}
                  data-testid={`junior-tool-mini-${tool.id}`}
                >{tool.icon}</button>
              ))}
              <div className="w-9 h-9 rounded-xl border-4 border-white shadow mx-auto mt-1" style={{ backgroundColor: activeColor }} />
            </div>
          )}
        </div>

        {/* Canvas viewport — the outer div gives a definite size; the inner scrollable div uses it */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={canvasAreaRef}
            className="absolute inset-0 overflow-auto bg-gradient-to-br from-blue-50/10 to-purple-50/10"
          >
          <div style={{ minWidth: '100%', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
            <PixelCanvas
              grid={grid}
              zoom={zoom}
              showGrid={showGrid}
              activeTool={activeTool}
              activeColor={activeColor}
              selectedStamp={selectedStamp}
              onGridChange={handleGridChange}
            />
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
