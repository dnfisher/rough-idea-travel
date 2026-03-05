# Destination Page Improvements v2

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix image quality, events relevance, stats layout, and phase 2 speed on the destination detail page.

**Architecture:** Five tasks. Task 1 (Phase 2 collapse) must complete before Task 2 (page UI). Tasks 3–5 are independent.

**Branch:** `feat/form-redesign`

---

## Context

Key files:
- `src/lib/ai/prompts.ts` — system prompts including `DESTINATION_DETAIL_NDJSON_NO_ITINERARY_SYSTEM_PROMPT`
- `src/lib/hooks/useDetailStream.ts` — NDJSON stream consumer
- `src/app/destination/[slug]/DestinationDetailPage.tsx` — main page
- `src/components/results/BookingLinks.tsx` — booking section
- `src/app/api/destination-image/route.ts` — hero image
- `src/app/api/explore/detail/route.ts` — Phase 2 API

Phase 1 summary already contains: `reasoning`, `topActivities`, `weather`, `estimatedDailyCostEur`, `suggestedDuration`, `bestTimeToVisit`. Phase 2 "quick" section regenerates these redundantly. Only unique Phase 2 additions are: **pros, cons, localInsights, localEvents, booking data**.

---

### Task 1: Collapse Phase 2 from 3 sections to 2

**Files:**
- Modify: `src/lib/ai/prompts.ts`
- Modify: `src/lib/hooks/useDetailStream.ts`

**Goal:** Replace the 3-section `overview` prompt (quick + insights + booking) with a 2-section prompt (overview + booking). The new `overview` section merges pros/cons + insights + events into one faster generation.

**Step 1: Update `DESTINATION_DETAIL_NDJSON_NO_ITINERARY_SYSTEM_PROMPT` in prompts.ts**

Replace the existing 3-section prompt with this 2-section version:

```typescript
export const DESTINATION_DETAIL_NDJSON_NO_ITINERARY_SYSTEM_PROMPT = `You are a travel planning expert. Generate a trip overview for a single destination.

CRITICAL: Respond with EXACTLY 2 JSON objects, each on its own line (NDJSON format). No markdown, no code fences, no explanation. Just 2 raw JSON lines in this exact order:

LINE 1 — type "overview" (pros, cons, local insights, events — output this first):
{"type":"overview","pros":["string"],"cons":["string"],"localInsights":[{"category":"string","insight":"string"}],"localEvents":[{"name":"string","date":"string","description":"string","type":"festival|cultural|music|food|sports|religious|market"}]}

LINE 2 — type "booking" (output this last):
{"type":"booking","accommodation":{"averageNightlyEur":number,"recommendedArea":"string","nearestAirportCode":"string","nearestAirportName":"string"}|null,"flightEstimate":{"roundTripEur":number,"fromAirportCode":"string","toAirportCode":"string"}|null,"drivingEstimate":{"estimatedGasCostEur":number,"estimatedTotalDriveKm":number,"estimatedDriveHours":number,"startingPoint":"string"}|null,"estimatedTotalTripCostEur":number|null}

Guidelines:
- Complete each JSON line fully before starting the next
- pros/cons: 3-4 each, honest assessment
- localInsights: 3-4 items (categories: Food & Drink, Customs, Language, Getting Around, Money, Hidden Gems, Local Tips). 1-2 sentences each
- localEvents: events/festivals that occur WITHIN or within 2 weeks of the user's travel dates. Events must be in the future relative to today. 2-3 items maximum.
- accommodation.averageNightlyEur: mid-range nightly EUR rate
- For flying trips: include flightEstimate with nearest IATA airport codes
- For road trips: include drivingEstimate. If route is 4-5+ hours from home, also include flightEstimate
- estimatedTotalTripCostEur: based on nightly rate, transport, and daily expenses
- Numeric cost fields always in EUR
- Be concise`;
```

**Step 2: Update `useDetailStream.ts`**

The hook currently handles: `quick`, `itinerary`, `insights`, `booking`. Add a handler for the new `overview` type and keep the others for backward compatibility (pre-loaded data may use old format):

In the `processLine` function, add after the `booking` handler:
```typescript
} else if (type === "overview") {
  // New 2-section format: overview merges pros/cons + insights + events
  setDetail((prev) => ({ ...prev, ...data }));
}
```

The `...data` spread will add `pros`, `cons`, `localInsights`, `localEvents` to the detail state — same shape as before, just arriving in one section.

**Step 3: Commit**

```bash
git add src/lib/ai/prompts.ts src/lib/hooks/useDetailStream.ts
git commit -m "perf: collapse Phase 2 to 2 sections (overview+booking), remove redundant quick section"
```

