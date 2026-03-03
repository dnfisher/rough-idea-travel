# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint

# Tests (unit + integration)
npm test              # Vitest in watch mode
npm run test:run      # Vitest — single run (CI)
npm run test:e2e      # Playwright E2E (auto-starts dev server)
npm run test:e2e:ui   # Playwright with interactive UI

# Run a single test file:
npm test -- --run src/__tests__/unit/currency.test.ts
```

Unit and integration tests live in `src/__tests__/`. E2E tests live in `e2e/`.

Database migrations are managed via Drizzle Kit (see `drizzle.config.ts`).

## Architecture

AI-powered travel planning SaaS built on **Next.js App Router** with **PostgreSQL + Drizzle ORM**, **NextAuth v5**, and **Anthropic Claude** (via Vercel AI SDK).

### Two-Phase AI Pipeline

The core feature is a two-phase AI flow in `src/app/api/explore/`:

1. **Phase 1** (`route.ts`): Streams 8–10 destination summaries using `claude-sonnet-4-5-20250929`. Road trips get 12K max tokens vs 8K for standard trips.
2. **Phase 2** (`detail/route.ts`): Fetches full itinerary for a single destination on demand. Results open in a dedicated `/destination/[slug]` page (new tab).

Schemas for both phases live in `src/lib/ai/schemas.ts` (Zod). System prompts are centralized in `src/lib/ai/prompts.ts`.

### Key Architectural Decisions

- **Detail page**: Destinations open in a new browser tab at `/destination/[slug]`. Phase 1 summary data is passed via `sessionStorage` (see `src/lib/destination-url.ts`) so the detail page can render immediately while Phase 2 loads.
- **Road trip vs standard**: The explore API detects road trips from user input and switches prompts, token limits, and response schemas accordingly. Road trips support multi-stop routing (max 4–5 hrs driving/day).
- **Currency**: All AI responses return EUR values in JSON; `src/lib/currency.ts` handles display conversion. Global state via `CurrencyProvider` context (`src/components/CurrencyProvider.tsx`). Default display currency is **USD**. Authenticated users have currency saved server-side via `/api/user/preferences`.
- **Auth gating**: `src/lib/hooks/useSearchGate.ts` gates search behind auth. Session state is preserved across OAuth redirects via `src/lib/auth-persistence.ts` (sessionStorage).
- **Favorites & wishlists**: Authenticated users can save destinations to named lists. See `src/app/api/favorites/` and `src/app/api/wishlists/`.
- **Share**: Any destination detail can be shared via a public URL at `/trip/[id]`. See `src/app/api/share/route.ts`.
- **Destination images**: `src/app/api/destination-image/route.ts` fetches high-quality photos via Google Places API (New).
- **JSONB storage**: Complex destination/trip data is stored as JSONB in Postgres (see `src/lib/db/schema.ts`).

### Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| Database | PostgreSQL + Drizzle ORM |
| Auth | NextAuth v5 (Google + GitHub OAuth) |
| AI | Anthropic Claude via `@ai-sdk/anthropic` |
| Maps | Leaflet + React-Leaflet |
| Validation | Zod throughout |

### Key Paths

| Path | Purpose |
|------|---------|
| `src/lib/ai/schemas.ts` | Zod schemas for all AI input/output |
| `src/lib/ai/prompts.ts` | All Claude system prompts |
| `src/lib/db/schema.ts` | Drizzle table definitions |
| `src/lib/auth.ts` | NextAuth config |
| `src/lib/destination-url.ts` | Slug generation + sessionStorage context for detail page |
| `src/app/api/explore/route.ts` | Phase 1 AI endpoint |
| `src/app/api/explore/detail/route.ts` | Phase 2 AI endpoint |
| `src/app/api/favorites/route.ts` | Favorites CRUD |
| `src/app/api/wishlists/route.ts` | Wishlist CRUD |
| `src/app/api/share/route.ts` | Create shareable trip link |
| `src/app/api/user/preferences/route.ts` | User currency preference |
| `src/app/api/destination-image/route.ts` | Google Places photo proxy |
| `src/app/explore/page.tsx` | Main search UI |
| `src/app/destination/[slug]/` | Destination detail page (new tab) |
| `src/components/results/` | Results panel, map, itinerary, booking |
| `src/components/favorites/` | FavoriteButton, SaveToListModal |
| `src/components/share/` | ShareButton, ShareModal |

### Conventions

- Path alias `@/` maps to `src/`
- Client components use a `Client` suffix (e.g., `DestinationDetailPage`)
- Environment variable for Anthropic: `ROUGH_IDEA_ANTHROPIC_API_KEY`
- Error logging uses `[Rough Idea]` prefix
- `nanoid` for ID generation (10-char share IDs)
- Database foreign keys cascade on user delete
