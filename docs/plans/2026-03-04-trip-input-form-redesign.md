# TripInputForm Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure TripInputForm from 4 cards to 3 focused steps, add group travel selection, fix all audit issues, and surface additionalNotes with examples.

**Architecture:** Extract pure helper functions (buildTripInput, validation, summary pills) to `src/lib/form/trip-input-builder.ts` for testability, then implement the visual restructure in `TripInputForm.tsx`. No schema changes required — group type chips map to existing `travelers: number`. No backend changes.

**Tech Stack:** React, TypeScript, Tailwind CSS v4, Vitest + React Testing Library, Zod (schemas untouched)

---

## Reference: New 3-Step Structure

| Step | Label | Fields |
|------|-------|--------|
| 0 | Where & Who | Home city · Travel range · Location preference · Group type |
| 1 | When & Weather | Date type · Date inputs or description · Duration · Weather preference |
| 2 | Vibe & Budget | Interests · Trip style · Budget · Additional notes (optional) |

## Reference: Group Type → travelers mapping

| Chip | travelers value |
|------|----------------|
| Solo | 1 |
| Couple | 2 |
| Small group (3–5) | 4 |
| Large group (6+) | 8 |

---

## Task 1: Create feature branch

**Files:** none

**Step 1: Create and switch to feature branch**

```bash
cd "rough-idea-travel-main"
git checkout -b feat/form-redesign
```

Expected: `Switched to a new branch 'feat/form-redesign'`

---

## Task 2: Create trip-input-builder helper module (failing tests first)

**Files:**
- Create: `src/lib/form/trip-input-builder.ts`
- Create: `src/__tests__/unit/trip-input-builder.test.ts`

**Step 1: Write the failing tests**

