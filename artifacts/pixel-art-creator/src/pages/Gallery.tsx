import { useState } from "react";
import type { Project } from "@/lib/types";
import { GALLERY_PER_PAGE } from "@/lib/types";
import { deleteProject, generateThumbnail } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface GalleryProps {
  projects: Project[];
  onProjectsChange: (projects: Project[]) => void;
  onOpenProject: (project: Project) => void;
  onBack: () => void;
  onNewProject: (mode: 'creative' | 'junior') => void;
}

export default function Gallery({ projects, onProjectsChange, onOpenProject, onBack, onNewProject }: GalleryProps) {
  const [activeCategory, setActiveCategory] = useState<'creative' | 'junior'>('creative');
  const [currentPage, setCurrentPage] = useState(1);

  const creativeCount = projects.filter(p => p.mode === 'creative').length;
  const juniorCount = projects.filter(p => p.mode === 'junior').length;

  const filteredProjects = projects
    .filter(p => p.mode === activeCategory)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / GALLERY_PER_PAGE));
  const pageProjects = filteredProjects.slice(
    (currentPage - 1) * GALLERY_PER_PAGE,
    currentPage * GALLERY_PER_PAGE
  );

  const switchCategory = (cat: 'creative' | 'junior') => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this project?')) {
      const updated = deleteProject(projects, id);
      onProjectsChange(updated);
      const newFiltered = updated.filter(p => p.mode === activeCategory);
      const newTotal = Math.max(1, Math.ceil(newFiltered.length / GALLERY_PER_PAGE));
      if (currentPage > newTotal) setCurrentPage(newTotal);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          data-testid="btn-gallery-back"
        >
          ← Back
        </button>
        <div className="font-pixel text-sm text-primary">PROJECT GALLERY</div>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span>🎨 {creativeCount} creative</span>
          <span>·</span>
          <span>🌈 {juniorCount} junior</span>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-0 border-b border-border">
        <button
          onClick={() => switchCategory('creative')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px",
            activeCategory === 'creative'
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
          data-testid="tab-creative"
        >
          🎨 Creative Art
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded-full font-bold",
            activeCategory === 'creative' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>{creativeCount}</span>
        </button>
        <button
          onClick={() => switchCategory('junior')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px",
            activeCategory === 'junior'
              ? "border-chart-2 text-chart-2 bg-chart-2/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
          data-testid="tab-junior"
        >
          🌈 Junior Art
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded-full font-bold",
            activeCategory === 'junior' ? "bg-chart-2/20 text-chart-2" : "bg-muted text-muted-foreground"
          )}>{juniorCount}</span>
        </button>

        {/* New project button aligned to the right */}
        <div className="ml-auto flex items-center pr-6">
          {activeCategory === 'creative' ? (
            <button
              onClick={() => onNewProject('creative')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              data-testid="btn-new-creative"
            >
              🎨 New Creative
            </button>
          ) : (
            <button
              onClick={() => onNewProject('junior')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-chart-2 text-white text-sm font-semibold hover:bg-chart-2/90 transition-colors"
              data-testid="btn-new-junior"
            >
              🌈 New Junior
            </button>
          )}
        </div>
      </div>

      {/* Projects grid */}
      {filteredProjects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <div className="text-6xl mb-4">{activeCategory === 'creative' ? '🎨' : '🌈'}</div>
          <div className="font-pixel text-sm text-muted-foreground mb-2">NO PROJECTS YET</div>
          <p className="text-sm text-muted-foreground mb-4">
            {activeCategory === 'creative'
              ? 'Create your first Creative Mode pixel art!'
              : 'Create your first Junior Mode pixel art!'}
          </p>
          {activeCategory === 'creative' ? (
            <button
              onClick={() => onNewProject('creative')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              🎨 Start Creating
            </button>
          ) : (
            <button
              onClick={() => onNewProject('junior')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-chart-2 text-white text-sm font-semibold hover:bg-chart-2/90 transition-colors"
            >
              🌈 Start Creating
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex-1 px-6 pt-4 pb-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {pageProjects.map(project => {
                const thumb = project.thumbnail || generateThumbnail(project.grid);
                return (
                  <div
                    key={project.id}
                    className={cn(
                      "group relative cursor-pointer rounded-xl overflow-hidden border-2 border-transparent transition-all hover:scale-[1.03]",
                      activeCategory === 'creative'
                        ? "hover:border-primary hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                        : "hover:border-chart-2 hover:shadow-[0_0_20px_hsl(var(--chart-2)/0.3)]"
                    )}
                    onClick={() => onOpenProject(project)}
                    data-testid={`gallery-project-${project.id}`}
                  >
                    <div className="checkerboard">
                      <img
                        src={thumb}
                        alt={project.name}
                        className="w-full aspect-square gallery-thumb"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                      <div className="text-xs text-white font-semibold truncate">{project.name}</div>
                      <div className="text-[10px] text-white/70">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-destructive/80"
                      onClick={(e) => handleDelete(e, project.id)}
                      data-testid={`btn-delete-${project.id}`}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-muted text-sm font-semibold disabled:opacity-40 hover:bg-muted/80 transition-colors"
                data-testid="btn-prev-page"
              >
                ← Prev
              </button>
              <div className="flex gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-sm font-semibold transition-colors",
                      currentPage === i + 1
                        ? activeCategory === 'creative' ? "bg-primary text-primary-foreground" : "bg-chart-2 text-white"
                        : "bg-muted hover:bg-muted/80"
                    )}
                    data-testid={`btn-page-${i + 1}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-muted text-sm font-semibold disabled:opacity-40 hover:bg-muted/80 transition-colors"
                data-testid="btn-next-page"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
