import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { showcaseDestinations } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

const PostSchema = z.object({
  name: z.string().min(1).max(200),
  country: z.string().max(100).optional(),
  slug: z.string().min(1).max(300).regex(/^[a-z0-9-]+$/, "Invalid slug format"),
  imageUrl: z.string().max(2000).optional(),
  destinationData: z.record(z.string(), z.unknown()).optional(),
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
    const body = await req.json();
    const parsed = PostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { name, country, slug, imageUrl, destinationData } = parsed.data;

    await db
      .insert(showcaseDestinations)
      .values({ name, country, slug, imageUrl, destinationData: destinationData ?? null, viewedAt: new Date() })
      .onConflictDoUpdate({
        target: showcaseDestinations.slug,
        set: {
          viewedAt: new Date(),
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
