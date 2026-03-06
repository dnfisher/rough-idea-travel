"use client";

import { Clock, Star, ChevronRight, Car, Plane } from "lucide-react";
import type { DeepPartial } from "ai";
import type { DestinationSummary, DestinationSuggestion } from "@/lib/ai/schemas";
import { DestinationImage } from "./DestinationImage";
import { useCurrency } from "@/components/CurrencyProvider";
import { formatPrice } from "@/lib/currency";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";

const CLASH: React.CSSProperties = { fontFamily: "'Clash Display', system-ui, sans-serif" };
const DM: React.CSSProperties = { fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif" };

interface DestinationCardProps {
  destination: DeepPartial<DestinationSummary> | DeepPartial<DestinationSuggestion>;
  rank: number;
  isRecommended?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  /** Home/departure city — used to filter it out of routeStops for image selection */
  homeCity?: string;
  /** User interests — biases image selection toward relevant themes */
  interests?: string[];
  // Favourites
  isFavorited?: boolean;
  favoriteId?: string | null;
  onFavoriteToggle?: (newId: string | null) => void;
  onAuthRequired?: () => void;
}

function matchBadgeStyle(score: number | null | undefined): React.CSSProperties {
  if (score == null) return {};
  if (score >= 90) {
    return {
      background: "rgba(42,191,191,0.2)",
      color: "#2ABFBF",
      border: "1px solid rgba(42,191,191,0.3)",
    };
  }
  if (score >= 75) {
    return {
      background: "rgba(196,168,130,0.2)",
      color: "#C4A882",
      border: "1px solid rgba(196,168,130,0.3)",
    };
  }
  return {
    background: "rgba(107,98,88,0.2)",
    color: "var(--dp-text-muted, #6B6258)",
    border: "1px solid rgba(107,98,88,0.3)",
  };
}

export function DestinationCard({
  destination,
  rank,
  isRecommended,
  isSelected,
  onClick,
  homeCity,
  interests,
  isFavorited = false,
  favoriteId = null,
  onFavoriteToggle,
  onAuthRequired,
}: DestinationCardProps) {
  const { currency } = useCurrency();
  const activities = destination.topActivities ?? [];
  const displayActivities = activities.slice(0, 3);
  const moreCount = activities.length - 3;

  // Road trip route data (optional)
  const routeStops = "routeStops" in destination ? (destination as DeepPartial<DestinationSummary>).routeStops : undefined;
  const drivingPace = "drivingPace" in destination ? (destination as DeepPartial<DestinationSummary>).drivingPace : undefined;
  const estimatedTotalDriveHours = "estimatedTotalDriveHours" in destination ? (destination as DeepPartial<DestinationSummary>).estimatedTotalDriveHours : undefined;
  const travelMode = "travelMode" in destination ? (destination as DeepPartial<DestinationSummary>).travelMode : undefined;
  const isRoute = routeStops && routeStops.length > 1;

  const firstDestStop = isRoute
    ? (routeStops.find(
        (stop) =>
          stop &&
          (!homeCity || stop.toLowerCase() !== homeCity.toLowerCase())
      ) as string | undefined)
    : undefined;

  const cardBorderColor = isSelected
    ? "1.5px solid #2ABFBF"
    : "1px solid var(--border, #2E2B25)";
  const cardShadow = isSelected
    ? "0 0 0 2px rgba(42,191,191,0.2), 0 4px 20px rgba(0,0,0,0.4)"
    : "0 2px 12px rgba(0,0,0,0.3)";

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: "14px",
        border: cardBorderColor,
        overflow: "hidden",
        background: "var(--card, #1C1A17)",
        boxShadow: cardShadow,
        cursor: "pointer",
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}
    >
      {/* Hero image — 16:9 */}
      <div style={{ position: "relative", paddingTop: "56.25%" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <DestinationImage
            name={destination.name}
            country={destination.country}
            searchName={firstDestStop}
            fallbackName={firstDestStop}
            interests={interests}
            className="w-full h-full"
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, rgba(15,14,13,0.1) 0%, rgba(15,14,13,0.7) 100%)",
            }}
          />
        </div>

        {/* Heart / favourite button — top-left */}
        {onFavoriteToggle && (
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              zIndex: 2,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <FavoriteButton
              destination={destination}
              isFavorited={isFavorited}
              favoriteId={favoriteId}
              onToggle={onFavoriteToggle}
              onAuthRequired={onAuthRequired}
              size="sm"
            />
          </div>
        )}

        {/* Rank badge — bottom-left */}
        <span
          style={{
            position: "absolute",
            bottom: "10px",
            left: "10px",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "rgba(15,14,13,0.7)",
            backdropFilter: "blur(4px)",
            border: "1.5px solid rgba(255,255,255,0.15)",
            color: "#F2EEE8",
            fontSize: "12px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...DM,
          }}
        >
          {rank}
        </span>

        {/* Match score badge */}
        {destination.matchScore != null && (
          <span
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              padding: "3px 8px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: 700,
              backdropFilter: "blur(4px)",
              ...DM,
              ...matchBadgeStyle(destination.matchScore),
            }}
          >
            {destination.matchScore}%
          </span>
        )}

        {/* Top Pick badge */}
        {isRecommended && (
          <span
            style={{
              position: "absolute",
              bottom: "10px",
              right: "10px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 8px",
              borderRadius: "20px",
              fontSize: "10px",
              fontWeight: 600,
              background: "rgba(232,131,58,0.2)",
              color: "#E8833A",
              border: "1px solid rgba(232,131,58,0.3)",
              backdropFilter: "blur(4px)",
              ...DM,
            }}
          >
            <Star style={{ width: "9px", height: "9px", fill: "currentColor" }} />
            Top Pick
          </span>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: "16px 20px 20px", ...DM }}>
        {/* Name + country */}
        <div style={{ marginBottom: "8px" }}>
          <h3
            style={{
              ...CLASH,
              fontSize: "22px",
              fontWeight: 500,
              color: "var(--foreground, #F2EEE8)",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            {destination.name || "Loading..."}
          </h3>
          {destination.country && (
            <p
              style={{
                ...DM,
                fontSize: "12px",
                color: "var(--dp-text-muted, #6B6258)",
                marginTop: "2px",
              }}
            >
              {destination.country}
            </p>
          )}
        </div>

        {/* Reasoning */}
        {destination.reasoning && (
          <p
            style={{
              ...DM,
              fontSize: "14px",
              color: "var(--muted-foreground, #A89F94)",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              marginBottom: "10px",
            }}
          >
            {destination.reasoning}
          </p>
        )}

        {/* Road trip badges */}
        {isRoute && (travelMode || drivingPace || estimatedTotalDriveHours != null) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
            {travelMode === "fly_and_drive" && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 500,
                  background: "rgba(42,191,191,0.1)",
                  color: "#2ABFBF",
                  border: "1px solid rgba(42,191,191,0.2)",
                  ...DM,
                }}
              >
                <Plane style={{ width: "10px", height: "10px" }} />
                Fly + Drive
              </span>
            )}
            {drivingPace && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 500,
                  background: "rgba(196,168,130,0.1)",
                  color: "#C4A882",
                  border: "1px solid rgba(196,168,130,0.2)",
                  ...DM,
                }}
              >
                <Car style={{ width: "10px", height: "10px" }} />
                {drivingPace} pace
              </span>
            )}
            {estimatedTotalDriveHours != null && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 500,
                  background: "rgba(107,98,88,0.1)",
                  color: "var(--dp-text-muted, #6B6258)",
                  border: "1px solid rgba(107,98,88,0.2)",
                  ...DM,
                }}
              >
                <Car style={{ width: "10px", height: "10px" }} />
                ~{estimatedTotalDriveHours}h driving
              </span>
            )}
          </div>
        )}

        {/* Cost + duration */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "10px" }}>
          {destination.estimatedDailyCostEur != null && (
            <span style={{ ...DM, fontSize: "14px", fontWeight: 500, color: "var(--muted-foreground, #A89F94)" }}>
              ~{formatPrice(destination.estimatedDailyCostEur, currency)}/day pp
            </span>
          )}
          {destination.suggestedDuration && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                ...DM,
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--muted-foreground, #A89F94)",
              }}
            >
              <Clock style={{ width: "12px", height: "12px" }} />
              {destination.suggestedDuration}
            </span>
          )}
        </div>

        {/* Activity chips */}
        {displayActivities.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
            {displayActivities.map((activity) => (
              <span
                key={activity}
                style={{
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: 500,
                  background: "rgba(42,191,191,0.08)",
                  color: "#2ABFBF",
                  border: "1px solid rgba(42,191,191,0.15)",
                  ...DM,
                }}
              >
                {activity}
              </span>
            ))}
            {moreCount > 0 && (
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  color: "var(--dp-text-muted, #6B6258)",
                  ...DM,
                }}
              >
                +{moreCount} more
              </span>
            )}
          </div>
        )}

        {/* View details */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "2px",
            ...DM,
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--dp-orange, #E8833A)",
          }}
        >
          View details
          <ChevronRight style={{ width: "14px", height: "14px" }} />
        </div>
      </div>
    </div>
  );
}
