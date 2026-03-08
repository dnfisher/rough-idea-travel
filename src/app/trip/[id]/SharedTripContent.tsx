"use client";

import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { DestinationDetailPage } from "@/app/destination/[slug]/DestinationDetailPage";
import { slugify } from "@/lib/destination-url";
import type { DestinationPageContext } from "@/lib/destination-url";

interface SharedTripContentProps {
  destination: DestinationSuggestion;
  destinationName: string;
  country: string;
}

export function SharedTripContent({ destination, destinationName, country }: SharedTripContentProps) {
  const slug = slugify(destinationName);
  const firstStop = destination.itinerary?.days?.[0]?.location;

  const initialContext: DestinationPageContext = {
    summary: { name: destinationName, country },
    detail: destination,
    imageSearchName: firstStop ?? destinationName,
    stableCountry: country,
  };

  return (
    <DestinationDetailPage
      slug={slug}
      initialContext={initialContext}
      sharedMode
    />
  );
}
