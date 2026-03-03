# Multi-Step Card Form Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the progressive-disclosure stacking form with a clean 4-card wizard where users see one card at a time, can skip any card, and always have the Search button reachable.

**Architecture:** All changes are in `src/components/explore/TripInputForm.tsx` plus two CSS lines in `src/app/globals.css`. The 3-mode system (progressive disclosure / card edit / summary) collapses to 2 modes: card mode (used for initial fill and post-submit editing) and summary mode (unchanged). Navigation uses explicit Next/Back buttons; a ghost Search button is present on every card so users can submit at any point without completing all fields.

**Tech Stack:** React, TypeScript, Tailwind CSS v4, Next.js App Router

---

### Task 1: Trim constants, state, auto-advance effects, and deleted features

**Files:**
- Modify: `src/components/explore/TripInputForm.tsx`

**Context:** The file has 3 render modes and 7 progressive-disclosure steps with auto-advance useEffects. This task removes all progressive-disclosure machinery and the deleted features (compare places, advanced options). Read the file in full before editing.

---

**Step 1: Update constants (lines 83–86)**

Replace:
```typescript
const TOTAL_STEPS = 7;
const TOTAL_CARDS = 5;
const CARD_LABELS = ["Origin", "Dates", "Interests", "Preferences", "Finish"];
```

With:
```typescript
const TOTAL_CARDS = 4;
const CARD_LABELS = ["Origin", "When", "Vibe", "Details"];
```

---

**Step 2: Remove deleted state variables**

Inside `TripInputForm`, delete these state declarations:
```typescript
const [showAdvanced, setShowAdvanced] = useState(false);
const [comparePlaces, setComparePlaces] = useState<string[]>([]);
const [newPlace, setNewPlace] = useState("");
const [travelers, setTravelers] = useState(1);
const [additionalNotes, setAdditionalNotes] = useState("");
const [currentStep, setCurrentStep] = useState(0);
const [travelRangeTouched, setTravelRangeTouched] = useState(false);
const [preferencesSectionTouched, setPreferencesSectionTouched] = useState(false);
const [locationTouched, setLocationTouched] = useState(false);
```

Also delete the `homeCityTimerRef` line (was only used by the auto-advance effect):
```typescript
const homeCityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

---

**Step 3: Remove the `StepSection` component (lines 113–128)**

Delete the entire `StepSection` function:
```typescript
function StepSection({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "transition-all duration-500 ease-out",
        visible
          ? "max-h-[800px] opacity-100 translate-y-0 overflow-visible"
          : "max-h-0 opacity-0 -translate-y-2 pointer-events-none overflow-hidden"
      )}
    >
      {children}
    </div>
  );
}
```

---

**Step 4: Remove all 6 auto-advance useEffects**

Delete these effects (they all have a comment starting with `// Auto-advance:`):

1. `// Auto-advance: home city (debounced 500ms)` — 10-line effect
2. `// Auto-advance: travel range clicked` — 6-line effect
3. `// Auto-advance: dates filled` — 14-line effect
4. `// Auto-advance: at least 1 interest selected` — 8-line effect
5. `// Auto-advance: weather/style/budget section` — 8-line effect (also delete the `const [preferencesSectionTouched, setPreferencesSectionTouched] = useState(false)` that lives just before it)
6. `// Auto-advance: location preference` — 14-line effect

---

**Step 5: Remove helper functions for deleted features**

Delete `addPlace()` and `removePlace()` functions.

---

**Step 6: Remove `setTravelRangeTouched` call inside `travelRangeField`**

In the `travelRangeField` JSX, the onClick for each travel range button calls both `setTravelRange` and `setTravelRangeTouched`. Remove only the `setTravelRangeTouched(true)` line from each onClick.

---

**Step 7: Simplify mode-logic variables**

Replace:
```typescript
const isExpanded = hasSubmittedOnce || !!hasResults;
const showCardMode = isExpanded && isEditing;
const showSummary = isExpanded && !isEditing;
const isStepVisible = (step: number) => isExpanded || step <= currentStep;
```

With:
```typescript
const showSummary = (hasSubmittedOnce || !!hasResults) && !isEditing;
```

---

**Step 8: Remove unused imports**

