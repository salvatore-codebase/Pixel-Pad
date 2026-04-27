import { useState } from "react";
import { STAMP_SHAPES } from "@/lib/stamps";
import type { StampShape } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StampPanelProps {
  selectedStamp: StampShape | null;
  onSelectStamp: (stamp: StampShape) => void;
}

const CATEGORIES = [
  { label: 'People', ids: ['person', 'girl', 'robot', 'unicorn'] },
  { label: 'Nature', ids: ['tree', 'palm', 'flower', 'mushroom', 'sun', 'moon', 'cloud', 'rainbow', 'snowflake', 'lightning'] },
  { label: 'Animals', ids: ['fish', 'octopus', 'shark', 'butterfly', 'duck', 'dinosaur'] },
  { label: 'Vehicles', ids: ['car', 'truck', 'plane', 'rocket', 'boat'] },
  { label: 'Buildings', ids: ['house', 'castle', 'tower'] },
  { label: 'Fun', ids: ['kite', 'star', 'heart', 'balloon', 'icecream', 'waterfall'] },
];

export default function StampPanel({ selectedStamp, onSelectStamp }: StampPanelProps) {
  const [activeCategory, setActiveCategory] = useState('People');

  const category = CATEGORIES.find(c => c.label === activeCategory)!;
  const stamps = STAMP_SHAPES.filter(s => category.ids.includes(s.id));

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Stamps
      </div>

      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(cat.label)}
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-semibold transition-colors",
              activeCategory === cat.label
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
            data-testid={`stamp-category-${cat.label}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-1">
        {stamps.map(stamp => (
          <button
            key={stamp.id}
            onClick={() => onSelectStamp(stamp)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all",
              selectedStamp?.id === stamp.id
                ? "border-primary bg-primary/20 scale-95"
                : "border-transparent bg-muted/40 hover:bg-muted/80 hover:border-white/20"
            )}
            title={stamp.name}
            data-testid={`stamp-${stamp.id}`}
          >
            <span className="text-xl leading-none">{stamp.icon}</span>
            <span className="text-[9px] text-muted-foreground leading-tight text-center">{stamp.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
