# Homepage Copy Redesign + Showcase Destinations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace hero copy and below-fold feature cards with a three-section layout, refine typography, and introduce a self-populating showcase destinations system that saves destination data on detail page view and serves it on the homepage.

**Architecture:** New `showcase_destinations` DB table (Drizzle/PostgreSQL) stores destination name, country, slug, and image proxy URL whenever a user views a detail page. A `GET /api/showcase` endpoint serves the 8 most recent to the homepage. The homepage is a single `"use client"` component that fetches on mount and renders a horizontal scrolling card row. All other homepage changes (copy, typography, below-fold sections) are in `src/app/page.tsx` and `src/app/globals.css`.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM + PostgreSQL, Zod, Vitest, Playwright E2E, Lucide React.

**Design doc:** `docs/plans/2026-03-05-homepage-copy-redesign-design.md`

---

### Task 1: Add showcaseDestinations to DB schema + migration

**Files:**
- Modify: `src/lib/db/schema.ts`
- Create: `src/lib/db/migrations/0002_add_showcase_destinations.sql`

**Context:** The schema file already imports `pgTable`, `text`, `timestamp` from `drizzle-orm/pg-core` and `nanoid` from `nanoid`. Migrations live in `src/lib/db/migrations/` numbered sequentially. Existing migrations: `0000_init.sql`, `0001_add_rls.sql`.

**Step 1: Read the current schema file**

Read `src/lib/db/schema.ts` to understand the existing pattern, then append the new table definition at the end:

```ts
// ─── Showcase Destinations ─────────────────────────────────────────────

export const showcaseDestinations = pgTable("showcase_destinations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  country: text("country"),
  slug: text("slug").notNull().unique(),
  imageUrl: text("image_url"),
  viewedAt: timestamp("viewed_at", { mode: "date" }).defaultNow().notNull(),
});
```

**Step 2: Create the migration file**

Create `src/lib/db/migrations/0002_add_showcase_destinations.sql`:

```sql
CREATE TABLE "showcase_destinations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"country" text,
	"slug" text NOT NULL,
	"image_url" text,
	"viewed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "showcase_destinations_slug_unique" UNIQUE("slug")
);
```

**Step 3: TypeScript check**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && npx tsc --noEmit 2>&1 | grep -E "^src/lib/db" | head -10
```

Expected: no errors from `schema.ts`.

**Step 4: Commit**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && git add src/lib/db/schema.ts src/lib/db/migrations/0002_add_showcase_destinations.sql && git commit -m "feat: add showcase_destinations table to schema and migration"
```

---

### Task 2: Create /api/showcase route (GET + POST) with tests

**Files:**
- Create: `src/app/api/showcase/route.ts`
- Create: `src/__tests__/integration/api-showcase.test.ts`

**Context:** Integration tests follow the pattern in `src/__tests__/integration/api-share.test.ts` — mock `@/lib/db` with a Proxy, import route handlers directly, use `new Request(...)`. The `db` mock uses a chainable proxy so `db.insert(...).values(...).onConflictDoUpdate(...)` all chain without setup. Route files export named `GET` and `POST` functions.

**Step 1: Write the failing tests**

Create `src/__tests__/integration/api-showcase.test.ts`:

