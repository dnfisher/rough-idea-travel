"use client";

import type { ElementType } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  Clock,
  Star,
  Sun,
  CloudRain,
  Thermometer,
  CalendarDays,
  Globe,
  Utensils,
  MessageCircle,
  MapPinned,
  Banknote,
  Gem,
  Lightbulb,
  Calendar,
} from "lucide-react";
import type { DeepPartial } from "ai";
import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { DestinationImage } from "./DestinationImage";
import { ItineraryTimeline } from "./ItineraryTimeline";
import { ExploreMap } from "./ExploreMap";
import { BookingLinks } from "./BookingLinks";
import type { MapMarker } from "./ExploreMapInner";
import { useCurrency } from "@/components/CurrencyProvider";
import { formatPrice } from "@/lib/currency";

const INSIGHT_ICONS: Record<string, ElementType> = {
  "Food & Drink": Utensils,
  "Customs": Globe,
  "Language": MessageCircle,
  "Getting Around": MapPinned,
  "Money": Banknote,
  "Hidden Gems": Gem,
  "Local Tips": Lightbulb,
};

const EVENT_TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  festival: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
  cultural: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  music: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300" },
  food: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300" },
  sports: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300" },
  religious: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  market: { bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-300" },
};

interface DestinationDetailContentProps {
  destination: DeepPartial<DestinationSuggestion>;
  /** Override image search name from Phase 1 summary (ensures card/detail images match) */
  imageSearchName?: string;
  /** Stable country from Phase 1 summary (prevents streaming-induced image changes) */
  stableCountry?: string;
  rank?: number;
  isRecommended?: boolean;
  /** Slot for action buttons (favorite, share, close) rendered above the content */
  actions?: React.ReactNode;
  /** Show "shared on" badge with date */
  sharedDate?: Date;
}

