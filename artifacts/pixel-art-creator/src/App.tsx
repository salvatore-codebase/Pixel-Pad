import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MainMenu from "@/pages/MainMenu";
import Gallery from "@/pages/Gallery";
import CreativeEditor from "@/pages/CreativeEditor";
import JuniorEditor from "@/pages/JuniorEditor";
import type { Project } from "@/lib/types";
import { loadProjects, createNewProject } from "@/lib/storage";

const queryClient = new QueryClient();

type AppView = 'menu' | 'gallery' | 'creative-editor' | 'junior-editor';

function App() {
  const [view, setView] = useState<AppView>('menu');
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const handleSelectMode = (mode: 'creative' | 'junior') => {
    const newProject = createNewProject(`Untitled ${mode === 'creative' ? 'Creative' : 'Junior'} ${Date.now().toString().slice(-4)}`, mode);
    setActiveProject(newProject);
    setView(mode === 'creative' ? 'creative-editor' : 'junior-editor');
  };

  const handleOpenProject = (project: Project) => {
    setActiveProject(project);
    setView(project.mode === 'creative' ? 'creative-editor' : 'junior-editor');
  };

  const handleNewProjectFromGallery = (mode: 'creative' | 'junior') => {
    handleSelectMode(mode);
  };

  if (view === 'menu') {
    return (
      <MainMenu
        onSelectMode={handleSelectMode}
        onOpenGallery={() => setView('gallery')}
      />
    );
  }

  if (view === 'gallery') {
    return (
      <Gallery
        projects={projects}
        onProjectsChange={setProjects}
        onOpenProject={handleOpenProject}
        onBack={() => setView('menu')}
        onNewProject={handleNewProjectFromGallery}
      />
    );
  }

  if ((view === 'creative-editor' || view === 'junior-editor') && activeProject) {
    if (view === 'creative-editor') {
      return (
        <CreativeEditor
          key={activeProject.id}
          project={activeProject}
          allProjects={projects}
          onProjectsChange={setProjects}
          onBack={() => setView('menu')}
        />
      );
    }
    return (
      <JuniorEditor
        key={activeProject.id}
        project={activeProject}
        allProjects={projects}
        onProjectsChange={setProjects}
        onBack={() => setView('menu')}
      />
    );
  }

  return (
    <MainMenu
      onSelectMode={handleSelectMode}
      onOpenGallery={() => setView('gallery')}
    />
  );
}

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}
