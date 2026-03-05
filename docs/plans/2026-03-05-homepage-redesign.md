# Homepage Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the light-themed static homepage with a dark, immersive cycling-video hero, restrained premium typography, frosted-glass nav, and polished feature cards — all consistent with the existing dark design system.

**Architecture:** `page.tsx` becomes a single `"use client"` component housing nav scroll detection, video cycling state, and the full page layout. A separate `HeroVideoBackground` client component handles the video array and cross-fade logic. Dark theme is scoped via a `.homepage` CSS class (same pattern as `.destination-page`/`.explore-page`).

**Tech Stack:** Next.js App Router, Tailwind CSS v4, Clash Display (Fontshare CDN), DM Sans (Google Fonts), Lucide React, 9 local MP4 background videos.

**Design doc:** `docs/plans/2026-03-05-homepage-redesign-design.md`

---

### Task 1: Copy video files into the project

**Files:**
- Create: `public/videos/` (directory + 9 files)

**Step 1: Copy all videos**

```bash
mkdir -p "rough-idea-travel-main/public/videos"
cp "../videos/"*.mp4 "rough-idea-travel-main/public/videos/"
```

Run from `/Users/dave/Rough Idea Travel/`.

**Step 2: Verify**

```bash
ls -lh rough-idea-travel-main/public/videos/
```

Expected: 9 `.mp4` files, 6–16MB each.

**Step 3: Commit**

```bash
git add public/videos/
git commit -m "chore: add background video assets to public/videos"
```

Note: if git is slow due to binary size, consider adding to `.gitignore` and serving from a CDN for production. For now, committing directly.

---

### Task 2: Add DM Sans weight 300 to layout

**Files:**
- Modify: `src/app/layout.tsx`

The subtext spec calls for `font-weight: 300`. DM Sans is currently loaded at 400/500/600 only. Add 300.

**Step 1: Open the file and find the DM Sans config**

It's at `src/app/layout.tsx` around line 30:

```ts
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
```

**Step 2: Add weight 300**

Change the `weight` array to:

```ts
  weight: ["300", "400", "500", "600"],
```

**Step 3: Verify build compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: no type errors, build succeeds.

**Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add DM Sans weight 300 for homepage subtext"
```

---

### Task 3: Add homepage CSS to globals.css

**Files:**
- Modify: `src/app/globals.css`

All new CSS classes for the homepage. Add at the end of the file.

**Step 1: Extend the existing dark theme selector**

Find this line (around line 261):
```css
.destination-page,
.explore-page {
```

Change it to:
```css
.destination-page,
.explore-page,
.homepage {
```

This gives `.homepage` all the same dark tokens without duplication.

**Step 2: Append all homepage-specific CSS at the end of globals.css**

```css
/* ── Homepage: Video Background ─────────────────────────── */
.hero-video-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  overflow: hidden;
}

.hero-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: opacity 1.2s ease;
}

.hero-video--active  { opacity: 1; }
.hero-video--fading  { opacity: 0; }
.hero-video--hidden  { opacity: 0; pointer-events: none; }

.hero-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    to bottom,
    rgba(15, 14, 13, 0.35) 0%,
    rgba(15, 14, 13, 0.50) 50%,
    rgba(15, 14, 13, 0.88) 85%,
    #0F0E0D 100%
  );
}

@media (max-width: 768px) {
  .hero-video { display: none; }
  .hero-video-container {
    background-image: url('/images/hero-poster.jpg');
    background-size: cover;
    background-position: center;
  }
}

/* ── Homepage: Nav ───────────────────────────────────────── */
.homepage-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0 28px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
  border-bottom: 1px solid transparent;
  transition: background 0.3s ease, border-color 0.3s ease;
}

.homepage-nav.scrolled {
  background: rgba(28, 26, 23, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom-color: var(--color-border, #2E2B25);
}

/* ── Homepage: Scroll Indicator ─────────────────────────── */
.scroll-indicator {
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  opacity: 0.4;
  z-index: 2;
  pointer-events: none;
}

.scroll-indicator__icon {
  animation: scrollBounce 2s ease-in-out infinite;
}

@keyframes scrollBounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(5px); }
}

@media (max-width: 768px) {
  .scroll-indicator { display: none; }
}