Create `src/__tests__/unit/trip-input-builder.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  groupTypeTravelers,
  buildTripInput,
  validateHomeCity,
  validateDateRange,
  buildSummaryPills,
  GROUP_TYPES,
} from '@/lib/form/trip-input-builder'

// --- groupTypeTravelers ---
describe('groupTypeTravelers', () => {
  it('maps solo to 1', () => expect(groupTypeTravelers('solo')).toBe(1))
  it('maps couple to 2', () => expect(groupTypeTravelers('couple')).toBe(2))
  it('maps small_group to 4', () => expect(groupTypeTravelers('small_group')).toBe(4))
  it('maps large_group to 8', () => expect(groupTypeTravelers('large_group')).toBe(8))
  it('maps unknown to 1', () => expect(groupTypeTravelers(undefined)).toBe(1))
})

// --- validateHomeCity ---
describe('validateHomeCity', () => {
  it('returns null for a non-empty city', () => expect(validateHomeCity('London')).toBeNull())
  it('returns error for empty string', () => expect(validateHomeCity('')).toBeTruthy())
  it('returns error for whitespace-only', () => expect(validateHomeCity('   ')).toBeTruthy())
})

// --- validateDateRange ---
describe('validateDateRange', () => {
  it('returns null when end is after start', () =>
    expect(validateDateRange('2026-06-01', '2026-06-10')).toBeNull())
  it('returns null when either date is empty', () => {
    expect(validateDateRange('', '2026-06-10')).toBeNull()
    expect(validateDateRange('2026-06-01', '')).toBeNull()
  })
  it('returns error when end is before start', () =>
    expect(validateDateRange('2026-06-10', '2026-06-01')).toBeTruthy())
  it('returns error when end equals start', () =>
    expect(validateDateRange('2026-06-01', '2026-06-01')).toBeTruthy())
})

// --- buildTripInput ---
describe('buildTripInput', () => {
  const base = {
    homeCity: 'London',
    travelRange: 'medium_haul' as const,
    dateType: 'specific' as const,
    startDate: '2026-07-01',
    endDate: '2026-07-10',
    dateDescription: '',
    duration: 7,
    groupType: 'couple' as const,
    interests: ['Hiking', 'Food & Wine'],
    weatherPreference: 'warm',
    budgetLevel: 'moderate' as const,
    tripStyle: 'mixed' as const,
    locationType: 'open' as const,
    regionValue: '',
    startingPoint: '',
    additionalNotes: '',
  }

  it('sets travelers from groupType', () => {
    expect(buildTripInput(base).travelers).toBe(2)
  })

  it('sets travelers to 1 when groupType undefined', () => {
    expect(buildTripInput({ ...base, groupType: undefined }).travelers).toBe(1)
  })

  it('includes homeCity when non-empty', () => {
    expect(buildTripInput(base).homeCity).toBe('London')
  })

  it('omits homeCity when empty', () => {
    expect(buildTripInput({ ...base, homeCity: '' }).homeCity).toBeUndefined()
  })

  it('uses specific dates correctly', () => {
    const result = buildTripInput(base)
    expect(result.dates.flexible).toBe(false)
    expect(result.dates.startDate).toBe('2026-07-01')
    expect(result.dates.endDate).toBe('2026-07-10')
  })

  it('uses flexible dates correctly', () => {
    const result = buildTripInput({
      ...base,
      dateType: 'flexible',
      dateDescription: 'mid-April',
      duration: 5,
    })
    expect(result.dates.flexible).toBe(true)
    expect(result.dates.description).toBe('mid-April')
    expect(result.dates.durationDays).toEqual({ min: 5, max: 5 })
  })

  it('omits weatherPreference when "any"', () => {
    expect(buildTripInput({ ...base, weatherPreference: 'any' }).weatherPreference).toBeUndefined()
  })

  it('includes additionalNotes when non-empty', () => {
    expect(buildTripInput({ ...base, additionalNotes: 'celebrating anniversary' }).additionalNotes)
      .toBe('celebrating anniversary')
  })

  it('omits additionalNotes when empty', () => {
    expect(buildTripInput({ ...base, additionalNotes: '' }).additionalNotes).toBeUndefined()
  })
})

// --- buildSummaryPills ---
describe('buildSummaryPills', () => {
  const base = {
    homeCity: 'Berlin',
    travelRange: 'medium_haul' as const,
    dateType: 'specific' as const,
    startDate: '2026-07-01',
    endDate: '2026-07-10',
    dateDescription: '',
    groupType: 'couple' as const,
    interests: ['Hiking'],
    tripStyle: 'adventure' as const,
    budgetLevel: 'moderate' as const,
    locationType: 'open' as const,
    regionValue: '',
  }

  it('includes homeCity pill', () => {
    const pills = buildSummaryPills(base)
    expect(pills.some(p => p.label === 'Berlin')).toBe(true)
  })

  it('includes groupType pill', () => {
    const pills = buildSummaryPills(base)
    expect(pills.some(p => p.label === 'Couple')).toBe(true)
  })

  it('includes formatted date range pill', () => {
    const pills = buildSummaryPills(base)
    expect(pills.some(p => p.label.includes('Jul'))).toBe(true)
  })

  it('groupType pill maps to card 0', () => {
    const pills = buildSummaryPills(base)
    const groupPill = pills.find(p => p.label === 'Couple')
    expect(groupPill?.card).toBe(0)
  })

  it('interests pill maps to card 2', () => {
    const pills = buildSummaryPills(base)
    const interestPill = pills.find(p => p.label.includes('interest') || p.label === 'Hiking')
    expect(interestPill?.card).toBe(2)
  })

  it('shows interest count when more than 2', () => {
    const pills = buildSummaryPills({
      ...base,
      interests: ['Hiking', 'Beaches', 'Nightlife'],
    })
    expect(pills.some(p => p.label === '3 interests')).toBe(true)
  })
})

// --- GROUP_TYPES constant ---
describe('GROUP_TYPES', () => {
  it('has 4 options', () => expect(GROUP_TYPES).toHaveLength(4))
  it('includes solo, couple, small_group, large_group values', () => {
    const values = GROUP_TYPES.map(g => g.value)
    expect(values).toContain('solo')
    expect(values).toContain('couple')
    expect(values).toContain('small_group')
    expect(values).toContain('large_group')
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npm run test:run -- src/__tests__/unit/trip-input-builder.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/form/trip-input-builder'`

**Step 3: Create the implementation**

Create `src/lib/form/trip-input-builder.ts`:

