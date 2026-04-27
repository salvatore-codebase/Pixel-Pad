import { useRef, useEffect, useCallback } from "react";

interface ShadeAndTintPickerProps {
  baseColor: string;
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

function hexToHsl(hex: string): [number, number, number] {
  if (!hex || hex.length < 7) return [0, 0, 50];
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  const sl = s / 100, ll = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sl * Math.min(ll, 1 - ll);
  const f = (n: number) => {
    const val = Math.round(255 * (ll - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
    return Math.max(0, Math.min(255, val)).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function buildShades(hex: string): string[] {
  const [h, s] = hexToHsl(hex);
  const shades: string[] = [];
  for (let l = 95; l >= 5; l -= 5) {
    shades.push(hslToHex(h, s, l));
  }
  return shades; // 19 swatches from light to dark
}

export default function ShadeAndTintPicker({ baseColor, selectedColor, onSelectColor }: ShadeAndTintPickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [h, s] = hexToHsl(baseColor);
  const shades = buildShades(baseColor);

  const drawGradient = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h2 = canvas.height;
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, hslToHex(h, s, 95));
    grad.addColorStop(0.5, baseColor);
    grad.addColorStop(1, hslToHex(h, s, 5));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h2);

    // Draw marker for currently selected color
    const [, , currentL] = hexToHsl(selectedColor);
    const xPos = ((95 - currentL) / 90) * w;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(xPos, h2 / 2, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(xPos, h2 / 2, 7, 0, Math.PI * 2);
    ctx.stroke();
  }, [baseColor, selectedColor, h, s]);

  useEffect(() => {
    drawGradient();
  }, [drawGradient]);

  const pickFromCanvas = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const l = Math.round(95 - x * 90);
    const clampedL = Math.max(5, Math.min(95, l));
    onSelectColor(hslToHex(h, s, clampedL));
  }, [h, s, onSelectColor]);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Shade &amp; Tint
      </div>

      {/* Gradient bar */}
      <canvas
        ref={canvasRef}
        width={180}
        height={20}
        className="w-full rounded cursor-crosshair border border-white/10"
        style={{ imageRendering: 'pixelated', height: '20px' }}
        onClick={pickFromCanvas}
        onMouseMove={(e) => { if (e.buttons === 1) pickFromCanvas(e); }}
      />

      {/* Discrete swatches */}
      <div className="flex gap-[2px] flex-wrap">
        {shades.map((color) => (
          <button
            key={color}
            className="flex-shrink-0 rounded-sm border-2 transition-transform hover:scale-125 hover:z-10"
            style={{
              backgroundColor: color,
              width: '16px',
              height: '16px',
              borderColor: selectedColor.toUpperCase() === color.toUpperCase() ? 'white' : 'transparent',
              transform: selectedColor.toUpperCase() === color.toUpperCase() ? 'scale(1.2)' : undefined,
            }}
            onClick={() => onSelectColor(color)}
            title={color}
          />
        ))}
      </div>

      <div className="text-[10px] text-muted-foreground">
        Based on selected palette color
      </div>
    </div>
  );
}
