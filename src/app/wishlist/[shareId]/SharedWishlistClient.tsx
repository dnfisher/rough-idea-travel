"use client";

import { useState } from "react";
import { Heart, Compass } from "lucide-react";
import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { DestinationDetailSheet } from "@/components/results/DestinationDetailSheet";
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
  const [detailName, setDetailName] = useState<string | null>(null);

  const detailFav = detailName
    ? items.find((f) => f.destinationName === detailName)
    : null;
  const detailDest = detailFav?.destinationData as Partial<DestinationSuggestion> | undefined;

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Heart className="h-4 w-4 text-red-400 fill-current" />
          <span>Shared wishlist</span>
          <span className="mx-1">&middot;</span>
          <span>
            {new Date(createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <h1 className="font-display font-semibold text-2xl mb-1">{wishlistName}</h1>
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "destination" : "destinations"}
        </p>
      </div>

      {/* Destination grid */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="font-display font-semibold text-lg mb-2">
            This wishlist is empty
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            No destinations have been added yet.
          </p>
          <a
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Compass className="h-4 w-4" />
            Explore Destinations
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((fav) => {
            const dest = fav.destinationData as Partial<DestinationSuggestion> & { routeStops?: string[] };
            const firstStop = dest?.routeStops?.[0] ?? dest?.itinerary?.days?.[0]?.location;
            return (
            <div
              key={fav.id}
              onClick={() => setDetailName(fav.destinationName)}
              className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-all"
            >
              <div className="relative h-40">
                <DestinationImage
                  name={fav.destinationName}
                  country={fav.country}
                  searchName={firstStop}
                  fallbackName={firstStop}
                  className="w-full h-full"
                />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-display font-semibold text-white text-base drop-shadow-sm">
                    {fav.destinationName}
                  </h3>
                  <p className="text-xs text-white/80">{fav.country}</p>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Detail sheet — read-only (no favorite button) */}
      <DestinationDetailSheet
        destination={detailDest ?? null}
        onClose={() => setDetailName(null)}
      />
    </>
  );
}
