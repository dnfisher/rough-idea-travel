# Homepage Copy Redesign + Showcase Destinations Design

**Date:** 2026-03-05
**Status:** Approved

## Goal

Third pass on the homepage: replace hero copy, refine typography, fix subtext legibility, replace feature cards with a three-section below-fold layout, and introduce a self-populating showcase destinations system.

## Constraints

- Do not change video cycling logic, nav behaviour, routing, or non-homepage components
- Global design tokens and font imports unchanged
- Headline copy exactly: "Your next trip, / planned in three questions."

---

## Part 1: Showcase Destinations System

### Overview

A self-populating table of destinations that users have clicked through to view. Used on the homepage "Popular Trips" row and available for use elsewhere.

### Database

New table `showcase_destinations` in `src/lib/db/schema.ts`:

```ts
export const showcaseDestinations = pgTable('showcase_destinations', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  name: text('name').notNull(),
  country: text('country'),
  slug: text('slug').notNull().unique(),
  imageUrl: text('image_url'),          // proxy URL e.g. /api/destination-image?name=X&country=Y
  viewedAt: timestamp('viewed_at', { mode: 'date' }).defaultNow().notNull(),
});
```

Migration file: `src/lib/db/migrations/0002_add_showcase_destinations.sql`

### Image URL Strategy

Store the `/api/destination-image?name=X&country=Y` proxy URL — NOT the raw Google Places signed URL. The proxy URL is permanent, routes through the server-side cache, and never expires. This means:
- Homepage serves showcase cards with zero Google API calls (cache hit)
- URL never goes stale

### API Routes

**`POST /api/showcase`** — upserts a destination into the showcase.
- No auth required (additive-only, low risk)
- Zod validates: `{ name: string, country?: string, slug: string, imageUrl?: string }`
- Upserts on `slug` conflict, updates `viewedAt` to keep popular destinations fresh
- Returns `{ ok: true }`

**`GET /api/showcase`** — returns the 8 most recently viewed destinations.
- No auth required, public
- Returns: `Array<{ name, country, slug, imageUrl }>`
- Ordered by `viewedAt DESC`, limit 8

### Trigger Point

In `src/app/destination/[slug]/DestinationDetailPage.tsx`, add a `useEffect` that fires on mount once `destination.name` is available (from Phase 1 sessionStorage context). Constructs the proxy image URL client-side:

```ts
const imageUrl = `/api/destination-image?name=${encodeURIComponent(name)}${country ? `&country=${encodeURIComponent(country)}` : ''}`;
```

Then fires `POST /api/showcase` as fire-and-forget (no await, no error handling that blocks the page).

---

## Part 2: Homepage Changes

### Files Changed

| File | Change |
|------|--------|
| `src/app/page.tsx` | New copy, typography, 3 below-fold sections, showcase fetch |
| `src/app/globals.css` | New CSS: step flow, destination teaser cards, trust line |
| `src/lib/db/schema.ts` | Add `showcaseDestinations` table |
| `src/lib/db/migrations/0002_add_showcase_destinations.sql` | Migration |
| `src/app/api/showcase/route.ts` | GET + POST handlers |
| `src/app/destination/[slug]/DestinationDetailPage.tsx` | Fire-and-forget showcase POST on mount |
| `e2e/landing.spec.ts` | Update tests for new copy |

### Hero Copy

**Headline:**
- Line 1: "Your next trip," — Clash Display, `#F2EEE8`
- Line 2: "planned in three questions." — Clash Display, teal→orange→warm-grey gradient

**Subtext (single paragraph):**
"Tell us when, how far, and what you're into. We'll find where you should go — matched to the weather, your budget, and a full day-by-day itinerary."

**CTA:** "Start Exploring →" — unchanged

### Headline Typography

```css
font-size: clamp(44px, 6vw, 80px);
font-weight: 400;
line-height: 1.08;
letter-spacing: -0.02em;
text-shadow: 0 2px 32px rgba(0, 0, 0, 0.5);
max-width: 880px;
```

Gradient span carries `letter-spacing: -0.02em` explicitly (browser inheritance unreliable through background-clip). No `text-shadow` on gradient span.

### Subtext

```css
font-size: 17px;
font-weight: 400;
color: rgba(242, 238, 232, 0.82);
line-height: 1.7;
letter-spacing: 0.01em;
max-width: 500px;
margin-top: 20px;
text-shadow: 0 1px 24px rgba(0, 0, 0, 0.75);
```

### Section A — How It Works

Three-step horizontal flow replacing feature cards. Steps in CSS `.step` class with connector line via `::after`. Icons from Lucide. Step numbers colored teal/orange/warm-grey.

| | Step 1 | Step 2 | Step 3 |
|--|--|--|--|
| Icon | MessageSquare (teal) | MapPin (orange) | Calendar (warm-grey) |
| Number | STEP 01 (teal) | STEP 02 (orange) | STEP 03 (warm-grey) |
| Title | "Tell us your rough idea" | "We find your destinations" | "Get your full itinerary" |

Section padding: `100px 24px`. Max-width 1080px centered.

### Section B — Popular Trips

Homepage fetches `GET /api/showcase` on mount via `useEffect`. Results stored in state.

- While loading: 8 skeleton cards (`--color-bg-elevated`, shimmer animation from globals.css)
- Loaded: photo cards with gradient overlay, name + country, hover "Explore →" pill
- Zero results: section hidden entirely
- Card size: `flex: 0 0 260px`, `height: 180px`, `border-radius: 14px`
- Horizontal scroll, scrollbar hidden
- Section background: `--color-bg-subtle` for visual break
- Section padding: `80px 0 80px 24px` (right edge bleeds)

### Section C — Trust Line

```css
text-align: center;
padding: 64px 24px 80px;
border-top: 1px solid var(--color-border);
```

Text: "Free to use. No account needed to explore." (DM Sans 15px/400, `--color-text-muted`)
Below: second "Start Exploring →" CTA button.

### Page Structure

1. Hero — cycling video + new copy
2. How It Works (Section A)
3. Popular Trips (Section B) — hidden if empty
4. Trust line + CTA (Section C)

---

## Open Items

- `showcaseDestinations` table needs `drizzle-kit push` or migration applied to production DB
- Section B will show skeleton then nothing until first real destination clicks accumulate
