import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { sharedTrips } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { Compass } from "lucide-react";
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
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <a
            href="/"
            className="font-logo text-3xl uppercase tracking-[-0.02em]"
          >
            ROUGH IDEA<span className="text-highlight">.</span>
          </a>
          <a
            href="/explore"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            <Compass className="h-4 w-4" />
            Plan your own trip
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <SharedTripContent
          destination={destination}
          sharedDate={trip.createdAt}
        />
      </main>
    </div>
  );
}
