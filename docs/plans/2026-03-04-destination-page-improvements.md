# Destination Page Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the destination detail page with deferred itinerary loading (cost savings), image gallery, editorial "Why" section, reordered sections, date range in header, and total cost in stats.

**Architecture:** Six independent improvements to `DestinationDetailPage.tsx`, plus two new files (gallery API + gallery component). The deferred itinerary requires a prompt variant + new hook. All changes are on the existing `feat/form-redesign` branch.

**Tech Stack:** Next.js App Router, React, Tailwind CSS v4, Vercel AI SDK `streamText`, Google Places API (New), NextAuth v5 session

---

## Context for each task

The destination detail page lives at `src/app/destination/[slug]/DestinationDetailPage.tsx` (598 lines). It loads via two phases:
- **Phase 1**: summary data from `sessionStorage` (immediate, stored as `ctx.summary`)
- **Phase 2**: streaming NDJSON from `/api/explore/detail` — 4 sections: `quick`, `itinerary`, `insights`, `booking`

The stream is consumed by `src/lib/hooks/useDetailStream.ts`. The API route is `src/app/api/explore/detail/route.ts`. Prompts live in `src/lib/ai/prompts.ts`.

Section order in current page (lines 354–591):
1. Quick stats grid (daily cost, duration, best time, sunshine)
2. Reasoning ("Why this destination?")
3. Pros & Cons
4. Top Activities
5. Weather
6. Local Insights
7. What's Happening (local events)
8. Route Map
9. Itinerary Timeline
10. Booking Links (includes total cost)

---

### Task 1: Prompt variant + API — defer itinerary to on-demand

**Files:**
- Modify: `src/lib/ai/prompts.ts`
- Modify: `src/app/api/explore/detail/route.ts`

**Context:** The NDJSON system prompt instructs Claude to output exactly 4 lines. We need a 3-line variant that omits `itinerary`. The detail route accepts a body JSON object validated by `DetailRequestSchema` (Zod).

**Step 1: Add 3-section prompt variant to prompts.ts**

After the existing `DESTINATION_DETAIL_NDJSON_SYSTEM_PROMPT` constant (ends around line 107), add:

```typescript
// Phase 2: NDJSON streaming prompt — 3 sections only (no itinerary).
// Used for initial page load; itinerary fetched on demand separately.
export const DESTINATION_DETAIL_NDJSON_NO_ITINERARY_SYSTEM_PROMPT = `You are a travel planning expert. Generate a trip overview for a single destination.

CRITICAL: Respond with EXACTLY 3 JSON objects, each on its own line (NDJSON format). No markdown, no code fences, no explanation. Just 3 raw JSON lines in this exact order:

LINE 1 — type "quick" (output this first — fastest to generate):
{"type":"quick","name":"string","country":"string","coordinates":{"lat":number,"lng":number},"reasoning":"string","matchScore":number,"pros":["string"],"cons":["string"],"topActivities":["string"],"weather":{"destination":"string","avgHighC":number,"avgLowC":number,"rainyDays":number,"sunshineHours":number,"description":"string"},"estimatedDailyCostEur":number,"suggestedDuration":"string","bestTimeToVisit":"string"}

LINE 2 — type "insights":
{"type":"insights","localInsights":[{"category":"string","insight":"string"}],"localEvents":[{"name":"string","date":"string","description":"string","type":"festival|cultural|music|food|sports|religious|market"}]}

LINE 3 — type "booking" (output this last):
{"type":"booking","accommodation":{"averageNightlyEur":number,"recommendedArea":"string","nearestAirportCode":"string","nearestAirportName":"string"}|null,"flightEstimate":{"roundTripEur":number,"fromAirportCode":"string","toAirportCode":"string"}|null,"drivingEstimate":{"estimatedGasCostEur":number,"estimatedTotalDriveKm":number,"estimatedDriveHours":number,"startingPoint":"string"}|null,"estimatedTotalTripCostEur":number|null}

Guidelines:
- Complete each JSON line fully before starting the next
- matchScore: 0-100
- pros/cons: 3-4 each, honest assessment
- topActivities: top 3-4 most relevant
- weather: realistic averages for the specified travel dates
- accommodation.averageNightlyEur: mid-range nightly EUR rate
- For flying trips: include flightEstimate with nearest IATA airport codes
- For road trips: include drivingEstimate. If route is 4-5+ hours from home, also include flightEstimate
- localInsights: 3-4 items (categories: Food & Drink, Customs, Language, Getting Around, Money, Hidden Gems, Local Tips). 1-2 sentences each
- localEvents: 2-3 events/festivals during or near travel dates
- estimatedTotalTripCostEur: based on nightly rate, transport, and daily expenses
- Numeric cost fields always in EUR. Use user's preferred currency in free-text descriptions
- Be concise throughout`;
```

