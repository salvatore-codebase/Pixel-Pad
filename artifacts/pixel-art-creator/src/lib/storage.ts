import type { Project, PixelGrid, CustomPalette } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CREATIVE_CANVAS_WIDTH, CREATIVE_CANVAS_HEIGHT, JUNIOR_CANVAS_WIDTH, JUNIOR_CANVAS_HEIGHT, DEFAULT_CREATIVE_PALETTE, MAX_PROJECTS } from './types';

const STORAGE_KEY = 'pixel-art-projects';

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // ignore storage errors
  }
}

export function createEmptyGrid(width = CANVAS_WIDTH, height = CANVAS_HEIGHT): PixelGrid {
  return {
    width,
    height,
    data: new Array(width * height).fill(''),
  };
}

export function createEmptyPalette(): CustomPalette {
  return {
    colors: [...DEFAULT_CREATIVE_PALETTE],
  };
}

export function createNewProject(name: string, mode: 'creative' | 'junior'): Project {
  const width = mode === 'creative' ? CREATIVE_CANVAS_WIDTH : JUNIOR_CANVAS_WIDTH;
  const height = mode === 'creative' ? CREATIVE_CANVAS_HEIGHT : JUNIOR_CANVAS_HEIGHT;
  return {
    id: crypto.randomUUID(),
    name,
    mode,
    grid: createEmptyGrid(width, height),
    palette: createEmptyPalette(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function saveProject(projects: Project[], project: Project): Project[] {
  const existing = projects.findIndex(p => p.id === project.id);
  let updated: Project[];
  if (existing >= 0) {
    updated = [...projects];
    updated[existing] = { ...project, updatedAt: Date.now() };
  } else {
    if (projects.length >= MAX_PROJECTS) {
      // Remove oldest project
      const sorted = [...projects].sort((a, b) => a.updatedAt - b.updatedAt);
      updated = projects.filter(p => p.id !== sorted[0].id);
    } else {
      updated = [...projects];
    }
    updated = [{ ...project, updatedAt: Date.now() }, ...updated];
  }
  saveProjects(updated);
  return updated;
}

export function deleteProject(projects: Project[], id: string): Project[] {
  const updated = projects.filter(p => p.id !== id);
  saveProjects(updated);
  return updated;
}

export function generateThumbnail(grid: PixelGrid, thumbW = 160, thumbH = 90): string {
  const canvas = document.createElement('canvas');
  canvas.width = thumbW;
  canvas.height = thumbH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const pxW = thumbW / grid.width;
  const pxH = thumbH / grid.height;

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const idx = y * grid.width + x;
      const color = grid.data[idx];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * pxW, y * pxH, pxW, pxH);
      } else {
        const light = (x + y) % 2 === 0;
        ctx.fillStyle = light ? '#cccccc' : '#aaaaaa';
        ctx.fillRect(x * pxW, y * pxH, pxW, pxH);
      }
    }
  }

  return canvas.toDataURL('image/png');
}
