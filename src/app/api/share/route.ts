import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sharedTrips } from "@/lib/db/schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { destinationData, tripInputData } = body;

    if (!destinationData?.name || !destinationData?.country) {
      return new Response(JSON.stringify({ error: "Missing destination data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Limit payload size (~50KB max for destination data)
    const dataStr = JSON.stringify(destinationData);
    if (dataStr.length > 50_000) {
      return new Response(JSON.stringify({ error: "Destination data too large" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Optionally associate with logged-in user
    const session = await auth();
    const userId = session?.user?.id ?? null;

    const [inserted] = await db
      .insert(sharedTrips)
      .values({
        userId,
        destinationName: destinationData.name,
        country: destinationData.country,
        destinationData,
        tripInputData: tripInputData ?? null,
      })
      .returning();

    const url = `/trip/${inserted.id}`;

    return new Response(JSON.stringify({ id: inserted.id, url }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[share] POST error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
