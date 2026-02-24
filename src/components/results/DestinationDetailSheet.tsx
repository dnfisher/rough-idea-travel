"use client";

import { useEffect, useCallback } from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeepPartial } from "ai";
import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { DestinationDetailContent } from "./DestinationDetailContent";

function DestinationDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero image area */}
      <div className="relative h-56 sm:h-72 -mx-6 -mt-6 animate-shimmer rounded-b-xl" />

      {/* Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border p-3 space-y-2">
            <div className="h-4 w-4 mx-auto animate-shimmer rounded-full" />
            <div className="h-4 w-16 mx-auto animate-shimmer rounded-lg" />
            <div className="h-3 w-20 mx-auto animate-shimmer rounded-lg" />
          </div>
        ))}
      </div>

      {/* Reasoning paragraph */}
      <div className="space-y-2">
        <div className="h-4 w-40 animate-shimmer rounded-lg" />
        <div className="h-3 w-full animate-shimmer rounded-lg" />
        <div className="h-3 w-full animate-shimmer rounded-lg" />
        <div className="h-3 w-3/4 animate-shimmer rounded-lg" />
      </div>

      {/* Pros/Cons grid */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border p-4 space-y-3">
            <div className="h-4 w-12 animate-shimmer rounded-lg" />
            <div className="h-3 w-full animate-shimmer rounded-lg" />
            <div className="h-3 w-5/6 animate-shimmer rounded-lg" />
            <div className="h-3 w-4/6 animate-shimmer rounded-lg" />
          </div>
        ))}
      </div>

      {/* Activity pills */}
      <div className="space-y-2">
        <div className="h-4 w-28 animate-shimmer rounded-lg" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-20 animate-shimmer rounded-xl" />
          ))}
        </div>
      </div>

      {/* Itinerary placeholder */}
      <div className="space-y-3">
        <div className="h-4 w-32 animate-shimmer rounded-lg" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border p-4 space-y-2">
            <div className="h-4 w-24 animate-shimmer rounded-lg" />
            <div className="h-3 w-full animate-shimmer rounded-lg" />
            <div className="h-3 w-2/3 animate-shimmer rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface DestinationDetailSheetProps {
  destination: DeepPartial<DestinationSuggestion> | null;
  isOpen?: boolean;
  rank?: number;
  isRecommended?: boolean;
  onClose: () => void;
  actions?: React.ReactNode;
  isDetailLoading?: boolean;
}

export function DestinationDetailSheet({
  destination,
  isOpen: isOpenProp,
  rank,
  isRecommended,
  onClose,
  actions,
  isDetailLoading,
}: DestinationDetailSheetProps) {
  const isOpen = isOpenProp ?? destination !== null;

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
            {destination && destination.reasoning ? (
              <>
                <DestinationDetailContent
                  destination={destination}
                  rank={rank}
                  isRecommended={isRecommended}
                  actions={actions}
                />
                {isDetailLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading full trip details...
                  </div>
                )}
              </>
            ) : isOpen ? (
              <DestinationDetailSkeleton />
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
