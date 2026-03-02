# Deprecate Drawer (DestinationDetailSheet) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the right-hand drawer used in favorites and wishlist pages with new-tab navigation to `/destination/[slug]`, passing the saved Phase 2 detail data through sessionStorage so the detail page renders instantly without a network fetch.

**Architecture:** Extend `DestinationPageContext` with an optional `detail` field carrying full Phase 2 data. Three client pages (FavoritesClient, WishlistDetailClient, SharedWishlistClient) that currently open a drawer on card click will instead call `storeDestinationContext` then `window.open`. The detail page skips the Phase 2 API fetch when `ctx.detail` is pre-loaded, and shows a Refresh button (only when `tripInput` is also available) to re-fetch on demand.

**Tech Stack:** TypeScript, Next.js App Router, `DeepPartial` from `ai` package, `sessionStorage` via existing `destination-url.ts` helpers.

---

## Context for the implementer

This is the **rough-idea-travel** app (`/Users/dave/Rough Idea Travel/rough-idea-travel-github`). Work on the branch `test/add-test-suite`. Run `npm run test:run` after each task to confirm unit tests still pass (82 tests, all green). There are no unit tests for the UI components being modified — just confirm the build succeeds with `npm run build`.

Key paths:
- `src/lib/destination-url.ts` — defines `DestinationPageContext` interface and `storeDestinationContext` / `getDestinationContext` helpers
- `src/app/destination/[slug]/DestinationDetailPage.tsx` — full-page destination detail (new tab)
- `src/app/favorites/FavoritesClient.tsx` — favorites page, currently uses drawer
- `src/app/favorites/[listId]/WishlistDetailClient.tsx` — wishlist detail page, currently uses drawer
- `src/app/wishlist/[shareId]/SharedWishlistClient.tsx` — shared (public) wishlist page, currently uses drawer
- `src/components/results/DestinationDetailSheet.tsx` — the drawer component being deprecated

---

### Task 1: Extend DestinationPageContext with optional `detail` and optional `tripInput`

**Files:**
- Modify: `src/lib/destination-url.ts`

**Background:** `DestinationPageContext` is the shape stored in `sessionStorage` to pass Phase 1 summary data to the detail page. We're extending it to optionally carry full Phase 2 data (a `DestinationSuggestion`) and making `tripInput` optional so favorites pages (which don't have the original search input) can also build the context.

**Current file** (`src/lib/destination-url.ts`):
```typescript
import type { DeepPartial } from "ai";
import type { DestinationSummary, TripInput } from "@/lib/ai/schemas";

export interface DestinationPageContext {
  tripInput: TripInput;
  summary: DeepPartial<DestinationSummary>;
  imageSearchName?: string;
  stableCountry?: string;
  rank?: number;
  isRecommended?: boolean;
}
```

**Step 1: Update the import line**

Change:
```typescript
import type { DestinationSummary, TripInput } from "@/lib/ai/schemas";
```
To:
```typescript
import type { DestinationSuggestion, DestinationSummary, TripInput } from "@/lib/ai/schemas";
```

**Step 2: Update the interface**

Change:
```typescript
export interface DestinationPageContext {
  tripInput: TripInput;
  summary: DeepPartial<DestinationSummary>;
  imageSearchName?: string;
  stableCountry?: string;
  rank?: number;
  isRecommended?: boolean;
}
```
To:
```typescript
export interface DestinationPageContext {
  tripInput?: TripInput;
  summary: DeepPartial<DestinationSummary>;
  detail?: DeepPartial<DestinationSuggestion>;
  imageSearchName?: string;
  stableCountry?: string;
  rank?: number;
  isRecommended?: boolean;
}
```

**Step 3: Run unit tests**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-github"
npm run test:run
```

Expected: 82 tests pass. The existing `destination-url` unit tests cover `storeDestinationContext` and `getDestinationContext` — they should still pass since we only added optional fields.

**Step 4: Commit**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-github"
git add src/lib/destination-url.ts
git commit -m "feat: extend DestinationPageContext with optional detail and tripInput"
```