Also export a prompt for itinerary-only requests (3 lines becomes 1 itinerary line):

```typescript
// Phase 2: Itinerary-only NDJSON prompt — outputs exactly 1 JSON line.
// Called when the user explicitly requests itinerary generation.
export const DESTINATION_ITINERARY_ONLY_SYSTEM_PROMPT = `You are a travel planning expert. Generate a detailed day-by-day itinerary for a single destination.

CRITICAL: Respond with EXACTLY 1 JSON object on a single line. No markdown, no code fences. Just the raw JSON:

{"type":"itinerary","totalDays":number,"totalDriveTimeHours":number|null,"totalDistanceKm":number|null,"days":[{"dayNumber":number,"location":"string","coordinates":{"lat":number,"lng":number},"highlights":["string"],"driveTimeFromPrevious":"string"|null,"driveDistanceKm":number|null,"overnightStay":"string","meals":["string"]|null,"tips":"string"|null}],"estimatedTotalCostEur":number|null,"packingTips":["string"]|null,"practicalTips":["string"]|null}

Guidelines:
- Day-by-day itinerary with GPS coordinates for each stop
- Drive times realistic. Max 4-5 hours daily driving for road trips
- packingTips: 3 items. practicalTips: 3 items
- meals: 1 specific restaurant/dish recommendation per meal (brief)
- tips: 1 concise sentence per day
- Be concise throughout`;
```

**Step 2: Modify detail route to accept `includeItinerary` param**

In `src/app/api/explore/detail/route.ts`, update `DetailRequestSchema`:

```typescript
const DetailRequestSchema = z.object({
  destinationName: z.string(),
  country: z.string(),
  tripInput: TripInputSchema,
  includeItinerary: z.boolean().default(false),
});
```

Import the new prompts:

```typescript
import {
  DESTINATION_DETAIL_NDJSON_SYSTEM_PROMPT,
  DESTINATION_DETAIL_NDJSON_NO_ITINERARY_SYSTEM_PROMPT,
  DESTINATION_ITINERARY_ONLY_SYSTEM_PROMPT,
  buildDetailPrompt,
} from "@/lib/ai/prompts";
```

Switch system prompt based on `includeItinerary`:

```typescript
const { destinationName, country, tripInput, includeItinerary } = DetailRequestSchema.parse(body);

const systemPrompt = includeItinerary
  ? DESTINATION_DETAIL_NDJSON_SYSTEM_PROMPT          // 4 sections (legacy / fallback)
  : DESTINATION_DETAIL_NDJSON_NO_ITINERARY_SYSTEM_PROMPT; // 3 sections (default)
```

Wait — actually, for the itinerary-only case we need a different prompt. Add a second request schema variant or a `mode` field:

Better approach — add `mode: 'overview' | 'itinerary_only'` to the schema:

```typescript
const DetailRequestSchema = z.object({
  destinationName: z.string(),
  country: z.string(),
  tripInput: TripInputSchema,
  mode: z.enum(['overview', 'itinerary_only', 'full']).default('overview'),
});
```

Then:
```typescript
const systemPrompt =
  mode === 'itinerary_only' ? DESTINATION_ITINERARY_ONLY_SYSTEM_PROMPT
  : mode === 'full' ? DESTINATION_DETAIL_NDJSON_SYSTEM_PROMPT
  : DESTINATION_DETAIL_NDJSON_NO_ITINERARY_SYSTEM_PROMPT;
```

**Step 3: Commit**

```bash
git add src/lib/ai/prompts.ts src/app/api/explore/detail/route.ts
git commit -m "feat: add itinerary-deferred mode to detail API"
```

---

### Task 2: useItineraryStream hook — on-demand itinerary fetch

**Files:**
- Create: `src/lib/hooks/useItineraryStream.ts`

