import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { favorites } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { FavoritesClient } from "./FavoritesClient";

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const userFavorites = await db
    .select()
    .from(favorites)
    .where(eq(favorites.userId, session.user.id))
    .orderBy(desc(favorites.createdAt));

  return <FavoritesClient initialFavorites={userFavorites} />;
}
