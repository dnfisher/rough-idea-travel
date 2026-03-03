# Detail Page Performance Design

**Date:** 2026-03-02

## Goal

Eliminate the 10-30 second blank wait on the destination detail page by combining three techniques: NDJSON streaming (progressive section rendering), hover prefetch (start Phase 2 before the user clicks), and auto-prefetch of the top result after Phase 1 completes.

---

## Background & Constraint

Phase 2 currently uses `generateText()` — it waits for the full 16K-token response before returning anything. A previous attempt at `streamObject()`/`generateObject()` with the Zod schema failed with "compiled grammar is too large" from Anthropic's API. The workaround was to describe the JSON schema in the system prompt as plain text. This design keeps that workaround and uses `streamText()` (no schema compilation) with a structured NDJSON output format.

---

## Architecture

Five files change, two are new:

| File | Change |
|------|--------|
| `src/app/api/explore/detail/route.ts` | Switch `generateText` → `streamText`, update prompt to output 4 NDJSON lines, return streaming response |
| `src/lib/ai/prompts.ts` | New NDJSON-based detail system prompt instructing model to output 4 JSON objects on separate lines |
| `src/lib/hooks/useDetailStream.ts` | **New** — reads the NDJSON stream from the API, exposes `{ quick, itinerary, insights, booking }` with per-section loading states |
| `src/lib/hooks/useDetailFetch.ts` | Updated to read the same NDJSON stream internally, assembles and returns a complete merged object (used for hover prefetch caching) |
| `src/app/destination/[slug]/DestinationDetailPage.tsx` | Replace direct fetch with `useDetailStream`; per-section skeletons; skip stream when `ctx.detail` present |
| `src/components/results/ResultsPanel.tsx` | Hover prefetch (300ms debounce on card `mouseenter`); auto-prefetch top result after Phase 1; pass cached detail into `storeDestinationContext` on click |

---

## NDJSON Section Breakdown

The model outputs exactly 4 JSON objects on separate lines, in order from fastest to slowest to generate:

```
{"type":"quick","reasoning":"...","matchScore":"...","pros":[...],"cons":[...],"topActivities":[...],"weather":{...},"estimatedDailyCostEur":...,"suggestedDuration":"...","bestTimeToVisit":"..."}
{"type":"itinerary","totalDays":...,"totalDriveTimeHours":...,"totalDistanceKm":...,"days":[{...}],"estimatedTotalCostEur":...,"packingTips":[...],"practicalTips":[...]}
{"type":"insights","localInsights":[{"category":"...","insight":"..."}],"localEvents":[{"name":"...","date":"...","description":"...","type":"..."}]}
{"type":"booking","accommodation":{...},"flightEstimate":{...},"drivingEstimate":{...},"estimatedTotalTripCostEur":...}
```

---

## Data Flow

### Scenario 1 — Hover then click (instant)
1. User hovers a card for 300ms → `fetchDetail()` starts silently in background via `useDetailFetch`
2. User clicks → `getDetail(name)` has cached data → `storeDestinationContext(slug, { summary, detail: cachedData, tripInput })` → `window.open`
3. Detail page sees `ctx.detail` → renders everything immediately, no network call

### Scenario 2 — Auto-prefetch top result (near-instant for #1)
1. Phase 1 finishes streaming → `fetchDetail()` auto-called for the #1 ranked destination
2. User reads summaries, clicks the top result → already cached → instant render
3. User clicks a different result → falls through to Scenario 3

### Scenario 3 — Direct click, no prefetch (cold path, progressive)
1. User clicks → `storeDestinationContext(slug, { summary, tripInput })` (no detail) → `window.open`
2. Detail page calls `useDetailStream` → POST to `/api/explore/detail`
3. API streams 4 NDJSON lines; client parses each as it completes:
   - Line 1 `quick` (~3-5s): pros/cons, weather, activities, costs render; rest shows skeletons
   - Line 2 `itinerary` (~8-12s): day timeline and map render; insights/booking skeletons remain
   - Line 3 `insights` (~12-18s): local tips and events render; booking skeleton remains
   - Line 4 `booking` (~15-20s): accommodation, flight, driving estimates render

---

## Error Handling

- **Stream interrupted mid-line** — section stays in skeleton state; small "Some details failed to load" banner appears. Already-rendered sections stay visible.
- **Invalid JSON on a line** — silently skip that section, show a "failed to load" note in place of the skeleton. Other sections unaffected.
- **Hover prefetch aborts** — if user clicks before prefetch completes, in-flight request is abandoned and detail page starts its own stream. No duplicate requests.
- **Auto-prefetch on slow connections** — fire-and-forget. If not finished when user clicks, detail page streams from scratch.
- **`ctx.detail` present** — `useDetailStream` does not fire; page renders from sessionStorage data only.
- **No `tripInput`** — `useDetailStream` won't fire (can't re-fetch without tripInput). Page renders from `ctx.detail` only.

---

## Testing

No new unit tests required — hooks have no tests currently. Existing 82 tests pass unchanged. Manual verification covers the three scenarios above.
