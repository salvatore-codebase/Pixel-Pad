import { useState, useRef } from "react";
import { FULL_SPECTRUM_COLORS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ColorSpectrumProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

export default function ColorSpectrum({ selectedColor, onSelectColor }: ColorSpectrumProps) {
  const [hexInput, setHexInput] = useState(selectedColor);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleHexChange = (val: string) => {
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onSelectColor(val.toUpperCase());
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-[2px]">
        {FULL_SPECTRUM_COLORS.map((color) => (
          <button
            key={color}
            className={cn(
              "w-4 h-4 rounded-sm border-2 transition-transform hover:scale-110 hover:z-10",
              selectedColor === color ? "border-white scale-110 z-10" : "border-transparent"
            )}
            style={{ backgroundColor: color }}
            onClick={() => { onSelectColor(color); setHexInput(color); }}
            title={color}
            data-testid={`spectrum-color-${color}`}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 mt-1">
        <div
          className="w-8 h-8 rounded border-2 border-white/20 flex-shrink-0 cursor-pointer"
          style={{ backgroundColor: selectedColor }}
          onClick={() => inputRef.current?.click()}
        />
        <input
          ref={inputRef}
          type="color"
          value={selectedColor}
          onChange={(e) => { onSelectColor(e.target.value.toUpperCase()); setHexInput(e.target.value.toUpperCase()); }}
          className="w-0 h-0 opacity-0 absolute"
          data-testid="color-picker-input"
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => handleHexChange(e.target.value)}
          onFocus={() => setHexInput(selectedColor)}
          className="flex-1 text-xs font-mono px-2 py-1 rounded border border-white/10 bg-white/5 text-foreground uppercase"
          maxLength={7}
          placeholder="#FFFFFF"
          data-testid="hex-input"
        />
      </div>
    </div>
  );
}
