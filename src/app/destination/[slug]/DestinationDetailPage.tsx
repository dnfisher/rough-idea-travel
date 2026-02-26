"use client";

import { useEffect, useState, useMemo, useCallback, type ElementType } from "react";
import {
  ArrowLeft,
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
  AlertTriangle,
  Loader2,
} from "lucide-react";
import type { DeepPartial } from "ai";
import type { DestinationSuggestion, DestinationSummary, TripInput } from "@/lib/ai/schemas";
import { getDestinationContext, type DestinationPageContext } from "@/lib/destination-url";
import { DestinationImage } from "@/components/results/DestinationImage";
import { ItineraryTimeline } from "@/components/results/ItineraryTimeline";
import { ExploreMap } from "@/components/results/ExploreMap";
import { BookingLinks } from "@/components/results/BookingLinks";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { ShareButton } from "@/components/share/ShareButton";
import { useCurrency } from "@/components/CurrencyProvider";
import { formatPrice } from "@/lib/currency";
import type { MapMarker } from "@/components/results/ExploreMapInner";

// ── Constants ──────────────────────────────────────────────────

const INSIGHT_ICONS: Record<string, ElementType> = {
  "Food & Drink": Utensils,
  Customs: Globe,
  Language: MessageCircle,
  "Getting Around": MapPinned,
  Money: Banknote,
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

// ── Skeleton components ────────────────────────────────────────

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="h-5 w-40 animate-shimmer rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 animate-shimmer rounded-lg" style={{ width: `${85 - i * 12}%` }} />
      ))}
    </div>
  );
}

function ProsConsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-border p-4 space-y-3">
          <div className="h-5 w-16 animate-shimmer rounded-lg" />
          <div className="h-4 w-full animate-shimmer rounded-lg" />
          <div className="h-4 w-5/6 animate-shimmer rounded-lg" />
          <div className="h-4 w-4/6 animate-shimmer rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function ItinerarySkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-5 w-32 animate-shimmer rounded-lg" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl border border-border p-4 space-y-2">
          <div className="h-5 w-28 animate-shimmer rounded-lg" />
          <div className="h-4 w-full animate-shimmer rounded-lg" />
          <div className="h-4 w-2/3 animate-shimmer rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-5 w-32 animate-shimmer rounded-lg" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl border border-border p-3">
          <div className="h-4 w-4 animate-shimmer rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-20 animate-shimmer rounded-lg" />
            <div className="h-4 w-full animate-shimmer rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

interface DestinationDetailPageProps {
  slug: string;
}