```typescript
import type { TripInput } from '@/lib/ai/schemas'
import { TRAVEL_RANGES, TRIP_STYLES, BUDGET_LEVELS } from '@/components/explore/TripInputForm.constants'

export type GroupType = 'solo' | 'couple' | 'small_group' | 'large_group' | undefined

export const GROUP_TYPES = [
  { value: 'solo' as const, label: 'Solo' },
  { value: 'couple' as const, label: 'Couple' },
  { value: 'small_group' as const, label: 'Small group (3–5)' },
  { value: 'large_group' as const, label: 'Large group (6+)' },
]

export function groupTypeTravelers(groupType: GroupType): number {
  switch (groupType) {
    case 'solo': return 1
    case 'couple': return 2
    case 'small_group': return 4
    case 'large_group': return 8
    default: return 1
  }
}

export function validateHomeCity(city: string): string | null {
  return city.trim().length > 0 ? null : 'Please enter your home city so we can find flights and distances.'
}

export function validateDateRange(startDate: string, endDate: string): string | null {
  if (!startDate || !endDate) return null
  return endDate > startDate ? null : 'End date must be after start date.'
}

export interface BuildTripInputState {
  homeCity: string
  travelRange: TripInput['travelRange']
  dateType: 'flexible' | 'specific'
  startDate: string
  endDate: string
  dateDescription: string
  duration: number
  groupType: GroupType
  interests: string[]
  weatherPreference: string
  budgetLevel: TripInput['budgetLevel']
  tripStyle: TripInput['tripStyle']
  locationType: 'open' | 'region'
  regionValue: string
  startingPoint: string
  additionalNotes: string
}

export function buildTripInput(state: BuildTripInputState): TripInput {
  return {
    ...(state.homeCity ? { homeCity: state.homeCity } : {}),
    ...(state.travelRange && state.travelRange !== 'any' ? { travelRange: state.travelRange } : {}),
    dates: {
      flexible: state.dateType === 'flexible',
      ...(state.dateType === 'flexible'
        ? { description: state.dateDescription, durationDays: { min: state.duration, max: state.duration } }
        : { startDate: state.startDate, endDate: state.endDate }
      ),
    },
    travelers: groupTypeTravelers(state.groupType),
    interests: state.interests,
    weatherPreference: state.weatherPreference === 'any' ? undefined : state.weatherPreference,
    budgetLevel: state.budgetLevel,
    tripStyle: state.tripStyle,
    locationPreference: {
      type: state.locationType as 'open' | 'region',
      ...(state.locationType === 'region' ? { value: state.regionValue } : {}),
    },
    ...(state.startingPoint ? { startingPoint: state.startingPoint } : {}),
    ...(state.additionalNotes.trim() ? { additionalNotes: state.additionalNotes.trim() } : {}),
  }
}

export interface SummaryPillState {
  homeCity: string
  travelRange: TripInput['travelRange']
  dateType: 'flexible' | 'specific'
  startDate: string
  endDate: string
  dateDescription: string
  groupType: GroupType
  interests: string[]
  tripStyle: TripInput['tripStyle']
  budgetLevel: TripInput['budgetLevel']
  locationType: 'open' | 'region'
  regionValue: string
}

export function buildSummaryPills(state: SummaryPillState): { label: string; card: number }[] {
  const pills: { label: string; card: number }[] = []

  // Card 0: Where & Who
  if (state.homeCity) pills.push({ label: state.homeCity, card: 0 })
  if (state.travelRange && state.travelRange !== 'any') {
    const rangeLabel = TRAVEL_RANGES.find(r => r.value === state.travelRange)?.label
    if (rangeLabel) pills.push({ label: rangeLabel, card: 0 })
  }
  const groupLabel = GROUP_TYPES.find(g => g.value === state.groupType)?.label
  if (groupLabel) pills.push({ label: groupLabel, card: 0 })

  // Card 1: When & Weather
  if (state.dateType === 'specific' && state.startDate && state.endDate) {
    const fmt = (d: string) => {
      try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }
      catch { return d }
    }
    pills.push({ label: `${fmt(state.startDate)} – ${fmt(state.endDate)}`, card: 1 })
  } else if (state.dateType === 'flexible' && state.dateDescription) {
    pills.push({ label: state.dateDescription, card: 1 })
  }

  // Card 2: Vibe & Budget
  if (state.interests.length > 0) {
    pills.push({
      label: state.interests.length <= 2 ? state.interests.join(', ') : `${state.interests.length} interests`,
      card: 2,
    })
  }
  const styleLabel = TRIP_STYLES.find(s => s.value === state.tripStyle)?.label
  if (styleLabel && state.tripStyle !== 'mixed') pills.push({ label: styleLabel, card: 2 })
  const budgetLabel = BUDGET_LEVELS.find(b => b.value === state.budgetLevel)?.label
  if (budgetLabel) pills.push({ label: budgetLabel, card: 2 })

  return pills
}
```

**Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/__tests__/unit/trip-input-builder.test.ts
```

Expected: PASS (all tests green)

**Step 5: Commit**

```bash
git add src/lib/form/trip-input-builder.ts src/__tests__/unit/trip-input-builder.test.ts
git commit -m "feat: extract trip input builder helpers with tests"
```

---

## Task 3: Extract constants from TripInputForm into a separate file

The builder module imports constants from `TripInputForm.constants`. Create that file now.

**Files:**
- Create: `src/components/explore/TripInputForm.constants.ts`
- Modify: `src/components/explore/TripInputForm.tsx` (replace inline constants with imports)

**Step 1: Create constants file**

Create `src/components/explore/TripInputForm.constants.ts`:

```typescript
export const INTEREST_OPTIONS = [
  'Food & Wine',
  'Hiking',
  'Beaches',
  'Culture & History',
  'Nightlife',
  'Architecture',
  'Nature & Wildlife',
  'Adventure Sports',
  'Shopping',
  'Photography',
  'Relaxation',
  'Local Markets',
]

export const WEATHER_OPTIONS = [
  { value: 'warm', label: 'Warm & Sunny' },
  { value: 'mild', label: 'Mild & Pleasant' },
  { value: 'hot', label: 'Hot' },
  { value: 'cool', label: 'Cool & Crisp' },
  { value: 'any', label: "Don't Mind" },
]

export const TRIP_STYLES = [
  { value: 'road_trip' as const, label: 'Road Trip' },
  { value: 'city_hopping' as const, label: 'City Hop' },
  { value: 'beach' as const, label: 'Beach' },
  { value: 'adventure' as const, label: 'Adventure' },
  { value: 'cultural' as const, label: 'Cultural' },
  { value: 'mixed' as const, label: 'Mixed' },
]

export const TRAVEL_RANGES = [
  { value: 'short_haul' as const, label: 'Short Haul', desc: 'Under 3hr flight / nearby' },
  { value: 'medium_haul' as const, label: 'Medium Haul', desc: '3-6hr flight / neighbouring countries' },
  { value: 'long_haul' as const, label: 'Long Haul', desc: '6hr+ flight / different continent' },
  { value: 'driving_distance' as const, label: 'Driving Distance', desc: 'Road trip — stay on the road' },
  { value: 'any' as const, label: 'Any Distance', desc: 'No preference' },
]

export const BUDGET_LEVELS = [
  { value: 'budget' as const, label: 'Budget', desc: 'Hostels, street food' },
  { value: 'moderate' as const, label: 'Moderate', desc: 'Mid-range hotels' },
  { value: 'comfortable' as const, label: 'Comfortable', desc: 'Nice hotels, dining' },
  { value: 'luxury' as const, label: 'Luxury', desc: 'Top-end everything' },
]

export const COMMON_CITIES = [
  'London', 'Paris', 'Berlin', 'Amsterdam', 'Dublin', 'Madrid', 'Barcelona',
  'Rome', 'Milan', 'Lisbon', 'Vienna', 'Prague', 'Copenhagen', 'Stockholm',
  'Oslo', 'Helsinki', 'Zurich', 'Munich', 'Frankfurt', 'Brussels',
  'New York', 'Los Angeles', 'San Francisco', 'Chicago', 'Boston', 'Miami',
  'Toronto', 'Vancouver', 'Montreal', 'Sydney', 'Melbourne', 'Auckland',
  'Singapore', 'Tokyo', 'Hong Kong', 'Dubai', 'Cape Town', 'Sao Paulo',
  'Mexico City', 'Buenos Aires',
]

