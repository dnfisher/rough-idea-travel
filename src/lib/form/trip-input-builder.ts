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
