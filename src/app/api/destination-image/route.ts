import { NextRequest, NextResponse } from "next/server";

const CACHE = new Map<string, { url: string | null; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const UA = "RoughIdeaTravel/1.0 (travel planning tool)";

// URL patterns that indicate non-photo content (maps, charts, logos, etc.)
const NON_PHOTO_PATTERNS = [
  // Maps & geography
  "Map_of_", "map_of_", "_map.", "_Map.", "locator_map", "location_map",
  "_in_Europe", "_in_Asia", "_in_Africa", "_in_North_America", "_in_South_America",
  "_in_Oceania", "_in_the_", "_on_the_globe",
  "_orthographic", "_globe", "topographic_map", "relief_map", "political_map",
  "Administrative_", "administrative_", "Location_dot_",
  // Logos, emblems, heraldry
  "coat_of_arms", "Coat_of_arms", "Coat_of_Arms",
  "Logo_", "logo_", "_logo.", "_Logo.",
  "Symbol_", "symbol_", "Seal_of_", "seal_of_",
  "Emblem_of_", "emblem_of_", "Blason_", "Wappen_", "Escudo_de_",
  // Charts, diagrams, data graphics
  "Diagram", "diagram", "Chart_", "chart_",
  "comparison", "Comparison_", "timeline", "Timeline_",
  // Text-heavy / composite images
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
  url.searchParams.set("pithumbsize", "800");

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

// Wikipedia search — finds articles related to the query and checks for images
async function fetchWikipediaSearchImage(query: string): Promise<string | null> {
  const searchUrl = new URL("https://en.wikipedia.org/w/api.php");
  searchUrl.searchParams.set("action", "query");
  searchUrl.searchParams.set("generator", "search");
  searchUrl.searchParams.set("gsrsearch", query);
  searchUrl.searchParams.set("gsrlimit", "5");
  searchUrl.searchParams.set("prop", "pageimages");
  searchUrl.searchParams.set("piprop", "thumbnail");
  searchUrl.searchParams.set("pithumbsize", "800");
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

async function fetchCommonsImage(query: string): Promise<string | null> {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", query);
  url.searchParams.set("gsrlimit", "5");
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|mime|size");
  url.searchParams.set("iiurlwidth", "800");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString(), { headers: { "User-Agent": UA } });
  if (!res.ok) return null;

  const data = await res.json();
  const pages = data?.query?.pages;
  if (!pages) return null;

  const sorted = Object.values(pages as Record<string, any>).sort(
    (a, b) => (a.index ?? 99) - (b.index ?? 99)
  );

  for (const page of sorted) {
    const info = page?.imageinfo?.[0];
    const thumbUrl = info?.thumburl;
    const mime = info?.mime ?? "";
    const width = info?.width ?? 0;
    const height = info?.height ?? 0;
    if (thumbUrl && mime.startsWith("image/jpeg") && isLikelyPhoto(thumbUrl) && width >= 800 && height >= 400) {
      return thumbUrl;
    }
  }
  return null;
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
    if (!cached.url) return new NextResponse(null, { status: 404 });
    return NextResponse.redirect(cached.url);
  }

  let imageUrl: string | null = null;

  // 1. Try Wikipedia article images — exact title match (best for well-known cities)
  const wikiQueries = [
    name,
    country ? `${name}, ${country}` : null,
  ].filter(Boolean) as string[];

  for (const q of wikiQueries) {
    imageUrl = await fetchWikipediaImage(q);
    if (imageUrl) break;
  }

  // 2. Try Wikipedia search with adaptive suffixes (landscape works for islands/regions, skyline for cities)
  if (!imageUrl) {
    const suffixes = ["landscape", "scenic view", "city skyline", "panoramic"];
    for (const suffix of suffixes) {
      const searchTerms = country ? `${name} ${country} ${suffix}` : `${name} ${suffix}`;
      imageUrl = await fetchWikipediaSearchImage(searchTerms);
      if (imageUrl) break;
    }
  }

  // 3. Fall back to Wikimedia Commons — prefer photography-focused queries
  if (!imageUrl) {
    imageUrl = await fetchCommonsImage(`${name} landscape photograph`);
  }

  // 4. Try Commons with just the name
  if (!imageUrl) {
    imageUrl = await fetchCommonsImage(name);
  }

  // 5. Try Commons with country for more specificity
  if (!imageUrl && country) {
    imageUrl = await fetchCommonsImage(`${name} ${country} scenic`);
  }

  CACHE.set(cacheKey, { url: imageUrl, ts: Date.now() });

  if (!imageUrl) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.redirect(imageUrl);
}
