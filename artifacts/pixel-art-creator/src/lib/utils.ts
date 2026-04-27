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