export function DestinationDetailContent({
  destination,
  imageSearchName: imageSearchNameProp,
  stableCountry,
  rank,
  isRecommended,
  actions,
  sharedDate,
}: DestinationDetailContentProps) {
  const { currency } = useCurrency();

  // Build map markers from itinerary days
  const mapMarkers: MapMarker[] = (destination.itinerary?.days ?? [])
    .filter((d) => d?.coordinates?.lat != null && d?.coordinates?.lng != null)
    .map((d, i) => ({
      id: `day-${d!.dayNumber ?? i + 1}`,
      lat: d!.coordinates!.lat!,
      lng: d!.coordinates!.lng!,
      label: d!.dayNumber ?? i + 1,
      title: `Day ${d!.dayNumber ?? i + 1}`,
      subtitle: d!.location,
      isItinerary: true,
    }));

  // For road trip routes, use first itinerary location for the image instead of the route title
  // Prefer the prop override from Phase 1 summary (ensures card/detail images match)
  const itineraryLocations = destination.itinerary?.days
    ?.map((d) => d?.location)
    .filter(Boolean) ?? [];
  const uniqueLocations = [...new Set(itineraryLocations)];
  const isMultiStop = uniqueLocations.length > 1;

  const resolvedImageSearchName = imageSearchNameProp
    ?? (isMultiStop ? destination.itinerary?.days?.[0]?.location ?? destination.country : undefined);

  const resolvedFallbackName = imageSearchNameProp
    ?? (isMultiStop ? (destination.itinerary?.days?.[0]?.location ?? destination.country ?? undefined) : undefined);

  return (
    <div className="space-y-6">
      {/* Hero image */}
      <div className="relative h-56 sm:h-72 -mx-6 -mt-6">
        <DestinationImage
          name={destination.name}
          country={stableCountry ?? destination.country}
          searchName={resolvedImageSearchName ?? undefined}
          fallbackName={resolvedFallbackName ?? undefined}
          className="w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Rank badge */}
        {rank != null && (
          <span className="absolute top-4 left-6 flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg">
            {rank}
          </span>
        )}

        {/* Match score */}
        {destination.matchScore != null && (
          <span className="absolute top-4 right-6 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-sm font-bold text-primary shadow-sm">
            {destination.matchScore} match
          </span>
        )}

        {/* Name overlay */}
        <div className="absolute bottom-4 left-6 right-6">
          <h2 className="font-display font-semibold text-2xl text-white drop-shadow-sm">
            {destination.name || "Loading..."}
            {isRecommended && (
              <span className="inline-flex items-center ml-2 text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full align-middle">
                <Star className="h-3 w-3 mr-0.5 fill-current" />
                Top Pick
              </span>
            )}
          </h2>
          {destination.country && (
            <p className="text-sm text-white/80">{destination.country}</p>
          )}
        </div>
      </div>

      {/* Action bar */}
      {(actions || sharedDate) && (
        <div className="flex items-center justify-between">
          {sharedDate && (
            <span className="text-xs text-muted-foreground">
              Shared on {sharedDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
          {actions && <div className="flex items-center gap-2 ml-auto">{actions}</div>}
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {destination.estimatedDailyCostEur != null && (
          <div className="rounded-xl border border-border p-3 text-center">
            <p className="text-sm font-medium">~{formatPrice(destination.estimatedDailyCostEur, currency)}/day</p>
            <p className="text-xs text-muted-foreground">Estimated cost</p>
          </div>
        )}
        {destination.suggestedDuration && (
          <div className="rounded-xl border border-border p-3 text-center">
            <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-sm font-medium">{destination.suggestedDuration}</p>
            <p className="text-xs text-muted-foreground">Duration</p>
          </div>
        )}
        {destination.bestTimeToVisit && (
          <div className="rounded-xl border border-border p-3 text-center">
            <CalendarDays className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-sm font-medium">{destination.bestTimeToVisit}</p>
            <p className="text-xs text-muted-foreground">Best time</p>
          </div>
        )}
        {destination.weather?.sunshineHours != null && (
          <div className="rounded-xl border border-border p-3 text-center">
            <Sun className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-sm font-medium">{destination.weather.sunshineHours}h sun</p>
            <p className="text-xs text-muted-foreground">Daily average</p>
          </div>
        )}
      </div>

      {/* Reasoning */}
      {destination.reasoning && (
        <div>
          <h3 className="font-display font-semibold text-sm mb-2">Why this destination?</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{destination.reasoning}</p>
        </div>
      )}

      {/* Pros & Cons */}
      {(destination.pros?.length || destination.cons?.length) ? (
        <div className="grid grid-cols-2 gap-4">
          {destination.pros && destination.pros.length > 0 && (
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-1.5 font-medium text-green-600 dark:text-green-400 mb-2 text-sm">
                <ThumbsUp className="h-4 w-4" />
                Pros
              </div>
              <ul className="space-y-1.5">
                {destination.pros.map((pro) => (
                  <li key={pro} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">+</span>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {destination.cons && destination.cons.length > 0 && (
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-1.5 font-medium text-red-500 dark:text-red-400 mb-2 text-sm">
                <ThumbsDown className="h-4 w-4" />
                Cons
              </div>
              <ul className="space-y-1.5">
                {destination.cons.map((con) => (
                  <li key={con} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">-</span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {/* Top Activities */}
      {destination.topActivities && destination.topActivities.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-sm mb-2">Top Activities</h3>
          <div className="flex flex-wrap gap-2">
            {destination.topActivities.map((activity) => (
              <span
                key={activity}
                className="px-3 py-1.5 rounded-xl bg-accent text-sm text-accent-foreground"
              >
                {activity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Weather detail */}
      {destination.weather && (
        <div className="rounded-xl border border-border p-4">
          <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-1.5">
            <Thermometer className="h-4 w-4 text-primary" />
            Weather
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm">
            {destination.weather.avgHighC != null && (
              <div>
                <p className="font-medium text-primary">{destination.weather.avgHighC}°C</p>
                <p className="text-xs text-muted-foreground">High</p>
              </div>
            )}
            {destination.weather.avgLowC != null && (
              <div>
                <p className="font-medium text-blue-500">{destination.weather.avgLowC}°C</p>
                <p className="text-xs text-muted-foreground">Low</p>
              </div>
            )}
            {destination.weather.rainyDays != null && (
              <div>
                <p className="font-medium flex items-center justify-center gap-1">
                  <CloudRain className="h-3.5 w-3.5" />
                  {destination.weather.rainyDays}
                </p>
                <p className="text-xs text-muted-foreground">Rainy days</p>
              </div>
            )}
            {destination.weather.sunshineHours != null && (
              <div>
                <p className="font-medium flex items-center justify-center gap-1">
                  <Sun className="h-3.5 w-3.5" />
                  {destination.weather.sunshineHours}h
                </p>
                <p className="text-xs text-muted-foreground">Sunshine</p>
              </div>
            )}
          </div>
          {destination.weather.description && (
            <p className="mt-3 text-xs text-muted-foreground">{destination.weather.description}</p>
          )}
        </div>
      )}

      {/* Local Insights */}
      {destination.localInsights && destination.localInsights.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-primary" />
            Local Insights
          </h3>
          <div className="space-y-2">
            {destination.localInsights.map((insight, i) => {
              if (!insight?.category || !insight?.insight) return null;
              const Icon = INSIGHT_ICONS[insight.category] ?? Lightbulb;
              return (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-border p-3">
                  <Icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-primary">{insight.category}</span>
                    <p className="text-sm text-muted-foreground">{insight.insight}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Local Events */}
      {destination.localEvents && destination.localEvents.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary" />
            What&apos;s Happening
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {destination.localEvents.map((event, i) => {
              if (!event?.name) return null;
              const typeStyle = EVENT_TYPE_STYLES[event.type ?? "cultural"] ?? EVENT_TYPE_STYLES.cultural;
              return (
                <div key={i} className="rounded-xl border border-border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm">{event.name}</h4>
                    {event.type && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${typeStyle.bg} ${typeStyle.text} capitalize flex-shrink-0`}>
                        {event.type}
                      </span>
                    )}
                  </div>
                  {event.date && (
                    <p className="text-xs text-primary font-medium flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {event.date}
                    </p>
                  )}
                  {event.description && (
                    <p className="text-xs text-muted-foreground">{event.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mini map */}
      {mapMarkers.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-sm mb-2">Route</h3>
          <ExploreMap
            markers={mapMarkers}
            selectedId={null}
            showRoute={true}
            height={280}
          />
        </div>
      )}

      {/* Full itinerary */}
      {destination.itinerary?.days?.length ? (
        <ItineraryTimeline itinerary={destination.itinerary} />
      ) : null}

      {/* Booking CTAs */}
      <BookingLinks destination={destination} />
    </div>
  );
}