---

### Task 2: Update DestinationDetailPage to use pre-loaded detail and show Refresh button

**Files:**
- Modify: `src/app/destination/[slug]/DestinationDetailPage.tsx`

**Background:** This page currently always fires a Phase 2 API fetch (`/api/explore/detail`) as soon as `ctx` is available from sessionStorage. After this task, it will skip that fetch when `ctx.detail` is pre-loaded, displaying the data instantly. A "Refresh" button will appear (only if `ctx.tripInput` is also set) to let the user trigger a fresh fetch manually.

**Step 1: Add `usePreloaded` state**

In `DestinationDetailPage`, after the existing state declarations (around line 139, after `const [favoriteId, setFavoriteId] = useState<string | null>(null);`), add:

```typescript
// Track whether we're displaying pre-loaded Phase 2 data (no fetch needed)
const [usePreloaded, setUsePreloaded] = useState(true);
```

**Step 2: Replace the Phase 2 fetch useEffect**

The current useEffect (lines 152–193) fetches unconditionally when `ctx` is set. Replace it with this version that skips the fetch when `ctx.detail` is present and `usePreloaded` is true:

```typescript
// Fetch Phase 2 detail once we have context (skipped if pre-loaded)
useEffect(() => {
  if (!ctx) return;

  // Use pre-loaded Phase 2 data if available (e.g. opened from favorites)
  if (ctx.detail && usePreloaded) {
    setDetail(ctx.detail);
    return;
  }

  // Need both name and tripInput to fetch Phase 2
  const name = ctx.summary.name;
  const country = ctx.summary.country ?? "";
  if (!name || !ctx.tripInput) return;

  const controller = new AbortController();
  setDetailLoading(true);
  setDetailError(null);

  fetch("/api/explore/detail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      destinationName: name,
      country,
      tripInput: ctx.tripInput,
    }),
    signal: controller.signal,
  })
    .then((res) => {
      if (!res.ok) {
        return res.json().then(
          (body) => { throw new Error(body.error || `Request failed (${res.status})`); },
          () => { throw new Error(`Request failed (${res.status})`); }
        );
      }
      return res.json();
    })
    .then((data: DeepPartial<DestinationSuggestion>) => {
      setDetail(data);
      setDetailLoading(false);
    })
    .catch((err) => {
      if (err.name === "AbortError") return;
      setDetailError(err instanceof Error ? err : new Error(String(err)));
      setDetailLoading(false);
    });

  return () => controller.abort();
}, [ctx, usePreloaded]);
```

**Step 3: Add `showRefresh` computed value**

After the `hasPhase2` constant (currently `const hasPhase2 = !!detail;`, around line 230), add:

```typescript
const showRefresh = usePreloaded && !!ctx?.detail && !!ctx?.tripInput;
```

**Step 4: Add Refresh banner in the JSX**

In the content section (inside `<div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">`), add a Refresh banner **after** the error block (after the `{detailError && !detailLoading && ...}` block, before the Quick stats grid). Insert:

```tsx
{/* Refresh banner — shown when displaying pre-loaded saved data */}
{showRefresh && (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <span>Showing saved data.</span>
    <button
      onClick={() => setUsePreloaded(false)}
      className="text-primary hover:underline"
    >
      Refresh
    </button>
  </div>
)}
```

**Step 5: Clean up unused imports**

On the import line (line 26):
```typescript
import type { DestinationSuggestion, DestinationSummary, TripInput } from "@/lib/ai/schemas";
```

`DestinationSummary` and `TripInput` are no longer referenced directly in this file. Change to:
```typescript
import type { DestinationSuggestion } from "@/lib/ai/schemas";
```

