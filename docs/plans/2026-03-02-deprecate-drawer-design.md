# Deprecate Drawer (DestinationDetailSheet) Design

**Date:** 2026-03-02

## Goal

Replace the right-hand drawer (`DestinationDetailSheet`) used in the favorites and wishlist pages with the same new-tab navigation pattern already used by the main explore flow. When a user opens a destination from favorites or a wishlist, it opens in a new browser tab at `/destination/[slug]` with the saved detail data available immediately (no Phase 2 API call needed).

---

## Architecture

### What changes

**`src/lib/destination-url.ts`** — Extend `DestinationPageContext`:
- Add `detail?: DeepPartial<DestinationSuggestion>` — carries full Phase 2 data when available
- Make `tripInput` optional (`tripInput?: TripInput`) — favorites may not have the original trip input

**`src/app/destination/[slug]/DestinationDetailPage.tsx`** — Conditionally skip Phase 2 fetch:
- If `ctx.detail` is present, initialize the detail state from it and skip the `fetchDetail` call
- Show a "Refresh" button/banner only when `ctx.detail` is present AND `ctx.tripInput` is available (needed for re-fetch)
- Refresh clears detail state and re-fetches via the normal Phase 2 path

**3 client files** — Remove drawer, add new-tab navigation:
- `src/app/favorites/FavoritesClient.tsx`
- `src/app/favorites/[listId]/WishlistDetailClient.tsx`
- `src/app/wishlist/[shareId]/SharedWishlistClient.tsx`

Each file currently maintains `selectedDestination` state and renders `<DestinationDetailSheet>`. Replace with: `slugify(name)` → build `DestinationPageContext` → `storeDestinationContext` → `window.open('/destination/${slug}', '_blank')`.

**`src/components/results/DestinationDetailSheet.tsx`** — Add `@deprecated` JSDoc. No deletion (safe deprecation).

### What does NOT change

- The main explore flow (`ResultsPanel`) — already uses new-tab pattern
- The `useDetailFetch` hook — unchanged
- Phase 2 API route — unchanged
- All test files — no changes needed

---

## Data Flow

### Opening a destination from favorites/wishlist

```
User clicks destination card
  → slugify(destination.name)
  → Build DestinationPageContext:
      summary: {
        name: destination.name,
        country: destination.country,
        // mapped fields from DestinationSuggestion
      }
      detail: destination  // full DestinationSuggestion from DB
      tripInput: undefined  // not available from favorites
      imageSearchName: destination.imageSearchName ?? destination.name
      stableCountry: destination.country
  → storeDestinationContext(slug, context)
  → window.open(`/destination/${slug}`, '_blank')
```

### Detail page behaviour

```
Mount:
  → getDestinationContext(slug) → ctx

if ctx.detail present:
  → Initialize detail state with ctx.detail
  → Skip fetchDetail() call
  → Show "Refresh" button if ctx.tripInput is also present

if ctx.detail absent (normal explore flow):
  → fetchDetail() as before (no change)

User clicks Refresh:
  → Clear detail state
  → Call fetchDetail(name, country, ctx.tripInput)
  → Hide Refresh button
```

### Drawer removal

- Remove `selectedDestination` state from the 3 client files
- Remove `<DestinationDetailSheet>` import and usage
- Remove any handler functions that set drawer state
- No other state changes (favorites toggle, list management etc. are unaffected)

---

## Error Handling

- `storeDestinationContext` already silently catches `sessionStorage` quota errors — no change needed
- If `ctx.detail` is present but malformed, the detail page will render with whatever partial data it has (same as current streaming partial-data behavior)
- Refresh button hidden when `tripInput` is absent, so the re-fetch path is never offered when it can't work

---

## Testing

- Unit tests for `destination-url.ts` already cover `storeDestinationContext` / `getDestinationContext` — no new tests needed there
- The 3 modified client files have no unit tests currently — no new tests required for this change
- `DestinationDetailPage` has no tests currently — no new tests required
- Manually verify: open a destination from favorites → new tab opens → detail shows instantly → Refresh button absent (no tripInput from favorites)
