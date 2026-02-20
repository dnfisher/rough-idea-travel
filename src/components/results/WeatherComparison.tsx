"use client";

import { Sun, CloudRain, Thermometer } from "lucide-react";
import type { DeepPartial } from "ai";
import type { WeatherData } from "@/lib/ai/schemas";

interface WeatherComparisonProps {
  data: (DeepPartial<WeatherData> | undefined)[];
}

export function WeatherComparison({ data }: WeatherComparisonProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 bg-accent/50 border-b border-border">
        <h3 className="font-display font-semibold text-sm flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-primary" />
          Weather Comparison
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Destination
              </th>
              <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                <span className="flex items-center justify-center gap-1">
                  High
                </span>
              </th>
              <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                Low
              </th>
              <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                <span className="flex items-center justify-center gap-1">
                  <CloudRain className="h-3 w-3" />
                  Rain
                </span>
              </th>
              <th className="text-center px-3 py-3 font-medium text-muted-foreground">
                <span className="flex items-center justify-center gap-1">
                  <Sun className="h-3 w-3" />
                  Sun
                </span>
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((w, i) => {
              if (!w) return null;
              return (
              <tr
                key={w.destination || i}
                className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
              >
                <td className="px-4 py-3 font-medium">
                  {w.destination || "—"}
                </td>
                <td className="text-center px-3 py-3">
                  {w.avgHighC != null ? (
                    <span className="text-primary font-medium">
                      {w.avgHighC}°C
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="text-center px-3 py-3">
                  {w.avgLowC != null ? (
                    <span className="text-blue-600 dark:text-blue-400">
                      {w.avgLowC}°C
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="text-center px-3 py-3 text-muted-foreground">
                  {w.rainyDays != null ? `${w.rainyDays} days` : "—"}
                </td>
                <td className="text-center px-3 py-3 text-muted-foreground">
                  {w.sunshineHours != null ? `${w.sunshineHours}h` : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px]">
                  {w.description || "—"}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
