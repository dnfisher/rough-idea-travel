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
import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { getDestinationContext, type DestinationPageContext } from "@/lib/destination-url";
import { DestinationImage } from "@/components/results/DestinationImage";
import { DestinationGallery } from "@/components/results/DestinationGallery";
import { ItineraryTimeline } from "@/components/results/ItineraryTimeline";
import { ExploreMap } from "@/components/results/ExploreMap";
import { BookingLinks } from "@/components/results/BookingLinks";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { ShareButton } from "@/components/share/ShareButton";
import { useCurrency } from "@/components/CurrencyProvider";
import { formatPrice } from "@/lib/currency";
import type { MapMarker } from "@/components/results/ExploreMapInner";
import { useDetailStream } from "@/lib/hooks/useDetailStream";
import { useItineraryStream } from "@/lib/hooks/useItineraryStream";
import { useSession } from "next-auth/react";

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

  // Favorites
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  // Track whether we're displaying pre-loaded Phase 2 data (no fetch needed)
  const [usePreloaded, setUsePreloaded] = useState(true);

  // Read context from sessionStorage on mount
  useEffect(() => {
    const data = getDestinationContext(slug);
    if (data) {
      setCtx(data);
    } else {
      setNoContext(true);
    }
  }, [slug]);

  // Memoize tripInput so hooks don't get a new reference if ctx ever updates
  const tripInput = useMemo(() => ctx?.tripInput, [ctx]);

  // Stream Phase 2 detail (skipped when pre-loaded detail is available)
  const shouldStream = ctx != null && !(ctx.detail && usePreloaded) && !!ctx.tripInput;
  const {
    detail: streamedDetail,
    isStreaming,
    error: streamError,
  } = useDetailStream(
    shouldStream ? ctx?.summary.name : undefined,
    shouldStream ? (ctx?.summary.country ?? "") : undefined,
    shouldStream ? tripInput : undefined
  );

  // Use pre-loaded detail (sessionStorage / prefetch cache) if available; else use stream
  const detail: DeepPartial<DestinationSuggestion> | null =
    ctx?.detail && usePreloaded
      ? (ctx.detail as DeepPartial<DestinationSuggestion>)
      : streamedDetail;
  const detailLoading = isStreaming;
  const detailError = streamError;

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

  const { data: session } = useSession();
  const isAuthenticated = !!session?.user?.id;

  const {
    itinerary: streamedItinerary,
    isStreaming: itineraryStreaming,
    error: itineraryError,
    trigger: triggerItinerary,
  } = useItineraryStream(
    ctx?.summary.name,
    ctx?.summary.country ?? "",
    tripInput
  );

  // Use on-demand itinerary if generated, otherwise fall back to preloaded itinerary in detail
  const itineraryData = streamedItinerary ?? detail?.itinerary;

  const stableCountry = ctx?.stableCountry ?? destination?.country ?? undefined;

  // Map markers from itinerary
  const mapMarkers: MapMarker[] = useMemo(() => {
    return (itineraryData?.days ?? [])
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
  }, [itineraryData]);

  // Format the trip dates from the user's original search input for display in stats
  const tripDateLabel = useMemo(() => {
    const dates = ctx?.tripInput?.dates;
    if (!dates) return null;
    if (!dates.flexible && dates.startDate && dates.endDate) {
      const fmt = (d: string) => {
        try {
          const [year, month, day] = d.split("-").map(Number);
          return new Date(year, month - 1, day).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        } catch { return d; }
      };
      return `${fmt(dates.startDate)} – ${fmt(dates.endDate)}`;
    }
    if (dates.flexible && dates.description) return dates.description;
    return null;
  }, [ctx?.tripInput?.dates]);

  const hasQuick = !!(detail?.pros?.length);
  const hasItinerary = !!(itineraryData?.days?.length);
  const hasInsights = !!(detail?.localInsights?.length);
  const hasBooking = !!(detail?.accommodation || detail?.flightEstimate || detail?.drivingEstimate || detail?.estimatedTotalTripCostEur);
  const showRefresh = usePreloaded && !!ctx?.detail && !!ctx?.tripInput;
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

        {/* Top bar: back */}
        <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex items-start">
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/40 backdrop-blur-md text-white text-sm hover:bg-black/60 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
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

        {/* Refresh banner — shown when displaying pre-loaded saved data */}
        {showRefresh && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Showing saved data.</span>
            <button
              onClick={() => setUsePreloaded(false)}
              className="text-primary hover:underline"
            >
              Refresh
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <FavoriteButton
            destination={destination}
            isFavorited={!!favoriteId}
            favoriteId={favoriteId}
            onToggle={setFavoriteId}
            onAuthRequired={() => {
              window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`;
            }}
            size="md"
          />
          <ShareButton destination={destination} size="md" />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {destination.estimatedDailyCostEur != null && (
            <div className="rounded-xl border border-border p-3 text-center">
              <p className="text-sm font-medium">~{formatPrice(destination.estimatedDailyCostEur, currency)}/day</p>
              <p className="text-xs text-muted-foreground">Daily cost</p>
            </div>
          )}
          {destination.estimatedTotalTripCostEur != null ? (
            <div className="rounded-xl border border-border p-3 text-center">
              <p className="text-sm font-medium">~{formatPrice(destination.estimatedTotalTripCostEur, currency)}</p>
              <p className="text-xs text-muted-foreground">Est. trip total</p>
            </div>
          ) : detailLoading ? (
            <div className="rounded-xl border border-border p-3 h-16 animate-shimmer" />
          ) : null}
          {tripDateLabel && (
            <div className="rounded-xl border border-border p-3 text-center">
              <CalendarDays className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-sm font-medium truncate">{tripDateLabel}</p>
              <p className="text-xs text-muted-foreground">Your dates</p>
            </div>
          )}
          {destination.suggestedDuration && (
            <div className="rounded-xl border border-border p-3 text-center">
              <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-sm font-medium">{destination.suggestedDuration}</p>
              <p className="text-xs text-muted-foreground">Suggested</p>
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

        {/* Why — editorial lead section */}
        {destination.reasoning && (
          <div className="py-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Why we picked this</p>
            <p className="text-lg sm:text-xl leading-relaxed text-foreground font-light">
              {destination.reasoning}
            </p>
          </div>
        )}

        {/* Local Events */}
        {hasInsights && destination.localEvents && destination.localEvents.length > 0 && (
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
        {hasInsights ? (
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

        {/* Pros & Cons — show skeleton if Phase 2 not loaded yet */}
        {hasQuick ? (
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

        {/* Gallery */}
        {destination.name && (
          <DestinationGallery
            name={destination.name}
            country={stableCountry}
            searchName={imageSearchName ?? undefined}
          />
        )}

        {/* Itinerary — generated on demand */}
        {hasItinerary ? (
          <>
            {mapMarkers.length > 0 && (
              <div>
                <h2 className="font-display font-semibold text-base mb-2">Route</h2>
                <ExploreMap markers={mapMarkers} selectedId={null} showRoute={true} height={350} />
              </div>
            )}
            <ItineraryTimeline itinerary={itineraryData!} />
          </>
        ) : (
          <div className="rounded-2xl border border-border bg-accent/30 p-6 text-center space-y-3">
            <h3 className="font-display font-semibold text-base">Want a day-by-day itinerary?</h3>
            <p className="text-sm text-muted-foreground">
              Generate a personalised sample itinerary for this trip, including route map, accommodation areas, and meal suggestions.
            </p>
            {isAuthenticated ? (
              <button
                onClick={triggerItinerary}
                disabled={itineraryStreaming}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {itineraryStreaming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating itinerary…
                  </>
                ) : (
                  "Generate my itinerary"
                )}
              </button>
            ) : (
              <a
                href={`/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Sign in to generate itinerary
              </a>
            )}
            {itineraryError && (
              <p className="text-xs text-destructive">Failed to generate itinerary. Please try again.</p>
            )}
          </div>
        )}

        {/* Booking CTAs */}
        {hasBooking ? (
          <BookingLinks destination={destination} />
        ) : detailLoading ? (
          <SectionSkeleton rows={2} />
        ) : null}

        {/* Bottom padding */}
        <div className="h-8" />
      </div>
    </div>
  );
}
