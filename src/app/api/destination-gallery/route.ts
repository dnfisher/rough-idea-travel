import { NextRequest, NextResponse } from "next/server";

const CACHE = new Map<string, { photos: string[]; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 4; // 4 hours

async function fetchGooglePlacesPhotos(
  query: string,
  apiKey: string,
  maxPhotos = 5,
  maxWidthPx = 800
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

    const urls: string[] = [];
    for (const photo of photos.slice(0, maxPhotos)) {
      const mediaUrl = `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=${maxWidthPx}&key=${apiKey}`;
      const mediaRes = await fetch(mediaUrl, { redirect: "manual" });
      const location = mediaRes.headers.get("location");
      if (location) {
        urls.push(location);
      }
      // If no redirect location, skip this photo to avoid exposing the API key
    }
    return urls;
  } catch (err) {
    console.error("[destination-gallery] Google Places error:", err);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  const country = req.nextUrl.searchParams.get("country");

  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
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

  CACHE.set(cacheKey, { photos, ts: Date.now() });
  return NextResponse.json({ photos });
}
