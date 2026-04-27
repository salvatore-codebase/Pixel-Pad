import { useRef, useCallback, useEffect, useState } from "react";
import type { PixelGrid, ToolCreative, ToolJunior } from "@/lib/types";
import { blendColors, blotchPixels, drawLine, floodFill, airbrushPixels, watercolorPixels } from "@/lib/utils";
import type { StampShape } from "@/lib/types";

interface PixelCanvasProps {
  grid: PixelGrid;
  zoom: number;
  showGrid: boolean;
  activeTool: ToolCreative | ToolJunior;
  activeColor: string;
  opacity?: number; // 0-100, default 100
  thickness?: number; // 1-6, default 1
  selectedStamp?: StampShape | null;
  onGridChange: (newData: string[], pushHistory?: boolean) => void;
}

const RAINBOW_COLORS = ['#FF0000','#FF6600','#FFFF00','#00CC00','#0099FF','#9900FF','#FF00CC'];

export default function PixelCanvas({
  grid,
  zoom,
  showGrid,
  activeTool,
  activeColor,
  opacity = 100,
  thickness = 1,
  selectedStamp,
  onGridChange,
}: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPixel = useRef<{ x: number; y: number } | null>(null);
  const lineStart = useRef<{ x: number; y: number } | null>(null);
  const linePreview = useRef<string[] | null>(null);
  const rainbowIdx = useRef(0);
  const [stampPreview, setStampPreview] = useState<{ x: number; y: number } | null>(null);

  const pixelSize = zoom;
  const canvasWidth = Math.round(grid.width * pixelSize);
  const canvasHeight = Math.round(grid.height * pixelSize);

  const getPixelCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = Math.floor((clientX - rect.left) / pixelSize);
    const y = Math.floor((clientY - rect.top) / pixelSize);
    if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) return null;
    return { x, y };
  }, [pixelSize, grid.width, grid.height]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    const displayData = linePreview.current || grid.data;

    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const idx = y * grid.width + x;
        const color = displayData[idx];
        if (!color) {
          const light = (x + y) % 2 === 0;
          ctx.fillStyle = light ? '#2a2a3a' : '#252535';
        } else {
          ctx.fillStyle = color;
        }
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }

    // Stamp preview overlay
    if (stampPreview && selectedStamp && activeTool === 'stamp') {
      const { x: sx, y: sy } = stampPreview;
      ctx.globalAlpha = 0.6;
      for (const px of selectedStamp.pixels) {
        const nx = sx + px.x - Math.floor(selectedStamp.width / 2);
        const ny = sy + px.y - Math.floor(selectedStamp.height / 2);
        if (nx >= 0 && nx < grid.width && ny >= 0 && ny < grid.height) {
          ctx.fillStyle = px.color;
          ctx.fillRect(nx * pixelSize, ny * pixelSize, pixelSize, pixelSize);
        }
      }
      ctx.globalAlpha = 1;
    }

    if (showGrid && zoom >= 4) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= grid.width; x++) {
        ctx.beginPath(); ctx.moveTo(x * pixelSize, 0); ctx.lineTo(x * pixelSize, canvasHeight); ctx.stroke();
      }
      for (let y = 0; y <= grid.height; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * pixelSize); ctx.lineTo(canvasWidth, y * pixelSize); ctx.stroke();
      }
    } else if (showGrid && zoom < 4) {
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= grid.width; x++) {
        ctx.beginPath(); ctx.moveTo(x * pixelSize, 0); ctx.lineTo(x * pixelSize, canvasHeight); ctx.stroke();
      }
      for (let y = 0; y <= grid.height; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * pixelSize); ctx.lineTo(canvasWidth, y * pixelSize); ctx.stroke();
      }
    }
  }, [grid, zoom, showGrid, canvasWidth, canvasHeight, pixelSize, stampPreview, selectedStamp, activeTool]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  const applyTool = useCallback((x: number, y: number, isFirst: boolean) => {
    let newData = [...grid.data];
    const tool = activeTool;
    const alpha = opacity / 100;
    const brushRadius = Math.max(0, thickness - 1);

    // Paint a brush-circle of pixels at (px, py)
    const paintAt = (data: string[], px: number, py: number, color: string, blend: number) => {
      const applyPixel = (nx: number, ny: number) => {
        if (nx < 0 || nx >= grid.width || ny < 0 || ny >= grid.height) return;
        const idx = ny * grid.width + nx;
        data[idx] = blend < 1 ? blendColors(data[idx], color, blend) : color;
      };
      if (brushRadius === 0) { applyPixel(px, py); return; }
      for (let dy = -brushRadius; dy <= brushRadius; dy++)
        for (let dx = -brushRadius; dx <= brushRadius; dx++)
          if (dx * dx + dy * dy <= brushRadius * brushRadius) applyPixel(px + dx, py + dy);
    };

    // Erase a brush-circle of pixels at (px, py)
    const eraseAt = (data: string[], px: number, py: number) => {
      const clearPixel = (nx: number, ny: number) => {
        if (nx < 0 || nx >= grid.width || ny < 0 || ny >= grid.height) return;
        data[ny * grid.width + nx] = '';
      };
      if (brushRadius === 0) { clearPixel(px, py); return; }
      for (let dy = -brushRadius; dy <= brushRadius; dy++)
        for (let dx = -brushRadius; dx <= brushRadius; dx++)
          if (dx * dx + dy * dy <= brushRadius * brushRadius) clearPixel(px + dx, py + dy);
    };

    // Bresenham line from (x0,y0) to (x1,y1) calling fn at each step
    const bresenham = (x0: number, y0: number, x1: number, y1: number, fn: (px: number, py: number) => void) => {
      let cx = x0, cy = y0;
      const adx = Math.abs(x1 - cx), ady = Math.abs(y1 - cy);
      const sx2 = cx < x1 ? 1 : -1, sy2 = cy < y1 ? 1 : -1;
      let err2 = adx - ady;
      while (true) {
        fn(cx, cy);
        if (cx === x1 && cy === y1) break;
        const e2 = 2 * err2;
        if (e2 > -ady) { err2 -= ady; cx += sx2; }
        if (e2 < adx) { err2 += adx; cy += sy2; }
      }
    };

    if (tool === 'hand') return;

    if (tool === 'fill') {
      newData = floodFill(newData, grid.width, grid.height, x, y, activeColor);
      onGridChange(newData, true);
      return;
    }

    if (tool === 'stamp' && selectedStamp && isFirst) {
      for (const px of selectedStamp.pixels) {
        const nx = x + px.x - Math.floor(selectedStamp.width / 2);
        const ny = y + px.y - Math.floor(selectedStamp.height / 2);
        if (nx >= 0 && nx < grid.width && ny >= 0 && ny < grid.height) {
          newData[ny * grid.width + nx] = px.color;
        }
      }
      onGridChange(newData, true);
      return;
    }

    if (tool === 'blotch') {
      newData = blotchPixels(newData, grid.width, grid.height, x, y, activeColor, Math.max(2, brushRadius + 2), alpha);
      onGridChange(newData, false);
      return;
    }

    if (tool === 'airbrush') {
      newData = airbrushPixels(newData, grid.width, grid.height, x, y, activeColor, opacity);
      onGridChange(newData, false);
      return;
    }

    if (tool === 'watercolor') {
      newData = watercolorPixels(newData, grid.width, grid.height, x, y, activeColor, opacity);
      onGridChange(newData, false);
      return;
    }

    if (tool === 'eraser') {
      if (!isFirst && lastPixel.current) {
        bresenham(lastPixel.current.x, lastPixel.current.y, x, y, (px, py) => eraseAt(newData, px, py));
      } else {
        eraseAt(newData, x, y);
      }
      onGridChange(newData, false);
      return;
    }

    if (tool === 'circle') {
      const r = 2;
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++)
          if (dx * dx + dy * dy <= r * r) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < grid.width && ny >= 0 && ny < grid.height)
              newData[ny * grid.width + nx] = activeColor;
          }
      onGridChange(newData, true);
      return;
    }

    if (tool === 'square') {
      const r = 2;
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < grid.width && ny >= 0 && ny < grid.height)
            newData[ny * grid.width + nx] = activeColor;
        }
      onGridChange(newData, true);
      return;
    }

    if (tool === 'star') {
      const starPoints = [
        [0,-3],[0,3],[-3,0],[3,0],[-2,-2],[2,-2],[-2,2],[2,2],
        [0,-2],[0,2],[-2,0],[2,0],[0,-1],[0,1],[-1,0],[1,0],[0,0],
        [-1,-1],[1,-1],[-1,1],[1,1],
      ];
      for (const [dx, dy] of starPoints) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < grid.width && ny >= 0 && ny < grid.height)
          newData[ny * grid.width + nx] = activeColor;
      }
      onGridChange(newData, true);
      return;
    }

    if (tool === 'rainbow') {
      const color = RAINBOW_COLORS[rainbowIdx.current % RAINBOW_COLORS.length];
      if (isFirst) rainbowIdx.current++;
      newData[y * grid.width + x] = color;
      onGridChange(newData, false);
      return;
    }

    if (tool === 'pen') {
      if (!isFirst && lastPixel.current) {
        bresenham(lastPixel.current.x, lastPixel.current.y, x, y, (px, py) => paintAt(newData, px, py, activeColor, alpha));
      } else {
        paintAt(newData, x, y, activeColor, alpha);
      }
      onGridChange(newData, false);
      return;
    }

    if (tool === 'marker') {
      if (!isFirst && lastPixel.current) {
        bresenham(lastPixel.current.x, lastPixel.current.y, x, y, (px, py) => paintAt(newData, px, py, activeColor, 1));
      } else {
        paintAt(newData, x, y, activeColor, 1);
      }
      onGridChange(newData, false);
      return;
    }

    if (tool === 'line') {
      if (isFirst) lineStart.current = { x, y };
    }
  }, [grid, activeTool, activeColor, opacity, thickness, selectedStamp, onGridChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (activeTool === 'hand') return;
    const coords = getPixelCoords(e);
    if (!coords) return;
    isDrawing.current = true;
    lastPixel.current = coords;
    applyTool(coords.x, coords.y, true);
  }, [getPixelCoords, applyTool, activeTool]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getPixelCoords(e);
    if (!coords) return;
    if (activeTool === 'stamp') setStampPreview(coords);
    if (!isDrawing.current) return;

    if (activeTool === 'line' && lineStart.current) {
      const preview = drawLine([...grid.data], grid.width, grid.height, lineStart.current.x, lineStart.current.y, coords.x, coords.y, activeColor);
      linePreview.current = preview;
      drawCanvas();
      return;
    }

    if (lastPixel.current && (lastPixel.current.x !== coords.x || lastPixel.current.y !== coords.y)) {
      applyTool(coords.x, coords.y, false);
      lastPixel.current = coords;
    }
  }, [getPixelCoords, activeTool, applyTool, grid, activeColor, drawCanvas]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    if (activeTool === 'line' && lineStart.current) {
      const coords = getPixelCoords(e);
      if (coords && lineStart.current) {
        const newData = drawLine([...grid.data], grid.width, grid.height, lineStart.current.x, lineStart.current.y, coords.x, coords.y, activeColor);
        linePreview.current = null;
        onGridChange(newData, true);
      }
      lineStart.current = null;
      linePreview.current = null;
    }
    if (['pen', 'eraser', 'blotch', 'rainbow', 'airbrush', 'watercolor'].includes(activeTool)) {
      onGridChange(grid.data, true);
    }
    isDrawing.current = false;
    lastPixel.current = null;
  }, [activeTool, getPixelCoords, grid, activeColor, onGridChange]);

  const handleMouseLeave = useCallback(() => {
    setStampPreview(null);
    if (!isDrawing.current) return;
    if (['pen', 'marker', 'eraser', 'blotch', 'rainbow', 'airbrush', 'watercolor'].includes(activeTool)) {
      onGridChange(grid.data, true);
    }
    isDrawing.current = false;
    lastPixel.current = null;
  }, [activeTool, grid, onGridChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getPixelCoords(e);
    if (!coords) return;
    isDrawing.current = true;
    lastPixel.current = coords;
    applyTool(coords.x, coords.y, true);
  }, [getPixelCoords, applyTool]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getPixelCoords(e);
    if (!coords || !isDrawing.current) return;
    if (lastPixel.current && (lastPixel.current.x !== coords.x || lastPixel.current.y !== coords.y)) {
      applyTool(coords.x, coords.y, false);
      lastPixel.current = coords;
    }
  }, [getPixelCoords, applyTool]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (['pen', 'marker', 'eraser', 'blotch', 'rainbow', 'airbrush', 'watercolor'].includes(activeTool)) {
      onGridChange(grid.data, true);
    }
    isDrawing.current = false;
    lastPixel.current = null;
  }, [activeTool, grid, onGridChange]);

  let cursor = 'crosshair';
  if (activeTool === 'eraser') cursor = 'cell';
  if (activeTool === 'marker') cursor = 'crosshair';
  if (activeTool === 'fill') cursor = 'cell';
  if (activeTool === 'stamp') cursor = 'copy';
  if (activeTool === 'hand') cursor = 'grab';
  if (activeTool === 'airbrush') cursor = 'cell';
  if (activeTool === 'watercolor') cursor = 'cell';

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{ cursor, imageRendering: 'pixelated', display: 'block', touchAction: 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-testid="pixel-canvas"
    />
  );
}
