"use client";

import { MapPin, Car, Utensils, Lightbulb, Bed } from "lucide-react";
import type { DeepPartial } from "ai";
import type { ItinerarySuggestion } from "@/lib/ai/schemas";

interface ItineraryTimelineProps {
  itinerary: DeepPartial<ItinerarySuggestion>;
}

export function ItineraryTimeline({ itinerary }: ItineraryTimelineProps) {
  if (!itinerary || !itinerary.days?.length) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-base">
          {itinerary.destinationName
            ? `${itinerary.destinationName} — ${itinerary.totalDays || itinerary.days.length} Day Itinerary`
            : "Recommended Itinerary"}
        </h3>
        <div className="flex gap-4 text-sm text-muted-foreground">
          {itinerary.totalDriveTimeHours != null && (
            <span className="flex items-center gap-1">
              <Car className="h-3.5 w-3.5" />
              {itinerary.totalDriveTimeHours}h total driving
            </span>
          )}
          {itinerary.estimatedTotalCostEur != null && (
            <span>~€{itinerary.estimatedTotalCostEur} total</span>
          )}
        </div>
      </div>

      {/* Day cards */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-8 bottom-8 w-px bg-border" />

        <div className="space-y-4">
          {itinerary.days.map((day, idx) => {
            if (!day) return null;
            return (
              <div key={day.dayNumber ?? idx} className="relative flex gap-4">
                {/* Day marker */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold z-10">
                  {day.dayNumber}
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <div className="rounded-2xl border border-border p-4 bg-card shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {day.location}
                      </h4>
                      {day.driveTimeFromPrevious && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 bg-accent/60 px-2 py-0.5 rounded-full">
                          <Car className="h-3 w-3" />
                          {day.driveTimeFromPrevious}
                          {day.driveDistanceKm
                            ? ` (${day.driveDistanceKm}km)`
                            : ""}
                        </span>
                      )}
                    </div>

                    {/* Highlights */}
                    {day.highlights && day.highlights.length > 0 && (
                      <ul className="space-y-1 mb-3">
                        {day.highlights.map((highlight, i) => (
                          <li
                            key={i}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <span className="text-primary mt-0.5">•</span>
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {/* Overnight */}
                      {day.overnightStay && (
                        <span className="flex items-center gap-1">
                          <Bed className="h-3 w-3" />
                          {day.overnightStay}
                        </span>
                      )}
                      {/* Meals */}
                      {day.meals && day.meals.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Utensils className="h-3 w-3" />
                          {day.meals.join(", ")}
                        </span>
                      )}
                    </div>

                    {/* Tip */}
                    {day.tips && (
                      <p className="mt-2 text-xs text-muted-foreground bg-accent/30 rounded-lg px-3 py-2 flex items-start gap-1.5">
                        <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0 text-highlight" />
                        {day.tips}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Practical tips */}
      {itinerary.practicalTips && itinerary.practicalTips.length > 0 && (
        <div className="rounded-2xl border border-border p-4 bg-accent/30 shadow-sm">
          <h4 className="font-display font-medium text-sm mb-2 flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-primary" />
            Practical Tips
          </h4>
          <ul className="space-y-1">
            {itinerary.practicalTips.map((tip, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                • {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Packing tips */}
      {itinerary.packingTips && itinerary.packingTips.length > 0 && (
        <div className="rounded-2xl border border-border p-4 bg-accent/30 shadow-sm">
          <h4 className="font-display font-medium text-sm mb-2">Packing Tips</h4>
          <ul className="space-y-1">
            {itinerary.packingTips.map((tip, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                • {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
