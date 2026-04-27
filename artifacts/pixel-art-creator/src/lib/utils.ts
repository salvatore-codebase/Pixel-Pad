import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function floodFill(
  data: string[],
  width: number,
  height: number,
  startX: number,
  startY: number,
  fillColor: string
): string[] {
  const startIdx = startY * width + startX;
  const targetColor = data[startIdx];

  if (targetColor === fillColor) return data;

  const newData = [...data];
  const stack: number[] = [startIdx];
  const visited = new Set<number>();

  while (stack.length > 0) {
    const idx = stack.pop()!;
    if (visited.has(idx)) continue;
    if (idx < 0 || idx >= width * height) continue;
    if (newData[idx] !== targetColor) continue;

    visited.add(idx);
    newData[idx] = fillColor;

    const x = idx % width;
    const y = Math.floor(idx / width);

    if (x > 0) stack.push(idx - 1);
    if (x < width - 1) stack.push(idx + 1);
    if (y > 0) stack.push(idx - width);
    if (y < height - 1) stack.push(idx + width);
  }

  return newData;
}

export function blotchPixels(
  data: string[],
  width: number,
  height: number,
  x: number,
  y: number,
  color: string,
  radius = 2
): string[] {
  const newData = [...data];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const idx = ny * width + nx;
          if (Math.random() > 0.3) {
            newData[idx] = color;
          }
        }
      }
    }
  }
  return newData;
}

export function blendColors(base: string, overlay: string, alpha: number): string {
  if (alpha <= 0) return base || '';
  if (alpha >= 1) return overlay;
  const bg = base && base.length >= 7 ? base : '#252535';
  const br = parseInt(bg.slice(1, 3), 16);
  const bgc = parseInt(bg.slice(3, 5), 16);
  const bb = parseInt(bg.slice(5, 7), 16);
  const or = parseInt(overlay.slice(1, 3), 16);
  const og = parseInt(overlay.slice(3, 5), 16);
  const ob = parseInt(overlay.slice(5, 7), 16);
  const r = Math.round(br + (or - br) * alpha);
  const g = Math.round(bgc + (og - bgc) * alpha);
  const b = Math.round(bb + (ob - bb) * alpha);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

export function airbrushPixels(
  data: string[],
  width: number,
  height: number,
  x: number,
  y: number,
  color: string,
  opacity: number,
  radius = 5
): string[] {
  const newData = [...data];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) continue;
      const prob = Math.pow(1 - dist / radius, 1.5) * 0.8;
      if (Math.random() > prob) continue;
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const idx = ny * width + nx;
        const falloff = (1 - dist / radius) * (opacity / 100);
        newData[idx] = blendColors(newData[idx], color, falloff);
      }
    }
  }
  return newData;
}

export function watercolorPixels(
  data: string[],
  width: number,
  height: number,
  x: number,
  y: number,
  color: string,
  opacity: number,
  radius = 4
): string[] {
  const newData = [...data];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) continue;
      if (Math.random() > 0.65) continue;
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const idx = ny * width + nx;
        const blend = (1 - dist / radius) * 0.35 * (opacity / 100);
        newData[idx] = blendColors(newData[idx], color, blend);
      }
    }
  }
  return newData;
}

export function drawLine(
  data: string[],
  width: number,
  height: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string
): string[] {
  const newData = [...data];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let cx = x0;
  let cy = y0;

  while (true) {
    if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
      newData[cy * width + cx] = color;
    }
    if (cx === x1 && cy === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; cx += sx; }
    if (e2 < dx) { err += dx; cy += sy; }
  }

  return newData;
}
