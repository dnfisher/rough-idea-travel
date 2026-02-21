"use client";

import { useState, useMemo, useCallback } from "react";
import { MapPin, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeepPartial } from "ai";
import type { ExplorationResult } from "@/lib/ai/schemas";
import { DestinationCard } from "./DestinationCard";
import { WeatherComparison } from "./WeatherComparison";
import { ExploreLoadingState } from "./ExploreLoadingState";
import { DestinationSortBar, type SortOption } from "./DestinationSortBar";
import { ExploreMap } from "./ExploreMap";
import { DestinationDetailSheet } from "./DestinationDetailSheet";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { ShareButton } from "@/components/share/ShareButton";
import type { MapMarker } from "./ExploreMapInner";

type Tab = "destinations" | "weather";

interface ResultsPanelProps {
  result: DeepPartial<ExplorationResult> | undefined;
  isLoading: boolean;
  error: Error | undefined;
}

export function ResultsPanel({ result, isLoading, error }: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("destinations");
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("match");
  // Detail sheet state
  const [detailDestination, setDetailDestination] = useState<string | null>(null);
  // Track favorites: map of destination name -> favorite ID
  const [favoritesMap, setFavoritesMap] = useState<Record<string, string>>({});

  // Sort destinations (only when not streaming)
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

  // Find the selected destination for the map
  const selectedDest = useMemo(() => {
    if (!selectedDestination) return null;
    return sortedDestinations.find((d) => d?.name === selectedDestination) ?? null;
  }, [selectedDestination, sortedDestinations]);

  // Find the destination for the detail sheet
  const detailDest = useMemo(() => {
    if (!detailDestination) return null;
    return sortedDestinations.find((d) => d?.name === detailDestination) ?? null;
  }, [detailDestination, sortedDestinations]);

  const detailDestRank = useMemo(() => {
    if (!detailDest) return undefined;
    return sortedDestinations.indexOf(detailDest) + 1;
  }, [detailDest, sortedDestinations]);

  // Compute map markers — show itinerary route when a destination with itinerary is selected
  const mapMarkers = useMemo((): MapMarker[] => {
    if (selectedDest?.itinerary?.days?.length) {
      const days = selectedDest.itinerary.days;
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
  }, [selectedDest, sortedDestinations]);

  const showRoute = !!selectedDest?.itinerary?.days?.length;

  const handleMarkerClick = useCallback((id: string) => {
    if (id.startsWith("day-")) return;
    setSelectedDestination((prev) => (prev === id ? null : id));
    setActiveTab("destinations");
  }, []);

  // Clicking a card: highlight on map + open detail sheet
  const handleCardClick = useCallback((name: string | undefined) => {
    if (!name) return;
    setSelectedDestination(name);
    setDetailDestination(name);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailDestination(null);
  }, []);

  // Show loading animation until at least 3 destinations have streamed in
  const destinationCount = result?.destinations?.filter(Boolean)?.length ?? 0;
  const showLoading = isLoading && destinationCount < 3;
  const showSkipToEnd = isLoading && destinationCount >= 1 && destinationCount < 3;

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-destructive font-medium mb-1">Something went wrong</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  if (showLoading) {
    return <ExploreLoadingState skipToEnd={showSkipToEnd} />;
  }

  if (!result && !isLoading) {
    return null;
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "destinations", label: "Destinations", icon: <MapPin className="h-4 w-4" /> },
    { id: "weather", label: "Weather", icon: <Thermometer className="h-4 w-4" /> },
  ];

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

      {/* Tabs */}
      {result && (
        <>
          <div className="flex gap-1 border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.id === "destinations" && result.destinations?.length != null && (
                  <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                    {result.destinations.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-[200px]">
            {activeTab === "destinations" && (
              <div className="space-y-3">
                {!isLoading && sortedDestinations.length > 1 && (
                  <DestinationSortBar value={sortBy} onChange={setSortBy} />
                )}

                {/* Destination cards */}
                <div className="grid grid-cols-1 gap-3">
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
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                        <div className="h-48 animate-shimmer" />
                        <div className="p-5 space-y-3">
                          <div className="h-5 w-48 animate-shimmer rounded-lg" />
                          <div className="h-4 w-full animate-shimmer rounded-lg" />
                          <div className="h-4 w-3/4 animate-shimmer rounded-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "weather" && (
              <div>
                {result.weatherComparison && result.weatherComparison.length > 0 ? (
                  <WeatherComparison data={result.weatherComparison} />
                ) : isLoading ? (
                  <div className="rounded-xl border border-border p-8 text-center">
                    <p className="text-sm text-muted-foreground">Loading weather data...</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No weather data available yet
                  </p>
                )}
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

      {/* Detail sheet — slide-in panel */}
      <DestinationDetailSheet
        destination={detailDest}
        rank={detailDestRank}
        isRecommended={detailDest?.name === result?.recommendedDestination}
        onClose={handleCloseDetail}
        actions={
          detailDest ? (
            <>
              <FavoriteButton
                destination={detailDest}
                isFavorited={!!(detailDest.name && favoritesMap[detailDest.name])}
                favoriteId={detailDest.name ? favoritesMap[detailDest.name] ?? null : null}
                onToggle={(newId) => {
                  if (!detailDest.name) return;
                  setFavoritesMap((prev) => {
                    const next = { ...prev };
                    if (newId) {
                      next[detailDest.name!] = newId;
                    } else {
                      delete next[detailDest.name!];
                    }
                    return next;
                  });
                }}
              />
              <ShareButton destination={detailDest} />
            </>
          ) : undefined
        }
      />
    </div>
  );
}
