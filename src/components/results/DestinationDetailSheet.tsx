"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeepPartial } from "ai";
import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { DestinationDetailContent } from "./DestinationDetailContent";

interface DestinationDetailSheetProps {
  destination: DeepPartial<DestinationSuggestion> | null;
  rank?: number;
  isRecommended?: boolean;
  onClose: () => void;
  /** Action buttons rendered in the detail content header (favorite, share, etc.) */
  actions?: React.ReactNode;
}

export function DestinationDetailSheet({
  destination,
  rank,
  isRecommended,
  onClose,
  actions,
}: DestinationDetailSheetProps) {
  const isOpen = destination !== null;

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full lg:w-[60vw] lg:max-w-3xl",
          "bg-card border-l border-border shadow-2xl",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label={destination?.name ? `Details for ${destination.name}` : "Destination details"}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-sm hover:bg-muted transition-colors"
          aria-label="Close details"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Scrollable content */}
        <div className="h-full overflow-y-auto overscroll-contain">
          <div className="p-6">
            {destination && (
              <DestinationDetailContent
                destination={destination}
                rank={rank}
                isRecommended={isRecommended}
                actions={actions}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