export const TOTAL_CARDS = 3
export const CARD_LABELS = ['Where & Who', 'When & Weather', 'Vibe & Budget']
```

**Step 2: Update TripInputForm.tsx imports**

At the top of `src/components/explore/TripInputForm.tsx`, replace the inline constant declarations (lines 23–81) with:

```typescript
import {
  INTEREST_OPTIONS,
  WEATHER_OPTIONS,
  TRIP_STYLES,
  TRAVEL_RANGES,
  BUDGET_LEVELS,
  COMMON_CITIES,
  TOTAL_CARDS,
  CARD_LABELS,
} from './TripInputForm.constants'
import {
  GROUP_TYPES,
  buildTripInput as buildTripInputHelper,
  buildSummaryPills as buildSummaryPillsHelper,
  validateHomeCity,
  validateDateRange,
} from '@/lib/form/trip-input-builder'
import type { GroupType } from '@/lib/form/trip-input-builder'
```

Delete the now-redundant inline declarations of `INTEREST_OPTIONS`, `WEATHER_OPTIONS`, `TRIP_STYLES`, `TRAVEL_RANGES`, `BUDGET_LEVELS`, `COMMON_CITIES`, `TOTAL_CARDS`, and `CARD_LABELS` from `TripInputForm.tsx`.

**Step 3: Run full test suite to verify nothing broke**

```bash
npm run test:run
```

Expected: All existing tests pass.

**Step 4: Commit**

```bash
git add src/components/explore/TripInputForm.constants.ts src/components/explore/TripInputForm.tsx
git commit -m "refactor: extract TripInputForm constants to separate file"
```

---

## Task 4: Add groupType state and wire buildTripInput / buildSummaryPills

**Files:**
- Modify: `src/components/explore/TripInputForm.tsx`

**Step 1: Add groupType state**

In the state declarations section (after line ~124 `const [tripStyle...]`), add:

```typescript
const [groupType, setGroupType] = useState<GroupType>(undefined)
```

**Step 2: Replace buildTripInput function**

Replace the entire `buildTripInput` function (lines ~197–219) with a call to the extracted helper:

```typescript
function buildTripInput(): TripInput {
  return buildTripInputHelper({
    homeCity,
    travelRange,
    dateType,
    startDate,
    endDate,
    dateDescription,
    duration,
    groupType,
    interests,
    weatherPreference,
    budgetLevel,
    tripStyle,
    locationType,
    regionValue,
    startingPoint,
    additionalNotes: '',  // will be replaced in Task 7
  })
}
```

**Step 3: Replace summaryPills computation**

Replace the `summaryPills` array construction (lines ~679–699) with:

```typescript
const summaryPills = buildSummaryPillsHelper({
  homeCity,
  travelRange,
  dateType,
  startDate,
  endDate,
  dateDescription,
  groupType,
  interests,
  tripStyle,
  budgetLevel,
  locationType,
  regionValue,
})
```

**Step 4: Run tests**

```bash
npm run test:run
```

Expected: All passing.

**Step 5: Commit**

```bash
git add src/components/explore/TripInputForm.tsx
git commit -m "refactor: wire extracted helpers into TripInputForm"
```

---

## Task 5: Add groupType field JSX to Step 1

**Files:**
- Modify: `src/components/explore/TripInputForm.tsx`

**Step 1: Add the groupTypeField JSX**

After the `travelRangeField` const definition, add:

```tsx
const groupTypeField = (
  <fieldset>
    <legend className="flex items-center gap-2 text-sm font-medium mb-3">
      <Users className="h-4 w-4 text-primary" />
      Who's travelling?
    </legend>
    <div className="grid grid-cols-2 gap-2">
      {GROUP_TYPES.map((gt) => (
        <button
          key={gt.value}
          type="button"
          onClick={() => setGroupType(gt.value)}
          className={chipClass(groupType === gt.value)}
        >
          {gt.label}
        </button>
      ))}
    </div>
  </fieldset>
)
```

**Step 2: Add Users icon to imports**

In the lucide-react import at the top of the file, add `Users` to the list.

**Step 3: Run dev server briefly to check renders**

```bash
npm run dev
```

Open http://localhost:3000/explore and verify the group type chips appear on Step 1 (they'll be on the wrong step until Task 6 — that's fine for now).

**Step 4: Commit**

```bash
git add src/components/explore/TripInputForm.tsx
git commit -m "feat: add group type chip selector to TripInputForm"
```

---

## Task 6: Restructure cardContent to 3 steps, move location to Step 1

**Files:**
- Modify: `src/components/explore/TripInputForm.tsx`

**Step 1: Update cardContent array**

Find the `cardContent` array (around line 756–761). Replace it with:

```tsx
const cardContent = [
  // Step 0: Where & Who
  <div key="where-who" className="space-y-5">
    {homeCityField}
    {travelRangeField}
    {locationField}
    {groupTypeField}
  </div>,
  // Step 1: When & Weather
  <div key="when-weather" className="space-y-5">
    {datesField}
    {weatherField}
  </div>,
  // Step 2: Vibe & Budget
  <div key="vibe-budget" className="space-y-5">
    {interestsField}
    {tripStyleField}
    {budgetField}
  </div>,
]
```

Note: `weatherField` and `budgetField` are renamed extractions you'll create in Task 7. For now, reference them as placeholders — the app will fail to compile until Task 7 is complete. Complete Tasks 6 and 7 before running tests.

**Step 2: Commit (after Task 7 compiles)**

Hold this commit until Task 7 is done.

---

## Task 7: Extract weatherField and budgetField, add additionalNotes field

**Files:**
- Modify: `src/components/explore/TripInputForm.tsx`

**Step 1: Add additionalNotes state**

In the state declarations section, add:

```typescript
const [additionalNotes, setAdditionalNotes] = useState('')
```

**Step 2: Update buildTripInput call to pass additionalNotes**

In the `buildTripInput` wrapper function (from Task 4), replace `additionalNotes: ''` with `additionalNotes`.

**Step 3: Extract weatherField**

The `weatherBudgetField` const currently combines weather + budget. Split it into two:

```tsx
const weatherField = (
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
)
```

**Step 4: Extract budgetField**

```tsx
const budgetField = (
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
          className={cn(chipClass(budgetLevel === level.value), 'flex flex-col items-start text-left')}
        >
          <span className="font-medium text-foreground">{level.label}</span>
          <span className="text-xs text-muted-foreground">{level.desc}</span>
        </button>
      ))}
    </div>
  </fieldset>
)
```

**Step 5: Add additionalNotesField**

```tsx
const ADDITIONAL_NOTES_EXAMPLES = [
  'celebrating an anniversary',
  'need wheelchair access',
  'my partner hates flying',
  'travelling with a toddler',
]

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
            "{ex}"
          </button>
          {i < ADDITIONAL_NOTES_EXAMPLES.length - 1 ? ' · ' : ''}
        </span>
      ))}
    </p>
    <textarea
      value={additionalNotes}
      onChange={(e) => setAdditionalNotes(e.target.value)}
      placeholder="Any extra context for your trip..."
      rows={2}
      className={cn(inputClass, 'resize-none')}
    />
  </fieldset>
)
```

**Step 6: Remove the old `weatherBudgetField` const**

Delete the `weatherBudgetField` const definition (it's now replaced by the two separate fields above).

**Step 7: Update cardContent Step 2 to include additionalNotesField**

Update the Vibe & Budget card (from Task 6):

```tsx
<div key="vibe-budget" className="space-y-5">
  {interestsField}
  {tripStyleField}
  {budgetField}
  {additionalNotesField}
