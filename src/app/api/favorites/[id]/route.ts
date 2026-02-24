import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { favorites, wishlists } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = await params;
    const body = await req.json();
    const { listId } = body;

    // Validate listId belongs to user if provided (null means uncategorize)
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

    const updated = await db
      .update(favorites)
      .set({ listId: listId ?? null })
      .where(and(eq(favorites.id, id), eq(favorites.userId, session.user.id)))
      .returning();

    if (updated.length === 0) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(updated[0]), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[favorites] PATCH error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = await params;

    const deleted = await db
      .delete(favorites)
      .where(and(eq(favorites.id, id), eq(favorites.userId, session.user.id)))
      .returning();

    if (deleted.length === 0) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[favorites] DELETE error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
