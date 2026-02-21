"use client";

import { useState } from "react";
import { Heart, Compass } from "lucide-react";
import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { DestinationDetailSheet } from "@/components/results/DestinationDetailSheet";
import { DestinationImage } from "@/components/results/DestinationImage";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { UserButton } from "@/components/auth/UserButton";

interface FavoriteRow {
  id: string;
  destinationName: string;
  country: string;
  destinationData: unknown;
  createdAt: Date;
}

interface FavoritesClientProps {
  initialFavorites: FavoriteRow[];
}

export function FavoritesClient({ initialFavorites }: FavoritesClientProps) {
  const [favs, setFavs] = useState(initialFavorites);
  const [detailName, setDetailName] = useState<string | null>(null);

  const detailFav = detailName
    ? favs.find((f) => f.destinationName === detailName)
    : null;
  const detailDest = detailFav?.destinationData as Partial<DestinationSuggestion> | undefined;

  function handleRemove(favId: string) {
    setFavs((prev) => prev.filter((f) => f.id !== favId));
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="font-logo text-3xl uppercase tracking-[-0.02em]">
            ROUGH IDEA<span className="text-highlight">.</span>
          </a>
          <UserButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-6 w-6 text-red-500 fill-current" />
          <h1 className="font-display font-semibold text-2xl">My Favorites</h1>
          <span className="text-sm text-muted-foreground ml-1">
            {favs.length} saved
          </span>
        </div>

        {favs.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="font-display font-semibold text-lg mb-2">
              No saved destinations yet
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Explore destinations and click the heart icon to save your favorites.
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
            {favs.map((fav) => {
              const dest = fav.destinationData as Partial<DestinationSuggestion>;
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
                      className="w-full h-full"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-display font-semibold text-white text-base drop-shadow-sm">
                        {fav.destinationName}
                      </h3>
                      <p className="text-xs text-white/80">{fav.country}</p>
                    </div>
                    <div className="absolute top-2 right-2">
                      <FavoriteButton
                        destination={dest}
                        isFavorited={true}
                        favoriteId={fav.id}
                        onToggle={(newId) => {
                          if (!newId) handleRemove(fav.id);
                        }}
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground">
                      Saved {new Date(fav.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Detail sheet */}
      <DestinationDetailSheet
        destination={detailDest ?? null}
        onClose={() => setDetailName(null)}
      />
    </div>
  );
}
