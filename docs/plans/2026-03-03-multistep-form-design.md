# Multi-Step Card Form Design

**Date:** 2026-03-03

## Goal

Replace the progressive-disclosure stacking form with a clean 4-card wizard. Users see one card at a time, nothing is required, and the Search button is always reachable. Remove compare-places and the advanced options section to reduce clutter.

---

## Cards

| # | Title | Fields |
|---|-------|--------|
| 1 | Origin | Home city (autocomplete) + Travel range chips (incl. driving distance with starting point) |
| 2 | When | Specific dates (start/end pickers) or Flexible (text description + duration) |
| 3 | Vibe | Interests (12 chips + add your own) + Trip style (6 chips) |
| 4 | Details | Weather (5 chips) + Budget (4 chips) + Where (Surprise me / Region) |

---

## Navigation

- **Next →** always enabled — no fields are required
- **← Back** hidden on card 1, shown on cards 2–4
- **Search** button present on every card:
  - Cards 1–3: ghost/outline style (secondary), so it doesn't compete with Next
  - Card 4: primary style; Next button is replaced by Search
- Clicking a progress segment jumps directly to that card

---

## Layout (per card)

```
┌─────────────────────────────────┐
│ ████████░░░░░░░░░░░░░░░░░░░░░░  │  progress bar (4 segments)
│ Step 1 of 4  ·  Origin          │  step label
│                                 │
│  [fields]                       │
│                                 │
│  ← Back              Next →     │
│  ─────────────────────────────  │
│  [Search]                       │  ghost on cards 1–3, hidden on card 4
└─────────────────────────────────┘
```

---

## Transitions

- Next: card slides right→left (`translate-x-4 → translate-x-0`, `opacity-0 → opacity-100`)
- Back: card slides left→right (`-translate-x-4 → translate-x-0`)
- Implemented via a keyed `div` with Tailwind transition classes (same pattern as existing `animate-fade-in`)
- First interactive field on each card receives `autoFocus` on mount

---

## Removed

- `locationType === "specific"` (compare places) — entire branch deleted
- Advanced section (travelers count + additional notes) — `showAdvanced`, `travelers`, `additionalNotes` state deleted
- Progressive disclosure mode (Mode 3) — `TOTAL_STEPS`, `currentStep`, `isStepVisible`, all 6 auto-advance `useEffect`s, and `StepSection` component all deleted

---

## Simplified Form Modes (3 → 2)

| Mode | Trigger | Description |
|------|---------|-------------|
| **Card mode** | Always (initial fill + post-submit editing) | 4 cards, one at a time |
| **Summary mode** | After first submit, not editing | Collapsed pills + "Edit" button — unchanged |

The `isExpanded` flag becomes unnecessary; `isEditing` drives the mode toggle. On first submit `isEditing = false` (summary); "Edit" sets `isEditing = true` (card mode at card 0).

---

## TripInput Schema Impact

No schema changes needed. `locationPreference.type` will only ever be `"open"` or `"region"` from the UI now (the `"specific"` + `comparePlaces` branch still exists in the schema for backward-compatibility with saved/shared trips). `travelers` and `additionalNotes` are simply omitted from `buildTripInput()`.

---

## Testing

No new unit tests needed. Existing 82 tests cover schema/API layer. Manual verification:
1. Fresh load — card 1 shows, Search button visible
2. Click Next without filling anything — advances to card 2
3. Fill home city + travel range, click Next — card 2 shows with slide animation
4. Click Search from card 2 — submits with partial data, summary mode appears
5. Click Edit — returns to card mode at card 0
6. Progress bar segments are clickable, jump to correct card
7. Driving distance selection reveals starting point input
8. Flexible dates toggle shows description + duration fields
9. Custom interest add/remove works on card 3
10. Region input on card 4 works
