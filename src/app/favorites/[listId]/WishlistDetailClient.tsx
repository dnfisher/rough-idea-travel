"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Share2, Pencil, Check, X, Compass, Heart } from "lucide-react";
import Link from "next/link";
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
  listId: string | null;
  createdAt: Date;
}

interface WishlistData {
  id: string;
  name: string;
  shareId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WishlistDetailClientProps {
  wishlist: WishlistData;
  initialItems: FavoriteRow[];
}

export function WishlistDetailClient({
  wishlist,
  initialItems,
}: WishlistDetailClientProps) {
  const [items, setItems] = useState(initialItems);
  const [listName, setListName] = useState(wishlist.name);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(wishlist.name);
  const [copied, setCopied] = useState(false);
  const [detailName, setDetailName] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) editInputRef.current?.focus();
  }, [isEditing]);

  const detailFav = detailName
    ? items.find((f) => f.destinationName === detailName)
    : null;
  const detailDest = detailFav?.destinationData as Partial<DestinationSuggestion> | undefined;

  function handleRemove(favId: string) {
    setItems((prev) => prev.filter((f) => f.id !== favId));
  }

  async function handleSaveName() {
    if (!editValue.trim() || editValue.trim() === listName) {
      setIsEditing(false);
      setEditValue(listName);
      return;
    }

    try {
      const res = await fetch(`/api/wishlists/${wishlist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editValue.trim() }),
      });
      if (res.ok) {
        setListName(editValue.trim());
      }
    } catch {
      setEditValue(listName);
    }
    setIsEditing(false);
  }

  function handleCopyShareLink() {
    const url = `${window.location.origin}/wishlist/${wishlist.shareId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
        {/* Back link */}
        <Link
          href="/favorites"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          All wishlists
        </Link>

        {/* List header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  ref={editInputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") {
                      setIsEditing(false);
                      setEditValue(listName);
                    }
                  }}
                  className="font-display font-semibold text-2xl bg-transparent border-b-2 border-primary outline-none w-full"
                />
                <button
                  onClick={handleSaveName}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <Check className="h-5 w-5 text-primary" />
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditValue(listName);
                  }}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="font-display font-semibold text-2xl">{listName}</h1>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                  title="Rename list"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {items.length} {items.length === 1 ? "destination" : "destinations"}
            </p>
          </div>

          <button
            onClick={handleCopyShareLink}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors flex-shrink-0"
          >
            <Share2 className="h-4 w-4" />
            {copied ? "Link copied!" : "Share list"}
          </button>
        </div>

        {/* Destination grid */}
        {items.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="font-display font-semibold text-lg mb-2">
              This list is empty
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Explore destinations and save them to this list.
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
      </main>

      {/* Detail sheet */}
      <DestinationDetailSheet
        destination={detailDest ?? null}
        onClose={() => setDetailName(null)}
      />
    </div>
  );
}
