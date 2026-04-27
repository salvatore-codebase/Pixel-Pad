import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface CustomPalettePanelProps {
  colors: string[];
  selectedColor: string;
  onSelectColor: (color: string) => void;
  onUpdateColor: (index: number, color: string) => void;
}

export default function CustomPalettePanel({
  colors,
  selectedColor,
  onSelectColor,
  onUpdateColor,
}: CustomPalettePanelProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);

  const handleSwatchClick = (index: number) => {
    onSelectColor(colors[index]);
  };

  const handleSwatchRightClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setEditingIndex(index);
    setTimeout(() => colorPickerRef.current?.click(), 0);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
        Custom Palette
      </div>
      <div className="grid grid-cols-5 gap-1">
        {colors.map((color, i) => (
          <button
            key={i}
            className={cn(
              "palette-swatch",
              selectedColor === color && "selected"
            )}
            style={{ backgroundColor: color || '#1a1a2e', border: !color ? '2px dashed rgba(255,255,255,0.2)' : undefined }}
            onClick={() => handleSwatchClick(i)}
            onContextMenu={(e) => handleSwatchRightClick(e, i)}
            title={`${color || 'Empty'} (right-click to edit)`}
            data-testid={`palette-swatch-${i}`}
          />
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">Right-click to edit a color</div>

      <input
        ref={colorPickerRef}
        type="color"
        value={editingIndex !== null ? colors[editingIndex] || '#ffffff' : '#ffffff'}
        onChange={(e) => {
          if (editingIndex !== null) {
            onUpdateColor(editingIndex, e.target.value.toUpperCase());
          }
        }}
        onBlur={() => setEditingIndex(null)}
        className="w-0 h-0 opacity-0 absolute"
        data-testid="palette-color-picker"
      />
    </div>
  );
}