export function DestinationDetailPage({ slug }: DestinationDetailPageProps) {
  const { currency } = useCurrency();

  // Phase 1 context from sessionStorage
  const [ctx, setCtx] = useState<DestinationPageContext | null>(null);
  const [noContext, setNoContext] = useState(false);

  // Phase 2 detail data
  const [detail, setDetail] = useState<DeepPartial<DestinationSuggestion> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<Error | null>(null);

  // Favorites
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  // Read context from sessionStorage on mount
  useEffect(() => {
    const data = getDestinationContext(slug);
    if (data) {
      setCtx(data);
    } else {
      setNoContext(true);
    }
  }, [slug]);

  // Fetch Phase 2 detail once we have context
  useEffect(() => {
    if (!ctx) return;

    const name = ctx.summary.name;
    const country = ctx.summary.country ?? "";
    if (!name) return;

    const controller = new AbortController();
    setDetailLoading(true);
    setDetailError(null);

    fetch("/api/explore/detail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destinationName: name,
        country,
        tripInput: ctx.tripInput,
      }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then(
            (body) => { throw new Error(body.error || `Request failed (${res.status})`); },
            () => { throw new Error(`Request failed (${res.status})`); }
          );
        }
        return res.json();
      })
      .then((data: DeepPartial<DestinationSuggestion>) => {
        setDetail(data);
        setDetailLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setDetailError(err instanceof Error ? err : new Error(String(err)));
        setDetailLoading(false);
      });

    return () => controller.abort();
  }, [ctx]);

  // Merged data: Phase 2 detail overrides Phase 1 summary fields
  const destination: DeepPartial<DestinationSuggestion> | null = useMemo(() => {
    if (detail) return detail;
    if (!ctx) return null;
    return ctx.summary as DeepPartial<DestinationSuggestion>;
  }, [detail, ctx]);

  // Image search name resolution (same logic as ResultsPanel)
  const imageSearchName = useMemo(() => {
    if (ctx?.imageSearchName) return ctx.imageSearchName;
    if (!destination) return undefined;
    const days = destination.itinerary?.days;
    const locations = days?.map((d) => d?.location).filter(Boolean) ?? [];
    const unique = [...new Set(locations)];
    if (unique.length > 1) return days?.[0]?.location ?? destination.country ?? undefined;
    return destination.name ?? undefined;
  }, [ctx, destination]);

  const stableCountry = ctx?.stableCountry ?? destination?.country ?? undefined;

  // Map markers from itinerary
  const mapMarkers: MapMarker[] = useMemo(() => {
    return (destination?.itinerary?.days ?? [])
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
  }, [destination]);

  const hasPhase2 = !!detail;
  const goBack = useCallback(() => window.close(), []);

  // ── No context fallback ──
  if (noContext) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="font-display text-2xl font-semibold">Destination not found</h1>
          <p className="text-muted-foreground text-sm">
            This page needs to be opened from search results. Head back and click on a destination to view its details.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to search
          </a>
        </div>
      </div>
    );
  }

  // ── Loading state before context is ready ──
  if (!destination) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[50vh] sm:h-[55vh] animate-shimmer" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-border p-3 h-20 animate-shimmer" />
            ))}
          </div>
          <SectionSkeleton />
          <ProsConsSkeleton />
          <ItinerarySkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <div className="relative h-[50vh] sm:h-[55vh] max-h-[600px]">
        <DestinationImage
          name={destination.name}
          country={stableCountry}
          searchName={imageSearchName ?? undefined}
          fallbackName={imageSearchName ?? destination.name ?? undefined}
          className="w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

        {/* Top bar: back + actions */}
        <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex items-start justify-between">
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/40 backdrop-blur-md text-white text-sm hover:bg-black/60 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <FavoriteButton
              destination={destination}
              isFavorited={!!favoriteId}
              favoriteId={favoriteId}
              onToggle={setFavoriteId}
              size="md"
            />
            <ShareButton destination={destination} size="md" />
          </div>
        </div>

        {/* Bottom: name + score */}
        <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8">
          <div className="max-w-4xl mx-auto flex items-end justify-between gap-4">
            <div>
              {ctx?.rank != null && (
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg mb-2">
                  {ctx.rank}
                </span>
              )}
              <h1 className="font-display font-semibold text-3xl sm:text-4xl text-white drop-shadow-md">
                {destination.name || "Loading..."}
                {ctx?.isRecommended && (
                  <span className="inline-flex items-center ml-3 text-xs bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full align-middle">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Top Pick
                  </span>
                )}
              </h1>
              {destination.country && (
                <p className="text-lg text-white/80 mt-1">{destination.country}</p>
              )}
            </div>
            {destination.matchScore != null && (
              <span className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm text-base font-bold text-primary shadow-sm flex-shrink-0">
                {destination.matchScore} match
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Loading indicator */}
        {detailLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading full trip details...
          </div>
        )}

        {/* Error */}
        {detailError && !detailLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 px-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
            <span>Failed to load full details. Some information may be missing.</span>
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
            <h2 className="font-display font-semibold text-base mb-2">Why this destination?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{destination.reasoning}</p>
          </div>
        )}

        {/* Pros & Cons — show skeleton if Phase 2 not loaded yet */}
        {hasPhase2 ? (
          (destination.pros?.length || destination.cons?.length) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          ) : null
        ) : detailLoading ? (
          <ProsConsSkeleton />
        ) : null}

        {/* Top Activities */}
        {destination.topActivities && destination.topActivities.length > 0 && (
          <div>
            <h2 className="font-display font-semibold text-base mb-2">Top Activities</h2>
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

        {/* Weather */}
        {destination.weather && (
          <div className="rounded-xl border border-border p-4">
            <h2 className="font-display font-semibold text-base mb-3 flex items-center gap-1.5">
              <Thermometer className="h-4 w-4 text-primary" />
              Weather
            </h2>
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

        {/* Local Insights — skeleton or content */}
        {hasPhase2 ? (
          destination.localInsights && destination.localInsights.length > 0 ? (
            <div>
              <h2 className="font-display font-semibold text-base mb-3 flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-primary" />
                Local Insights
              </h2>
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
          ) : null
        ) : detailLoading ? (
          <InsightsSkeleton />
        ) : null}

        {/* Local Events */}
        {hasPhase2 && destination.localEvents && destination.localEvents.length > 0 && (
          <div>
            <h2 className="font-display font-semibold text-base mb-3 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              What&apos;s Happening
            </h2>
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

        {/* Route map — skeleton or content */}
        {hasPhase2 ? (
          mapMarkers.length > 0 ? (
            <div>
              <h2 className="font-display font-semibold text-base mb-2">Route</h2>
              <ExploreMap markers={mapMarkers} selectedId={null} showRoute={true} height={350} />
            </div>
          ) : null
        ) : detailLoading ? (
          <div className="space-y-2">
            <div className="h-5 w-20 animate-shimmer rounded-lg" />
            <div className="h-[350px] animate-shimmer rounded-xl" />
          </div>
        ) : null}

        {/* Itinerary — skeleton or content */}
        {hasPhase2 ? (
          destination.itinerary?.days?.length ? (
            <ItineraryTimeline itinerary={destination.itinerary} />
          ) : null
        ) : detailLoading ? (
          <ItinerarySkeleton />
        ) : null}

        {/* Booking CTAs */}
        {hasPhase2 && <BookingLinks destination={destination} />}

        {/* Bottom padding */}
        <div className="h-8" />
      </div>
    </div>
  );
}
