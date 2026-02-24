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

  // Fetch all favorites in this wishlist
  const items = await db
    .select()
    .from(favorites)
    .where(eq(favorites.listId, wl.id))
    .orderBy(desc(favorites.createdAt));

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
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

      <main className="max-w-5xl mx-auto px-6 py-8">
        <SharedWishlistClient
          wishlistName={wl.name}
          items={items}
          createdAt={wl.createdAt}
        />
      </main>
    </div>
  );
}