**Step 6: Verify build**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-github"
npm run build
```

Expected: Clean build, no TypeScript errors.

**Step 7: Run tests**

```bash
npm run test:run
```

Expected: 82 tests pass.

**Step 8: Commit**

```bash
git add src/app/destination/\[slug\]/DestinationDetailPage.tsx
git commit -m "feat: skip Phase 2 fetch when pre-loaded detail is available, add Refresh button"
```

---

### Task 3: Update FavoritesClient to open destination in new tab

**Files:**
- Modify: `src/app/favorites/FavoritesClient.tsx`

**Background:** This page shows a grid of uncategorized favorites. Clicking a card currently sets `detailName` state, which opens a `DestinationDetailSheet` drawer. After this task, clicking a card stores the destination context in sessionStorage and opens `/destination/[slug]` in a new tab.

**Step 1: Update imports**

Current imports (lines 1–11):
```typescript
import { useState } from "react";
import { Heart, Compass, Plus, ChevronDown, ChevronUp, Share2, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { DestinationDetailSheet } from "@/components/results/DestinationDetailSheet";
import { DestinationImage } from "@/components/results/DestinationImage";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { UserButton } from "@/components/auth/UserButton";
import { cn } from "@/lib/utils";
```

Change to:
```typescript
import { useState } from "react";
import { Heart, Compass, Plus, ChevronDown, ChevronUp, Share2, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { DeepPartial } from "ai";
import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { slugify, storeDestinationContext } from "@/lib/destination-url";
import { DestinationImage } from "@/components/results/DestinationImage";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { UserButton } from "@/components/auth/UserButton";
import { cn } from "@/lib/utils";
```

(Remove `DestinationDetailSheet` import, add `DeepPartial`, `slugify`, `storeDestinationContext`.)

**Step 2: Remove drawer state**

Remove these lines from inside `FavoritesClient` (currently around lines 44–53):
```typescript
const [detailName, setDetailName] = useState<string | null>(null);

// Find detail destination from uncategorized
const detailFav = detailName
  ? uncategorized.find((f) => f.destinationName === detailName)
  : null;
const detailDest = detailFav?.destinationData as Partial<DestinationSuggestion> | undefined;
```

**Step 3: Add `openInNewTab` helper**

Add this function inside `FavoritesClient`, after `handleCopyShareLink` and before `const totalSaved = ...`:

```typescript
function openInNewTab(fav: FavoriteRow) {
  const dest = fav.destinationData as DeepPartial<DestinationSuggestion> & { routeStops?: string[] };
  const firstStop = dest?.routeStops?.[0] ?? dest?.itinerary?.days?.[0]?.location;
  const slug = slugify(fav.destinationName);
  storeDestinationContext(slug, {
    summary: { name: fav.destinationName, country: fav.country },
    detail: dest,
    imageSearchName: firstStop ?? fav.destinationName,
    stableCountry: fav.country,
  });
  window.open(`/destination/${slug}`, "_blank");
}
```

**Step 4: Update the card click handler**

Find the card `div` inside the `uncategorized.map()` (currently around line 255):
```tsx
onClick={() => setDetailName(fav.destinationName)}
```
Change to:
```tsx
onClick={() => openInNewTab(fav)}
```

**Step 5: Remove the DestinationDetailSheet JSX**

At the bottom of the component return (currently lines 308–312), remove:
```tsx
{/* Detail sheet */}
<DestinationDetailSheet
  destination={detailDest ?? null}
  onClose={() => setDetailName(null)}
/>
```

**Step 6: Verify build and tests**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-github"
npm run build && npm run test:run
```

Expected: Clean build, 82 tests pass.

**Step 7: Commit**

```bash
git add src/app/favorites/FavoritesClient.tsx
git commit -m "feat: open favorites destination in new tab instead of drawer"
```

---

### Task 4: Update WishlistDetailClient to open destination in new tab

**Files:**
- Modify: `src/app/favorites/[listId]/WishlistDetailClient.tsx`

**Background:** Same pattern as Task 3. This page shows items in a specific wishlist. Clicking a card opens the drawer — replace with new-tab navigation.

**Step 1: Update imports**

Current (lines 1–10):
```typescript
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Share2, Pencil, Check, X, Compass, Heart } from "lucide-react";
import Link from "next/link";
import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { DestinationDetailSheet } from "@/components/results/DestinationDetailSheet";
import { DestinationImage } from "@/components/results/DestinationImage";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { UserButton } from "@/components/auth/UserButton";
```

Change to:
```typescript
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Share2, Pencil, Check, X, Compass, Heart } from "lucide-react";
import Link from "next/link";
import type { DeepPartial } from "ai";
import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { slugify, storeDestinationContext } from "@/lib/destination-url";
import { DestinationImage } from "@/components/results/DestinationImage";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { UserButton } from "@/components/auth/UserButton";
```

**Step 2: Remove drawer state**

Remove these lines (currently around lines 43–53):
```typescript
const [detailName, setDetailName] = useState<string | null>(null);
```
and:
```typescript
const detailFav = detailName
  ? items.find((f) => f.destinationName === detailName)
  : null;
const detailDest = detailFav?.destinationData as Partial<DestinationSuggestion> | undefined;
```

**Step 3: Add `openInNewTab` helper**

Add inside `WishlistDetailClient`, after `handleCopyShareLink` and before `return`:

```typescript
function openInNewTab(fav: FavoriteRow) {
  const dest = fav.destinationData as DeepPartial<DestinationSuggestion> & { routeStops?: string[] };
  const firstStop = dest?.routeStops?.[0] ?? dest?.itinerary?.days?.[0]?.location;
  const slug = slugify(fav.destinationName);
  storeDestinationContext(slug, {
    summary: { name: fav.destinationName, country: fav.country },
    detail: dest,
    imageSearchName: firstStop ?? fav.destinationName,
    stableCountry: fav.country,
  });
  window.open(`/destination/${slug}`, "_blank");
}
```

**Step 4: Update the card click handler**

Find `onClick={() => setDetailName(fav.destinationName)}` (inside `items.map()`, around line 197) and change to:
```tsx
onClick={() => openInNewTab(fav)}
```

**Step 5: Remove the DestinationDetailSheet JSX**

At the bottom (currently lines 244–248), remove:
```tsx
{/* Detail sheet */}
<DestinationDetailSheet
  destination={detailDest ?? null}
  onClose={() => setDetailName(null)}
/>
```

**Step 6: Verify build and tests**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-github"
npm run build && npm run test:run
```

Expected: Clean build, 82 tests pass.

**Step 7: Commit**

```bash
git add "src/app/favorites/[listId]/WishlistDetailClient.tsx"
git commit -m "feat: open wishlist destination in new tab instead of drawer"
```

---

### Task 5: Update SharedWishlistClient to open destination in new tab

**Files:**
- Modify: `src/app/wishlist/[shareId]/SharedWishlistClient.tsx`

**Background:** This is the public-facing shared wishlist page (no auth required). Same pattern as Tasks 3 and 4 — remove drawer, add new-tab navigation.

**Step 1: Update imports**

Current (lines 1–7):
```typescript
import { useState } from "react";
import { Heart, Compass } from "lucide-react";
import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { DestinationDetailSheet } from "@/components/results/DestinationDetailSheet";
import { DestinationImage } from "@/components/results/DestinationImage";
```

Change to:
```typescript
import type { DeepPartial } from "ai";
import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { Heart, Compass } from "lucide-react";
import { slugify, storeDestinationContext } from "@/lib/destination-url";
import { DestinationImage } from "@/components/results/DestinationImage";
```

(No `useState` needed after removing drawer state — remove it entirely from the import.)

**Step 2: Remove drawer state**

Remove these lines from `SharedWishlistClient` (currently lines 28–33):
```typescript
const [detailName, setDetailName] = useState<string | null>(null);

const detailFav = detailName
  ? items.find((f) => f.destinationName === detailName)
  : null;
const detailDest = detailFav?.destinationData as Partial<DestinationSuggestion> | undefined;
```

**Step 3: Add `openInNewTab` helper**

Add inside `SharedWishlistClient`, before `return`:

```typescript
function openInNewTab(fav: FavoriteRow) {
  const dest = fav.destinationData as DeepPartial<DestinationSuggestion> & { routeStops?: string[] };
  const firstStop = dest?.routeStops?.[0] ?? dest?.itinerary?.days?.[0]?.location;
  const slug = slugify(fav.destinationName);
  storeDestinationContext(slug, {
    summary: { name: fav.destinationName, country: fav.country },
    detail: dest,
    imageSearchName: firstStop ?? fav.destinationName,
    stableCountry: fav.country,
  });
  window.open(`/destination/${slug}`, "_blank");
}
```

**Step 4: Update the card click handler**

Find `onClick={() => setDetailName(fav.destinationName)}` (inside `items.map()`, around line 83) and change to:
```tsx
onClick={() => openInNewTab(fav)}
```

**Step 5: Remove the DestinationDetailSheet JSX**

At the bottom (currently lines 108–112), remove:
```tsx
{/* Detail sheet — read-only (no favorite button) */}
<DestinationDetailSheet
  destination={detailDest ?? null}
  onClose={() => setDetailName(null)}
/>
```

Also remove the surrounding `<>` / `</>` fragment wrapper if the JSX now has a single root element — check whether the component return is still wrapped in a fragment. If the `<>` at the top and `</>` at the bottom are the only wrappers, you can either leave the fragment (valid) or remove it if there's a natural single root. Leave as-is if unsure.

**Step 6: Verify build and tests**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-github"
npm run build && npm run test:run
```

Expected: Clean build, 82 tests pass.

**Step 7: Commit**

```bash
git add "src/app/wishlist/[shareId]/SharedWishlistClient.tsx"
git commit -m "feat: open shared wishlist destination in new tab instead of drawer"
```

---

### Task 6: Add @deprecated to DestinationDetailSheet and final verification

**Files:**
- Modify: `src/components/results/DestinationDetailSheet.tsx`

**Background:** `DestinationDetailSheet` is no longer used by any page — it's only referenced from the (now-updated) three client files. We mark it `@deprecated` rather than deleting it, preserving backward compatibility in case any other code references it.

**Step 1: Add JSDoc @deprecated**

In `src/components/results/DestinationDetailSheet.tsx`, find the exported function declaration (currently line 87):
```typescript
export function DestinationDetailSheet({
```

Add a JSDoc comment immediately before it:
```typescript
/**
 * @deprecated Use the new-tab destination detail page (`/destination/[slug]`) instead.
 * Call `storeDestinationContext` then `window.open(\`/destination/\${slug}\`, '_blank')`.
 * This component is kept for reference only and will be removed in a future cleanup.
 */
export function DestinationDetailSheet({
```

**Step 2: Final build and test verification**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-github"
npm run build && npm run test:run
```

Expected: Clean build, 82 tests pass.

**Step 3: Commit**

```bash
git add src/components/results/DestinationDetailSheet.tsx
git commit -m "deprecate: mark DestinationDetailSheet as @deprecated in favour of new-tab detail page"
```

---

## Manual verification checklist

After all tasks are committed, verify the following manually in the browser (run `npm run dev` and open `http://localhost:3000`):

1. Log in with a test account that has saved favorites
2. Navigate to `/favorites`
3. Click a destination card in the uncategorized section → a new tab opens at `/destination/[slug]`
4. The new tab shows destination data instantly (no loading spinner for the main content)
5. No "Refresh" button appears (since favorites don't carry `tripInput`)
6. Navigate to a specific wishlist at `/favorites/[listId]`, click a card → same behaviour
7. Open a shared wishlist at `/wishlist/[shareId]`, click a card → same behaviour
8. Navigate to `/explore`, run a search, click a result → existing new-tab behaviour unchanged
