import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wishlists, favorites } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch all wishlists for the user
    const userWishlists = await db
      .select()
      .from(wishlists)
      .where(eq(wishlists.userId, session.user.id))
      .orderBy(desc(wishlists.updatedAt));

    // For each wishlist, get item count and cover data (first 3 favorites)
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

    return new Response(JSON.stringify(wishlistsWithPreviews), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[wishlists] GET error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new Response(JSON.stringify({ error: "List name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [inserted] = await db
      .insert(wishlists)
      .values({
        userId: session.user.id,
        name: name.trim(),
      })
      .returning();

    return new Response(
      JSON.stringify({ ...inserted, itemCount: 0, coverDestinations: [] }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[wishlists] POST error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