```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const dbMock = vi.hoisted(() => {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {}
  return new Proxy(mock, {
    get(target, prop) {
      if (!(prop in target)) target[prop as string] = vi.fn().mockReturnThis()
      return target[prop as string]
    },
  })
})
vi.mock('@/lib/db', () => ({ db: dbMock }))

import { GET, POST } from '@/app/api/showcase/route'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/showcase', () => {
  it('returns 200 with an array', async () => {
    dbMock.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            { name: 'Lisbon', country: 'Portugal', slug: 'lisbon-portugal', imageUrl: '/api/destination-image?name=Lisbon' },
          ]),
        }),
      }),
    })
    const req = new Request('http://localhost/api/showcase')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
    expect(json[0].name).toBe('Lisbon')
  })

  it('returns empty array when table is empty', async () => {
    dbMock.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    })
    const req = new Request('http://localhost/api/showcase')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual([])
  })
})

describe('POST /api/showcase', () => {
  it('returns 400 when name is missing', async () => {
    const req = new Request('http://localhost/api/showcase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'lisbon-portugal' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when slug is missing', async () => {
    const req = new Request('http://localhost/api/showcase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Lisbon' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 and upserts on valid payload', async () => {
    dbMock.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
      }),
    })
    const req = new Request('http://localhost/api/showcase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Lisbon',
        country: 'Portugal',
        slug: 'lisbon-portugal',
        imageUrl: '/api/destination-image?name=Lisbon&country=Portugal',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && npm test -- --run src/__tests__/integration/api-showcase.test.ts 2>&1 | tail -20
```

Expected: FAIL — `Cannot find module '@/app/api/showcase/route'`

**Step 3: Create the route**

Create `src/app/api/showcase/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { showcaseDestinations } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

const PostSchema = z.object({
  name: z.string().min(1).max(200),
  country: z.string().max(100).optional(),
  slug: z.string().min(1).max(300),
  imageUrl: z.string().max(2000).optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const rows = await db
      .select()
      .from(showcaseDestinations)
      .orderBy(desc(showcaseDestinations.viewedAt))
      .limit(8);

    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { name, country, slug, imageUrl } = parsed.data;

    await db
      .insert(showcaseDestinations)
      .values({ name, country, slug, imageUrl, viewedAt: new Date() })
      .onConflictDoUpdate({
        target: showcaseDestinations.slug,
        set: { viewedAt: new Date() },
      });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && npm test -- --run src/__tests__/integration/api-showcase.test.ts 2>&1 | tail -20
```

Expected: all tests PASS.

**Step 5: Commit**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && git add src/app/api/showcase/route.ts src/__tests__/integration/api-showcase.test.ts && git commit -m "feat: add GET/POST /api/showcase route with tests"
```

---

### Task 3: Trigger showcase save from DestinationDetailPage

**Files:**
- Modify: `src/app/destination/[slug]/DestinationDetailPage.tsx`

**Context:** The detail page reads Phase 1 context from sessionStorage via `getDestinationContext(slug)` and stores it in `ctx` state (set in a `useEffect` at line ~239). `ctx.summary.name` and `ctx.summary.country` are available once `ctx` is non-null. The trigger should fire once per destination mount — use `useEffect` with `[ctx?.summary.name]` as the dep so it fires once when name becomes available.

Image proxy URL format: `/api/destination-image?name=ENCODED_NAME&country=ENCODED_COUNTRY`

**Step 1: Read lines 218–280 of DestinationDetailPage.tsx** to confirm the exact state variable names and hook positions.

**Step 2: Add the showcase fire-and-forget effect**

Find the block of `useEffect` hooks near the top of the component (after the `ctx` useEffect, before the gallery useEffect). Insert this new `useEffect`:

```ts
  // Fire-and-forget: record this destination in the showcase on first view
  useEffect(() => {
    if (!ctx?.summary.name) return;
    const name = ctx.summary.name;
    const country = ctx.summary.country ?? "";
    const params = new URLSearchParams({ name });
    if (country) params.set("country", country);
    const imageUrl = `/api/destination-image?${params.toString()}`;
    // No await — never block the page for this
    fetch("/api/showcase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, country: country || undefined, slug, imageUrl }),
    }).catch(() => {/* silent — showcase is non-critical */});
  }, [ctx?.summary.name, slug]);
```

**Step 3: TypeScript check**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && npx tsc --noEmit 2>&1 | grep "DestinationDetailPage" | head -10
```

Expected: no errors.