---

### Task 2: Stats cleanup + gallery reposition in DestinationDetailPage

**Files:**
- Modify: `src/app/destination/[slug]/DestinationDetailPage.tsx`

**Changes:**

#### 2a. Update `hasQuick` and `hasInsights` flags

The new `overview` section sends pros/cons + insights together. Update the guards:

```typescript
// Old:
const hasQuick = !!(detail?.pros?.length);
const hasInsights = !!(detail?.localInsights?.length);

// New:
const hasOverview = !!(detail?.pros?.length || detail?.localInsights?.length);
```

Remove `hasQuick` and `hasInsights` variables. Replace all 4 usages in JSX:
- `hasQuick ? (pros/cons JSX) : detailLoading ? <ProsConsSkeleton /> : null`
  → `hasOverview ? (pros/cons JSX) : detailLoading ? <ProsConsSkeleton /> : null`
- `hasInsights ? (localInsights JSX) : detailLoading ? <InsightsSkeleton /> : null`
  → `hasOverview ? (localInsights JSX) : detailLoading ? <InsightsSkeleton /> : null`
- `hasInsights && destination.localEvents?.length > 0 ? (events JSX)`
  → `hasOverview && destination.localEvents && destination.localEvents.length > 0 ? (events JSX)`

#### 2b. Stats grid — reduce to 4 cards

Replace the entire stats grid block with exactly 4 cards (single row on sm:grid-cols-4):

```tsx
{/* Quick stats — 4 cards, single row */}
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
  {destination.estimatedDailyCostEur != null && (
    <div className="rounded-xl border border-border p-3 text-center">
      <p className="text-sm font-medium">~{formatPrice(destination.estimatedDailyCostEur, currency)}/day</p>
      <p className="text-xs text-muted-foreground">Daily cost</p>
    </div>
  )}
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
</div>
```

Remove: `estimatedTotalTripCostEur` stat card (moving back to BookingLinks), sunshine hours card.

#### 2c. Gallery — move to after reasoning section

Current order: reasoning → What's Happening → Top Activities → Weather → Local Insights → Pros & Cons → Gallery → Itinerary CTA → Booking

New order: reasoning → **Gallery** → What's Happening → Top Activities → Weather → Local Insights → Pros & Cons → Itinerary CTA → Booking

Cut the `{/* Gallery */}` block and paste it immediately after the `{/* Why — editorial lead section */}` block.

**Step 4: Verify**

Run: `npm run build 2>&1 | tail -20` — fix any TypeScript errors.

**Commit:**
```bash
git add src/app/destination/[slug]/DestinationDetailPage.tsx
git commit -m "fix: 4-card stats row, gallery after reasoning, use hasOverview for 2-section stream"
```

---

### Task 3: Restore total cost in BookingLinks

**Files:**
- Modify: `src/components/results/BookingLinks.tsx`

Total cost was removed in a previous task. Now that it's no longer in the stats grid, restore it in BookingLinks.

**Step 1: Re-add `Calculator` import**

Add `Calculator` back to the lucide-react import line.

**Step 2: Re-add `totalCost` variable**

```typescript
const totalCost = destination.estimatedTotalTripCostEur;
```

**Step 3: Update early return guard**

```typescript
if (!accommodation && !flight && !driving && totalCost == null) return null;
```

**Step 4: Add total cost display block back**

Inside the returned JSX, after the `<h3>Book Your Trip</h3>` heading, add:

```tsx
{/* Total cost estimate */}
{totalCost != null && (
  <div className="rounded-xl bg-accent/50 border border-border p-4 flex items-center gap-3">
    <Calculator className="h-5 w-5 text-primary flex-shrink-0" />
    <div>
      <p className="font-medium text-sm">Estimated Total: ~{formatPrice(totalCost, currency)}</p>
      <p className="text-xs text-muted-foreground">
        {isFlyAndDrive
          ? "Flights + car hire fuel + accommodation + daily expenses"
          : isRoadTrip
          ? "Gas + accommodation + daily expenses"
          : "Flights + accommodation + daily expenses"}
      </p>
    </div>
  </div>
)}
```

**Commit:**
```bash
git add src/components/results/BookingLinks.tsx
git commit -m "fix: restore total cost display in BookingLinks"
```

---

### Task 4: Events prompt — inject dates + require future events

**Files:**
- Modify: `src/lib/ai/prompts.ts`
- Modify: `src/lib/ai/prompts.ts` (the `buildDetailPrompt` function)

**Goal:** Events must be future and within the user's travel window.

