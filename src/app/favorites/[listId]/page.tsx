import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { favorites, wishlists } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { WishlistDetailClient } from "./WishlistDetailClient";

export default async function WishlistDetailPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { listId } = await params;

  const wishlist = await db
    .select()
    .from(wishlists)
    .where(and(eq(wishlists.id, listId), eq(wishlists.userId, session.user.id)))
    .limit(1);

  if (wishlist.length === 0) notFound();

  const items = await db
    .select()
    .from(favorites)
    .where(eq(favorites.listId, listId))
    .orderBy(desc(favorites.createdAt));

  return (
    <WishlistDetailClient
      wishlist={wishlist[0]}
      initialItems={items}
    />
  );
}