From the lucide-react import, remove: `ChevronDown`, `ChevronUp`, `Users`.

---

**Step 9: Run tests**

```bash
npm run test:run
```
Expected: All 82 tests pass (no unit tests cover this component directly).

---

**Step 10: Commit**

```bash
git add "src/components/explore/TripInputForm.tsx"
git commit -m "refactor: remove progressive disclosure, compare places, and advanced state"
```

---

### Task 2: Update buildTripInput and field variables

**Files:**
- Modify: `src/components/explore/TripInputForm.tsx`

**Context:** With dead state removed, update the data-building function and split/simplify the JSX field variables. `travelers` has `.default(1)` in the Zod schema so it can be omitted. `locationPreference.type` will only ever be `"open"` or `"region"` from now on.

---

**Step 1: Replace buildTripInput()**

```typescript
function buildTripInput(): TripInput {
  return {
    ...(homeCity ? { homeCity } : {}),
    ...(travelRange && travelRange !== "any" ? { travelRange } : {}),
    dates: {
      flexible: dateType === "flexible",
      ...(dateType === "flexible"
        ? { description: dateDescription, durationDays: { min: duration, max: duration } }
        : { startDate, endDate }
      ),
    },
    interests,
    weatherPreference: weatherPreference === "any" ? undefined : weatherPreference,
    budgetLevel,
    tripStyle,
    locationPreference: {
      type: locationType as "open" | "region",
      ...(locationType === "region" ? { value: regionValue } : {}),
    },
    ...(startingPoint ? { startingPoint } : {}),
  };
}
```

---

**Step 2: Extract `tripStyleField` from `preferencesField`**

Add this new const after `interestsField`:

```typescript
const tripStyleField = (
  <fieldset>
    <legend className="flex items-center gap-2 text-sm font-medium mb-3">
      <Compass className="h-4 w-4 text-primary" />
      Trip style
    </legend>
    <div className="grid grid-cols-3 gap-2">
      {TRIP_STYLES.map((style) => (
        <button
          key={style.value}
          type="button"
          onClick={() => setTripStyle(style.value)}
          className={cn(chipClass(tripStyle === style.value), "flex items-center justify-center py-2.5")}
        >
          {style.label}
        </button>
      ))}
    </div>
  </fieldset>
);
```

---

**Step 3: Extract `weatherBudgetField` from `preferencesField`**

Add this new const after `tripStyleField`:

```typescript
const weatherBudgetField = (
  <div className="space-y-5">
    <fieldset>
      <legend className="flex items-center gap-2 text-sm font-medium mb-3">
        <Sun className="h-4 w-4 text-primary" />
        Weather preference
      </legend>
      <div className="flex flex-wrap gap-2">
        {WEATHER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setWeatherPreference(opt.value)}
            className={chipClass(weatherPreference === opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </fieldset>

    <fieldset>
      <legend className="flex items-center gap-2 text-sm font-medium mb-3">
        <DollarSign className="h-4 w-4 text-primary" />
        Budget
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {BUDGET_LEVELS.map((level) => (
          <button
            key={level.value}
            type="button"
            onClick={() => setBudgetLevel(level.value)}
            className={cn(chipClass(budgetLevel === level.value), "flex flex-col items-start text-left")}
          >
            <span className="font-medium text-foreground">{level.label}</span>
            <span className="text-xs text-muted-foreground">{level.desc}</span>
          </button>
        ))}
      </div>
    </fieldset>
  </div>
);
```

---

**Step 4: Replace `locationField` — remove the "specific" branch**

```typescript
const locationField = (
  <fieldset>
    <legend className="flex items-center gap-2 text-sm font-medium mb-3">
      <MapPin className="h-4 w-4 text-primary" />
      Where are you thinking?
    </legend>
    <div className="flex gap-2 mb-3">
      {[
        { value: "open" as const, label: "Surprise me" },
        { value: "region" as const, label: "Region" },
      ].map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setLocationType(opt.value)}
          className={pillClass(locationType === opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
    {locationType === "region" && (
      <div className="flex gap-2">
        <input
          type="text"
          value={regionValue}
          onChange={(e) => {
            setRegionValue(e.target.value);
            setRegionConfirmed(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && regionValue.trim().length > 0) {
              e.preventDefault();
              setRegionConfirmed(true);
            }
          }}
          placeholder='e.g. "Southern Europe", "Southeast Asia"'
          className={cn(inputClass, "flex-1")}
        />
        {regionValue.trim().length > 0 && !regionConfirmed && (
          <button
            type="button"
            onClick={() => setRegionConfirmed(true)}
            className="px-3 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex-shrink-0"
            aria-label="Confirm region"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
        {regionConfirmed && (
          <span className="flex items-center px-3 text-primary">
            <Check className="h-4 w-4" />
          </span>
        )}
      </div>
    )}
  </fieldset>
);
```