**Context:** `useDetailStream.ts` is a one-shot hook (won't re-fetch once started). We need a new hook that's manually triggered (not auto-started on mount) and only processes `itinerary` lines from the stream.

**Step 1: Write the hook**

```typescript
"use client";

import { useState, useRef, useCallback } from "react";
import type { DeepPartial } from "ai";
import type { DestinationSuggestion, TripInput } from "@/lib/ai/schemas";

export interface ItineraryStreamResult {
  itinerary: DeepPartial<DestinationSuggestion>["itinerary"] | null;
  isStreaming: boolean;
  error: Error | null;
  fetch: () => void;
}

/**
 * On-demand itinerary fetch. Call `fetch()` to trigger the stream.
 * Only processes the "itinerary" NDJSON line from the detail API.
 */
export function useItineraryStream(
  name: string | undefined,
  country: string | undefined,
  tripInput: TripInput | undefined
): ItineraryStreamResult {
  const [itinerary, setItinerary] = useState<DeepPartial<DestinationSuggestion>["itinerary"] | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetchedRef = useRef(false);

  const fetch = useCallback(() => {
    if (!name || !country || !tripInput || fetchedRef.current) return;
    fetchedRef.current = true;

    const controller = new AbortController();
    setIsStreaming(true);
    setError(null);

    (async () => {
      try {
        const res = await globalThis.fetch("/api/explore/detail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destinationName: name, country, tripInput, mode: "itinerary_only" }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error || `Request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const processLine = (line: string) => {
          const trimmed = line.trim();
          if (!trimmed) return;
          try {
            const section = JSON.parse(trimmed) as Record<string, unknown>;
            const { type, ...data } = section;
            if (type === "itinerary") {
              setItinerary({ destinationName: name, ...(data as object) } as DeepPartial<DestinationSuggestion>["itinerary"]);
            }
          } catch {
            // skip malformed lines
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) processLine(line);
        }
        if (buffer.trim()) processLine(buffer);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err : new Error(String(err)));
        fetchedRef.current = false; // allow retry on error
      } finally {
        setIsStreaming(false);
      }
    })();
  }, [name, country, tripInput]);

  return { itinerary, isStreaming, error, fetch };
}
```

**Step 2: Commit**

```bash
git add src/lib/hooks/useItineraryStream.ts
git commit -m "feat: add useItineraryStream hook for on-demand itinerary"
```

---

### Task 3: Gallery API endpoint

**Files:**
- Create: `src/app/api/destination-gallery/route.ts`

**Context:** `src/app/api/destination-image/route.ts` already has `fetchGooglePlacesPhoto` which calls the Places text search and returns a single photo. The Places text search response `searchData.places[0].photos` is an array — we just need to iterate it.

This new endpoint returns `{ photos: string[] }` JSON (up to 5 photo URLs). No redirect — direct JSON response so the component can load all images.

**Step 1: Write the endpoint**

```typescript
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
      } else {
        urls.push(mediaUrl);
      }
    }
    return urls;
  } catch {
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
```

**Step 2: Commit**

```bash
git add src/app/api/destination-gallery/route.ts
git commit -m "feat: add destination gallery API returning multiple Google Places photos"
```

---

### Task 4: DestinationGallery component

**Files:**
- Create: `src/components/results/DestinationGallery.tsx`

**Context:** Shows a horizontally scrollable strip of photos. Fetches from `/api/destination-gallery`. Shows shimmer placeholder while loading. If no photos, renders nothing (component is optional).

**Step 1: Write the component**

```typescript
"use client";

import { useEffect, useState } from "react";

interface DestinationGalleryProps {
  name: string;
  country?: string;
  searchName?: string;
}

export function DestinationGallery({ name, country, searchName }: DestinationGalleryProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = searchName ?? name;
    const params = new URLSearchParams({ name: query });
    if (country) params.set("country", country);

    fetch(`/api/destination-gallery?${params}`)
      .then((r) => r.json())
      .then((data: { photos?: string[] }) => setPhotos(data.photos ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [name, country, searchName]);

  if (!loading && photos.length === 0) return null;

  return (
    <div>
      <h2 className="font-display font-semibold text-base mb-3">Gallery</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-48 h-32 rounded-xl animate-shimmer snap-start"
              />
            ))
          : photos.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${name} photo ${i + 1}`}
                className="flex-shrink-0 w-48 h-32 rounded-xl object-cover snap-start"
                loading="lazy"
              />
            ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/results/DestinationGallery.tsx
git commit -m "feat: add DestinationGallery component with horizontal scroll"
```

---

### Task 5: DestinationDetailPage — all UI changes

This is the main task. Apply all 6 UI improvements to `DestinationDetailPage.tsx`.

**Files:**
- Modify: `src/app/destination/[slug]/DestinationDetailPage.tsx`

**Changes (apply in order):**

#### 5a. Add imports
Add at the top of imports:
```typescript
import { DestinationGallery } from "@/components/results/DestinationGallery";
import { useItineraryStream } from "@/lib/hooks/useItineraryStream";
import { useSession } from "next-auth/react";
```
Add lucide icons: `MapPin` (for date display).

#### 5b. Add state + hooks inside component

After existing hooks (around line 136), add:
```typescript
const { data: session } = useSession();
const isAuthenticated = !!session?.user?.id;

const {
  itinerary: streamedItinerary,
  isStreaming: itineraryStreaming,
  error: itineraryError,
  fetch: fetchItinerary,
} = useItineraryStream(
  ctx?.summary.name,
  ctx?.summary.country ?? "",
  ctx?.tripInput
);
```

Update `hasItinerary` to also check the on-demand itinerary:
```typescript
const hasItinerary = !!(detail?.itinerary?.days?.length) || !!(streamedItinerary?.days?.length);
const itineraryData = streamedItinerary ?? detail?.itinerary;
```

#### 5c. Format date range from tripInput

Add a helper near the top of the component (after line 210):
```typescript
const tripDateLabel = useMemo(() => {
  const dates = ctx?.tripInput?.dates;
  if (!dates) return null;
  if (!dates.flexible && dates.startDate && dates.endDate) {
    const fmt = (d: string) => {
      try {
        const [year, month, day] = d.split("-").map(Number);
        return new Date(year, month - 1, day).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      } catch { return d; }
    };
    return `${fmt(dates.startDate)} – ${fmt(dates.endDate)}`;
  }
  if (dates.flexible && dates.description) return dates.description;
  return null;
}, [ctx]);
```

#### 5d. Quick stats grid — add date + total cost cards

Replace the quick stats grid (lines 354–382) with a version that adds date and total cost:

```tsx
{/* Quick stats */}
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
  {destination.estimatedDailyCostEur != null && (
    <div className="rounded-xl border border-border p-3 text-center">
      <p className="text-sm font-medium">~{formatPrice(destination.estimatedDailyCostEur, currency)}/day</p>
      <p className="text-xs text-muted-foreground">Daily cost</p>
    </div>
  )}
  {destination.estimatedTotalTripCostEur != null ? (
    <div className="rounded-xl border border-border p-3 text-center">
      <p className="text-sm font-medium">~{formatPrice(destination.estimatedTotalTripCostEur, currency)}</p>
      <p className="text-xs text-muted-foreground">Est. trip total</p>
    </div>
  ) : detailLoading ? (
    <div className="rounded-xl border border-border p-3 h-16 animate-shimmer" />
  ) : null}
  {tripDateLabel && (
    <div className="rounded-xl border border-border p-3 text-center">
      <CalendarDays className="h-4 w-4 mx-auto mb-1 text-primary" />
      <p className="text-sm font-medium truncate">{tripDateLabel}</p>
      <p className="text-xs text-muted-foreground">Your dates</p>
    </div>
  )}
  {destination.suggestedDuration && (
    <div className="rounded-xl border border-border p-3 text-center">
      <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
      <p className="text-sm font-medium">{destination.suggestedDuration}</p>
      <p className="text-xs text-muted-foreground">Suggested</p>
    </div>
  )}
  {destination.bestTimeToVisit && (
    <div className="rounded-xl border border-border p-3 text-center">
      <CalendarDays className="h-4 w-4 mx-auto mb-1 text-primary" />
      <p className="text-sm font-medium">{destination.bestTimeToVisit}</p>
      <p className="text-xs text-muted-foreground">Best time</p>
    </div>
  )}
  {destination.weather?.sunshineHours != null && (
    <div className="rounded-xl border border-border p-3 text-center">
      <Sun className="h-4 w-4 mx-auto mb-1 text-primary" />
      <p className="text-sm font-medium">{destination.weather.sunshineHours}h sun</p>
      <p className="text-xs text-muted-foreground">Daily average</p>
    </div>
  )}
</div>
```

Note: When `tripDateLabel` is shown, `bestTimeToVisit` can be removed from stats to avoid duplication. Keep both if trip is flexible; the AI's "best time" is still useful context.

#### 5e. Editorial "Why this destination" section (replace lines 384–390)

```tsx
{/* Why — editorial lead section */}
{destination.reasoning && (
  <div className="py-2">
    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Why we picked this</p>
    <p className="text-lg sm:text-xl leading-relaxed text-foreground font-light">
      {destination.reasoning}
    </p>
  </div>
)}
```

#### 5f. Reorder sections

New order after stats + reasoning:
1. What's Happening (local events) ← **moved up**
2. Top Activities
3. Weather
4. Local Insights
5. Pros & Cons ← **moved down**
6. Gallery (new)
7. Route Map
8. Itinerary CTA (deferred — replaces inline itinerary)
9. Booking Links

Move the Local Events block (currently lines 525–560) to appear immediately after the reasoning section. Move Pros & Cons (lines 392–432) to after Local Insights.

#### 5g. Add gallery after Pros & Cons

```tsx
{/* Gallery */}
{destination.name && (
  <DestinationGallery
    name={destination.name}
    country={stableCountry}
    searchName={imageSearchName}
  />
)}
```

#### 5h. Replace inline itinerary with on-demand CTA section

Remove the existing itinerary skeleton + inline render. Replace with:

```tsx
{/* Itinerary — deferred / on-demand */}
{itineraryData?.days?.length ? (
  // Itinerary was generated — show it
  <>
    {mapMarkers.length > 0 && (
      <div>
        <h2 className="font-display font-semibold text-base mb-2">Route</h2>
        <ExploreMap markers={mapMarkers} selectedId={null} showRoute={true} height={350} />
      </div>
    )}
    <ItineraryTimeline itinerary={itineraryData} />
  </>
) : (
  // Itinerary not yet fetched — show CTA
  <div className="rounded-2xl border border-border bg-accent/30 p-6 text-center space-y-3">
    <h3 className="font-display font-semibold text-base">Want a day-by-day itinerary?</h3>
    <p className="text-sm text-muted-foreground">
      Generate a personalised sample itinerary for this trip, including route map, accommodation areas, and meal suggestions.
    </p>
    {isAuthenticated ? (
      <button
        onClick={fetchItinerary}
        disabled={itineraryStreaming}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {itineraryStreaming ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating itinerary…
          </>
        ) : (
          "Generate my itinerary"
        )}
      </button>
    ) : (
      <a
        href={`/auth/signin?callbackUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Sign in to generate itinerary
      </a>
    )}
    {itineraryError && (
      <p className="text-xs text-destructive">Failed to generate itinerary. Please try again.</p>
    )}
  </div>
)}
```

Also remove the separate Route Map block that currently precedes itinerary (lines 562–575) — it's now inside the itinerary section above.

**Step 2: Verify no TypeScript errors**

Run: `npm run build 2>&1 | tail -20`

**Step 3: Commit**

```bash
git add src/app/destination/[slug]/DestinationDetailPage.tsx
git commit -m "feat: editorial reasoning, deferred itinerary CTA, reorder sections, date range + total cost in stats, image gallery"
```

---

### Task 6: Remove `estimatedTotalTripCostEur` from BookingLinks (avoid duplication)

**Files:**
- Modify: `src/components/results/BookingLinks.tsx`

**Context:** Total cost now shown in the stats grid at the top. No need to show it again in BookingLinks. But keep the breakdown description (flights + accommodation + daily expenses) as it adds context.

Remove the "Estimated Total" block (lines 73–88 in BookingLinks.tsx):
```tsx
{/* Total cost estimate */}
{totalCost != null && (
  <div className="rounded-xl bg-accent/50 border border-border p-4 flex items-center gap-3">
    ...
  </div>
)}
```

Also remove the `totalCost` variable declaration if no longer used.

**Step 2: Commit**

```bash
git add src/components/results/BookingLinks.tsx
git commit -m "refactor: remove total cost from BookingLinks (now shown in stats)"
```

---

## Testing checklist

After all tasks:

1. Dev server starts: `npm run dev`
2. Perform a search → click a destination → page opens in new tab
3. Stats grid shows: daily cost + (loading skeleton for total cost) + your dates + suggested duration
4. Total cost appears when booking section streams in
5. "Why we picked this" renders as large editorial text, immediately visible
6. What's Happening appears above Pros & Cons
7. Gallery shows 4–5 photos in horizontal scroll strip
8. Itinerary CTA section shows at bottom (not auto-loaded)
9. Clicking "Generate my itinerary" streams in the itinerary
10. Unauthenticated user sees "Sign in to generate itinerary" link instead
11. Route map appears after itinerary generates
12. `npm run build` passes with no TypeScript errors

---

## Efficiency summary (for the record)

| Mode | Approx output tokens | Cost @ $15/MTok |
|------|---------------------|-----------------|
| Old (always 4 sections) | ~6000–9000 | $0.09–$0.14/search |
| New overview (3 sections) | ~1600–2500 | $0.024–$0.038/search |
| On-demand itinerary | ~3500–7000 | $0.052–$0.105/search |

Browse-only sessions (user doesn't click generate): **~70% cost reduction**
