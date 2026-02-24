"use client";

import { Clock, Star, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeepPartial } from "ai";
import type { DestinationSummary, DestinationSuggestion } from "@/lib/ai/schemas";
import { DestinationImage } from "./DestinationImage";
import { useCurrency } from "@/components/CurrencyProvider";
import { formatPrice } from "@/lib/currency";

interface DestinationCardProps {
  destination: DeepPartial<DestinationSummary> | DeepPartial<DestinationSuggestion>;
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
  const { currency } = useCurrency();
  const activities = destination.topActivities ?? [];
  const displayActivities = activities.slice(0, 3);
  const moreCount = activities.length - 3;

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border overflow-hidden transition-all bg-card shadow-sm cursor-pointer",
        isSelected
          ? "border-primary shadow-lg ring-2 ring-primary/20"
          : "border-border hover:shadow-md",
        isRecommended && !isSelected && "ring-1 ring-primary/20"
      )}
    >
      {/* Hero image */}
      <div className="relative h-36">
        <DestinationImage
          name={destination.name}
          country={destination.country}
          className="w-full h-full"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Rank badge */}
        <span className="absolute top-3 left-3 flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg">
          {rank}
        </span>

        {/* Match score */}
        {destination.matchScore != null && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-xs font-bold text-primary shadow-sm">
            {destination.matchScore}%
          </span>
        )}

        {/* Name and country */}
        <div className="absolute bottom-2.5 left-3 right-3">
          <h3 className="font-display font-semibold text-base text-white drop-shadow-sm leading-tight">
            {destination.name || "Loading..."}
            {isRecommended && (
              <span className="inline-flex items-center ml-1.5 text-[10px] bg-white/20 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full align-middle">
                <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                Top Pick
              </span>
            )}
          </h3>
          {destination.country && (
            <p className="text-xs text-white/80">{destination.country}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2.5">
        {destination.reasoning && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {destination.reasoning}
          </p>
        )}

        <div className="flex gap-4 text-sm">
          {destination.estimatedDailyCostEur != null && (
            <span className="flex items-center gap-1 text-muted-foreground">
              ~{formatPrice(destination.estimatedDailyCostEur, currency)}/day
            </span>
          )}
          {destination.suggestedDuration && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {destination.suggestedDuration}
            </span>
          )}
        </div>

        {displayActivities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {displayActivities.map((activity) => (
              <span
                key={activity}
                className="px-2 py-0.5 rounded-lg bg-accent text-xs text-accent-foreground"
              >
                {activity}
              </span>
            ))}
            {moreCount > 0 && (
              <span className="px-2 py-0.5 rounded-lg text-xs text-muted-foreground">
                +{moreCount} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-end pt-0.5 text-xs text-primary font-medium">
          View details
          <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
        </div>
      </div>
    </div>
  );
}
