import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wishlists, favorites } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
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

    const wishlist = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.id, id), eq(wishlists.userId, session.user.id)))
      .limit(1);

    if (wishlist.length === 0) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const items = await db
      .select()
      .from(favorites)
      .where(eq(favorites.listId, id))
      .orderBy(desc(favorites.createdAt));

    return new Response(
      JSON.stringify({ ...wishlist[0], items }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[wishlists] GET [id] error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

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
    const { name } = body;

    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
      return new Response(JSON.stringify({ error: "Invalid name" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name.trim();

    const updated = await db
      .update(wishlists)
      .set(updates)
      .where(and(eq(wishlists.id, id), eq(wishlists.userId, session.user.id)))
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
    console.error("[wishlists] PATCH error:", error);
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
      .delete(wishlists)
      .where(and(eq(wishlists.id, id), eq(wishlists.userId, session.user.id)))
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
    console.error("[wishlists] DELETE error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
