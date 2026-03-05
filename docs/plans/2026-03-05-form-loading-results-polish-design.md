# Design: Form, Loading & Results Polish — Third Pass

**Date:** 2026-03-05
**Branch:** feat/form-redesign
**Scope:** UI-only refinements. No changes to search logic, ranking, routing, or TypeScript interfaces.

---

## Design Tokens (unchanged)

```css
--color-bg:              #0F0E0D;
--color-bg-elevated:     #1C1A17;
--color-bg-subtle:       #252219;
--color-border:          #2E2B25;
--color-text-primary:    #F2EEE8;
--color-text-secondary:  #A89F94;
--color-text-muted:      #6B6258;
--color-teal:            #2ABFBF;
--color-orange:          #E8833A;
--color-warm-grey:       #C4A882;
```

---

## Section 1 — Form Changes

### 1. Remove Road Trip Starting Point Field

- Delete the starting point input block from `TripInputForm.tsx` (shown when `travelRange === "driving_distance"`)
- Keep `startingPoint` state; silently set it to `homeCity` inside `buildTripInput()` when `travelRange === "driving_distance"`
- Remove `startPointSuggestions` state, `filteredStartCities`, `startPointSuggestionsRef`, and the related `useEffect` click-outside handler
- No UI indication of the silent fallback

### 2. Inline Expanding Date Picker (react-day-picker)

**Dependency:** `react-day-picker` v9 (no external date lib required)

- Replace both `<input type="date">` fields in the "Specific dates" path with a single inline `DayPicker` in `range` mode
- The picker renders directly in the form flow (no popover/floating layer) — expands below a click trigger showing the current selection summary
- Two-month layout: left = departure month, right = return month
- Selecting a start date auto-advances the right panel to show the same month as departure
- Selecting the end date collapses the picker; shows a formatted summary line (e.g. "14 May – 21 May")
- `startDate` and `endDate` state values remain strings (ISO format); only the setter path changes
- Style entirely via CSS vars to match the dark theme — no default react-day-picker stylesheet

### 3. Duration — Replace Number Input with Chips

Applies to the flexible dates path only (where duration was previously a number input).

**Chip options and values:**

| Label | Duration value |
|---|---|
| Weekend | 2 |
| 7 days | 7 |
| 10 days | 10 |
| 2 weeks | 14 |
| Other | (free entry) |

- Chip styling matches existing interest tag chips (teal border + tint when selected)
- "Other" chip: when selected, a text input expands inline below the chip row via `max-height` CSS transition (0.2s ease), auto-focused, placeholder "e.g. 12 days"
- "Other" chip stays teal while the input is visible
- `duration` state remains `number`; "Weekend" maps to `2`, "Other" parses the free-entry string to a number

### 4. Inline "Got it" Confirmation

Replaces the standalone `<p>✓ Got it</p>` that appears below confirmed fields.

**Single-line text inputs** (flexible date description, region):
- Wrap input in `position: relative` container
- On confirmation: `position: absolute, right: 12px` span renders `✓ Got it` in `--color-teal`, 12px DM Sans 500
- Input border transitions to `--color-teal`
- Input background unchanged

**Textarea** (additional notes):
- Textarea width constrained to `75%` of container
- On confirmation: `✓ Got it` renders as a sibling element to the right of the textarea, vertically centered via flexbox on the wrapper row
- Same teal styling as above

---

## Section 2 — Loading State

### Architecture

- When `isLoading === true` and `!hasResults`: render a `position: fixed, inset: 0, z-index: 100, background: #0F0E0D` full-screen overlay
- The two-panel grid renders underneath but is hidden (or not yet mounted)
- When the loaded threshold is met, the overlay fades out: `opacity` transition, 400ms

### Trigger threshold

Cross-fade begins when `effectiveResult?.destinations?.length >= 2` — enough to render a meaningful results panel without waiting for the full stream.

### Loading screen content

Exactly the existing `ExploreLoadingState` suitcase animation, centered horizontally and vertically in the viewport. No map, no pins, no search tags overlay. All existing animation behaviour (packing items, expressions, progress bar) retained unchanged.

---

## Section 3 — Results Page Updates

### Heart Button on Cards

- `FavoriteButton` restyled with orange palette replacing current red:
  - Default: outline heart, `--color-text-primary`
  - Hover: `rgba(232,131,58,0.2)` background, `--color-orange` border
  - Saved: filled orange heart, orange border + background tint
  - Save pulse: `transform: scale(1.3)` → `scale(1)`, 0.2s ease
- `DestinationCard` receives four new props: `isFavorited`, `favoriteId`, `onToggle`, `onAuthRequired`
- `FavoriteButton` renders `position: absolute, top: 12px, left: 12px` inside the image container
- Rank badge relocates: `top: 10px, left: 10px` → `bottom: 10px, left: 10px`
- Match score badge stays `top: 10px, right: 10px`
- `ResultsPanel` passes existing `favoritesMap` state per-card (already present)

### Card Typography

| Element | Before | After |
|---|---|---|
| Destination title | Clash Display 16px/600 | Clash Display 22px/500 |
| Description body | DM Sans 13px | DM Sans 14px |
| Trip tags (pace, drive time) | 11px/500 | 12px/500 |
| Daily cost + duration | 12px | 14px/500 |
| "View details" | 12px/500 | 14px/500 |

Card body padding: `16px` → `20px`.

### Map Panel Size

- Left panel column width: `340px` → `380px` (in `explore/page.tsx` grid template)
- Map height prop: `300` → `400` (in `ExploreMap` call in left panel)

### Card–Map Hover Sync

- Hovering a card sets `selectedDestination` in `ResultsPanel` (state already exists) — ExploreMap already uses `selectedId` for pin highlighting
- Pin hover → card highlight: `hoveredMarkerId` state in `explore/page.tsx`, passed to `ExploreMap` (pin callbacks) and `ResultsPanel` (card border highlight)
- Highlighted card: `border-color: --color-teal`, `box-shadow: 0 0 0 2px rgba(42,191,191,0.3)`, fades back after 1.5s
- All transitions at `0.15s ease`
- Complex wiring marked `// TODO: card-map sync` if deferred

---

## What Is Not Changed

- Search logic, AI processing, result ranking
- Map library internals or tile provider
- Routing, URL structure, history management
- Component props and TypeScript interfaces (except the four new `DestinationCard` props)
- Step validation logic in the form
- Favorites/wishlist data layer (heart button reads/writes existing state only)
