# Homepage Redesign — Design Document

**Date:** 2026-03-05
**Status:** Approved

## Goal

Redesign the Rough Idea Travel homepage to be visually immersive and premium while remaining minimal. Adds cycling video background, refines typography toward restraint, and aligns all UI with the existing app design system.

## Constraints

- Do not change routing, nav destinations, or CTA href values
- Do not alter authentication or session logic
- Do not change any copy (headline, subtext, feature card text)
- Fonts: Clash Display + DM Sans only

## Files Changed

| File | Change |
|------|--------|
| `src/app/page.tsx` | Full rewrite — "use client", dark theme, video + nav + hero + cards |
| `src/components/homepage/HeroVideoBackground.tsx` | New — video cycling component |
| `src/app/globals.css` | Add `.homepage` dark theme scope + video/nav/card/scroll CSS |
| `src/app/layout.tsx` | Add DM Sans weight 300 |
| `public/videos/` | Copy 9 videos from `../videos/` |
| `public/images/hero-poster.jpg` | User-provided poster frame |

## Architecture Decision

**Approach A — Single client component.** `page.tsx` is `"use client"`. Nav scroll detection, video cycling, and full page layout co-located in one file. Justified because the homepage has no server-side data fetching, so losing server-component benefits is a non-issue.

## Dark Theme Scoping

`.homepage` CSS class on the outer div overrides all design tokens to the dark palette. Same pattern as `.destination-page` and `.explore-page`. Does not affect other pages.

```css
.homepage {
  --background: #0F0E0D;
  --card: #1C1A17;
  --surface: #252219;
  --border: #2E2B25;
  --foreground: #F2EEE8;
  --muted-foreground: #A89F94;
  --primary: #2ABFBF;
  --highlight: #E8833A;
}
```

## Video Component

- `HeroVideoBackground` renders all 9 video elements; only active + fading are visible
- Cycles on `onEnded`; `onError` silently advances to next clip
- Non-active videos have `preload="none"` to prevent simultaneous loading
- All videos: `muted`, `playsInline`, `poster="/images/hero-poster.jpg"`
- Mobile (< 768px): all videos hidden, container shows static poster via CSS background-image
- ffmpeg not available on dev machine — originals used with TODO comment for production compression

**Video files (9 clips, 6–16MB each):**
- coverr-coast-in-brazil-4147-1080p.mp4
- coverr-grand-teton-national-park-5555-1080p.mp4
- coverr-sandy-beach-3010-1080p.mp4
- coverr-skiing-in-a-winter-wonderland-3258-1080p.mp4
- coverr-sun-rays-coming-through-the-branches-1767-1080p.mp4
- coverr-sunflower-field-571-1080p.mp4
- coverr-sunrise-on-sayulita-beach-in-mexico-7133-1080p.mp4
- coverr-sunrise-on-street-in-mexico-city-2715-1080p.mp4
- coverr-world-trade-center-6092-1080p.mp4

## Typography

| Element | Font | Size | Weight | Notes |
|---------|------|------|--------|-------|
| Headline line 1 | Clash Display | clamp(48px, 6.5vw, 84px) | 400 | `--color-text-primary`, `letterSpacing: 0.04em` |
| Headline line 2 | Clash Display | (same) | 400 | Inline teal→orange→warm-grey gradient |
| Subtext | DM Sans | 16px | 300 | `--color-text-secondary`, `opacity: 0.85` |
| CTA | DM Sans | 15px | 600 | `--color-teal` bg, dark text |
| Card titles | Clash Display inline | 18px | 500 | |
| Card body | DM Sans | 14px | 400 | `--color-text-secondary` |
| Logo | Clash Display inline | 20px | 500 | |
| Scroll label | DM Sans | 10px | 400 | Uppercase, `letterSpacing: 0.12em` |

Headline gradient uses inline style (not `.text-gradient` class) to avoid changing global gradient colors.

## Nav Behavior

- `position: fixed`, `z-index: 100`, `height: 60px`
- Default: transparent background, transparent border
- After 80px scroll: `background: rgba(28,26,23,0.88)`, `backdrop-filter: blur(16px)`, border visible
- Scroll listener added in `useEffect`, cleaned up on unmount

## Hero Layout

- `min-height: 100vh`, flex column, centered
- `padding-bottom: 12vh` nudges content slightly above center
- Video container: `position: fixed`, `z-index: 0`
- Overlay: `z-index: 1`, gradient from 35% opacity top → solid `#0F0E0D` at bottom
- Text content: `z-index: 2`
- Scroll indicator: `position: absolute`, bottom 28px, `z-index: 2`, hidden on mobile

## Feature Cards

- Below hero, no hard edge (video fixed background bleeds through)
- `padding: 80px 24px 100px`, max-width 1080px, 3-col → 1-col grid, gap 16px
- Hover: teal border glow + `translateY(-3px)` + box shadow
- Icons: Lucide (MapPin / Sun / Route), 28px, teal color

## Open Items

- [ ] User to provide `public/images/hero-poster.jpg` (compressed JPEG, under 200KB)
- [ ] Compress videos before production using ffmpeg `-crf 28 -movflags +faststart` (TODO added in code)
