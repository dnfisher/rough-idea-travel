"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import type { DeepPartial } from "ai";
import type {
  ExplorationSummaryResult,
  DestinationSummary,
  TripInput,
} from "@/lib/ai/schemas";
import { DestinationCard } from "./DestinationCard";
import { ExploreLoadingState } from "./ExploreLoadingState";
import { DestinationSortBar, type SortOption } from "./DestinationSortBar";
import { ExploreMap } from "./ExploreMap";
import type { MapMarker } from "./ExploreMapInner";
import { slugify, storeDestinationContext } from "@/lib/destination-url";
import { useDetailFetch } from "@/lib/hooks/useDetailFetch";

interface ResultsPanelProps {
  result: DeepPartial<ExplorationSummaryResult> | undefined;
  isLoading: boolean;
  error: Error | undefined;
  tripInput: TripInput | null;
  onAuthRequired?: (destinationName?: string) => void;
  pendingAutoFavorite?: string | null;
  onAutoFavoriteComplete?: () => void;
  hideMap?: boolean;
}

export function ResultsPanel({ result, isLoading, error, tripInput, onAuthRequired, pendingAutoFavorite, onAutoFavoriteComplete, hideMap }: ResultsPanelProps) {
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("match");
  const [favoritesMap, setFavoritesMap] = useState<Record<string, string>>({});
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  const { fetchDetail, getDetail, clearCache } = useDetailFetch();

  // Auto-favorite a destination after auth flow returns
  const autoFavoriteHandled = useRef(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Reset selection when new search starts; auto-prefetch top result when Phase 1 finishes
  const prevIsLoading = useRef(isLoading);
  useEffect(() => {
    if (isLoading && !prevIsLoading.current) {
      // New search starting — reset and clear prefetch cache
      setSelectedDestination(null);
      clearCache();
    } else if (!isLoading && prevIsLoading.current && tripInput && sortedDestinations.length > 0) {
      // Phase 1 just finished — prefetch the top-ranked result
      const top = sortedDestinations[0];
      if (top?.name && top?.country) {
        fetchDetail(top.name, top.country, tripInput);
      }
    }
    prevIsLoading.current = isLoading;
  // Intentional: only fire on isLoading transitions. Omitting sortedDestinations/tripInput/
  // fetchDetail/clearCache prevents auto-prefetch from re-firing on every sort change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // Selected destination for map (summary data)
  const selectedDest = useMemo(() => {
    if (!selectedDestination) return null;
    return sortedDestinations.find((d) => d?.name === selectedDestination) ?? null;
  }, [selectedDestination, sortedDestinations]);

  // Map markers
  const mapMarkers = useMemo((): MapMarker[] => {
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
  }, [sortedDestinations]);

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedDestination((prev) => (prev === id ? null : id));
  }, []);

  // Hover prefetch: start Phase 2 after 300ms hover — fire-and-forget
  const handleCardMouseEnter = useCallback(
    (dest: { name?: string; country?: string }) => {
      if (!tripInput || !dest.name || !dest.country) return;
      hoverTimerRef.current = setTimeout(() => {
        fetchDetail(dest.name!, dest.country!, tripInput);
      }, 300);
    },
    [fetchDetail, tripInput]
  );

  const handleCardMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  // Card click: store context in sessionStorage + open detail page in new tab
  const handleCardClick = useCallback((name: string | undefined) => {
    if (!name || !tripInput) return;

    const dest = sortedDestinations.find((d) => d?.name === name);
    if (!dest) return;

    setSelectedDestination(name);

    // Compute image search name (same logic as before)
    const routeStops = "routeStops" in dest
      ? (dest as DeepPartial<DestinationSummary>).routeStops
      : undefined;
    let imageSearchName: string | undefined;
    if (routeStops && routeStops.length > 1) {
      const homeCity = tripInput.homeCity;
      const firstDest = routeStops.find(
        (s) => s && homeCity ? s.toLowerCase() !== homeCity.toLowerCase() : true
      );
      imageSearchName = (firstDest as string) ?? (name as string);
    } else {
      imageSearchName = name;
    }

    const rank = sortedDestinations.findIndex((d) => d?.name === name) + 1;
    const slug = slugify(name);

    const cachedDetail = getDetail(name);
    storeDestinationContext(slug, {
      tripInput,
      summary: dest as DeepPartial<DestinationSummary>,
      imageSearchName,
      stableCountry: dest.country as string | undefined,
      rank: rank > 0 ? rank : undefined,
      isRecommended: dest.name === result?.recommendedDestination,
      detail: cachedDetail ?? undefined,
    });

    window.open(`/destination/${slug}`, "_blank");
  }, [sortedDestinations, tripInput, result?.recommendedDestination, getDetail]);

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

  // Smart summary sentence
  const finishedCount = sortedDestinations.length;
  const allRoadTrips =
    finishedCount > 0 &&
    sortedDestinations.every(
      (d) => d != null && "routeStops" in d && Array.isArray((d as DeepPartial<DestinationSummary>).routeStops)
    );
  const kind = allRoadTrips ? "road trips" : "destinations";
  const smartSentence = tripInput
    ? `${finishedCount} ${kind} from ${tripInput.homeCity} — ranked by how well they match you.`
    : `${finishedCount} ${kind} — ranked by how well they match you.`;

  const DM: import("react").CSSProperties = { fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif" };

  return (
    <div className="space-y-4">
      {/* Smart sentence + AI summary disclosure */}
      {result && finishedCount > 0 && (
        <div
          style={{
            borderRadius: "12px",
            background: "var(--dp-bg-subtle, #252219)",
            border: "1px solid var(--border, #2E2B25)",
            padding: "14px 16px",
            ...DM,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ fontSize: "13px", color: "var(--foreground, #F2EEE8)", fontWeight: 500, margin: 0 }}>
              {smartSentence}
            </p>
            {result.summary && (
              <button
                onClick={() => setSummaryExpanded((v) => !v)}
                style={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  color: "var(--dp-text-muted, #6B6258)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0",
                  ...DM,
                }}
              >
                More
                <ChevronDown
                  style={{
                    width: "12px",
                    height: "12px",
                    transition: "transform 0.2s",
                    transform: summaryExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>
            )}
          </div>
          {summaryExpanded && result.summary && (
            <p
              style={{
                marginTop: "10px",
                paddingTop: "10px",
                borderTop: "1px solid var(--border, #2E2B25)",
                fontSize: "13px",
                lineHeight: 1.6,
                color: "var(--muted-foreground, #A89F94)",
                margin: "10px 0 0",
                ...DM,
              }}
            >
              {result.summary}
            </p>
          )}
        </div>
      )}

      {/* Map — only if not hidden by parent */}
      {!hideMap && result && mapMarkers.length > 0 && (
        <ExploreMap
          markers={mapMarkers}
          selectedId={selectedDestination}
          showRoute={false}
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
                  <div
                    key={dest.name || i}
                    data-destination-id={dest.name}
                    onMouseEnter={() => handleCardMouseEnter(dest)}
                    onMouseLeave={handleCardMouseLeave}
                  >
                    <DestinationCard
                      destination={dest}
                      rank={i + 1}
                      isRecommended={dest.name === result.recommendedDestination}
                      isSelected={selectedDestination === dest.name}
                      onClick={() => handleCardClick(dest.name)}
                      homeCity={tripInput?.homeCity}
                      isFavorited={!!(dest?.name && favoritesMap[dest.name])}
                      favoriteId={dest?.name ? (favoritesMap[dest.name] ?? null) : null}
                      onFavoriteToggle={(newId) => {
                        if (!dest?.name) return;
                        setFavoritesMap((prev) => {
                          const next = { ...prev };
                          if (newId) {
                            next[dest.name!] = newId;
                          } else {
                            delete next[dest.name!];
                          }
                          return next;
                        });
                      }}
                      onAuthRequired={() => onAuthRequired?.(dest?.name ?? undefined)}
                    />
                  </div>
                );
              })}
            </div>

            {isLoading && (!result.destinations || result.destinations.length === 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                    <div style={{ paddingTop: "56.25%", position: "relative" }}>
                      <div className="animate-shimmer absolute inset-0" />
                    </div>
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
    </div>
  );
}
