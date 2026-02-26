"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { DeepPartial } from "ai";
import type {
  ExplorationSummaryResult,
  DestinationSuggestion,
  DestinationSummary,
  TripInput,
} from "@/lib/ai/schemas";
import { useDetailFetch } from "@/lib/hooks/useDetailFetch";
import { DestinationCard } from "./DestinationCard";
import { ExploreLoadingState } from "./ExploreLoadingState";
import { DestinationSortBar, type SortOption } from "./DestinationSortBar";
import { ExploreMap } from "./ExploreMap";
import { DestinationDetailSheet } from "./DestinationDetailSheet";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { ShareButton } from "@/components/share/ShareButton";
import type { MapMarker } from "./ExploreMapInner";

interface ResultsPanelProps {
  result: DeepPartial<ExplorationSummaryResult> | undefined;
  isLoading: boolean;
  error: Error | undefined;
  tripInput: TripInput | null;
  onAuthRequired?: (destinationName?: string) => void;
  pendingAutoFavorite?: string | null;
  onAutoFavoriteComplete?: () => void;
}

export function ResultsPanel({ result, isLoading, error, tripInput, onAuthRequired, pendingAutoFavorite, onAutoFavoriteComplete }: ResultsPanelProps) {
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("match");
  const [detailDestination, setDetailDestination] = useState<string | null>(null);
  const [favoritesMap, setFavoritesMap] = useState<Record<string, string>>({});

  // Detail fetching via plain fetch + cache (replaces useObject streaming)
  const { getDetail, isLoading: isDetailLoading, error: detailError, fetchDetail, clearCache } = useDetailFetch();

  // Auto-favorite a destination after auth flow returns
  const autoFavoriteHandled = useRef(false);
  useEffect(() => {
    if (!pendingAutoFavorite || !result?.destinations || autoFavoriteHandled.current) return;
    autoFavoriteHandled.current = true;

    const dest = result.destinations.find((d) => d?.name === pendingAutoFavorite);
    if (!dest?.name) {
      onAutoFavoriteComplete?.();
      return;
    }

    fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinationData: dest }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.id && dest.name) {
          setFavoritesMap((prev) => ({ ...prev, [dest.name!]: data.id }));
        }
      })
      .catch(() => {})
      .finally(() => onAutoFavoriteComplete?.());
  }, [pendingAutoFavorite, result?.destinations, onAutoFavoriteComplete]);

  // Clear caches when new search starts
  const prevIsLoading = useRef(isLoading);
  useEffect(() => {
    if (isLoading && !prevIsLoading.current) {
      clearCache();
      setDetailDestination(null);
      setSelectedDestination(null);
    }
    prevIsLoading.current = isLoading;
  }, [isLoading, clearCache]);

  // Sort destinations
  const sortedDestinations = useMemo(() => {
    const dests = result?.destinations?.filter(Boolean) ?? [];
    if (isLoading) return dests;

    return [...dests].sort((a, b) => {
      switch (sortBy) {
        case "match":
          return (b?.matchScore ?? 0) - (a?.matchScore ?? 0);
        case "cost":
          return (a?.estimatedDailyCostEur ?? Infinity) - (b?.estimatedDailyCostEur ?? Infinity);
        case "weather": {
          const scoreA = (a?.weather?.sunshineHours ?? 0) - (a?.weather?.rainyDays ?? 0);
          const scoreB = (b?.weather?.sunshineHours ?? 0) - (b?.weather?.rainyDays ?? 0);
          return scoreB - scoreA;
        }
        case "duration": {
          const parseDuration = (s?: string) => {
            const match = s?.match(/(\d+)/);
            return match ? parseInt(match[1]) : Infinity;
          };
          return parseDuration(a?.suggestedDuration) - parseDuration(b?.suggestedDuration);
        }
        default:
          return 0;
      }
    });
  }, [result?.destinations, sortBy, isLoading]);

  // Selected destination for map (summary data)
  const selectedDest = useMemo(() => {
    if (!selectedDestination) return null;
    return sortedDestinations.find((d) => d?.name === selectedDestination) ?? null;
  }, [selectedDestination, sortedDestinations]);

  // Detail data: use cached Phase 2 data if available, otherwise fall back to Phase 1 summary
  const detailData: DeepPartial<DestinationSuggestion> | null = useMemo(() => {
    if (!detailDestination) return null;
    const cached = getDetail(detailDestination);
    if (cached) return cached;
    // Fall back to Phase 1 summary while detail is loading
    const summary = sortedDestinations.find((d) => d?.name === detailDestination) ?? null;
    return summary as DeepPartial<DestinationSuggestion> | null;
  }, [detailDestination, getDetail, sortedDestinations]);

  const detailDestRank = useMemo(() => {
    if (!detailDestination) return undefined;
    const idx = sortedDestinations.findIndex((d) => d?.name === detailDestination);
    return idx >= 0 ? idx + 1 : undefined;
  }, [detailDestination, sortedDestinations]);

  // Extract image search name from Phase 1 summary so detail view uses the same image as the card
  // Also filters out home city from routeStops to avoid showing departure city images
  const detailImageSearchName = useMemo(() => {
    if (!detailDestination) return undefined;
    const summary = sortedDestinations.find((d) => d?.name === detailDestination);
    if (!summary) return undefined;
    const routeStops = "routeStops" in summary
      ? (summary as DeepPartial<DestinationSummary>).routeStops
      : undefined;
    if (routeStops && routeStops.length > 1) {
      const homeCity = tripInput?.homeCity;
      const firstDest = routeStops.find(
        (s) => s && homeCity
          ? s.toLowerCase() !== homeCity.toLowerCase()
          : true
      );
      return (firstDest as string) ?? (summary.name as string);
    }
    return summary.name as string;
  }, [detailDestination, sortedDestinations, tripInput?.homeCity]);

  // Stable country from Phase 1 summary — prevents streaming-induced image changes in detail view
  const detailStableCountry = useMemo(() => {
    if (!detailDestination) return undefined;
    const summary = sortedDestinations.find((d) => d?.name === detailDestination);
    return summary?.country as string | undefined;
  }, [detailDestination, sortedDestinations]);

  // Map markers — show itinerary route from detail if available
  const mapMarkers = useMemo((): MapMarker[] => {
    if (selectedDest?.name) {
      const cached = getDetail(selectedDest.name);
      if (cached?.itinerary?.days?.length) {
        const days = cached.itinerary.days;
        return days
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
      }
    }

    return sortedDestinations
      .filter((d) => d?.coordinates?.lat != null && d?.coordinates?.lng != null)
      .map((d, i) => ({
        id: d!.name ?? `dest-${i}`,
        lat: d!.coordinates!.lat!,
        lng: d!.coordinates!.lng!,
        label: i + 1,
        title: d!.name ?? "Unknown",
        subtitle: d!.country,
      }));
  }, [selectedDest, sortedDestinations, getDetail]);

  const showRoute = !!(selectedDest?.name && getDetail(selectedDest.name)?.itinerary?.days?.length);

  const handleMarkerClick = useCallback((id: string) => {
    if (id.startsWith("day-")) return;
    setSelectedDestination((prev) => (prev === id ? null : id));
  }, []);

  // Card click: highlight + open detail sheet + fetch detail if not cached
  const handleCardClick = useCallback((name: string | undefined) => {
    if (!name) return;
    setSelectedDestination(name);
    setDetailDestination(name);

    const dest = sortedDestinations.find((d) => d?.name === name);
    if (dest && tripInput) {
      fetchDetail(name, dest.country ?? "", tripInput);
    }
  }, [sortedDestinations, tripInput, fetchDetail]);

  const handleCloseDetail = useCallback(() => {
    setDetailDestination(null);
  }, []);

  // Show loading until at least 1 destination has streamed in (summaries are fast)
  const destinationCount = result?.destinations?.filter(Boolean)?.length ?? 0;
  const showLoading = isLoading && destinationCount < 1;

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-destructive font-medium mb-1">Something went wrong</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  if (showLoading) {
    return <ExploreLoadingState />;
  }

  if (!result && !isLoading) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {result?.summary && (
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
          <p className="text-sm leading-relaxed">{result.summary}</p>
        </div>
      )}

      {/* Hero Map */}
      {result && mapMarkers.length > 0 && (
        <ExploreMap
          markers={mapMarkers}
          selectedId={selectedDestination}
          showRoute={showRoute}
          onMarkerClick={handleMarkerClick}
          height={500}
        />
      )}

      {/* Destinations */}
      {result && (
        <>
          <div className="space-y-3">
            {!isLoading && sortedDestinations.length > 1 && (
              <DestinationSortBar value={sortBy} onChange={setSortBy} />
            )}

            {/* Destination cards — 2-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sortedDestinations.map((dest, i) => {
                if (!dest) return null;
                return (
                  <div key={dest.name || i} data-destination-id={dest.name}>
                    <DestinationCard
                      destination={dest}
                      rank={i + 1}
                      isRecommended={dest.name === result.recommendedDestination}
                      isSelected={selectedDestination === dest.name}
                      onClick={() => handleCardClick(dest.name)}
                      homeCity={tripInput?.homeCity}
                    />
                  </div>
                );
              })}
            </div>

            {isLoading && (!result.destinations || result.destinations.length === 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                    <div className="h-36 animate-shimmer" />
                    <div className="p-4 space-y-3">
                      <div className="h-5 w-48 animate-shimmer rounded-lg" />
                      <div className="h-4 w-full animate-shimmer rounded-lg" />
                      <div className="h-4 w-3/4 animate-shimmer rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Streaming indicator */}
          {isLoading && result && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
              Still exploring...
            </div>
          )}
        </>
      )}

      {/* Detail sheet */}
      <DestinationDetailSheet
        destination={detailData}
        imageSearchName={detailImageSearchName}
        stableCountry={detailStableCountry}
        isOpen={detailDestination !== null}
        rank={detailDestRank}
        isRecommended={detailData?.name === result?.recommendedDestination}
        onClose={handleCloseDetail}
        isDetailLoading={detailDestination ? isDetailLoading(detailDestination) : false}
        error={detailError ?? undefined}
        actions={
          detailData ? (
            <>
              <FavoriteButton
                destination={detailData}
                isFavorited={!!(detailData.name && favoritesMap[detailData.name])}
                favoriteId={detailData.name ? favoritesMap[detailData.name] ?? null : null}
                onAuthRequired={() => onAuthRequired?.(detailData.name)}
                onToggle={(newId) => {
                  if (!detailData.name) return;
                  setFavoritesMap((prev) => {
                    const next = { ...prev };
                    if (newId) {
                      next[detailData.name!] = newId;
                    } else {
                      delete next[detailData.name!];
                    }
                    return next;
                  });
                }}
              />
              <ShareButton destination={detailData} />
            </>
          ) : undefined
        }
      />
    </div>
  );
}