</div>
```

**Step 8: Run dev server and verify structure**

```bash
npm run dev
```

Verify all 3 steps render without errors. Check Step 1 shows: home city, travel range, location, group type. Step 2 shows: dates, weather. Step 3 shows: interests, trip style, budget, notes.

**Step 9: Run tests**

```bash
npm run test:run
```

Expected: All passing.

**Step 10: Commit Tasks 6 + 7 together**

```bash
git add src/components/explore/TripInputForm.tsx
git commit -m "feat: restructure to 3 steps, add additionalNotes field"
```

---

## Task 8: Remove ghost search button from Steps 1 and 2

**Files:**
- Modify: `src/components/explore/TripInputForm.tsx`

**Step 1: Locate the search button render**

Find this line near the bottom of the form render (around line 863):

```tsx
{searchButton(isLastCard)}
```

**Step 2: Wrap it so it only renders on the last card**

Replace with:

```tsx
{isLastCard && searchButton(true)}
```

**Step 3: Update the searchButton function signature**

Since it's now always called with `true`, simplify:

```tsx
const searchButton = (
  <button
    type="submit"
    disabled={isLoading}
    className={cn(
      'w-full py-3 rounded-xl font-medium text-sm transition-all',
      isLoading
        ? 'bg-muted text-muted-foreground cursor-not-allowed'
        : 'bg-foreground text-background hover:opacity-90 shadow-md hover:shadow-lg'
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
        Find my trip
      </span>
    )}
  </button>
)
```

And in the render:

```tsx
{isLastCard && searchButton}
```

**Step 4: Update the summary mode CTA**

In the summary render section (showSummary block), find the "Search again" button and update its label:

```tsx
<span className="flex items-center justify-center gap-2">
  <Compass className="h-4 w-4" />
  Find my trip