---

**Step 5: Delete `preferencesField` and `advancedAndSubmitField`**

Remove the entire `preferencesField` const (the `div` with weather + trip style + budget) and the entire `advancedAndSubmitField` const (advanced toggle + travelers + notes + submit button).

---

**Step 6: Update `summaryPills` card indices**

The pills now reference 4 cards (0–3). Replace the existing `summaryPills` block with:

```typescript
const summaryPills: { label: string; card: number }[] = [];
if (homeCity) summaryPills.push({ label: homeCity, card: 0 });
if (travelRange && travelRange !== "any") {
  const rangeLabel = TRAVEL_RANGES.find((r) => r.value === travelRange)?.label;
  if (rangeLabel) summaryPills.push({ label: rangeLabel, card: 0 });
}
if (dateType === "specific" && startDate && endDate) {
  const fmt = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); } catch { return d; }
  };
  summaryPills.push({ label: `${fmt(startDate)} – ${fmt(endDate)}`, card: 1 });
} else if (dateType === "flexible" && dateDescription) {
  summaryPills.push({ label: dateDescription, card: 1 });
}
if (interests.length > 0) {
  summaryPills.push({ label: interests.length <= 2 ? interests.join(", ") : `${interests.length} interests`, card: 2 });
}
const styleLabel = TRIP_STYLES.find((s) => s.value === tripStyle)?.label;
if (styleLabel && tripStyle !== "mixed") summaryPills.push({ label: styleLabel, card: 2 });
const budgetLabel = BUDGET_LEVELS.find((b) => b.value === budgetLevel)?.label;
if (budgetLabel) summaryPills.push({ label: budgetLabel, card: 3 });
```

---

**Step 7: Run tests**

```bash
npm run test:run
```
Expected: All 82 tests pass.

---

**Step 8: Commit**

```bash
git add "src/components/explore/TripInputForm.tsx"
git commit -m "refactor: update buildTripInput and split field vars for 4-card layout"
```

---

### Task 3: Add slide animations to globals.css

**Files:**
- Modify: `src/app/globals.css`

**Context:** The existing `animate-fade-in` animation lives at the bottom of `src/app/globals.css` (lines 236–242). Add two directional slide animations alongside it. These will be used in Task 4 for card transitions.

---

**Step 1: Add keyframes and utility classes after the existing `animate-fade-in` block**

After the closing `}` of `.animate-fade-in`, add:

```css
@keyframes slide-from-right {
  from { opacity: 0; transform: translateX(1rem); }
  to   { opacity: 1; transform: translateX(0); }
}
.animate-slide-from-right {
  animation: slide-from-right 0.22s ease-out both;
}

@keyframes slide-from-left {
  from { opacity: 0; transform: translateX(-1rem); }
  to   { opacity: 1; transform: translateX(0); }
}
.animate-slide-from-left {
  animation: slide-from-left 0.22s ease-out both;
}
```

---

**Step 2: Run tests**

```bash
npm run test:run
```
Expected: All 82 tests pass.

---

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add slide-from-right/left animations for card transitions"
```

---

### Task 4: Rewrite the render — unified card mode + summary

**Files:**
- Modify: `src/components/explore/TripInputForm.tsx`

**Context:** This is the main render rewrite. The file currently has three render blocks at the bottom (Mode 1 summary, Mode 2 card edit, Mode 3 progressive). Delete all three and replace with two: summary (unchanged logic, same JSX) and a unified card mode used for both initial fill and post-submit editing. Add `slideDirection` state and direction-aware navigation helpers.

---

**Step 1: Add `slideDirection` state**

Add with the other state declarations near the top of `TripInputForm`:

```typescript
const [slideDirection, setSlideDirection] = useState<"forward" | "back">("forward");
```

---

**Step 2: Add navigation helpers**

Add these functions after `handleUpdateSearch`:

```typescript
function goToCard(index: number) {
  setSlideDirection(index > activeCard ? "forward" : "back");
  setActiveCard(index);
}

