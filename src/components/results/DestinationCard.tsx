"use client";

import { ThumbsUp, ThumbsDown, Clock, DollarSign, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeepPartial } from "ai";
import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { DestinationImage } from "./DestinationImage";
import { ItineraryTimeline } from "./ItineraryTimeline";

interface DestinationCardProps {
  destination: DeepPartial<DestinationSuggestion>;
  rank: number;
  isRecommended?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export function DestinationCard({
  destination,
  rank,
  isRecommended,
  isSelected,
  onClick,
}: DestinationCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden transition-all bg-card shadow-sm",
        isSelected
          ? "border-primary shadow-lg ring-2 ring-primary/20"
          : "border-border hover:shadow-md cursor-pointer",
        isRecommended && !isSelected && "ring-1 ring-primary/20"
      )}
    >
      {/* Clickable header area */}
      <div onClick={onClick} className="cursor-pointer">
        {/* Hero image section */}
        <div className="relative h-48">
          <DestinationImage
            name={destination.name}
            country={destination.country}
            className="w-full h-full"
          />

          {/* Gradient overlay at bottom of image */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

          {/* Rank badge */}
          <span className="absolute top-3 left-3 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg">
            {rank}
          </span>

          {/* Match score badge */}
          {destination.matchScore != null && (
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-bold text-primary shadow-sm">
              {destination.matchScore} match
            </span>
          )}

          {/* Name and country over gradient */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-display font-semibold text-lg text-white drop-shadow-sm">
              {destination.name || "Loading..."}
              {isRecommended && (
                <span className="inline-flex items-center ml-2 text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
                  <Star className="h-3 w-3 mr-0.5 fill-current" />
                  Top Pick
                </span>
              )}
            </h3>
            {destination.country && (
              <p className="text-sm text-white/80">{destination.country}</p>
            )}
          </div>
        </div>

        {/* Content section */}
        <div className="p-5 space-y-3">
          {destination.reasoning && (
            <p className="text-sm text-muted-foreground">
              {destination.reasoning}
            </p>
          )}

          <div className="flex gap-4 text-sm">
            {destination.estimatedDailyCostEur != null && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                ~{destination.estimatedDailyCostEur}/day
              </span>
            )}
            {destination.suggestedDuration && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {destination.suggestedDuration}
              </span>
            )}
          </div>

          {destination.topActivities && destination.topActivities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {destination.topActivities.map((activity) => (
                <span
                  key={activity}
                  className="px-2.5 py-0.5 rounded-lg bg-accent text-xs text-accent-foreground"
                >
                  {activity}
                </span>
              ))}
            </div>
          )}

          {(destination.pros?.length || destination.cons?.length) && (
            <div className="grid grid-cols-2 gap-3 text-sm pt-1">
              {destination.pros && destination.pros.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 font-medium text-green-600 dark:text-green-400 mb-1">
                    <ThumbsUp className="h-3 w-3" />
                    Pros
                  </div>
                  <ul className="space-y-1">
                    {destination.pros.map((pro) => (
                      <li key={pro} className="text-muted-foreground text-xs">
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {destination.cons && destination.cons.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 font-medium text-red-500 dark:text-red-400 mb-1">
                    <ThumbsDown className="h-3 w-3" />
                    Cons
                  </div>
                  <ul className="space-y-1">
                    {destination.cons.map((con) => (
                      <li key={con} className="text-muted-foreground text-xs">
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Itinerary — shown when card is selected */}
      {isSelected && destination.itinerary?.days?.length && (
        <div className="border-t border-border px-5 py-5">
          <ItineraryTimeline itinerary={destination.itinerary} />
        </div>
      )}
    </div>
  );
}
