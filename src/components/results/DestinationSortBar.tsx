"use client";

import { Trophy, DollarSign, Sun, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortOption = "match" | "cost" | "weather" | "duration";

const options: { id: SortOption; label: string; icon: React.ReactNode }[] = [
  { id: "match", label: "Best Match", icon: <Trophy className="h-3.5 w-3.5" /> },
  { id: "cost", label: "Lowest Cost", icon: <DollarSign className="h-3.5 w-3.5" /> },
  { id: "weather", label: "Best Weather", icon: <Sun className="h-3.5 w-3.5" /> },
  { id: "duration", label: "Shortest Trip", icon: <Clock className="h-3.5 w-3.5" /> },
];

interface DestinationSortBarProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function DestinationSortBar({ value, onChange }: DestinationSortBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all border",
            value === opt.id
              ? "bg-accent text-accent-foreground border-primary/30 shadow-sm"
              : "border-border text-muted-foreground hover:border-primary/40"
          )}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
