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
    <div className="destination-page min-h-screen" style={{ background: "#0F0E0D", color: "#F2EEE8" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(28, 26, 23, 0.88)", backdropFilter: "blur(16px)", borderBottom: "1px solid #2E2B25" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a
            href="/"
            style={{ fontFamily: "'Clash Display', system-ui, sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: "#F2EEE8", textDecoration: "none" }}
          >
            ROUGH IDEA<span style={{ color: "#E8833A" }}>.</span>
          </a>
          <a
            href="/explore"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, border: "1px solid #2E2B25", fontSize: 14, fontWeight: 500, color: "#F2EEE8", textDecoration: "none" }}
          >
            <Compass className="h-4 w-4" />
            Plan your own trip
          </a>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <SharedTripContent
          destination={destination}
          sharedDate={trip.createdAt}
        />
      </main>
    </div>
  );
}
