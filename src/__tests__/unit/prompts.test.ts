import { describe, it, expect } from 'vitest'
import { isRoadTripInput } from '@/lib/ai/prompts'
import type { TripInput } from '@/lib/ai/schemas'

const baseTripInput: TripInput = {
  dates: { flexible: true },
  travelers: 2,
  interests: ['Hiking'],
  budgetLevel: 'moderate',
  tripStyle: 'cultural',
  locationPreference: { type: 'open' },
}

describe('isRoadTripInput', () => {
  it('returns true when tripStyle is road_trip', () => {
    expect(isRoadTripInput({ ...baseTripInput, tripStyle: 'road_trip' })).toBe(true)
  })

  it('returns true when travelRange is driving_distance', () => {
    expect(isRoadTripInput({ ...baseTripInput, travelRange: 'driving_distance' })).toBe(true)
  })

  it('returns false for cultural trip with short_haul range', () => {
    expect(isRoadTripInput({ ...baseTripInput, travelRange: 'short_haul' })).toBe(false)
  })

  it('returns false for beach trip with no travelRange', () => {
    expect(isRoadTripInput({ ...baseTripInput, tripStyle: 'beach' })).toBe(false)
  })

  it('returns true when both road_trip style and driving_distance set', () => {
    expect(
      isRoadTripInput({ ...baseTripInput, tripStyle: 'road_trip', travelRange: 'driving_distance' })
    ).toBe(true)
  })
})
