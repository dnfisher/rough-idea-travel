"use client";

import { useState } from "react";
import { Heart, Compass, Plus, ChevronDown, ChevronUp, Share2, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { DestinationDetailSheet } from "@/components/results/DestinationDetailSheet";
import { DestinationImage } from "@/components/results/DestinationImage";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { UserButton } from "@/components/auth/UserButton";
import { cn } from "@/lib/utils";

interface FavoriteRow {
  id: string;
  destinationName: string;
  country: string;
  destinationData: unknown;
  listId: string | null;
  createdAt: Date;
}

interface WishlistWithPreview {
  id: string;
  name: string;
  shareId: string;
  itemCount: number;
  coverDestinations: { destinationName: string; country: string }[];
  createdAt: Date;
  updatedAt: Date;
}

interface FavoritesClientProps {
  initialWishlists: WishlistWithPreview[];
  initialUncategorized: FavoriteRow[];
}

export function FavoritesClient({
  initialWishlists,
  initialUncategorized,
}: FavoritesClientProps) {
  const [wishlists, setWishlists] = useState(initialWishlists);
  const [uncategorized, setUncategorized] = useState(initialUncategorized);
  const [showUncategorized, setShowUncategorized] = useState(true);
  const [detailName, setDetailName] = useState<string | null>(null);
  const [creatingList, setCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

  // Find detail destination from uncategorized
  const detailFav = detailName
    ? uncategorized.find((f) => f.destinationName === detailName)
    : null;
  const detailDest = detailFav?.destinationData as Partial<DestinationSuggestion> | undefined;

  function handleRemoveUncategorized(favId: string) {
    setUncategorized((prev) => prev.filter((f) => f.id !== favId));
  }

  async function handleCreateList() {
    if (!newListName.trim()) return;

    try {
      const res = await fetch("/api/wishlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create list");
      const created = await res.json();
      setWishlists((prev) => [created, ...prev]);
      setNewListName("");
      setCreatingList(false);
    } catch {
      // fail silently
    }
  }

  function handleCopyShareLink(shareId: string) {
    const url = `${window.location.origin}/wishlist/${shareId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedShareId(shareId);
      setTimeout(() => setCopiedShareId(null), 2000);
    });
  }

  const totalSaved = wishlists.reduce((sum, wl) => sum + wl.itemCount, 0) + uncategorized.length;
  const isEmpty = wishlists.length === 0 && uncategorized.length === 0;

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
          <h1 className="font-display font-semibold text-2xl">My Wishlists</h1>
          <span className="text-sm text-muted-foreground ml-1">
            {totalSaved} saved
          </span>
        </div>

        {isEmpty ? (
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
          <div className="space-y-8">
            {/* Wishlist cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlists.map((wl) => (
                <div key={wl.id} className="group relative">
                  <Link
                    href={`/favorites/${wl.id}`}
                    className="block rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all"
                  >
                    {/* Cover image */}
                    <div className="relative h-40">
                      {wl.coverDestinations[0] ? (
                        <DestinationImage
                          name={wl.coverDestinations[0].destinationName}
                          country={wl.coverDestinations[0].country}
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Heart className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="font-display font-semibold text-white text-base drop-shadow-sm">
                          {wl.name}
                        </h3>
                        <p className="text-xs text-white/80">
                          {wl.itemCount} {wl.itemCount === 1 ? "destination" : "destinations"}
                        </p>
                      </div>
                    </div>
                  </Link>

                  {/* Share button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleCopyShareLink(wl.shareId);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-white/20 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                    title={copiedShareId === wl.shareId ? "Link copied!" : "Copy share link"}
                  >
                    {copiedShareId === wl.shareId ? (
                      <span className="text-xs px-1 font-medium text-green-600">Copied!</span>
                    ) : (
                      <Share2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}

              {/* Create new list card */}
              {creatingList ? (
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 flex flex-col items-center justify-center min-h-[208px]">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateList();
                      if (e.key === "Escape") {
                        setCreatingList(false);
                        setNewListName("");
                      }
                    }}
                    placeholder="e.g. Spring Trip 2026"
                    className="w-full text-center bg-transparent border-b border-primary/30 pb-2 text-sm outline-none placeholder:text-muted-foreground mb-4"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateList}
                      disabled={!newListName.trim()}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                        newListName.trim()
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setCreatingList(false);
                        setNewListName("");
                      }}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setCreatingList(true)}
                  className="rounded-2xl border border-dashed border-border bg-card/50 overflow-hidden shadow-sm hover:shadow-md hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center min-h-[208px] gap-3"
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Create new list</span>
                </button>
              )}
            </div>

            {/* Uncategorized favorites */}
            {uncategorized.length > 0 && (
              <div>
                <button
                  onClick={() => setShowUncategorized(!showUncategorized)}
                  className="flex items-center gap-2 mb-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showUncategorized ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  Unsorted favorites ({uncategorized.length})
                </button>

                {showUncategorized && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uncategorized.map((fav) => {
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
                            <div className="absolute top-2 right-2">
                              <FavoriteButton
                                destination={dest}
                                isFavorited={true}
                                favoriteId={fav.id}
                                onToggle={(newId) => {
                                  if (!newId) handleRemoveUncategorized(fav.id);
                                }}
                                size="sm"
                              />
                            </div>
                          </div>
                          <div className="p-3">
                            <p className="text-xs text-muted-foreground">
                              Saved{" "}
                              {new Date(fav.createdAt).toLocaleDateString("en-GB", {
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
              </div>
            )}
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
