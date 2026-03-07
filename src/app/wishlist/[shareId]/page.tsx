import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { wishlists, favorites } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { Compass } from "lucide-react";
import type { Metadata } from "next";
import { SharedWishlistClient } from "./SharedWishlistClient";

interface SharedWishlistPageProps {
  params: Promise<{ shareId: string }>;
}

export async function generateMetadata({
  params,
}: SharedWishlistPageProps): Promise<Metadata> {
  const { shareId } = await params;
  const wishlist = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.shareId, shareId))
    .limit(1);

  if (wishlist.length === 0) return {};

  const wl = wishlist[0];
  return {
    title: `${wl.name} — Rough Idea Travel Wishlist`,
    description: `Check out this travel wishlist: ${wl.name}`,
    openGraph: {
      title: `${wl.name} — Rough Idea Travel`,
      description: `A curated travel wishlist with destinations to explore`,
    },
  };
}

export default async function SharedWishlistPage({
  params,
}: SharedWishlistPageProps) {
  const { shareId } = await params;

  const wishlist = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.shareId, shareId))
    .limit(1);

  if (wishlist.length === 0) notFound();

  const wl = wishlist[0];

  // Increment view count (fire and forget)
  db.update(wishlists)
    .set({ viewCount: sql`${wishlists.viewCount} + 1` })
    .where(eq(wishlists.id, wl.id))
    .then(() => {})
    .catch(() => {});

  // Fetch all favorites in this wishlist — exclude tripInputData (contains user's private trip preferences)
  const items = await db
    .select({
      id: favorites.id,
      destinationName: favorites.destinationName,
      country: favorites.country,
      destinationData: favorites.destinationData,
      listId: favorites.listId,
      createdAt: favorites.createdAt,
    })
    .from(favorites)
    .where(eq(favorites.listId, wl.id))
    .orderBy(desc(favorites.createdAt));

  return (
    <div className="favorites-page min-h-screen" style={{ background: "#0F0E0D", color: "#F2EEE8" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(28, 26, 23, 0.88)", backdropFilter: "blur(16px)", borderBottom: "1px solid #2E2B25" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 40px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a
            href="/"
            style={{ fontFamily: "'Clash Display', system-ui, sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: "#F2EEE8", textDecoration: "none" }}
          >
            ROUGH IDEA<span style={{ color: "#E8833A" }}>.</span>
          </a>
          <a
            href="/explore"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid #2E2B25",
              fontSize: 14,
              fontWeight: 500,
              color: "#F2EEE8",
              textDecoration: "none",
            }}
          >
            <Compass className="h-4 w-4" />
            Plan your own trip
          </a>
        </div>
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 40px" }}>
        <SharedWishlistClient
          wishlistName={wl.name}
          items={items}
          createdAt={wl.createdAt}
        />
      </main>
    </div>
  );
}
