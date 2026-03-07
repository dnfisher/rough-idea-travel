"use client";

import React from "react";
import type { DeepPartial } from "ai";
import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { Heart, Compass } from "lucide-react";
import { slugify, storeDestinationContext } from "@/lib/destination-url";
import { DestinationImage } from "@/components/results/DestinationImage";

interface FavoriteRow {
  id: string;
  destinationName: string;
  country: string;
  destinationData: unknown;
  createdAt: Date;
}

interface SharedWishlistClientProps {
  wishlistName: string;
  items: FavoriteRow[];
  createdAt: Date;
}

export function SharedWishlistClient({
  wishlistName,
  items,
  createdAt,
}: SharedWishlistClientProps) {
  function openInNewTab(fav: FavoriteRow) {
    const dest = fav.destinationData as DeepPartial<DestinationSuggestion>;
    const firstStop = dest?.itinerary?.days?.[0]?.location;
    const slug = slugify(fav.destinationName);
    storeDestinationContext(slug, {
      summary: { name: fav.destinationName, country: fav.country },
      detail: dest,
      imageSearchName: firstStop ?? fav.destinationName,
      stableCountry: fav.country,
    });
    window.open(`/destination/${slug}`, "_blank");
  }

  const CLASH: React.CSSProperties = { fontFamily: "'Clash Display', system-ui, sans-serif" };

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#A89F94", marginBottom: 8 }}>
          <Heart className="h-4 w-4" style={{ color: "#E87070", fill: "#E87070" }} />
          <span>Shared wishlist</span>
          <span style={{ margin: "0 4px" }}>&middot;</span>
          <span>
            {new Date(createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <h1 style={{ ...CLASH, fontSize: 28, fontWeight: 600, color: "#F2EEE8", margin: "0 0 4px" }}>{wishlistName}</h1>
        <p style={{ fontSize: 14, color: "#A89F94" }}>
          {items.length} {items.length === 1 ? "destination" : "destinations"}
        </p>
      </div>

      {/* Destination grid */}
      {items.length === 0 ? (
        <div style={{ borderRadius: 16, border: "1px solid #2E2B25", background: "#1C1A17", padding: 48, textAlign: "center" }}>
          <Heart style={{ width: 48, height: 48, margin: "0 auto 16px", color: "rgba(168,159,148,0.3)" }} />
          <h2 style={{ ...CLASH, fontSize: 18, fontWeight: 600, color: "#F2EEE8", marginBottom: 8 }}>
            This wishlist is empty
          </h2>
          <p style={{ fontSize: 14, color: "#A89F94", marginBottom: 24 }}>
            No destinations have been added yet.
          </p>
          <a
            href="/explore"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 12,
              background: "#F2EEE8",
              color: "#0F0E0D",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            <Compass className="h-4 w-4" />
            Explore Destinations
          </a>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {items.map((fav) => {
            const dest = fav.destinationData as DeepPartial<DestinationSuggestion>;
            const firstStop = dest?.itinerary?.days?.[0]?.location;
            return (
            <div
              key={fav.id}
              onClick={() => openInNewTab(fav)}
              style={{ borderRadius: 16, border: "1px solid #2E2B25", background: "#1C1A17", overflow: "hidden", cursor: "pointer", transition: "transform 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <div className="relative" style={{ height: 160 }}>
                <DestinationImage
                  name={fav.destinationName}
                  country={fav.country}
                  searchName={firstStop}
                  fallbackName={firstStop}
                  className="w-full h-full"
                />
                <div style={{ position: "absolute", inset: "auto 0 0 0", height: 80, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />
                <div style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
                  <h3 style={{ ...CLASH, fontSize: 16, fontWeight: 600, color: "#fff" }}>
                    {fav.destinationName}
                  </h3>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>{fav.country}</p>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </>
  );
}
