import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { favorites, wishlists } from "@/lib/db/schema";
import { eq, desc, isNull, and, count } from "drizzle-orm";
import { FavoritesClient } from "./FavoritesClient";

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  // Fetch wishlists with item counts and cover data
  const userWishlists = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.userId, session.user.id))
    .orderBy(desc(wishlists.updatedAt));

  const wishlistsWithPreviews = await Promise.all(
    userWishlists.map(async (wl) => {
      const [countResult] = await db
        .select({ count: count() })
        .from(favorites)
        .where(eq(favorites.listId, wl.id));

      const coverItems = await db
        .select({
          destinationName: favorites.destinationName,
          country: favorites.country,
        })
        .from(favorites)
        .where(eq(favorites.listId, wl.id))
        .orderBy(desc(favorites.createdAt))
        .limit(3);

      return {
        ...wl,
        itemCount: countResult?.count ?? 0,
        coverDestinations: coverItems,
      };
    })
  );

  // Fetch uncategorized favorites (not in any list)
  const uncategorized = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, session.user.id), isNull(favorites.listId)))
    .orderBy(desc(favorites.createdAt));

  return (
    <FavoritesClient
      initialWishlists={wishlistsWithPreviews}
      initialUncategorized={uncategorized}
    />
  );
}
