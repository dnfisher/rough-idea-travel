# Form, Loading & Results Polish — Third Pass Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refine the search form UX (remove redundant field, add duration chips, inline confirmations, custom date picker), replace the loading state with a full-screen centred overlay, and polish result cards (heart button, larger typography, bigger map, card-map hover sync).

**Architecture:** All changes are UI-only — no search logic, ranking, routing, or TypeScript schema changes. Form state lives in `TripInputForm.tsx`. Loading overlay is managed in `explore/page.tsx`. Card changes are in `DestinationCard.tsx` with favourites props passed from `ResultsPanel.tsx`.

**Tech Stack:** Next.js App Router, React, Tailwind CSS v4, `react-day-picker` v9 (new dependency), Leaflet/React-Leaflet, Vitest (unit tests), `npm run test:run`.

---

## Task 1: Remove road trip starting point field

**Files:**
- Modify: `src/components/explore/TripInputForm.tsx`
- Modify: `src/__tests__/unit/trip-input-builder.test.ts`

**Step 1: Write the failing test**

Add to the `buildTripInput` describe block in `src/__tests__/unit/trip-input-builder.test.ts`:

```ts
it('uses homeCity as startingPoint when travelRange is driving_distance and startingPoint is empty', () => {
  // This tests the *form's* responsibility — the builder itself just passes through.
  // We document the contract here so the form behaviour is covered.
  const result = buildTripInput({
    ...base,
    travelRange: 'driving_distance',
    startingPoint: '',
    homeCity: 'Frankfurt',
  })
  // startingPoint is empty string → builder omits it (line 75 of trip-input-builder.ts)
  // The FORM is responsible for passing homeCity when driving_distance.
  // This test documents the builder's pass-through behaviour.
  expect(result.startingPoint).toBeUndefined()
})

it('includes startingPoint when explicitly provided', () => {
  const result = buildTripInput({
    ...base,
    travelRange: 'driving_distance',
    startingPoint: 'Frankfurt',
    homeCity: 'Frankfurt',
  })
  expect(result.startingPoint).toBe('Frankfurt')
})
```

**Step 2: Run test to confirm it passes (documents existing behaviour)**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main"
npm run test:run -- src/__tests__/unit/trip-input-builder.test.ts
```
Expected: all tests PASS (these test existing behaviour).

**Step 3: Update TripInputForm.tsx — remove UI, fix buildTripInput call**

In `src/components/explore/TripInputForm.tsx`:

a) Remove state variables (lines ~98–99, ~115–119, ~124–126):
- Remove: `const [startingPoint, setStartingPoint] = useState("");`
- Remove: `const [showStartPointSuggestions, setShowStartPointSuggestions] = useState(false);`
- Remove: `const [startPointSuggestionIndex, setStartPointSuggestionIndex] = useState(-1);`
- Remove: `const startPointSuggestionsRef = useRef<HTMLDivElement>(null);`
- Remove: `const filteredStartCities = startingPoint.trim().length >= 1 ? ...`

b) Remove the click-outside effect reference to `startPointSuggestionsRef` (the `handleClickOutside` function references it — remove that block).

c) In the `travelRangeField` const (around line 295), remove the entire block inside the `{travelRange === "driving_distance" && ( ... )}` conditional that renders the starting point input div (lines ~322–386). Keep the outer conditional wrapper removed too — delete the whole block including the `<div className="mt-3">` wrapper.

d) Also in `travelRangeField`, in the `onClick` for driving_distance (lines ~307–312), remove:
```tsx
if (!startingPoint.trim() && homeCity.trim()) {
  setStartingPoint(homeCity);
}
```
Keep only: `setTripStyle("road_trip");`

e) In the `buildTripInput` function (around line 167), change the `startingPoint` argument:
```tsx
// Before:
startingPoint,

// After:
startingPoint: travelRange === "driving_distance" ? homeCity : "",
```

f) Remove `Home` from the lucide-react imports if it's no longer used elsewhere (check first — it's used in `homeCityField` legend, so keep it).

g) Remove `startPointSuggestions`-related imports/refs that are now unused.

**Step 4: Run tests**

```bash
npm run test:run -- src/__tests__/unit/trip-input-builder.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main"
git add src/components/explore/TripInputForm.tsx src/__tests__/unit/trip-input-builder.test.ts
git commit -m "feat: remove road trip starting point field, use homeCity silently"
```

---

## Task 2: Duration chips

**Files:**
- Modify: `src/components/explore/TripInputForm.tsx`

**Step 1: Add duration chip state and constants**

At the top of the `TripInputForm` component function, add new state (around line 83, after the existing `duration` state):

```tsx
// Duration chips — replaces the free number input in flexible date flow
const DURATION_CHIPS = [
  { label: "Weekend", value: "weekend", days: 2 },
  { label: "7 days",  value: "7",       days: 7 },
  { label: "10 days", value: "10",      days: 10 },
  { label: "2 weeks", value: "14",      days: 14 },
  { label: "Other",   value: "other",   days: null },
] as const

