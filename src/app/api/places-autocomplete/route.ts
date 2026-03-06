import { NextRequest, NextResponse } from "next/server";

const CACHE = new Map<string, { suggestions: string[]; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const CACHE_MAX = 500;

const CITY_TYPES = [
  "locality",
  "sublocality",
  "administrative_area_level_3",
  "postal_town",
  "neighborhood",
];

const REGION_TYPES = [
  "country",
  "administrative_area_level_1",
  "administrative_area_level_2",
  "locality",
];

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  const mode = req.nextUrl.searchParams.get("mode"); // "region" or default (city)
  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error("[places-autocomplete] GOOGLE_PLACES_API_KEY not set");
    return NextResponse.json([]);
  }

  // Check cache
  const cacheKey = `${mode ?? "city"}:${query.toLowerCase()}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.suggestions);
  }

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify({
        input: query,
        includedPrimaryTypes: mode === "region" ? REGION_TYPES : CITY_TYPES,
      }),
    });

    if (!res.ok) {
      console.error("[places-autocomplete] Google API error:", res.status);
      return NextResponse.json([]);
    }

    const data = await res.json();
    const suggestions: string[] = (data.suggestions ?? [])
      .map((s: { placePrediction?: { text?: { text?: string } } }) =>
        s.placePrediction?.text?.text
      )
      .filter(Boolean)
      .slice(0, 8);

    // Store in cache (FIFO eviction)
    if (CACHE.size >= CACHE_MAX) {
      const oldest = CACHE.keys().next().value;
      if (oldest) CACHE.delete(oldest);
    }
    CACHE.set(cacheKey, { suggestions, ts: Date.now() });

    return NextResponse.json(suggestions);
  } catch (err) {
    console.error("[places-autocomplete] fetch error:", err);
    return NextResponse.json([]);
  }
}