</span>
```

**Step 5: Run dev server, verify no search button on Steps 1–2**

**Step 6: Commit**

```bash
git add src/components/explore/TripInputForm.tsx
git commit -m "fix: remove ghost search button from non-final steps, rename CTA"
```

---

## Task 9: Fix confirm-button pattern for flexible dates and region

Replace the explicit confirm buttons with `onBlur` confirmation and hint text.

**Files:**
- Modify: `src/components/explore/TripInputForm.tsx`

**Step 1: Update flexible dates input**

In `datesField`, replace the flexible date input section. Remove the confirm button and confirmed checkmark. Update the input to use `onBlur`:

```tsx
{dateType === 'flexible' ? (
  <div className="space-y-1">
    <input
      type="text"
      value={dateDescription}
      onChange={(e) => setDateDescription(e.target.value)}
      onBlur={() => {
        if (dateDescription.trim().length > 0) setFlexibleDatesConfirmed(true)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && dateDescription.trim().length > 0) {
          e.preventDefault()
          setFlexibleDatesConfirmed(true)
        }
      }}
      placeholder='e.g. "mid-April", "sometime in summer"'
      className={inputClass}
    />
    {!flexibleDatesConfirmed && dateDescription.trim().length === 0 && (
      <p className="text-xs text-muted-foreground">Press Enter or tab away to confirm</p>
    )}
    {flexibleDatesConfirmed && (
      <p className="text-xs text-primary flex items-center gap-1">
        <Check className="h-3 w-3" /> Got it
      </p>
    )}
  </div>
) : (
```

**Step 2: Update region input in locationField**

Apply the same pattern to the region input — remove the confirm button, add `onBlur`:

```tsx
{locationType === 'region' && (
  <div className="space-y-1">
    <input
      type="text"
      value={regionValue}
      onChange={(e) => {
        setRegionValue(e.target.value)
        setRegionConfirmed(false)
      }}
      onBlur={() => {
        if (regionValue.trim().length > 0) setRegionConfirmed(true)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && regionValue.trim().length > 0) {
          e.preventDefault()
          setRegionConfirmed(true)
        }
      }}
      placeholder='e.g. "Southern Europe", "Southeast Asia"'
      className={inputClass}
    />
    {!regionConfirmed && regionValue.trim().length === 0 && (
      <p className="text-xs text-muted-foreground">Press Enter or tab away to confirm</p>
    )}
    {regionConfirmed && (
      <p className="text-xs text-primary flex items-center gap-1">
        <Check className="h-3 w-3" /> Got it
      </p>
    )}
  </div>
)}
```

**Step 3: Commit**

```bash
git add src/components/explore/TripInputForm.tsx
git commit -m "fix: replace confirm button with onBlur pattern and hint text"
```

---

## Task 10: Stack date inputs vertically on mobile

**Files:**
- Modify: `src/components/explore/TripInputForm.tsx`

**Step 1: Find the specific dates input row**

In `datesField`, find the side-by-side date inputs:

```tsx
<div className="flex gap-3">
  <input type="date" value={startDate} ... className={cn(inputClass, 'flex-1')} />
  <span className="self-center text-muted-foreground text-sm">to</span>
  <input type="date" value={endDate} ... className={cn(inputClass, 'flex-1')} />
</div>
```

**Step 2: Replace with stacked layout**

```tsx
<div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
  <input
    type="date"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
    className={cn(inputClass, 'flex-1')}
  />
  <span className="text-muted-foreground text-sm sm:self-center hidden sm:block">to</span>
  <span className="text-xs text-muted-foreground sm:hidden">to</span>
  <input
    type="date"
    value={endDate}
    onChange={(e) => {
      setEndDate(e.target.value)
      setEndDateError(validateDateRange(startDate, e.target.value))
    }}
    className={cn(inputClass, 'flex-1')}
  />
