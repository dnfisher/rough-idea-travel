import { NextRequest, NextResponse } from "next/server";

const TRUSTED_IMAGE_HOSTS = [
  "lh3.googleusercontent.com",
  "maps.gstatic.com",
  "maps.googleapis.com",
  "upload.wikimedia.org",
];

function isTrustedImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && TRUSTED_IMAGE_HOSTS.some(h => u.hostname.endsWith(h));
  } catch {
    return false;
  }
}

const CACHE = new Map<string, { url: string | null; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 4; // 4 hours (Google photo URLs are long-lived)
const CACHE_MAX = 500;
const UA = "RoughIdeaTravel/1.0 (travel planning tool)";

// ── Google Places Photos API (New) ─────────────────────────────

async function fetchGooglePlacesPhoto(
  query: string,
  apiKey: string,
  maxWidthPx = 1600
): Promise<string | null> {
  try {
    // Step 1: Text Search to find a place with photos
    const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.photos",
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 1,
      }),
    });

    if (!searchRes.ok) {
      console.error("[destination-image] Google Places search failed:", searchRes.status);
      return null;
    }

    const searchData = await searchRes.json();
    const photos = searchData?.places?.[0]?.photos;
    if (!photos || photos.length === 0) return null;

    // Step 2: Build the photo media URL — this endpoint redirects to the actual image
    // photos[1] tends to be more scenic/outdoor than photos[0] (which is the most-clicked,
    // often a hotel lobby, restaurant interior, or tourist selfie spot).
    // Fall back to photos[0] if fewer than 2 photos.
    const targetPhoto = photos.length > 1 ? photos[1] : photos[0];
    const photoName = targetPhoto.name; // e.g. "places/ChIJ.../photos/AUacSh..."
    const mediaUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${apiKey}`;

    // Step 3: Follow the redirect to get the final cached image URL
    const mediaRes = await fetch(mediaUrl, { redirect: "manual" });
    const location = mediaRes.headers.get("location");
    if (location && isTrustedImageUrl(location)) return location;

    // If no redirect, use the media URL directly (client will follow)
    return mediaUrl;
  } catch (err) {
    console.error("[destination-image] Google Places error:", err);
    return null;
  }
}

// ── Wikipedia / Commons fallback ───────────────────────────────

const NON_PHOTO_PATTERNS = [
  "Map_of_", "map_of_", "_map.", "_Map.", "locator_map", "location_map",
  "_in_Europe", "_in_Asia", "_in_Africa", "_in_North_America", "_in_South_America",
  "_in_Oceania", "_in_the_", "_on_the_globe",
  "_orthographic", "_globe", "topographic_map", "relief_map", "political_map",
  "Administrative_", "administrative_", "Location_dot_",
  "coat_of_arms", "Coat_of_arms", "Coat_of_Arms",
  "Logo_", "logo_", "_logo.", "_Logo.",
  "Symbol_", "symbol_", "Seal_of_", "seal_of_",
  "Emblem_of_", "emblem_of_", "Blason_", "Wappen_", "Escudo_de_",
  "Diagram", "diagram", "Chart_", "chart_",
  "comparison", "Comparison_", "timeline", "Timeline_",
  "panorama_label", "Panorama_label", "annotated", "Annotated_",
  "collage", "Collage_", "montage", "Montage_",
  "poster_", "Poster_", "brochure", "Brochure_",
  "infographic", "Infographic", "illustration", "Illustration_",
  "stamp_", "Stamp_", "postcard", "Postcard_",
  "icon_", "Icon_", "badge_", "Badge_",
];

function isLikelyPhoto(url: string): boolean {
  return !NON_PHOTO_PATTERNS.some((p) => url.includes(p));
}

async function fetchWikipediaImage(title: string): Promise<string | null> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("titles", title);
  url.searchParams.set("prop", "pageimages");
  url.searchParams.set("format", "json");
  url.searchParams.set("pithumbsize", "1200");

  const res = await fetch(url.toString(), { headers: { "User-Agent": UA } });
  if (!res.ok) return null;

  const data = await res.json();
  const pages = data?.query?.pages;
  if (!pages) return null;

  for (const page of Object.values(pages) as any[]) {
    const thumb = page?.thumbnail?.source;
    if (thumb && !thumb.includes(".svg") && !thumb.includes("/Flag_of_") && isLikelyPhoto(thumb)) {
      return thumb;
    }
  }
  return null;
}

async function fetchWikipediaSearchImage(query: string): Promise<string | null> {
  const searchUrl = new URL("https://en.wikipedia.org/w/api.php");
  searchUrl.searchParams.set("action", "query");
  searchUrl.searchParams.set("generator", "search");
  searchUrl.searchParams.set("gsrsearch", query);
  searchUrl.searchParams.set("gsrlimit", "5");
  searchUrl.searchParams.set("prop", "pageimages");
  searchUrl.searchParams.set("piprop", "thumbnail");
  searchUrl.searchParams.set("pithumbsize", "1200");
  searchUrl.searchParams.set("format", "json");

  const res = await fetch(searchUrl.toString(), { headers: { "User-Agent": UA } });
  if (!res.ok) return null;

  const data = await res.json();
  const pages = data?.query?.pages;
  if (!pages) return null;

  const sorted = Object.values(pages as Record<string, any>).sort(
    (a, b) => (a.index ?? 99) - (b.index ?? 99)
  );

  for (const page of sorted) {
    const thumb = page?.thumbnail?.source;
    if (thumb && !thumb.includes(".svg") && !thumb.includes("/Flag_of_") && isLikelyPhoto(thumb)) {
      return thumb;
    }
  }
  return null;
}

// ── Route handler ──────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  const country = req.nextUrl.searchParams.get("country");

  if (!name || !/^[\p{L}\p{N}\s,.\-'()]{1,100}$/u.test(name)) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const cacheKey = `${name}|${country}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    if (!cached.url) {
      return new NextResponse(null, { status: 404 });
    }
    const cachedRes = NextResponse.redirect(cached.url, 302);
    cachedRes.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return cachedRes;
  }

  let imageUrl: string | null = null;
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;

  // ── Primary: Google Places Photos (high quality) ──
  if (googleApiKey) {
    const queries = [
      country ? `${name} ${country} landmark outdoor` : `${name} landmark outdoor`,
      country ? `${name}, ${country}` : name,
    ];

    for (const q of queries) {
      imageUrl = await fetchGooglePlacesPhoto(q, googleApiKey);
      if (imageUrl) break;
    }
  }

  // ── Fallback: Wikipedia (when no Google key or no results) ──
  if (!imageUrl) {
    const wikiQueries = [
      name,
      country ? `${name}, ${country}` : null,
    ].filter(Boolean) as string[];

    for (const q of wikiQueries) {
      imageUrl = await fetchWikipediaImage(q);
      if (imageUrl) break;
    }

    if (!imageUrl) {
      const suffixes = ["landscape", "scenic view", "city skyline"];
      for (const suffix of suffixes) {
        const searchTerms = country ? `${name} ${country} ${suffix}` : `${name} ${suffix}`;
        imageUrl = await fetchWikipediaSearchImage(searchTerms);
        if (imageUrl) break;
      }
    }
  }

  if (CACHE.size >= CACHE_MAX) CACHE.delete(CACHE.keys().next().value!);
  CACHE.set(cacheKey, { url: imageUrl, ts: Date.now() });

  if (!imageUrl) {
    return new NextResponse(null, { status: 404 });
  }

  const res = NextResponse.redirect(imageUrl, 302);
  res.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  return res;
}