function handleNext() {
  if (activeCard < TOTAL_CARDS - 1) goToCard(activeCard + 1);
}

function handleBack() {
  if (activeCard > 0) goToCard(activeCard - 1);
}
```

---

**Step 3: Update `handleSubmit` and `handleUpdateSearch`**

`handleSubmit` sets `isEditing = false` and calls `onSubmit`. Make sure it also sets `setHasSubmittedOnce(true)`:

```typescript
function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setHasSubmittedOnce(true);
  setIsEditing(false);
  onSubmit(buildTripInput());
}

function handleUpdateSearch() {
  setIsEditing(false);
  onSubmit(buildTripInput());
}
```

These are likely already correct — verify they match and leave them if so.

---

**Step 4: Delete all three render blocks and replace**

Delete everything from `// --- Summary pills for collapsed view ---` down to the end of the file, and replace with the following complete render section:

```typescript
// --- Summary pills ---
const summaryPills: { label: string; card: number }[] = [];
if (homeCity) summaryPills.push({ label: homeCity, card: 0 });
if (travelRange && travelRange !== "any") {
  const rangeLabel = TRAVEL_RANGES.find((r) => r.value === travelRange)?.label;
  if (rangeLabel) summaryPills.push({ label: rangeLabel, card: 0 });
}
if (dateType === "specific" && startDate && endDate) {
  const fmt = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); } catch { return d; }
  };
  summaryPills.push({ label: `${fmt(startDate)} – ${fmt(endDate)}`, card: 1 });
} else if (dateType === "flexible" && dateDescription) {
  summaryPills.push({ label: dateDescription, card: 1 });
}
if (interests.length > 0) {
  summaryPills.push({ label: interests.length <= 2 ? interests.join(", ") : `${interests.length} interests`, card: 2 });
}
const styleLabel = TRIP_STYLES.find((s) => s.value === tripStyle)?.label;
if (styleLabel && tripStyle !== "mixed") summaryPills.push({ label: styleLabel, card: 2 });
const budgetLabel = BUDGET_LEVELS.find((b) => b.value === budgetLevel)?.label;
if (budgetLabel) summaryPills.push({ label: budgetLabel, card: 3 });

// --- Render: summary mode ---
if (showSummary) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Your search</h3>
        <button
          type="button"
          onClick={() => { setIsEditing(true); goToCard(0); }}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {summaryPills.map((pill, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { setIsEditing(true); goToCard(pill.card); }}
            className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs border border-border hover:border-primary/30 transition-colors"
          >
            {pill.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={handleUpdateSearch}
        disabled={isLoading}
        className={cn(
          "w-full py-3 rounded-xl font-medium text-sm transition-all",
          isLoading
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-foreground text-background hover:opacity-90 shadow-md hover:shadow-lg"
        )}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
            Exploring...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Compass className="h-4 w-4" />
            Search again
          </span>
        )}
      </button>
    </div>
  );
}

// --- Render: card mode (initial fill + editing) ---
const cardContent = [
  <div key={0} className="space-y-5">{homeCityField}{travelRangeField}</div>,
  <div key={1} className="space-y-5">{datesField}</div>,
  <div key={2} className="space-y-5">{interestsField}{tripStyleField}</div>,
  <div key={3} className="space-y-5">{weatherBudgetField}{locationField}</div>,
];

const isLastCard = activeCard === TOTAL_CARDS - 1;

const searchButton = (primary: boolean) => (
  <button
    type="submit"
    disabled={isLoading}
    className={cn(
      "w-full rounded-xl font-medium text-sm transition-all",
      primary
        ? cn(
            "py-3",
            isLoading
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-foreground text-background hover:opacity-90 shadow-md hover:shadow-lg"
          )
        : cn(
            "py-2.5 border",
            isLoading
              ? "border-border text-muted-foreground cursor-not-allowed"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
          )
    )}
  >
    {isLoading ? (
      <span className="flex items-center justify-center gap-2">
        <span className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
        Exploring...
      </span>
    ) : (
      <span className="flex items-center justify-center gap-2">
        <Compass className="h-4 w-4" />
        {primary ? "Search" : "Search now"}
      </span>
    )}
  </button>
);

return (
  <form onSubmit={handleSubmit} className="space-y-4">
    {/* Progress bar — clickable segments */}
    <div className="flex gap-1.5">
      {Array.from({ length: TOTAL_CARDS }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => goToCard(i)}
          className={cn(
            "h-1.5 rounded-full flex-1 transition-all duration-300",
            i <= activeCard ? "bg-primary" : "bg-border"
          )}
          title={CARD_LABELS[i]}
        />
      ))}
    </div>

    {/* Step label */}
    <p className="text-xs text-muted-foreground font-medium">
      Step {activeCard + 1} of {TOTAL_CARDS} · {CARD_LABELS[activeCard]}
    </p>

    {/* Card content with directional slide animation */}
    <div
      key={activeCard}
      className={slideDirection === "forward" ? "animate-slide-from-right" : "animate-slide-from-left"}
    >
      {cardContent[activeCard]}
    </div>

    {/* Navigation row: Back / Next (or Search on last card) */}
    <div className="flex items-center gap-3 pt-1">
      {activeCard > 0 && (
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      )}
      <div className="flex-1" />
      {isLastCard ? (
        searchButton(true)
      ) : (
        <button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>

    {/* Ghost Search button — visible on cards 1–3 so users can submit at any time */}
    {!isLastCard && searchButton(false)}
  </form>
);
```