const [selectedDurationChip, setSelectedDurationChip] = useState<string>("7")
const [otherDurationValue, setOtherDurationValue] = useState("")
const otherDurationRef = useRef<HTMLInputElement>(null)
```

Remove the existing `const [duration, setDuration] = useState(7)` line. Instead, derive `duration` from the chip selection:

```tsx
const duration = (() => {
  const chip = DURATION_CHIPS.find(c => c.value === selectedDurationChip)
  if (!chip || chip.value === "other") {
    const parsed = parseInt(otherDurationValue)
    return Number.isFinite(parsed) ? Math.min(30, Math.max(1, parsed)) : 7
  }
  return chip.days
})()
```

**Step 2: Auto-focus the Other input when revealed**

Add a `useEffect` after the existing `customInterestInputRef` effect (around line 145):

```tsx
useEffect(() => {
  if (selectedDurationChip === "other" && otherDurationRef.current) {
    otherDurationRef.current.focus()
  }
}, [selectedDurationChip])
```

**Step 3: Replace the duration number input in datesField**

In the `datesField` const, find the block starting `{dateType === "flexible" && (` near the bottom (around line 484). Replace the entire `<div className="mt-3 flex items-center gap-3">` block with:

```tsx
{dateType === "flexible" && (
  <div className="mt-3">
    <p className="text-xs mb-2" style={{ color: "var(--muted-foreground, #A89F94)" }}>Duration</p>
    <div className="flex flex-wrap gap-2">
      {DURATION_CHIPS.map((chip) => (
        <button
          key={chip.value}
          type="button"
          onClick={() => setSelectedDurationChip(chip.value)}
          className={chipClass(selectedDurationChip === chip.value)}
          style={{ borderRadius: "999px", padding: "8px 16px", fontSize: "13px" }}
        >
          {chip.label}
        </button>
      ))}
    </div>
    <div
      style={{
        overflow: "hidden",
        maxHeight: selectedDurationChip === "other" ? "60px" : "0",
        transition: "max-height 0.2s ease",
      }}
    >
      <input
        ref={otherDurationRef}
        type="text"
        value={otherDurationValue}
        onChange={(e) => setOtherDurationValue(e.target.value)}
        placeholder="e.g. 12 days"
        className="mt-2"
        style={{
          background: "var(--surface, #252219)",
          border: "1px solid var(--primary, #2ABFBF)",
          borderRadius: "10px",
          padding: "10px 14px",
          width: "200px",
          fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
          fontSize: "14px",
          color: "var(--foreground, #F2EEE8)",
          outline: "none",
        }}
      />
    </div>
  </div>
)}
```

**Step 4: Verify visually**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main"
npm run dev
```

Open http://localhost:3000, go to Step 2 (When & Weather), select "Flexible dates". Confirm: number input is gone, chips appear, "Other" chip expands an input, chip stays teal while input is visible.

**Step 5: Commit**

```bash
git add src/components/explore/TripInputForm.tsx
git commit -m "feat: replace duration number input with chip selector"
```

---

## Task 3: Inline "Got it" confirmation

**Files:**
- Modify: `src/components/explore/TripInputForm.tsx`

**Step 1: Add additionalNotes confirmed state**

In the state declarations (around line 95, near `flexibleDatesConfirmed`), add:

```tsx
const [additionalNotesConfirmed, setAdditionalNotesConfirmed] = useState(false)
```

**Step 2: Update flexible date description field — inline confirmation**

In `datesField`, find the flexible dates input block (around line 426). The current structure:

```tsx
<div className="space-y-1">
  <input ... />
  {!flexibleDatesConfirmed && dateDescription.trim().length === 0 && (
    <p className="text-xs text-muted-foreground">Press Enter or tab away to confirm</p>
  )}
  {flexibleDatesConfirmed && (
    <p className="text-xs text-primary flex items-center gap-1">
      <Check className="h-3 w-3" /> Got it
    </p>
  )}
</div>
```

Replace with:

```tsx
<div>
  <div className="relative">
    <input
      type="text"
      value={dateDescription}
      onChange={(e) => {
        setDateDescription(e.target.value);
        setFlexibleDatesConfirmed(false);
      }}
      onBlur={() => {
        if (dateDescription.trim().length > 0) setFlexibleDatesConfirmed(true);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && dateDescription.trim().length > 0) {
          e.preventDefault();
          setFlexibleDatesConfirmed(true);
        }
      }}
      placeholder='e.g. "mid-April", "sometime in summer"'
      className={inputClass}
      style={flexibleDatesConfirmed ? { borderColor: "#2ABFBF", paddingRight: "80px" } : undefined}
    />
    {flexibleDatesConfirmed && (
      <span
        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none"
        style={{ color: "#2ABFBF", fontSize: "12px", fontWeight: 500 }}
      >
        <Check className="h-3.5 w-3.5" /> Got it
      </span>
    )}
  </div>
  {!flexibleDatesConfirmed && dateDescription.trim().length === 0 && (
    <p className="text-xs text-muted-foreground mt-1">Press Enter or tab away to confirm</p>
  )}
</div>
```

**Step 3: Update region field — inline confirmation**

In `locationField`, find the region input block (around line 690). Same pattern — replace the `<div className="space-y-1">` block:

```tsx
<div>
  <div className="relative">
    <input
      type="text"
      value={regionValue}
      onChange={(e) => {
        setRegionValue(e.target.value);
        setRegionConfirmed(false);
      }}
      onBlur={() => {
        if (regionValue.trim().length > 0) setRegionConfirmed(true);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && regionValue.trim().length > 0) {
          e.preventDefault();
          setRegionConfirmed(true);
        }
      }}
      placeholder='e.g. "Southern Europe", "Southeast Asia"'
      className={inputClass}
      style={regionConfirmed ? { borderColor: "#2ABFBF", paddingRight: "80px" } : undefined}
    />
    {regionConfirmed && (
      <span
        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none"
        style={{ color: "#2ABFBF", fontSize: "12px", fontWeight: 500 }}
      >
        <Check className="h-3.5 w-3.5" /> Got it
      </span>
    )}
  </div>
  {!regionConfirmed && regionValue.trim().length === 0 && (
    <p className="text-xs text-muted-foreground mt-1">Press Enter or tab away to confirm</p>
  )}
</div>
```

**Step 4: Update textarea — narrowed width with sibling confirmation**

In `additionalNotesField`, replace the `<textarea>` and surrounding markup:

```tsx
const additionalNotesField = (
  <fieldset>
    <legend className="flex items-center gap-2 text-sm font-medium mb-1">
      <Pencil className="h-4 w-4 text-primary" />
      Anything else?
      <span className="text-xs font-normal text-muted-foreground ml-1">optional</span>
    </legend>
    <p className="text-xs text-muted-foreground mb-2">
      e.g.{' '}
      {ADDITIONAL_NOTES_EXAMPLES.map((ex, i) => (
        <span key={ex}>
          <button
            type="button"
            className="italic hover:text-foreground transition-colors"
            onClick={() => setAdditionalNotes(ex)}
          >
            &ldquo;{ex}&rdquo;
          </button>
          {i < ADDITIONAL_NOTES_EXAMPLES.length - 1 ? ' · ' : ''}
        </span>
      ))}
    </p>
    <div className="flex items-start gap-3">
      <textarea
        value={additionalNotes}
        onChange={(e) => {
          setAdditionalNotes(e.target.value);
          setAdditionalNotesConfirmed(false);
        }}
        onBlur={() => {
          if (additionalNotes.trim().length > 0) setAdditionalNotesConfirmed(true);
        }}
        placeholder="Any extra context for your trip..."
        rows={2}
        className={cn(inputClass, 'resize-none')}
        style={{ width: '75%' }}
      />
      {additionalNotesConfirmed && (
        <span
          className="flex items-center gap-1 shrink-0 mt-2.5"
          style={{ color: "#2ABFBF", fontSize: "12px", fontWeight: 500 }}
        >
          <Check className="h-3.5 w-3.5" /> Got it
        </span>
      )}
    </div>
  </fieldset>
)
```

**Step 5: Verify visually**

```bash
npm run dev
```

Check: type in the flexible date field and blur — ✓ Got it appears inside the input at right. Type in region — same. Type in textarea and blur — textarea narrows, ✓ Got it appears to its right.

**Step 6: Commit**

```bash
git add src/components/explore/TripInputForm.tsx
git commit -m "feat: inline Got it confirmation for text input fields"
```

---

## Task 4: Install react-day-picker and create DateRangePicker component

**Files:**
- Create: `src/components/explore/DateRangePicker.tsx`
- Modify: `src/app/globals.css`

**Step 1: Install dependency**

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main"
npm install react-day-picker
```

Expected: installs `react-day-picker` v9.x. Confirm with `npm ls react-day-picker`.

**Step 2: Add CSS overrides to globals.css**

Open `src/app/globals.css` and add at the end of the file:

```css
/* ── react-day-picker dark theme ────────────────────────── */
.rdp-root {
  --rdp-accent-color: #2ABFBF;
  --rdp-accent-background-color: rgba(42, 191, 191, 0.12);
  --rdp-range-middle-background-color: rgba(42, 191, 191, 0.08);
  --rdp-outside-opacity: 0.3;
  color: #F2EEE8;
  font-family: var(--font-dm-sans, 'DM Sans'), sans-serif;
  font-size: 13px;
  --rdp-day-height: 34px;
  --rdp-day-width: 34px;
}

.rdp-month_caption {
  font-size: 13px;
  font-weight: 600;
  color: #F2EEE8;
  padding-bottom: 8px;
}

.rdp-nav button {
  color: #A89F94;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: color 0.15s ease, background 0.15s ease;
}

.rdp-nav button:hover {
  color: #F2EEE8;
  background: rgba(255, 255, 255, 0.06);
}

.rdp-weekday {
  font-size: 11px;
  color: #6B6258;
  font-weight: 500;
}

.rdp-day_button {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #F2EEE8;
  font-size: 13px;
  transition: background 0.1s ease, color 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rdp-day_button:hover {
  background: rgba(42, 191, 191, 0.12);
  color: #2ABFBF;
}

.rdp-selected .rdp-day_button,
.rdp-range_start .rdp-day_button,
.rdp-range_end .rdp-day_button {
  background: #2ABFBF;
  color: #0F0E0D;
  font-weight: 600;
}

.rdp-range_middle .rdp-day_button {
  background: rgba(42, 191, 191, 0.08);
  border-radius: 0;
  color: #F2EEE8;
}

.rdp-range_start .rdp-day_button {
  border-radius: 50% 0 0 50%;
}

.rdp-range_end .rdp-day_button {
  border-radius: 0 50% 50% 0;
}

.rdp-range_start.rdp-range_end .rdp-day_button {
  border-radius: 50%;
}

.rdp-today .rdp-day_button {
  font-weight: 700;
  color: #2ABFBF;
}

.rdp-disabled .rdp-day_button {
  color: #2E2B25;
  cursor: not-allowed;
}

.rdp-months {
  gap: 16px;
}
```

**Step 3: Create DateRangePicker component**

Create `src/components/explore/DateRangePicker.tsx`:

```tsx
"use client";

import { useState, useCallback } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  startDate: string;   // ISO date string "YYYY-MM-DD" or ""
  endDate: string;     // ISO date string "YYYY-MM-DD" or ""
  onChange: (start: string, end: string) => void;
  className?: string;
}

function toDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplay(iso: string): string {
  const d = toDate(iso);
  if (!d) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function DateRangePicker({ startDate, endDate, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Display month: the left month shown. Defaults to current month or departure month.
  const [displayMonth, setDisplayMonth] = useState<Date>(() => {
    return toDate(startDate) ?? new Date();
  });

  const range: DateRange = {
    from: toDate(startDate),
    to: toDate(endDate),
  };

  const handleSelect = useCallback(
    (selected: DateRange | undefined) => {
      if (!selected) {
        onChange("", "");
        return;
      }

      const start = selected.from ? toIso(selected.from) : "";
      const end = selected.to ? toIso(selected.to) : "";

      // When start is selected but no end yet, sync right month to start month
      if (selected.from && !selected.to) {
        setDisplayMonth(selected.from);
      }

      onChange(start, end);

      // Close when a complete range is selected
      if (selected.from && selected.to) {
        setIsOpen(false);
      }
    },
    [onChange]
  );

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("", "");
    setIsOpen(false);
  }

  const triggerLabel =
    startDate && endDate
      ? `${formatDisplay(startDate)} – ${formatDisplay(endDate)}`
      : startDate
      ? `${formatDisplay(startDate)} – select return`
      : "Select dates";

  const hasSelection = !!startDate;

  return (
    <div className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: "12px",
          border: `1px solid ${isOpen ? "#2ABFBF" : "#2E2B25"}`,
          background: "#252219",
          color: hasSelection ? "#F2EEE8" : "#6B6258",
          fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
          fontSize: "14px",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "border-color 0.15s ease",
        }}
      >
        <Calendar style={{ width: "15px", height: "15px", flexShrink: 0, color: "#6B6258" }} />
        <span style={{ flex: 1 }}>{triggerLabel}</span>
        {hasSelection && (
          <X
            onClick={handleClear}
            style={{
              width: "14px",
              height: "14px",
              flexShrink: 0,
              color: "#6B6258",
              cursor: "pointer",
            }}
          />
        )}
      </button>

      {/* Inline calendar */}
      {isOpen && (
        <div
          style={{
            marginTop: "8px",
            padding: "12px",
            borderRadius: "14px",
            border: "1px solid #2E2B25",
            background: "#1C1A17",
            overflow: "auto",
          }}
        >
          <DayPicker
            mode="range"
            selected={range}
            onSelect={handleSelect}
            numberOfMonths={2}
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            disabled={{ before: new Date() }}
          />
        </div>
      )}
    </div>
  );
}
```

**Step 4: Verify component renders in isolation**

```bash
npm run dev
```

No import errors should appear in the terminal. The component isn't integrated yet — just confirm no build errors.

**Step 5: Commit**

```bash
git add src/components/explore/DateRangePicker.tsx src/app/globals.css package.json package-lock.json
git commit -m "feat: add react-day-picker DateRangePicker component with dark theme"
```

---

## Task 5: Integrate DateRangePicker into TripInputForm

**Files:**
- Modify: `src/components/explore/TripInputForm.tsx`

**Step 1: Import DateRangePicker**

Add to the imports at the top of `TripInputForm.tsx`:

```tsx
import { DateRangePicker } from "./DateRangePicker";
```

**Step 2: Replace specific dates inputs in datesField**

In the `datesField` const, find the `<>` block inside `dateType === "specific"` (around line 456). Currently:

```tsx
<>
  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
    <input type="date" value={startDate} ... />
    <span ...>to</span>
    <input type="date" value={endDate} ... />
  </div>
  {endDateError && ...}
</>
```

Replace with:

```tsx
<>
  <DateRangePicker
    startDate={startDate}
    endDate={endDate}
    onChange={(start, end) => {
      setStartDate(start);
      setEndDate(end);
      if (start && end) {
        setEndDateError(validateDateRange(start, end));
      } else {
        setEndDateError(null);
      }
    }}
  />
  {endDateError && (
    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
      <span>⚠</span> {endDateError}
    </p>
  )}
</>
```

**Step 3: Verify visually**

```bash
npm run dev
```

Open http://localhost:3000 → Step 2 → "Specific dates". Confirm:
- Trigger shows "Select dates"
- Clicking opens an inline two-month dark calendar
- Selecting a start date syncs the right month and shows "10 May – select return"
- Selecting an end date closes the picker and shows "10 May – 17 May"
- The X button clears the selection

**Step 4: Commit**

```bash
git add src/components/explore/TripInputForm.tsx
git commit -m "feat: integrate inline date range picker into trip form"
```

---

## Task 6: Full-screen loading overlay

**Files:**
- Modify: `src/app/explore/page.tsx`

**Step 1: Add overlay state**

In `ExplorePage`, after the existing state declarations (around line 32), add:

```tsx
const [overlayVisible, setOverlayVisible] = useState(false);
const [overlayFading, setOverlayFading] = useState(false);
const overlayFadingRef = useRef(false);
```

**Step 2: Show overlay when search starts**

Add a `useEffect` that watches `isLoading`:

```tsx
useEffect(() => {
  if (isLoading) {
    setOverlayVisible(true);
    setOverlayFading(false);
    overlayFadingRef.current = false;
  }
}, [isLoading]);
```

**Step 3: Cross-fade when enough results arrive**

Add a second `useEffect` that watches destinations count:

```tsx
const destCount = (effectiveResult?.destinations ?? []).filter(Boolean).length;

useEffect(() => {
  if (overlayVisible && destCount >= 2 && !overlayFadingRef.current) {
    overlayFadingRef.current = true;
    setOverlayFading(true);
    const timer = setTimeout(() => {
      setOverlayVisible(false);
      setOverlayFading(false);
      overlayFadingRef.current = false;
    }, 400);
    return () => clearTimeout(timer);
  }
}, [overlayVisible, destCount]);
```

**Step 4: Add the overlay JSX**

Inside the `return (...)` of `ExplorePage`, add as the **first child of the outermost `<div>`**, before the `<header>`:

```tsx
{/* Full-screen loading overlay */}
{overlayVisible && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 100,
      background: "#0F0E0D",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: overlayFading ? 0 : 1,
      transition: "opacity 0.4s ease",
      pointerEvents: overlayFading ? "none" : "auto",
    }}
  >
    <ExploreLoadingState />
  </div>
)}
```

**Step 5: Suppress the ResultsPanel's own loading state during overlay**

`ResultsPanel` already renders `ExploreLoadingState` internally when `isLoading && destinations.length === 0`. Once our overlay is showing, we don't want a duplicate. Pass a prop to suppress it — but rather than changing ResultsPanel's interface, simply don't render `ResultsPanel` while the overlay is visible.

In the `{showLayout && ( <section ref={resultsRef}> ... </section> )}` block, wrap it:

```tsx
{showLayout && !overlayVisible && (
  <section ref={resultsRef} className="min-w-0">
    <ResultsPanel ... />
  </section>
)}
```

Also suppress the left-panel map during overlay:
```tsx
{showLayout && !overlayVisible && mapMarkers.length > 0 && (
  <ExploreMap ... />
)}
```

**Step 6: Verify visually**

```bash
npm run dev
```

Submit a search. Confirm:
- Screen goes full-screen dark with suitcase centred
- No form/results visible during loading
- When ~2 destinations arrive, smooth fade to the two-panel results layout

**Step 7: Commit**

```bash
git add src/app/explore/page.tsx
git commit -m "feat: full-screen loading overlay with cross-fade to results"
```

---

## Task 7: Restyle FavoriteButton with orange palette

**Files:**
- Modify: `src/components/favorites/FavoriteButton.tsx`

**Step 1: Replace red colours with orange**

In `FavoriteButton.tsx`, find the `<button>` className (around line 96). Replace:

```tsx
// Before:
isFavorited
  ? "bg-red-50 border-red-200 text-red-500 dark:bg-red-950 dark:border-red-800"
  : "border-border text-muted-foreground hover:text-red-500 hover:border-red-200",