**Step 4: Commit**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && git add src/app/destination/[slug]/DestinationDetailPage.tsx && git commit -m "feat: fire-and-forget showcase save on destination detail view"
```

---

### Task 4: Add below-fold CSS to globals.css

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Read the end of globals.css** to find the insertion point (after the `.feature-card:hover` block added in the previous session).

**Step 2: Append the following CSS block at the very end of globals.css:**

```css

/* ── Homepage: How It Works steps ───────────────────────── */
.steps-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 0;
  width: 100%;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
  flex: 1;
  padding: 0 24px;
  position: relative;
}

.step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 24px;
  right: -50%;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, #2E2B25, transparent);
}

@media (max-width: 768px) {
  .steps-row {
    flex-direction: column;
    gap: 48px;
  }
  .step:not(:last-child)::after {
    display: none;
  }
}

/* ── Homepage: Destination Teaser Cards ─────────────────── */
.destination-teaser-row {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: none;
}

.destination-teaser-row::-webkit-scrollbar {
  display: none;
}

.destination-teaser-card {
  flex: 0 0 260px;
  height: 180px;
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
  background: #252219;
}

.destination-teaser-card:hover {
  transform: scale(1.02);
}

.destination-teaser-card__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(15, 14, 13, 0.85) 0%, transparent 55%);
  z-index: 1;
}

.destination-teaser-card__explore {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  background: rgba(42, 191, 191, 0.9);
  color: #0F0E0D;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  padding: 4px 12px;
  opacity: 0;
  transition: opacity 0.15s ease;
  pointer-events: none;
}

.destination-teaser-card:hover .destination-teaser-card__explore {
  opacity: 1;
}

.destination-teaser-card__info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 14px;
  z-index: 2;
}

/* ── Homepage: Trust Line ────────────────────────────────── */
.trust-line {
  text-align: center;
  padding: 64px 24px 80px;
  border-top: 1px solid #2E2B25;
}
```

**Step 3: Verify no CSS syntax errors**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && npm run build 2>&1 | grep -i "css\|error" | head -10
```

Expected: no CSS parse errors.

