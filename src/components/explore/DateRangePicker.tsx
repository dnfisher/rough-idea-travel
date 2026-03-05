"use client";

import { useState, useCallback } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  startDate: string;   // ISO "YYYY-MM-DD" or ""
  endDate: string;     // ISO "YYYY-MM-DD" or ""
  onChange: (start: string, end: string) => void;
  className?: string;
}

function toDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplay(iso: string): string {
  const d = toDate(iso);
  if (!d) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function DateRangePicker({ startDate, endDate, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState<Date>(() => {
    return toDate(startDate) ?? new Date();
  });

  const range: DateRange = {
    from: toDate(startDate),
    to: toDate(endDate),
  };

  const handleSelect = useCallback(
    (selected: DateRange | undefined) => {
      if (!selected) {
        onChange("", "");
        return;
      }

      const start = selected.from ? toIso(selected.from) : "";
      const end = selected.to ? toIso(selected.to) : "";

      // When start is selected but no end yet, sync right month to start month
      if (selected.from && !selected.to) {
        setDisplayMonth(selected.from);
      }

      onChange(start, end);

      // Close when a complete range is selected
      if (selected.from && selected.to) {
        setIsOpen(false);
      }
    },
    [onChange]
  );

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("", "");
    setIsOpen(false);
  }

  const triggerLabel =
    startDate && endDate
      ? `${formatDisplay(startDate)} – ${formatDisplay(endDate)}`
      : startDate
      ? `${formatDisplay(startDate)} – select return`
      : "Select dates";

  const hasSelection = !!startDate;

  return (
    <div className={cn("relative", className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: "12px",
          border: `1px solid ${isOpen ? "#2ABFBF" : "#2E2B25"}`,
          background: "#252219",
          color: hasSelection ? "#F2EEE8" : "#6B6258",
          fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
          fontSize: "14px",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "border-color 0.15s ease",
        }}
        aria-expanded={isOpen}
        aria-label={triggerLabel}
      >
        <Calendar style={{ width: "15px", height: "15px", flexShrink: 0, color: "#6B6258" }} />
        <span style={{ flex: 1 }}>{triggerLabel}</span>
        {hasSelection && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear dates"
            style={{
              background: "none",
              border: "none",
              padding: "2px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <X
              style={{
                width: "14px",
                height: "14px",
                color: "#6B6258",
              }}
            />
          </button>
        )}
      </button>

      {/* Inline calendar */}
      {isOpen && (
        <div
          style={{
            marginTop: "8px",
            padding: "12px",
            borderRadius: "14px",
            border: "1px solid #2E2B25",
            background: "#1C1A17",
            overflow: "auto",
          }}
        >
          <DayPicker
            mode="range"
            selected={range}
            onSelect={handleSelect}
            numberOfMonths={2}
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            disabled={{ before: new Date() }}
          />
        </div>
      )}
    </div>
  );
}