**Step 1: Read the `buildDetailPrompt` function** (it's in prompts.ts, around line 220+)

Add today's date to the prompt context. Find where the prompt string is constructed and inject:

```typescript
const today = new Date().toISOString().split("T")[0]; // e.g. "2026-03-04"
```

Then in the prompt string passed to the model, add this line to the trip context section:
```
Today's date: ${today}
```

Also ensure the travel dates are surfaced in the prompt — the `TripInput.dates` object already gets included via `buildPreferenceParts()`. Verify it includes start/end dates or description.

**Step 2: Strengthen the events guideline in the 2-section prompt**

In `DESTINATION_DETAIL_NDJSON_NO_ITINERARY_SYSTEM_PROMPT`, the events guideline currently reads:
```
- localEvents: events/festivals that occur WITHIN or within 2 weeks of the user's travel dates...
```

The guidelines already include this from Step 1 of Task 1. But also update the `DESTINATION_DETAIL_NDJSON_SYSTEM_PROMPT` (4-section / full mode) and `DESTINATION_ITINERARY_ONLY_SYSTEM_PROMPT` to add the same events constraint. The `DESTINATION_ITINERARY_ONLY_SYSTEM_PROMPT` doesn't have events, so only update the 4-section prompt.

In `DESTINATION_DETAIL_NDJSON_SYSTEM_PROMPT`, find the localEvents guideline:
```
- localEvents: 2-3 events/festivals during or near travel dates
```
Replace with:
```
- localEvents: 2-3 events/festivals that occur WITHIN the user's travel dates or within 2 weeks before/after. Events must be after today's date (provided in the user prompt). Never invent past events.
```

**Step 3: Verify `buildDetailPrompt` injects today's date**

Read the full `buildDetailPrompt` function. It likely calls `buildPreferenceParts(input)` which formats the TripInput. Find where the output is assembled into the final prompt string. Add `Today's date: ${today}` as a line in the context block.

**Commit:**
```bash
git add src/lib/ai/prompts.ts
git commit -m "fix: inject today's date into detail prompt, require future events within travel dates"
```

---

### Task 5: Image quality — higher resolution + better query strategy

**Files:**
- Modify: `src/app/api/destination-image/route.ts`
- Modify: `src/app/api/destination-gallery/route.ts` (minor)

**Goal:** Get more scenic hero images and higher resolution.

**Step 1: Increase hero resolution to 1600px**

In `fetchGooglePlacesPhoto`, change the default `maxWidthPx` parameter from `1200` to `1600`.

**Step 2: Improve hero image query strategy**

In the route handler, change the query strategy for Google Places:

Currently:
```typescript
const queries = [
  country ? `${name}, ${country}` : name,
  country ? `${name} ${country} scenic destination` : `${name} scenic destination`,
];
```

Replace with a strategy that biases toward scenic/landmark photos:
```typescript
const queries = [
  // Most specific scenic query first — targets tourist attractions and landmarks
  country ? `${name} ${country} landmark tourist attraction` : `${name} landmark tourist attraction`,
  // Fallback with just destination name
  country ? `${name}, ${country}` : name,
];
```

**Step 3: Try photos[1] before photos[0] for hero**

In `fetchGooglePlacesPhoto`, after getting the photos array, use photos[1] if available (index 1 tends to be more scenic/outdoor than index 0 which is the most-clicked/popular photo):

```typescript
const photos = searchData?.places?.[0]?.photos;
if (!photos || photos.length === 0) return null;

// photos[1] tends to be more scenic/outdoor than photos[0] (most-clicked, often interiors)
// Fall back to photos[0] if only one photo exists
const targetPhoto = photos.length > 1 ? photos[1] : photos[0];
const photoName = targetPhoto.name;
```

**Step 4: Increase gallery thumbnail resolution**

In `destination-gallery/route.ts`, change `maxWidthPx` default from `800` to `1000` for crisper gallery thumbnails.

**Commit:**
```bash
git add src/app/api/destination-image/route.ts src/app/api/destination-gallery/route.ts
git commit -m "fix: increase image resolution, improve query for scenic photos, prefer photos[1] for hero"
```

---

## Testing checklist

1. `npm run build` passes
2. Perform a search with specific dates → destination page:
   - Stats row shows exactly 4 cards (daily cost, dates, duration, best time) in a single row
   - Gallery appears immediately after the editorial "Why" section
   - Total cost appears in "Book Your Trip" section at bottom
3. Phase 2 stream: pros/cons and local insights now appear together (same section)
4. Events show upcoming dates relevant to the travel window
5. Hero image is sharp (not pixellated) at full width
6. "Generate itinerary" button still works (itinerary_only mode unchanged)