**Step 4: Commit**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && git add src/app/globals.css && git commit -m "feat: add homepage below-fold CSS — steps, teaser cards, trust line"
```

---

### Task 5: Rewrite page.tsx

**Files:**
- Modify: `src/app/page.tsx`

**Context:** Current `page.tsx` is a `"use client"` component with nav scroll detection, `HeroVideoBackground`, headline, subtext, CTA, feature cards. We're replacing the headline/subtext copy, adjusting typography, and replacing the feature cards section with three new sections. The nav, video component, and routing are unchanged.

**Step 1: Read the current page.tsx** in full to understand all the inline style constants and structure.

**Step 2: Write the new page.tsx** — use the Write tool to replace the entire file:

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { MessageSquare, MapPin, Calendar, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { HeroVideoBackground } from '@/components/homepage/HeroVideoBackground';

const CLASH: React.CSSProperties = {
  fontFamily: "'Clash Display', system-ui, sans-serif",
};

const HEADLINE_GRADIENT: React.CSSProperties = {
  background: 'linear-gradient(90deg, #2ABFBF 0%, #E8833A 55%, #C4A882 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const STEPS = [
  {
    icon: MessageSquare,
    color: '#2ABFBF',
    number: 'STEP 01',
    title: 'Tell us your rough idea',
    body: 'When, how far, who\'s coming, and what kind of trip you\'re after. Three quick steps.',
  },
  {
    icon: MapPin,
    color: '#E8833A',
    number: 'STEP 02',
    title: 'We find your destinations',
    body: 'AI-matched trips ranked by how well they fit you — with real weather data, cost estimates, and local knowledge.',
  },
  {
    icon: Calendar,
    color: '#C4A882',
    number: 'STEP 03',
    title: 'Get your full itinerary',
    body: 'Day-by-day plans with routes, stays, restaurants, and things to do. Book directly from the app.',
  },
];

interface ShowcaseDestination {
  name: string;
  country: string | null;
  slug: string;
  imageUrl: string | null;
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [showcase, setShowcase] = useState<ShowcaseDestination[] | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetch('/api/showcase')
      .then(r => r.json())
      .then(data => setShowcase(Array.isArray(data) ? data : []))
      .catch(() => setShowcase([]));
  }, []);

  return (
    <div className="homepage" style={{ minHeight: '100vh', background: '#0F0E0D' }}>

      {/* Nav */}
      <nav className={`homepage-nav${scrolled ? ' scrolled' : ''}`}>
        <span style={{ ...CLASH, fontSize: 20, fontWeight: 500, color: '#F2EEE8', letterSpacing: '0.02em' }}>
          ROUGH IDEA<span style={{ color: '#E8833A' }}>.</span>
        </span>
        <Link
          href="/explore"
          style={{
            background: '#2ABFBF',
            color: '#0F0E0D',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.02em',
            borderRadius: 10,
            padding: '9px 20px',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Start Exploring
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingBottom: '12vh' }}>
        <HeroVideoBackground />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 880, padding: '0 24px' }}>
          <h1 style={{
            ...CLASH,
            fontSize: 'clamp(44px, 6vw, 80px)',
            fontWeight: 400,
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            margin: 0,
            textShadow: '0 2px 32px rgba(0,0,0,0.5)',
          }}>
            <span style={{ color: '#F2EEE8', display: 'block' }}>Your next trip,</span>
            <span style={{ ...HEADLINE_GRADIENT, letterSpacing: '-0.02em', display: 'block' }}>
              planned in three questions.
            </span>
          </h1>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 17,
            fontWeight: 400,
            color: 'rgba(242, 238, 232, 0.82)',
            lineHeight: 1.7,
            letterSpacing: '0.01em',
            textAlign: 'center',
            maxWidth: 500,
            margin: '20px auto 0',
            textShadow: '0 1px 24px rgba(0,0,0,0.75)',
          }}>
            Tell us when, how far, and what you&apos;re into.
            We&apos;ll find where you should go — matched to the weather,
            your budget, and a full day-by-day itinerary.
          </p>

          <Link
            href="/explore"
            style={{
              background: '#2ABFBF',
              color: '#0F0E0D',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '0.02em',
              borderRadius: 12,
              padding: '15px 32px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 40,
            }}
          >
            Start Exploring →
          </Link>
        </div>

        <div className="scroll-indicator">
          <ChevronDown className="scroll-indicator__icon" size={18} color="#6B6258" />
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            fontWeight: 400,
            color: '#6B6258',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}>
            Scroll
          </span>
        </div>
      </section>

      {/* Section A — How It Works */}
      <section style={{ background: '#0F0E0D', padding: '100px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            color: '#6B6258',
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            textAlign: 'center',
            marginBottom: 56,
          }}>
            HOW IT WORKS
          </p>
          <div className="steps-row">
            {STEPS.map(({ icon: Icon, color, number, title, body }) => (
              <div key={number} className="step">
                <Icon size={28} color={color} />
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  margin: 0,
                }}>
                  {number}
                </p>
                <h3 style={{ ...CLASH, fontSize: 18, fontWeight: 500, color: '#F2EEE8', margin: 0 }}>
                  {title}
                </h3>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 400,
                  color: '#A89F94',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section B — Popular Trips (hidden when empty) */}
      {(showcase === null || showcase.length > 0) && (
        <section style={{ background: '#252219', padding: '80px 0 80px 24px', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 1080, margin: '0 auto 32px', paddingRight: 24 }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: 600,
              color: '#6B6258',
              textTransform: 'uppercase',
              letterSpacing: '0.09em',
              marginBottom: 12,
            }}>
              POPULAR TRIPS
            </p>
            <h2 style={{ ...CLASH, fontSize: 24, fontWeight: 500, color: '#F2EEE8', margin: '0 0 8px' }}>
              Where will you go?
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 400,
              color: '#A89F94',
              margin: 0,
            }}>
              A few trips people are planning right now.
            </p>
          </div>

          <div className="destination-teaser-row">
            {showcase === null
              ? /* Loading skeletons */
                Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="destination-teaser-card animate-shimmer"
                    style={{ flexShrink: 0 }}
                  />
                ))
              : showcase.map(dest => (
                  <Link
                    key={dest.slug}
                    href="/explore"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="destination-teaser-card">
                      {dest.imageUrl && (
                        <img
                          src={dest.imageUrl}
                          alt={dest.name}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      )}
                      <div className="destination-teaser-card__overlay" />
                      <span className="destination-teaser-card__explore">Explore →</span>
                      <div className="destination-teaser-card__info">
                        {dest.country && (
                          <p style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 11,
                            fontWeight: 400,
                            color: '#6B6258',
                            margin: '0 0 2px',
                          }}>
                            {dest.country}
                          </p>
                        )}
                        <p style={{
                          ...CLASH,
                          fontSize: 16,
                          fontWeight: 500,
                          color: '#ffffff',
                          margin: 0,
                        }}>
                          {dest.name}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
            }
          </div>
        </section>
      )}

      {/* Section C — Trust line */}
      <div className="trust-line">
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15,
          fontWeight: 400,
          color: '#6B6258',
          margin: '0 0 24px',
        }}>
          Free to use. No account needed to explore.
        </p>
        <Link
          href="/explore"
          style={{
            background: '#2ABFBF',
            color: '#0F0E0D',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '0.02em',
            borderRadius: 12,
            padding: '15px 32px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          Start Exploring →
        </Link>
      </div>

    </div>
  );
}
```

