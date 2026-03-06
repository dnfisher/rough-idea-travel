import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { showcaseDestinations } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

const PostSchema = z.object({
  name: z.string().min(1).max(200),
  country: z.string().max(100).optional(),
  slug: z.string().min(1).max(300).regex(/^[a-z0-9-]+$/, "Invalid slug format"),
  // Only accept our own image proxy URLs — prevents storing external/attacker URLs
  imageUrl: z.string().max(500).regex(/^\/api\/destination-image\?/, "Must be a destination image proxy URL").optional(),
  destinationData: z.record(z.string(), z.unknown()).optional()
    .refine(d => !d || JSON.stringify(d).length <= 50_000, "destinationData too large"),
});

export async function GET(_req: NextRequest) {
  try {
    const rows = await db
      .select()
      .from(showcaseDestinations)
      .orderBy(desc(showcaseDestinations.viewedAt))
      .limit(8);

    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = PostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { name, country, slug, imageUrl, destinationData } = parsed.data;
    const now = new Date();

    await db
      .insert(showcaseDestinations)
      .values({ name, country, slug, imageUrl, destinationData: destinationData ?? null, viewedAt: now })
      .onConflictDoUpdate({
        target: showcaseDestinations.slug,
        set: {
          viewedAt: now,
          country,
          imageUrl,
          destinationData: destinationData ?? null,
        },
      });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
