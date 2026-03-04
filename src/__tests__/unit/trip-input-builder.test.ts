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
