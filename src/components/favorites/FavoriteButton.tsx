"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import type { DeepPartial } from "ai";
import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { SaveToListModal } from "./SaveToListModal";

interface FavoriteButtonProps {
  destination: DeepPartial<DestinationSuggestion>;
  isFavorited: boolean;
  favoriteId: string | null;
  onToggle: (newFavoriteId: string | null) => void;
  onAuthRequired?: () => void;
  size?: "sm" | "md";
}

export function FavoriteButton({
  destination,
  isFavorited,
  favoriteId,
  onToggle,
  onAuthRequired,
  size = "md",
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();

    if (!session?.user) {
      onAuthRequired?.();
      return;
    }

    if (loading) return;

    if (isFavorited) {
      // Unfavorite: direct DELETE, no modal needed
      setLoading(true);
      const oldFavoriteId = favoriteId;
      onToggle(null); // optimistic

      try {
        if (oldFavoriteId) {
          const res = await fetch(`/api/favorites/${oldFavoriteId}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Failed to remove favorite");
        }
      } catch {
        onToggle(oldFavoriteId); // revert
      } finally {
        setLoading(false);
      }
    } else {
      // Favorite: show list selection modal
      setShowListModal(true);
    }
  }

  async function handleSaveToList(listId: string | null) {
    setShowListModal(false);
    setLoading(true);
    onToggle("optimistic"); // optimistic
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 200);

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationData: destination,
          listId,
        }),
      });
      if (!res.ok) throw new Error("Failed to add favorite");
      const data = await res.json();
      onToggle(data.id);
    } catch {
      onToggle(null); // revert
    } finally {
      setLoading(false);
    }
  }

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const btnSize = size === "sm" ? "p-1.5" : "p-2";

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          background: isFavorited ? "rgba(232,131,58,0.15)" : "transparent",
          borderColor: isFavorited ? "#E8833A" : undefined,
          transition: "all 0.15s ease",
        }}
        className={cn(
          btnSize,
          "rounded-full border transition-all",
          isFavorited
            ? "border-[#E8833A] text-[#E8833A]"
            : "border-border text-[#F2EEE8] hover:border-[#E8833A] hover:bg-[rgba(232,131,58,0.08)] hover:text-[#E8833A]",
          loading && "opacity-50"
        )}
        title={isFavorited ? "Remove from favorites" : "Save to favorites"}
      >
        <Heart
          className={cn(iconSize, isFavorited && "fill-current", isPulsing && "heart-pulse")}
          style={isFavorited ? { color: "#E8833A" } : undefined}
        />
      </button>

      <SaveToListModal
        isOpen={showListModal}
        onClose={() => setShowListModal(false)}
        onSave={handleSaveToList}
        destinationName={destination.name ?? "this destination"}
      />
    </>
  );
}
