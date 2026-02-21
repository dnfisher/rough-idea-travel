"use client";

import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { DestinationDetailContent } from "@/components/results/DestinationDetailContent";

interface SharedTripContentProps {
  destination: DestinationSuggestion;
  sharedDate: Date;
}

export function SharedTripContent({ destination, sharedDate }: SharedTripContentProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <DestinationDetailContent
        destination={destination}
        sharedDate={sharedDate}
      />
    </div>
  );
}
