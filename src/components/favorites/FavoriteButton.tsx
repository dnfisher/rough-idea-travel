"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import type { DeepPartial } from "ai";
import type { DestinationSuggestion } from "@/lib/ai/schemas";

interface FavoriteButtonProps {
  destination: DeepPartial<DestinationSuggestion>;
  isFavorited: boolean;
  favoriteId: string | null;
  onToggle: (newFavoriteId: string | null) => void;
  size?: "sm" | "md";
}

export function FavoriteButton({
  destination,
  isFavorited,
  favoriteId,
  onToggle,
  size = "md",
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [showSignInHint, setShowSignInHint] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();

    if (!session?.user) {
      setShowSignInHint(true);
      setTimeout(() => setShowSignInHint(false), 3000);
      return;
    }

    if (loading) return;
    setLoading(true);

    // Optimistic update
    const wasFavorited = isFavorited;
    const oldFavoriteId = favoriteId;
    onToggle(wasFavorited ? null : "optimistic");

    try {
      if (wasFavorited && oldFavoriteId) {
        const res = await fetch(`/api/favorites/${oldFavoriteId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to remove favorite");
        onToggle(null);
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destinationData: destination }),
        });
        if (!res.ok) throw new Error("Failed to add favorite");
        const data = await res.json();
        onToggle(data.id);
      }
    } catch {
      // Revert optimistic update
      onToggle(wasFavorited ? oldFavoriteId : null);
    } finally {
      setLoading(false);
    }
  }

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const btnSize = size === "sm" ? "p-1.5" : "p-2";

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={loading}
        className={cn(
          btnSize,
          "rounded-full border transition-all",
          isFavorited
            ? "bg-red-50 border-red-200 text-red-500 dark:bg-red-950 dark:border-red-800"
            : "border-border text-muted-foreground hover:text-red-500 hover:border-red-200",
          loading && "opacity-50"
        )}
        title={isFavorited ? "Remove from favorites" : "Save to favorites"}
      >
        <Heart
          className={cn(iconSize, isFavorited && "fill-current")}
        />
      </button>

      {/* Sign-in hint tooltip */}
      {showSignInHint && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-card border border-border rounded-lg shadow-lg text-xs whitespace-nowrap z-50">
          <a href="/auth/signin" className="text-primary hover:underline font-medium">
            Sign in
          </a>
          {" "}to save favorites
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-r border-b border-border rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}