**Note on `searchButton` width:** On the last card the `searchButton(true)` is inside the flex row next to "Back", so it won't be full-width as designed. Fix: on the last card, render the Back button and the Search button in a column, or render Search outside the nav row. Simplest fix — when `isLastCard`, render the nav row with Back only, and render `searchButton(true)` as its own full-width block below it:

```typescript
{/* Navigation row */}
<div className="flex items-center gap-3 pt-1">
  {activeCard > 0 && (
    <button
      type="button"
      onClick={handleBack}
      className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
    >
      <ChevronLeft className="h-4 w-4" />
      Back
    </button>
  )}
  {!isLastCard && (
    <>
      <div className="flex-1" />
      <button
        type="button"
        onClick={handleNext}
        className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </>
  )}
</div>

{/* Primary Search on last card; ghost Search on cards 1–3 */}
{searchButton(isLastCard)}
```

Use this corrected version — it renders Search full-width below the nav row on every card, primary style on card 4, ghost style on cards 1–3.

---

**Step 5: Add `autoFocus` to first input per card**

In `homeCityField`, the city `<input>` already has `autoFocus={!isExpanded}`. Change it to always `autoFocus` (since card mode is now the only mode):

```typescript
autoFocus
```

In `datesField`, add `autoFocus` to the first date input (the `type="date"` start date input, or the flexible description input).

In `interestsField`, no text input on initial load — skip.

In `weatherBudgetField`, no text input — skip.

---

**Step 6: Run tests**

```bash
npm run test:run
```
Expected: All 82 tests pass.

---

**Step 7: Manual smoke test**

```bash
npm run dev
```

Open `http://localhost:3000/explore` and verify:

1. Fresh load — card 1 "Origin" shows. City input has focus. Ghost "Search now" button visible below Next.
2. Click Next without filling anything — card 2 "When" slides in from right.
3. Click Back — card 1 slides in from left.
4. Progress bar: clicking segment 3 jumps to card 3.
5. Select "Driving Distance" — starting point input appears.
6. On card 2, select Flexible — description + duration appear.
7. On card 3, select interests — chips toggle. Add a custom interest.
8. On card 4, "Search now" becomes the primary "Search" button.
9. Click Search from card 2 — form submits. Summary pills appear.
10. Click Edit — card mode reopens at card 0.
11. Click a summary pill — card mode opens at the correct card.

---

**Step 8: Commit**

```bash
git add "src/components/explore/TripInputForm.tsx"
git commit -m "feat: replace progressive disclosure with unified 4-card wizard"
```
