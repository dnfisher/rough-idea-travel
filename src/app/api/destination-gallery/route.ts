import { NextRequest, NextResponse } from "next/server";

function isTrustedImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" &&
      ["lh3.googleusercontent.com", "maps.gstatic.com"].some(h => u.hostname.endsWith(h));
  } catch {
    return false;
  }
}

const CACHE = new Map<string, { photos: string[]; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 4; // 4 hours
const CACHE_MAX = 200;

async function fetchGooglePlacesPhotos(
  query: string,
  apiKey: string,
  maxPhotos = 20,
  maxWidthPx = 1600
): Promise<string[]> {
  try {
    const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.photos",
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
    });

    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const photos: Array<{ name: string }> = searchData?.places?.[0]?.photos ?? [];
    if (photos.length === 0) return [];

    const results = await Promise.all(
      photos.slice(0, maxPhotos).map(async (photo) => {
        const mediaUrl = `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=${maxWidthPx}&key=${apiKey}`;
        const mediaRes = await fetch(mediaUrl, { redirect: "manual" });
        // Return the redirect location only if it points to a trusted host
        const location = mediaRes.headers.get("location");
        return location && isTrustedImageUrl(location) ? location : null;
      })
    );
    return results.filter((url): url is string => url !== null);
  } catch (err) {
    console.error("[destination-gallery] Google Places error:", err);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  const country = req.nextUrl.searchParams.get("country");

  if (!name || !/^[\p{L}\p{N}\s,.\-'()]{1,100}$/u.test(name)) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const cacheKey = `${name}|${country}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ photos: cached.photos });
  }

  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
  let photos: string[] = [];

  if (googleApiKey) {
    const query = country ? `${name}, ${country}` : name;
    photos = await fetchGooglePlacesPhotos(query, googleApiKey);
  }

  if (CACHE.size >= CACHE_MAX) CACHE.delete(CACHE.keys().next().value!);
  CACHE.set(cacheKey, { photos, ts: Date.now() });
  return NextResponse.json({ photos }, {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
