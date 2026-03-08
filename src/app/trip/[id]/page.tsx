import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { sharedTrips } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { SharedTripContent } from "./SharedTripContent";
import type { Metadata } from "next";

interface SharedTripPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: SharedTripPageProps): Promise<Metadata> {
  const { id } = await params;
  const trip = await db.query.sharedTrips.findFirst({
    where: eq(sharedTrips.id, id),
  });

  if (!trip) return {};

  return {
    title: `${trip.destinationName}, ${trip.country} — Rough Idea Travel`,
    description: `Check out this trip plan for ${trip.destinationName}, ${trip.country}`,
    openGraph: {
      title: `${trip.destinationName}, ${trip.country} — Rough Idea`,
      description: `Check out this trip plan for ${trip.destinationName}`,
      images: [
        `/api/destination-image?name=${encodeURIComponent(trip.destinationName)}&country=${encodeURIComponent(trip.country)}`,
      ],
    },
  };
}

export default async function SharedTripPage({ params }: SharedTripPageProps) {
  const { id } = await params;
  const trip = await db.query.sharedTrips.findFirst({
    where: eq(sharedTrips.id, id),
  });

  if (!trip) notFound();

  // Increment view count (fire and forget)
  db.update(sharedTrips)
    .set({ viewCount: sql`${sharedTrips.viewCount} + 1` })
    .where(eq(sharedTrips.id, id))
    .then(() => {})
    .catch(() => {});

  const destination = trip.destinationData as DestinationSuggestion;

  return (
    <SharedTripContent
      destination={destination}
      destinationName={trip.destinationName}
      country={trip.country}
    />
  );
}
