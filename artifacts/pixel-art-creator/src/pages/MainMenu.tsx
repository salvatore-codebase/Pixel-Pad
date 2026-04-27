import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { loadProjects } from "@/lib/storage";

interface MainMenuProps {
  onSelectMode: (mode: 'creative' | 'junior') => void;
  onOpenGallery: () => void;
}

export default function MainMenu({ onSelectMode, onOpenGallery }: MainMenuProps) {
  const projects = loadProjects();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('pixelpad-theme') !== 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('light', !darkMode);
    localStorage.setItem('pixelpad-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 rounded-full bg-chart-2/10 blur-2xl" />
      </div>

      {/* Logo — w-full so the absolute toggle reaches the right edge of the viewport */}
      <div className="relative mb-12 w-full text-center z-10">
        {/* Theme toggle — top-0 aligns its top with the top of PIXEL text; right-8 places it at the viewport's right edge */}
        <div className="absolute right-8 top-0">
          <button
            onClick={() => setDarkMode(d => !d)}
            className="inline-flex items-center rounded-full bg-muted border border-border p-0.5 gap-0.5 transition-colors hover:bg-muted/80"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            data-testid="btn-menu-theme-toggle"
          >
            <span className={cn("text-xs px-1.5 py-0.5 rounded-full transition-all leading-none select-none", !darkMode ? "bg-background shadow-sm" : "opacity-40")}>☀️</span>
            <span className={cn("text-xs px-1.5 py-0.5 rounded-full transition-all leading-none select-none", darkMode ? "bg-background shadow-sm" : "opacity-40")}>🌙</span>
          </button>
        </div>

        <div className="font-pixel text-2xl md:text-4xl text-primary mb-3 drop-shadow-[0_0_20px_hsl(var(--primary)/0.5)]">
          PIXEL
        </div>
        <div className="font-pixel text-xl md:text-3xl text-accent drop-shadow-[0_0_15px_hsl(var(--accent)/0.5)]">
          PAD
        </div>
        <div className="mt-4 text-muted-foreground text-sm">
          Choose your creative adventure
        </div>
      </div>

      {/* Mode cards */}
      <div className="flex flex-col md:flex-row gap-6 relative z-10 px-4 w-full max-w-2xl">
        {/* Creative Mode */}
        <button
          className="flex-1 flex flex-col group relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-card/80 p-8 text-left transition-all duration-200 hover:border-primary hover:shadow-[0_0_40px_hsl(var(--primary)/0.3)] hover:scale-[1.02] backdrop-blur-sm"
          onClick={() => onSelectMode('creative')}
          onMouseEnter={() => setHoveredCard('creative')}
          onMouseLeave={() => setHoveredCard(null)}
          data-testid="btn-creative-mode"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col flex-1">
            <div className="h-16 flex items-start mb-4 leading-none text-5xl">🎨</div>
            <div className="h-8 flex items-center font-pixel text-base text-primary">CREATIVE</div>
            <div className="h-8 flex items-center font-pixel text-base text-primary mb-3">MODE</div>
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
              Professional tools for artists. Pen, eraser, blotch tool, fill, line drawing, and a full color spectrum with 20 custom palette slots.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Pen','Marker','Blotch','Fill','Line','Eraser'].map(tool => (
                <span key={tool} className="text-xs bg-primary/20 text-primary rounded px-2 py-0.5">{tool}</span>
              ))}
            </div>
          </div>
        </button>

        {/* Junior Mode */}
        <button
          className="flex-1 flex flex-col group relative overflow-hidden rounded-2xl border-2 border-chart-2/30 bg-card/80 p-8 text-left transition-all duration-200 hover:border-chart-2 hover:shadow-[0_0_40px_hsl(var(--chart-2)/0.3)] hover:scale-[1.02] backdrop-blur-sm"
          onClick={() => onSelectMode('junior')}
          onMouseEnter={() => setHoveredCard('junior')}
          onMouseLeave={() => setHoveredCard(null)}
          data-testid="btn-junior-mode"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-chart-2/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col flex-1">
            <div className="h-16 flex items-start mb-4 leading-none text-5xl">🦕</div>
            <div className="h-8 flex items-center font-pixel text-base text-chart-2">JUNIOR</div>
            <div className="h-8 flex items-center font-pixel text-base text-chart-2 mb-3">MODE</div>
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
              Fun and easy for kids! Simple tools, bright colors, and 30+ stamp shapes to create amazing pixel art.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Pen','Eraser','Fill','Stamp','Star','Circle','Square','Rainbow'].map(tool => (
                <span key={tool} className="text-xs bg-chart-2/20 text-chart-2 rounded px-2 py-0.5">{tool}</span>
              ))}
            </div>
          </div>
        </button>
      </div>

      {/* Gallery button */}
      <button
        className="mt-8 relative z-10 flex items-center gap-3 px-6 py-3 rounded-xl border border-white/10 bg-card/60 hover:bg-card/90 hover:border-white/20 transition-all backdrop-blur-sm"
        onClick={onOpenGallery}
        data-testid="btn-open-gallery"
      >
        <span className="text-2xl">🖼️</span>
        <div className="text-left">
          <div className="font-semibold text-sm text-foreground">Project Gallery</div>
          <div className="text-xs text-muted-foreground">{projects.length} of 32 projects saved</div>
        </div>
      </button>

      {/* Decorative pixels */}
      <div className="absolute bottom-4 right-4 opacity-20 pointer-events-none">
        <div className="grid grid-cols-8 gap-0.5">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-sm" style={{
              backgroundColor: ['#FF0000','#FF6600','#FFFF00','#00CC00','#0099FF','#9900FF','#FF00CC',''][i % 8] || 'transparent',
              opacity: Math.random() > 0.5 ? 1 : 0,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