// After:
isFavorited
  ? "text-[#E8833A]"
  : "border-border text-[#F2EEE8] hover:border-[#E8833A] hover:text-[#E8833A]",
```

And add inline style for the saved/hover backgrounds and pulse animation. Replace the full `<button>` element:

```tsx
<button
  onClick={handleClick}
  disabled={loading}
  style={{
    background: isFavorited ? "rgba(232,131,58,0.15)" : "transparent",
    borderColor: isFavorited ? "#E8833A" : undefined,
    transition: "all 0.15s ease",
  }}
  className={cn(
    btnSize,
    "rounded-full border transition-all",
    isFavorited
      ? "border-[#E8833A] text-[#E8833A]"
      : "border-border text-[#F2EEE8] hover:border-[#E8833A] hover:bg-[rgba(232,131,58,0.08)]",
    loading && "opacity-50"
  )}
  title={isFavorited ? "Remove from favorites" : "Save to favorites"}
>
  <Heart
    className={cn(iconSize, isFavorited && "fill-current")}
    style={isFavorited ? { color: "#E8833A" } : undefined}
  />
</button>
```

**Step 2: Add save pulse via CSS keyframe**

In `src/app/globals.css`, add after the react-day-picker section:

```css
/* Heart button save pulse */
@keyframes heartPulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.heart-pulse {
  animation: heartPulse 0.2s ease;
}
```

In `FavoriteButton.tsx`, add state to trigger the pulse:

```tsx
const [isPulsing, setIsPulsing] = useState(false);
```

In `handleSaveToList`, after `onToggle("optimistic")`:

```tsx
setIsPulsing(true);
setTimeout(() => setIsPulsing(false), 200);
```

Add `className={cn(iconSize, isFavorited && "fill-current", isPulsing && "heart-pulse")}` to the `<Heart>` icon.

**Step 3: Verify**

```bash
npm run dev
```

Save a destination — heart fills orange with a brief pulse.

**Step 4: Commit**

```bash
git add src/components/favorites/FavoriteButton.tsx src/app/globals.css
git commit -m "feat: restyle FavoriteButton with orange palette and save pulse"
```

---

## Task 8: Heart button inside DestinationCard

**Files:**
- Modify: `src/components/results/DestinationCard.tsx`
- Modify: `src/components/results/ResultsPanel.tsx`

**Step 1: Add props to DestinationCard**

In `DestinationCard.tsx`, update the `DestinationCardProps` interface:

```tsx
interface DestinationCardProps {
  destination: DeepPartial<DestinationSummary> | DeepPartial<DestinationSuggestion>;
  rank: number;
  isRecommended?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  homeCity?: string;
  // Favourites
  isFavorited?: boolean;
  favoriteId?: string | null;
  onFavoriteToggle?: (newId: string | null) => void;
  onAuthRequired?: () => void;
}
```

Update the function signature to destructure these new props:

```tsx
export function DestinationCard({
  destination,
  rank,
  isRecommended,
  isSelected,
  onClick,
  homeCity,
  isFavorited = false,
  favoriteId = null,
  onFavoriteToggle,
  onAuthRequired,
}: DestinationCardProps) {
```

**Step 2: Import FavoriteButton**

Add to the imports:

```tsx
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
```

**Step 3: Move rank badge and add heart button**

In the image container (inside `<div style={{ position: "relative", paddingTop: "56.25%" }}>`) find the rank badge span (currently `position: absolute, top: 10px, left: 10px`). Change it to bottom-left:

```tsx
{/* Rank badge — bottom-left */}
<span
  style={{
    position: "absolute",
    bottom: "10px",
    left: "10px",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "rgba(15,14,13,0.7)",
    backdropFilter: "blur(4px)",
    border: "1.5px solid rgba(255,255,255,0.15)",
    color: "#F2EEE8",
    fontSize: "12px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ...DM,
  }}
>
  {rank}
</span>
```

Add the heart button at **top-left** of the image area, before the rank badge:

```tsx
{/* Heart / favourite button — top-left */}
{onFavoriteToggle && (
  <div
    style={{
      position: "absolute",
      top: "12px",
      left: "12px",
      zIndex: 2,
    }}
    onClick={(e) => e.stopPropagation()}
  >
    <FavoriteButton
      destination={destination as DeepPartial<import("@/lib/ai/schemas").DestinationSuggestion>}
      isFavorited={isFavorited}
      favoriteId={favoriteId}
      onToggle={onFavoriteToggle}
      onAuthRequired={onAuthRequired}
      size="sm"
    />
  </div>
)}
```

Note: wrap in a `stopPropagation` div so the card's own `onClick` isn't fired when clicking the heart.

**Step 4: Update ResultsPanel to pass favourites props per card**

In `ResultsPanel.tsx`, find the `<DestinationCard>` call inside the destinations map. It currently has props like `destination`, `rank`, `isRecommended`, `isSelected`, `onClick`, `homeCity`. Add:

```tsx
isFavorited={!!(destination?.name && favoritesMap[destination.name])}
favoriteId={destination?.name ? (favoritesMap[destination.name] ?? null) : null}
onFavoriteToggle={(newId) => {
  if (!destination?.name) return;
  setFavoritesMap((prev) => {
    const next = { ...prev };
    if (newId) {
      next[destination.name!] = newId;
    } else {
      delete next[destination.name!];
    }
    return next;
  });
}}
onAuthRequired={() => onAuthRequired?.(destination?.name ?? undefined)}
```

**Step 5: Verify**

```bash
npm run dev
```

Run a search. Confirm:
- Each card shows a heart button top-left of image
- Rank number is now bottom-left
- Clicking heart (when signed in) saves with orange fill
- Clicking heart (when signed out) triggers sign-in modal

**Step 6: Commit**

```bash
git add src/components/results/DestinationCard.tsx src/components/results/ResultsPanel.tsx src/components/favorites/FavoriteButton.tsx
git commit -m "feat: add heart button to destination cards, orange favourite styling"
```

---

## Task 9: Card typography, body padding, and map panel size

**Files:**
- Modify: `src/components/results/DestinationCard.tsx`
- Modify: `src/app/explore/page.tsx`

**Step 1: Update card typography and padding in DestinationCard.tsx**

Apply the following style value changes:

| Location in file | Property | Before | After |
|---|---|---|---|
| `<h3>` destination title (line ~193) | `fontSize` | `"16px"` | `"22px"` |
| `<h3>` destination title | `fontWeight` | `600` | `500` |
| `destination.reasoning` paragraph | `fontSize` | `"13px"` | `"14px"` |
| Road trip badge spans (drivingPace, driveHours, travelMode) | `fontSize` | `"11px"` | `"12px"` |
| Cost/duration row spans | `fontSize` | `"12px"` | `"14px"` |
| `<div style={{ padding: "14px 16px 16px" ...}>` card body | `padding` | `"14px 16px 16px"` | `"16px 20px 20px"` |
| "View details" div at bottom | `fontSize` | `"12px"` | `"14px"` |

**Step 2: Update map panel dimensions in explore/page.tsx**

Find the grid template (around line 175):
```tsx
// Before:
"grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 py-4 sm:py-6"

// After:
"grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 py-4 sm:py-6"
```

Find the ExploreMap height prop in the left panel (around line 233):
```tsx
// Before:
height={300}

// After:
height={400}
```

**Step 3: Verify**

```bash
npm run dev
```

Run a search. Confirm: destination names are visibly larger (22px Clash Display), body text feels more spacious, map is taller.

**Step 4: Commit**

```bash
git add src/components/results/DestinationCard.tsx src/app/explore/page.tsx
git commit -m "feat: increase card typography sizes, body padding, and map panel height"
```

---

## Task 10: Card–map hover sync

**Files:**
- Modify: `src/app/explore/page.tsx`
- Modify: `src/components/results/ResultsPanel.tsx`
- Modify: `src/components/results/ExploreMap.tsx`
- Modify: `src/components/results/ExploreMapInner.tsx`

**Step 1: Read ExploreMapInner to understand current marker API**

Before editing, read `src/components/results/ExploreMapInner.tsx` to find the `MapMarker` interface and the current `onMarkerClick` prop shape. This tells you what to add for hover.

**Step 2: Add onMarkerHover to ExploreMapInner**

In `ExploreMapInner.tsx`, find the props interface and add:
```tsx
onMarkerHover?: (id: string | null) => void;
```

On the marker element, add `onMouseEnter` / `onMouseLeave`:
```tsx
onMouseEnter={() => onMarkerHover?.(marker.id)}
onMouseLeave={() => onMarkerHover?.(null)}
```

Mark with a comment if the implementation is complex:
```tsx
// TODO: card-map sync — hover callbacks
```

**Step 3: Thread onMarkerHover through ExploreMap**

In `ExploreMap.tsx`, add `onMarkerHover?: (id: string | null) => void` to props and pass it through to `ExploreMapInner`.

**Step 4: Add hoveredDestName state in explore/page.tsx**

```tsx
const [hoveredDestName, setHoveredDestName] = useState<string | null>(null);
```

Pass to ExploreMap:
```tsx
<ExploreMap
  markers={mapMarkers}
  selectedId={hoveredDestName}   // highlights hovered card's pin
  showRoute={false}
  onMarkerClick={() => {}}
  onMarkerHover={(id) => setHoveredDestName(id)}
  height={400}
/>
```

Pass to ResultsPanel:
```tsx
<ResultsPanel
  ...
  hoveredDestName={hoveredDestName}
  onCardHover={(name) => setHoveredDestName(name)}
/>
```

**Step 5: Add hoveredDestName and onCardHover to ResultsPanel**

In `ResultsPanel.tsx`, add to the props interface:
```tsx
hoveredDestName?: string | null;
onCardHover?: (name: string | null) => void;
```

On each card wrapper div, add hover handlers. Find where `DestinationCard` is rendered inside a wrapping div or add a wrapper:

```tsx
<div
  key={destination.name}
  onMouseEnter={() => onCardHover?.(destination.name ?? null)}
  onMouseLeave={() => onCardHover?.(null)}
  style={{
    borderRadius: "14px",
    border: hoveredDestName === destination.name
      ? "1px solid #2ABFBF"
      : "1px solid transparent",
    boxShadow: hoveredDestName === destination.name
      ? "0 0 0 2px rgba(42,191,191,0.2)"
      : "none",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  }}
>
  <DestinationCard ... />
</div>
```

**Step 6: Verify**

```bash
npm run dev
```

Run a search. Confirm:
- Hovering a result card makes its map pin highlight (orange/teal)
- Hovering a map pin highlights the corresponding card with a teal border glow

**Step 7: Commit**

```bash
git add src/app/explore/page.tsx src/components/results/ResultsPanel.tsx src/components/results/ExploreMap.tsx src/components/results/ExploreMapInner.tsx
git commit -m "feat: card-map hover sync — pin highlights card, card highlights pin"
```

---

## Final verification

Run the full test suite to confirm no regressions:

```bash
cd "/Users/dave/Rough Idea Travel/rough-idea-travel-main"
npm run test:run
```

Expected: all existing tests pass.

Run a full end-to-end smoke test:
```bash
npm run dev
```

Check list:
- [ ] Step 1: "Driving Distance" selected — no starting point field appears
- [ ] Step 2 flexible: duration chips appear, "Other" expands input
- [ ] Step 2 flexible: flexible date text field shows ✓ Got it inline on blur
- [ ] Step 2 specific: date range picker opens inline, right month syncs to departure
- [ ] Step 1: region field shows ✓ Got it inline on blur
- [ ] Step 3: textarea is narrower, ✓ Got it appears beside it on blur
- [ ] Submitting search: full-screen suitcase appears, cross-fades to results
- [ ] Results cards: heart button top-left, rank bottom-left
- [ ] Results cards: destination names are 22px, body padding is larger
- [ ] Map panel: visibly taller/wider
- [ ] Card hover: corresponding map pin changes colour
- [ ] Pin hover: corresponding card glows teal
