import { NextRequest, NextResponse } from "next/server";

function isTrustedImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" &&
      ["lh3.googleusercontent.com", "maps.gstatic.com"].some(h => u.hostname === h || u.hostname.endsWith("." + h));
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

/** Map user interests to image-search-friendly descriptors */
function interestSearchTerms(interests: string[]): string {
  const INTEREST_MAP: Record<string, string> = {
    nature: "nature scenery", hiking: "hiking trail", photography: "scenic panorama",
    beach: "beach coastline", shopping: "shopping market", food: "food market",
    history: "historic landmark", culture: "cultural heritage", architecture: "architecture landmark",
    nightlife: "nightlife entertainment", adventure: "adventure outdoor", wildlife: "wildlife safari",
    skiing: "ski snow mountain", diving: "diving ocean", surfing: "surfing beach",
    cycling: "cycling countryside", wine: "vineyard wine", art: "art gallery",
    music: "music cultural", wellness: "spa wellness", romantic: "romantic scenic",
    family: "family attraction", luxury: "luxury resort", backpacking: "scenic trail",
    "road trip": "scenic drive road",
  };
  const terms = new Set<string>();
  for (const interest of interests.slice(0, 3)) {
    const key = interest.toLowerCase().trim();
    const mapped = INTEREST_MAP[key];
    if (mapped) { for (const w of mapped.split(" ").slice(0, 2)) terms.add(w); }
    else terms.add(key);
  }
  return [...terms].slice(0, 4).join(" ");
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  const country = req.nextUrl.searchParams.get("country");
  const interestsRaw = req.nextUrl.searchParams.get("interests");

  if (!name || !/^[\p{L}\p{N}\s,.\-'()&]{1,100}$/u.test(name)) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const interests = interestsRaw
    ? interestsRaw.split(",").map(s => s.trim()).filter(Boolean).slice(0, 5)
    : [];
  const interestTerms = interests.length ? interestSearchTerms(interests) : "";

  const cacheKey = `${name}|${country}|${interestTerms}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ photos: cached.photos });
  }

  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
  let photos: string[] = [];

  if (googleApiKey) {
    const basePlace = country ? `${name}, ${country}` : name;
    const query = interestTerms ? `${basePlace} ${interestTerms}` : basePlace;
    photos = await fetchGooglePlacesPhotos(query, googleApiKey);

    // For compound names like "Tulum & Playa del Carmen", try the first part if no results
    if (photos.length === 0 && name.includes("&")) {
      const firstPart = name.split("&")[0].trim();
      const fallbackPlace = country ? `${firstPart}, ${country}` : firstPart;
      const fallbackQuery = interestTerms ? `${fallbackPlace} ${interestTerms}` : fallbackPlace;
      photos = await fetchGooglePlacesPhotos(fallbackQuery, googleApiKey);
    }
  }

  if (CACHE.size >= CACHE_MAX) CACHE.delete(CACHE.keys().next().value!);
  CACHE.set(cacheKey, { photos, ts: Date.now() });
  return NextResponse.json({ photos }, {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
