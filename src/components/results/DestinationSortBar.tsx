"use client";

import { Trophy, DollarSign, Sun, Clock } from "lucide-react";

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
    <div
      style={{
        background: "var(--dp-bg-subtle, #252219)",
        borderRadius: "12px",
        padding: "6px",
        display: "flex",
        gap: "4px",
        flexWrap: "wrap",
      }}
    >
      {options.map((opt) => {
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            style={{
              height: "36px",
              padding: "0 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s",
              background: isActive ? "rgba(42,191,191,0.15)" : "transparent",
              color: isActive ? "#2ABFBF" : "var(--dp-text-muted, #6B6258)",
              fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
            }}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