</div>
```

Note: `endDateError` state is added in Task 11 (validation). For now, omit the `setEndDateError` call and add it in Task 11.

**Step 3: Commit**

```bash
git add src/components/explore/TripInputForm.tsx
git commit -m "fix: stack date inputs vertically on mobile"
```

---

## Task 11: Add homeCity and date range validation

**Files:**
- Modify: `src/components/explore/TripInputForm.tsx`

**Step 1: Add error state**

In the state declarations section, add:

```typescript
const [homeCityError, setHomeCityError] = useState<string | null>(null)
const [endDateError, setEndDateError] = useState<string | null>(null)
```

**Step 2: Add onBlur validation to homeCity input**

In `homeCityField`, update the `<input>` element to add:

```tsx
onBlur={() => setHomeCityError(validateHomeCity(homeCity))}
```

And below the input (inside the relative div, after the suggestions dropdown), add:

```tsx
{homeCityError && (
  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
    <span>⚠</span> {homeCityError}
  </p>
)}
```

**Step 3: Add onBlur validation to end date input**

In `datesField`, update the end date input from Task 10 to add:

```tsx
onBlur={() => setEndDateError(validateDateRange(startDate, endDate))}
onChange={(e) => {
  setEndDate(e.target.value)
  if (endDateError) setEndDateError(validateDateRange(startDate, e.target.value))
}}
```

And below the date inputs row, add:

```tsx
{endDateError && (
  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
    <span>⚠</span> {endDateError}
  </p>
)}
```

**Step 4: Gate "Next" on Step 1 to require homeCity**

In `handleNext`:

```typescript
function handleNext() {
  if (activeCard === 0) {
    const cityError = validateHomeCity(homeCity)
    setHomeCityError(cityError)
    if (cityError) return
  }
  if (activeCard < TOTAL_CARDS - 1) goToCard(activeCard + 1)
}
```

**Step 5: Run tests**

```bash
npm run test:run
```

Expected: All passing.

**Step 6: Commit**

```bash
git add src/components/explore/TripInputForm.tsx
git commit -m "feat: add homeCity and date range validation"
```

---

## Task 12: Increase progress bar tap targets

**Files:**
- Modify: `src/components/explore/TripInputForm.tsx`

**Step 1: Find the progress bar render**

```tsx
<div className="flex gap-1.5">
  {Array.from({ length: TOTAL_CARDS }).map((_, i) => (
    <button
      ...
      className={cn(
        'h-1.5 rounded-full flex-1 transition-all duration-300',
        ...
      )}
```

**Step 2: Add tap padding and increase height**

```tsx
<div className="flex gap-1.5">
  {Array.from({ length: TOTAL_CARDS }).map((_, i) => (
    <button
      key={i}
      type="button"
      onClick={() => goToCard(i)}
      className="flex-1 py-2 -my-2 group"
      title={CARD_LABELS[i]}
    >
      <div className={cn(
        'h-1.5 rounded-full w-full transition-all duration-300 group-hover:h-2',
        i === activeCard
          ? 'bg-primary'
          : i < activeCard
          ? 'bg-primary/40'
          : 'bg-border'
      )} />
    </button>
  ))}
</div>
```

**Step 3: Commit**

```bash
git add src/components/explore/TripInputForm.tsx
git commit -m "fix: increase progress bar tap target size"
```

---

## Task 13: Final verification

**Step 1: Run full test suite**

```bash
npm run test:run
```

Expected: All tests pass.

**Step 2: Run lint**

```bash
npm run lint
```

Expected: No errors.

**Step 3: Manual check on mobile viewport**

In browser DevTools, set viewport to 375px wide. Walk through all 3 steps and verify:
- [ ] Step 1: home city, travel range, location, group type chips all visible without excessive scroll
- [ ] Step 2: dates stacked vertically, weather chips visible
- [ ] Step 3: interests, trip style, budget, notes — comparable height to current Vibe card
- [ ] No search button on Steps 1 or 2
- [ ] "Find my trip" button on Step 3
- [ ] homeCity error shows when advancing with empty city
- [ ] Date range error shows when end < start
- [ ] Submit and verify summary pills include group type pill
- [ ] Tap a summary pill and verify it opens the correct step
- [ ] "Find my trip" button in summary mode works

**Step 4: Final commit if any lint/visual tweaks needed**

```bash
git add -p
git commit -m "fix: final polish from manual review"
```
