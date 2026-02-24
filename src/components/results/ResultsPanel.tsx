"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import type { DeepPartial } from "ai";
import type {
  ExplorationSummaryResult,
  DestinationSuggestion,
  TripInput,
} from "@/lib/ai/schemas";
import { DestinationSuggestionSchema } from "@/lib/ai/schemas";
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

  // Detail loading: cache + streaming
  const [detailCache, setDetailCache] = useState<Record<string, DeepPartial<DestinationSuggestion>>>({});
  const detailCacheRef = useRef(detailCache);
  detailCacheRef.current = detailCache;

  const {
    object: detailObject,
    submit: submitDetail,
    isLoading: isDetailLoading,
  } = useObject({
    api: "/api/explore/detail",
    schema: DestinationSuggestionSchema,
  });

  // Track which destination the current detail stream is for
  const [streamingDetailName, setStreamingDetailName] = useState<string | null>(null);

  // When detail stream finishes, cache the result
  useEffect(() => {
    if (!isDetailLoading && detailObject && streamingDetailName) {
      setDetailCache((prev) => ({
        ...prev,
        [streamingDetailName]: detailObject,
      }));
      setStreamingDetailName(null);
    }
  }, [isDetailLoading, detailObject, streamingDetailName]);

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
      setDetailCache({});
      setDetailDestination(null);
      setSelectedDestination(null);
    }
    prevIsLoading.current = isLoading;
  }, [isLoading]);

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

  // Detail data: use cache if available, else streaming object if it matches
  const detailData: DeepPartial<DestinationSuggestion> | null = useMemo(() => {
    if (!detailDestination) return null;
    if (detailCache[detailDestination]) return detailCache[detailDestination];
    if (streamingDetailName === detailDestination && detailObject) return detailObject;
    // Fallback: use summary data so there's never a null gap while detail streams in
    const summary = sortedDestinations.find((d) => d?.name === detailDestination);
    return summary ?? null;
  }, [detailDestination, detailCache, streamingDetailName, detailObject, sortedDestinations]);

  const detailDestRank = useMemo(() => {
    if (!detailDestination) return undefined;
    const idx = sortedDestinations.findIndex((d) => d?.name === detailDestination);
    return idx >= 0 ? idx + 1 : undefined;
  }, [detailDestination, sortedDestinations]);

  // Map markers — show itinerary route from detail if available
  const mapMarkers = useMemo((): MapMarker[] => {
    // If we have detail data with itinerary for the selected destination, show route
    if (selectedDest?.name && detailCache[selectedDest.name]?.itinerary?.days?.length) {
      const days = detailCache[selectedDest.name].itinerary!.days!;
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
  }, [selectedDest, sortedDestinations, detailCache]);

  const showRoute = !!(selectedDest?.name && detailCache[selectedDest.name]?.itinerary?.days?.length);

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
    if (dest && !detailCacheRef.current[name] && tripInput) {
      setStreamingDetailName(name);
      submitDetail({
        destinationName: name,
        country: dest.country ?? "",
        tripInput,
      });
    }
  }, [sortedDestinations, tripInput, submitDetail]);

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
        isOpen={detailDestination !== null}
        rank={detailDestRank}
        isRecommended={detailData?.name === result?.recommendedDestination}
        onClose={handleCloseDetail}
        isDetailLoading={isDetailLoading && streamingDetailName === detailDestination}
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
