import { useRef, useCallback, useEffect, useState } from "react";
import type { PixelGrid, ToolCreative, ToolJunior } from "@/lib/types";
import { blotchPixels, drawLine, floodFill } from "@/lib/utils";
import type { StampShape } from "@/lib/types";

interface PixelCanvasProps {
  grid: PixelGrid;
  zoom: number;
  showGrid: boolean;
  activeTool: ToolCreative | ToolJunior;
  activeColor: string;
  selectedStamp?: StampShape | null;
  onGridChange: (newData: string[], pushHistory?: boolean) => void;
  onPickColor?: (color: string) => void;
}

const RAINBOW_COLORS = ['#FF0000','#FF6600','#FFFF00','#00CC00','#0099FF','#9900FF','#FF00CC'];

export default function PixelCanvas({
  grid,
  zoom,
  showGrid,
  activeTool,
  activeColor,
  selectedStamp,
  onGridChange,
  onPickColor,
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

        // Checkerboard for empty
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

    // Grid lines
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= grid.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * pixelSize, 0);
        ctx.lineTo(x * pixelSize, canvasHeight);
        ctx.stroke();
      }
      for (let y = 0; y <= grid.height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * pixelSize);
        ctx.lineTo(canvasWidth, y * pixelSize);
        ctx.stroke();
      }
    }
  }, [grid, zoom, showGrid, canvasWidth, canvasHeight, pixelSize, stampPreview, selectedStamp, activeTool]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const applyTool = useCallback((x: number, y: number, isFirst: boolean) => {
    let newData = [...grid.data];
    const tool = activeTool;

    if (tool === 'eyedropper') {
      const color = grid.data[y * grid.width + x];
      if (color && onPickColor) onPickColor(color);
      return;
    }

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
      newData = blotchPixels(newData, grid.width, grid.height, x, y, activeColor, 2);
      onGridChange(newData, false);
      return;
    }

    if (tool === 'eraser') {
      newData[y * grid.width + x] = '';
      onGridChange(newData, false);
      return;
    }

    if (tool === 'circle') {
      const cx = x, cy = y, r = 2;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy <= r * r) {
            const nx = cx + dx, ny = cy + dy;
            if (nx >= 0 && nx < grid.width && ny >= 0 && ny < grid.height) {
              newData[ny * grid.width + nx] = activeColor;
            }
          }
        }
      }
      onGridChange(newData, true);
      return;
    }

    if (tool === 'square') {
      const r = 2;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < grid.width && ny >= 0 && ny < grid.height) {
            newData[ny * grid.width + nx] = activeColor;
          }
        }
      }
      onGridChange(newData, true);
      return;
    }

    if (tool === 'star') {
      const starPoints = [
        [0, -3], [0, 3], [-3, 0], [3, 0],
        [-2, -2], [2, -2], [-2, 2], [2, 2],
        [0, -2], [0, 2], [-2, 0], [2, 0],
        [0, -1], [0, 1], [-1, 0], [1, 0], [0, 0],
        [-1, -1], [1, -1], [-1, 1], [1, 1],
      ];
      for (const [dx, dy] of starPoints) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < grid.width && ny >= 0 && ny < grid.height) {
          newData[ny * grid.width + nx] = activeColor;
        }
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

    // Default pen
    if (tool === 'pen') {
      if (!isFirst && lastPixel.current) {
        newData = drawLine(newData, grid.width, grid.height, lastPixel.current.x, lastPixel.current.y, x, y, activeColor);
      } else {
        newData[y * grid.width + x] = activeColor;
      }
      onGridChange(newData, false);
    }

    if (tool === 'line') {
      if (isFirst) {
        lineStart.current = { x, y };
      }
    }
  }, [grid, activeTool, activeColor, selectedStamp, onGridChange, onPickColor]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getPixelCoords(e);
    if (!coords) return;
    isDrawing.current = true;
    lastPixel.current = coords;
    applyTool(coords.x, coords.y, true);
  }, [getPixelCoords, applyTool]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getPixelCoords(e);
    if (!coords) return;

    if (activeTool === 'stamp') {
      setStampPreview(coords);
    }

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

    if (['pen', 'eraser', 'blotch', 'rainbow'].includes(activeTool)) {
      onGridChange(grid.data, true);
    }

    isDrawing.current = false;
    lastPixel.current = null;
  }, [activeTool, getPixelCoords, grid, activeColor, onGridChange]);

  const handleMouseLeave = useCallback(() => {
    setStampPreview(null);
    if (!isDrawing.current) return;
    if (['pen', 'eraser', 'blotch', 'rainbow'].includes(activeTool)) {
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
    if (['pen', 'eraser', 'blotch', 'rainbow'].includes(activeTool)) {
      onGridChange(grid.data, true);
    }
    isDrawing.current = false;
    lastPixel.current = null;
  }, [activeTool, grid, onGridChange]);

  let cursor = 'crosshair';
  if (activeTool === 'eraser') cursor = 'cell';
  if (activeTool === 'eyedropper') cursor = 'copy';
  if (activeTool === 'fill') cursor = 'cell';
  if (activeTool === 'stamp') cursor = 'copy';

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{
        cursor,
        imageRendering: 'pixelated',
        display: 'block',
        touchAction: 'none',
      }}
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