/* ── Homepage: Feature Cards ─────────────────────────────── */
.feature-card {
  background: var(--color-card, #1C1A17);
  border: 1px solid var(--color-border, #2E2B25);
  border-radius: 16px;
  padding: 28px;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.feature-card:hover {
  border-color: rgba(42, 191, 191, 0.3);
  transform: translateY(-3px);
  box-shadow: 0 -1px 0 0 rgba(42, 191, 191, 0.3),
              0 12px 40px rgba(0, 0, 0, 0.4);
}
```

**Step 3: Verify no CSS syntax errors**

```bash
npm run build 2>&1 | grep -i "error\|warn" | head -20
```

Expected: no CSS parse errors.

**Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add homepage dark theme scope and video/nav/card CSS"
```

---

### Task 4: Create HeroVideoBackground component

**Files:**
- Create: `src/components/homepage/HeroVideoBackground.tsx`
- Test: `src/__tests__/components/HeroVideoBackground.test.tsx`

**Step 1: Write the failing test first**

Create `src/__tests__/components/HeroVideoBackground.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HeroVideoBackground } from '@/components/homepage/HeroVideoBackground'

describe('HeroVideoBackground', () => {
  it('renders a video element for each source', () => {
    render(<HeroVideoBackground />)
    const videos = screen.getAllByRole('generic').filter(
      el => el.tagName === 'VIDEO'
    )
    // 9 video files
    expect(videos.length).toBe(9)
  })

  it('all video elements are muted and playsInline', () => {
    const { container } = render(<HeroVideoBackground />)
    const videos = container.querySelectorAll('video')
    videos.forEach(v => {
      expect(v.muted).toBe(true)
      expect(v.hasAttribute('playsinline')).toBe(true)
    })
  })

  it('only one video has autoPlay at a time', () => {
    const { container } = render(<HeroVideoBackground />)
    const videos = container.querySelectorAll('video')
    const autoPlaying = Array.from(videos).filter(v => v.autoplay)
    expect(autoPlaying.length).toBe(1)
  })

  it('renders the overlay div', () => {
    const { container } = render(<HeroVideoBackground />)
    expect(container.querySelector('.hero-overlay')).toBeTruthy()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- --run src/__tests__/components/HeroVideoBackground.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/homepage/HeroVideoBackground'`

**Step 3: Create the component**

Create `src/components/homepage/HeroVideoBackground.tsx`:

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';

// TODO: compress videos before production — current files are 6–18MB each
// Target: under 3MB per clip using: ffmpeg -i input.mp4 -vcodec libx264 -crf 28
//   -preset slow -vf "scale=1920:-2" -movflags +faststart -an output_compressed.mp4
// Also generate WebM (30-40% smaller): ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 33 -b:v 0 -an output.webm
const VIDEO_SOURCES = [
  '/videos/coverr-coast-in-brazil-4147-1080p.mp4',
  '/videos/coverr-grand-teton-national-park-5555-1080p.mp4',
  '/videos/coverr-sandy-beach-3010-1080p.mp4',
  '/videos/coverr-skiing-in-a-winter-wonderland-3258-1080p.mp4',
  '/videos/coverr-sun-rays-coming-through-the-branches-1767-1080p.mp4',
  '/videos/coverr-sunflower-field-571-1080p.mp4',
  '/videos/coverr-sunrise-on-sayulita-beach-in-mexico-7133-1080p.mp4',
  '/videos/coverr-sunrise-on-street-in-mexico-city-2715-1080p.mp4',
  '/videos/coverr-world-trade-center-6092-1080p.mp4',
];

export function HeroVideoBackground() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fadingIndex, setFadingIndex] = useState<number | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const advance = () => {
    const nextIndex = (activeIndex + 1) % VIDEO_SOURCES.length;
    setFadingIndex(activeIndex);
    setActiveIndex(nextIndex);
    setTimeout(() => setFadingIndex(null), 1200);
  };

  // Preload next video
  useEffect(() => {
    const nextIndex = (activeIndex + 1) % VIDEO_SOURCES.length;
    const nextVideo = videoRefs.current[nextIndex];
    if (nextVideo) nextVideo.load();
  }, [activeIndex]);

  // Imperatively play active video (handles browser autoplay policy)
  useEffect(() => {
    const active = videoRefs.current[activeIndex];
    if (active) {
      active.play().catch(() => {
        // Autoplay blocked — silently advance to next
        advance();
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  return (
    <div className="hero-video-container">
      {VIDEO_SOURCES.map((src, index) => (
        <video
          key={src}
          ref={el => { videoRefs.current[index] = el; }}
          src={src}
          autoPlay={index === activeIndex}
          muted
          playsInline
          preload={index === activeIndex ? 'auto' : 'none'}
          poster="/images/hero-poster.jpg"
          onEnded={index === activeIndex ? advance : undefined}
          onError={index === activeIndex ? advance : undefined}
          className={[
            'hero-video',
            index === activeIndex ? 'hero-video--active' :
            index === fadingIndex ? 'hero-video--fading' :
            'hero-video--hidden',
          ].join(' ')}
        />
      ))}
      <div className="hero-overlay" />
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- --run src/__tests__/components/HeroVideoBackground.test.tsx
```

Expected: all 4 tests PASS.

**Step 5: Commit**

```bash
git add src/components/homepage/HeroVideoBackground.tsx src/__tests__/components/HeroVideoBackground.test.tsx
git commit -m "feat: add HeroVideoBackground cycling video component"
```

---

### Task 5: Rewrite page.tsx

**Files:**
- Modify: `src/app/page.tsx`

This is the full homepage rewrite. The file becomes `"use client"`.

**Shared style constants** (define at top of file, same pattern as destination page):

```ts
const CLASH: React.CSSProperties = {
  fontFamily: "'Clash Display', system-ui, sans-serif",
};

const HEADLINE_GRADIENT: React.CSSProperties = {
  background: 'linear-gradient(90deg, #2ABFBF 0%, #E8833A 55%, #C4A882 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};
```

**Complete file content:**

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Sun, Route, ChevronDown } from 'lucide-react';
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

const FEATURE_CARDS = [
  {
    icon: MapPin,
    title: 'Smart Suggestions',
    desc: 'AI-powered destination ideas tailored to your vague preferences',
  },
  {
    icon: Sun,
    title: 'Weather Intel',
    desc: 'Side-by-side climate data for your exact travel window',
  },
  {
    icon: Route,
    title: 'Full Itinerary',
    desc: 'Day-by-day plans with routes, restaurants, and local tips',
  },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
            transition: 'background 0.15s ease',
          }}
        >
          Start Exploring
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingBottom: '12vh' }}>
        <HeroVideoBackground />

        {/* Text content */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 960, padding: '0 24px' }}>
          <h1 style={{
            ...CLASH,
            fontSize: 'clamp(48px, 6.5vw, 84px)',
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: '0.04em',
            margin: 0,
          }}>
            <span style={{ color: '#F2EEE8', display: 'block' }}>Got a rough idea?</span>
            <span style={{ ...HEADLINE_GRADIENT, letterSpacing: '0.04em', display: 'block' }}>
              We&apos;ll plan the rest.
            </span>
          </h1>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 16,
            fontWeight: 300,
            color: '#A89F94',
            lineHeight: 1.7,
            letterSpacing: '0.01em',
            textAlign: 'center',
            maxWidth: 480,
            margin: '24px auto 0',
            opacity: 0.85,
          }}>
            Tell us when, where-ish, and what you&apos;re into. Our AI compares
            destinations, checks the weather, and builds your perfect itinerary.
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
              transition: 'background 0.15s ease, transform 0.15s ease',
            }}
          >
            Start Exploring →
          </Link>
        </div>

        {/* Scroll indicator */}
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

      {/* Feature cards */}
      <section style={{ background: '#0F0E0D', padding: '80px 24px 100px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {FEATURE_CARDS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="feature-card">
              <Icon size={28} color="#2ABFBF" style={{ marginBottom: 20 }} />
              <h3 style={{ ...CLASH, fontSize: 18, fontWeight: 500, color: '#F2EEE8', margin: '0 0 8px' }}>
                {title}
              </h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 400, color: '#A89F94', lineHeight: 1.6, margin: 0 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
```

**Step 1: Replace the file contents** with the above.

**Step 2: Run the dev server and visually verify**

```bash
npm run dev
```

Open `http://localhost:3000`. Check:
- Dark background visible immediately
- Nav transparent, frosted on scroll
- Video playing in background (desktop)
- Headline with correct gradient
- Feature cards with hover effect
- No console errors

**Step 3: Run existing E2E tests**

```bash
npm run test:e2e -- --grep "Landing page"
```

Expected: both tests PASS (CTA link still present, navigates to `/explore`).

**Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: homepage redesign — dark theme, video background, premium typography"
```

---

### Task 6: Update E2E tests for new homepage

**Files:**
- Modify: `e2e/landing.spec.ts`

The existing tests still pass. Add two new assertions for the redesigned elements.

**Step 1: Update the test file**

```ts
import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test('renders the hero section', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/rough idea/i)
    const cta = page.getByRole('link', { name: /start exploring/i }).first()
    await expect(cta).toBeVisible()
  })

  test('navigates to explore page from CTA', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /start exploring/i }).first().click()
    await expect(page).toHaveURL('/explore')
  })

  test('hero headline is present', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText("Got a rough idea?")).toBeVisible()
    await expect(page.getByText("We'll plan the rest.")).toBeVisible()
  })

  test('nav becomes visible on scroll', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav.homepage-nav')
    await expect(nav).not.toHaveClass(/scrolled/)
    await page.evaluate(() => window.scrollTo(0, 200))
    await expect(nav).toHaveClass(/scrolled/)
  })
})
```

Note: `first()` on CTA links because there are now two "Start Exploring" links (nav + hero button).

**Step 2: Run E2E tests**

```bash
npm run test:e2e -- --grep "Landing page"
```

Expected: all 4 tests PASS.

**Step 3: Commit**

```bash
git add e2e/landing.spec.ts
git commit -m "test: update landing page E2E tests for redesigned homepage"
```

---

### Task 7: Verify production build

**Step 1: Run full build**

```bash
npm run build
```

Expected: no errors, no TypeScript errors.

**Step 2: Run full test suite**

```bash
npm run test:run
```

Expected: all unit/integration tests pass.

**Step 3: Check bundle for video paths**

The videos are served as static files from `/public/videos/` — they are NOT bundled by webpack. No bundle size concern. Verify the video URLs resolve at runtime by opening DevTools > Network while the homepage loads and checking the first `.mp4` request returns 200.

---

## Open Items (post-implementation)

- User must place `public/images/hero-poster.jpg` (< 200KB JPEG) before the mobile fallback works
- Compress videos using ffmpeg before production deployment (see TODO comment in `HeroVideoBackground.tsx`)
- Consider CDN hosting for video files — 83MB total in `/public/` will slow Vercel deploys
