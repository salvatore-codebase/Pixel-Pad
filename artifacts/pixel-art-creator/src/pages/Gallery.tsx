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
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(projects.length / GALLERY_PER_PAGE));

  const sortedProjects = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);
  const pageProjects = sortedProjects.slice((currentPage - 1) * GALLERY_PER_PAGE, currentPage * GALLERY_PER_PAGE);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this project?')) {
      const updated = deleteProject(projects, id);
      onProjectsChange(updated);
      if (currentPage > Math.ceil(updated.length / GALLERY_PER_PAGE)) {
        setCurrentPage(Math.max(1, currentPage - 1));
      }
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
        <div className="ml-auto text-xs text-muted-foreground">{projects.length} / 32 projects</div>
      </div>

      {/* New project buttons */}
      <div className="flex gap-3 px-6 py-4">
        <button
          onClick={() => onNewProject('creative')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          data-testid="btn-new-creative"
        >
          🎨 New Creative
        </button>
        <button
          onClick={() => onNewProject('junior')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-chart-2 text-white text-sm font-semibold hover:bg-chart-2/90 transition-colors"
          data-testid="btn-new-junior"
        >
          🌈 New Junior
        </button>
      </div>

      {/* Projects grid */}
      {projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <div className="text-6xl mb-4">🖼️</div>
          <div className="font-pixel text-sm text-muted-foreground mb-2">NO PROJECTS YET</div>
          <p className="text-sm text-muted-foreground">Create your first pixel art masterpiece!</p>
        </div>
      ) : (
        <>
          <div className="flex-1 px-6 pb-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {pageProjects.map(project => {
                const thumb = project.thumbnail || generateThumbnail(project.grid);
                return (
                  <div
                    key={project.id}
                    className="group relative cursor-pointer rounded-xl overflow-hidden border-2 border-transparent hover:border-primary transition-all hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:scale-[1.03]"
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
                      <div className="text-[10px] text-white/70 uppercase">{project.mode}</div>
                    </div>
                    <button
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-destructive/80"
                      onClick={(e) => handleDelete(e, project.id)}
                      data-testid={`btn-delete-${project.id}`}
                    >
                      ×
                    </button>
                    <div className={cn(
                      "absolute top-1 left-1 text-[9px] rounded px-1 py-0.5 font-semibold",
                      project.mode === 'creative' ? "bg-primary/90 text-white" : "bg-chart-2/90 text-white"
                    )}>
                      {project.mode === 'creative' ? '🎨' : '🌈'}
                    </div>
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
                      currentPage === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
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
