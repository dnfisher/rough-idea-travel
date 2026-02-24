import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { favorites, wishlists } from "@/lib/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const listId = url.searchParams.get("listId");

    let conditions = eq(favorites.userId, session.user.id);

    if (listId === "uncategorized") {
      // Favorites not assigned to any list
      const userFavorites = await db
        .select()
        .from(favorites)
        .where(and(eq(favorites.userId, session.user.id), isNull(favorites.listId)))
        .orderBy(desc(favorites.createdAt));
      return new Response(JSON.stringify(userFavorites), {
        headers: { "Content-Type": "application/json" },
      });
    } else if (listId) {
      // Favorites in a specific list
      const userFavorites = await db
        .select()
        .from(favorites)
        .where(and(eq(favorites.userId, session.user.id), eq(favorites.listId, listId)))
        .orderBy(desc(favorites.createdAt));
      return new Response(JSON.stringify(userFavorites), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // All favorites
    const userFavorites = await db
      .select()
      .from(favorites)
      .where(conditions)
      .orderBy(desc(favorites.createdAt));

    return new Response(JSON.stringify(userFavorites), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[favorites] GET error:", error);
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
    const { destinationData, tripInputData, listId } = body;

    if (!destinationData?.name || !destinationData?.country) {
      return new Response(JSON.stringify({ error: "Missing destination data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate listId belongs to user if provided
    if (listId) {
      const list = await db
        .select({ id: wishlists.id })
        .from(wishlists)
        .where(and(eq(wishlists.id, listId), eq(wishlists.userId, session.user.id)))
        .limit(1);

      if (list.length === 0) {
        return new Response(JSON.stringify({ error: "Wishlist not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const [inserted] = await db
      .insert(favorites)
      .values({
        userId: session.user.id,
        destinationName: destinationData.name,
        country: destinationData.country,
        destinationData,
        tripInputData: tripInputData ?? null,
        listId: listId ?? null,
      })
      .returning();

    return new Response(JSON.stringify(inserted), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[favorites] POST error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
