import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { favorites } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userFavorites = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, session.user.id))
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
    const { destinationData, tripInputData } = body;

    if (!destinationData?.name || !destinationData?.country) {
      return new Response(JSON.stringify({ error: "Missing destination data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [inserted] = await db
      .insert(favorites)
      .values({
        userId: session.user.id,
        destinationName: destinationData.name,
        country: destinationData.country,
        destinationData,
        tripInputData: tripInputData ?? null,
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
