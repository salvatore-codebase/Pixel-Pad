import { useRef, useEffect, useCallback } from "react";

function hexToRgb(hex: string): [number, number, number] {
  if (!hex || hex.length < 7) return [0, 0, 0];
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (d > 0) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, v * 100];
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  s /= 100; v /= 100; h /= 360;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  const cases: Array<[number, number, number]> = [
    [v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q],
  ];
  const [r, g, b] = cases[i % 6];
  return [r * 255, g * 255, b * 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${Math.round(Math.max(0, Math.min(255, r))).toString(16).padStart(2, '0')}${Math.round(Math.max(0, Math.min(255, g))).toString(16).padStart(2, '0')}${Math.round(Math.max(0, Math.min(255, b))).toString(16).padStart(2, '0')}`.toUpperCase();
}

function hsvToHex(h: number, s: number, v: number): string {
  return rgbToHex(...hsvToRgb(h, s, v));
}

interface ShadeAndTintPickerProps {
  baseColor: string;
  selectedColor: string;
  onSelectColor: (color: string) => void;
  opacity: number;
  onOpacityChange: (v: number) => void;
}

const SV_HEIGHT = 200;

export default function ShadeAndTintPicker({ baseColor, selectedColor, onSelectColor, opacity, onOpacityChange }: ShadeAndTintPickerProps) {
  const svRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [rb, gb, bb] = hexToRgb(baseColor);
  const [hue] = rgbToHsv(rb, gb, bb);
  const pureHue = hsvToHex(hue, 100, 100);

  const [rs, gs, bs] = hexToRgb(selectedColor);
  const [, curS, curV] = rgbToHsv(rs, gs, bs);

  const drawSV = useCallback(() => {
    const canvas = svRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;

    const satGrad = ctx.createLinearGradient(0, 0, w, 0);
    satGrad.addColorStop(0, '#ffffff');
    satGrad.addColorStop(1, pureHue);
    ctx.fillStyle = satGrad;
    ctx.fillRect(0, 0, w, h);

    const valGrad = ctx.createLinearGradient(0, 0, 0, h);
    valGrad.addColorStop(0, 'rgba(0,0,0,0)');
    valGrad.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = valGrad;
    ctx.fillRect(0, 0, w, h);

    const cx = (curS / 100) * w;
    const cy = (1 - curV / 100) * h;
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [pureHue, curS, curV]);

  useEffect(() => {
    const canvas = svRef.current;
    if (!canvas || !containerRef.current) return;
    canvas.width = containerRef.current.clientWidth || 180;
    canvas.height = SV_HEIGHT;
    drawSV();
  }, [drawSV]);

  useEffect(() => {
    const canvas = svRef.current;
    if (!canvas || !containerRef.current) return;
    canvas.width = containerRef.current.clientWidth || 180;
    drawSV();
  }, [baseColor, selectedColor, drawSV]);

  const pickSV = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = svRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      if (!e.touches[0]) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const s = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const v = Math.max(0, Math.min(100, (1 - (clientY - rect.top) / rect.height) * 100));
    onSelectColor(hsvToHex(hue, s, v));
  }, [hue, onSelectColor]);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Shader
      </div>

      {/* SV color rectangle */}
      <div ref={containerRef} className="w-full rounded overflow-hidden border border-white/10" style={{ touchAction: 'none' }}>
        <canvas
          ref={svRef}
          style={{ display: 'block', width: '100%', height: `${SV_HEIGHT}px`, cursor: 'crosshair' }}
          onMouseDown={pickSV}
          onMouseMove={(e) => { if (e.buttons === 1) pickSV(e); }}
          onTouchStart={pickSV}
          onTouchMove={pickSV}
        />
      </div>

      {/* Opacity bar */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Opacity</span>
          <span className="text-[10px] text-muted-foreground font-mono">{opacity}%</span>
        </div>
        <div className="relative h-4 rounded overflow-hidden border border-white/10">
          {/* Checkerboard background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'repeating-conic-gradient(#555 0% 25%, #333 0% 50%)',
              backgroundSize: '8px 8px',
            }}
          />
          {/* Color gradient overlay */}
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to right, transparent, ${selectedColor})` }}
          />
          {/* Range input on top */}
          <input
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={(e) => onOpacityChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{ margin: 0, padding: 0 }}
          />
        </div>
      </div>
    </div>
  );
}