**Step 3: TypeScript check**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && npx tsc --noEmit 2>&1 | grep "page.tsx" | head -10
```

Expected: no errors.

**Step 4: Commit**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && git add src/app/page.tsx && git commit -m "feat: homepage copy redesign — new headline, steps section, popular trips, trust line"
```

---

### Task 6: Update E2E tests

**Files:**
- Modify: `e2e/landing.spec.ts`

**Context:** The headline copy changed from "Got a rough idea?" to "Your next trip,". The existing E2E test for headline text will fail.

**Step 1: Read e2e/landing.spec.ts**

**Step 2: Update the headline assertion test**

Find the `'hero headline is present'` test and change the asserted text:

```ts
test('hero headline is present', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Your next trip,')).toBeVisible()
  await expect(page.getByText('planned in three questions.')).toBeVisible()
})
```

All other tests remain unchanged (CTAs still say "Start Exploring", routing unchanged).

**Step 3: Commit**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && git add e2e/landing.spec.ts && git commit -m "test: update E2E headline assertions for new homepage copy"
```

---

### Task 7: Verify production build + full test run

**Step 1: Run unit + integration tests**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && npm run test:run 2>&1 | tail -20
```

Expected: all tests pass except the pre-existing `api-explore.test.ts` ESM issue (unrelated to this work). New `api-showcase.test.ts` should show all passing.

**Step 2: Run production build**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && npm run build 2>&1 | tail -20
```

Expected: build succeeds, no TypeScript errors, no CSS errors.

**Step 3: Apply the DB migration to local dev DB (if running locally)**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main" && npx drizzle-kit push 2>&1 | tail -10
```

This applies `0002_add_showcase_destinations.sql` to the local Postgres DB so the showcase API works at runtime. If the DB isn't running locally, skip this — the migration file is committed for production deployment.

---

## Production Deployment Note

Before going live, apply the migration to the production database:
```bash
npx drizzle-kit push
```
Or run the SQL directly:
```sql
CREATE TABLE "showcase_destinations" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "country" text,
  "slug" text NOT NULL,
  "image_url" text,
  "viewed_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "showcase_destinations_slug_unique" UNIQUE("slug")
);
```
