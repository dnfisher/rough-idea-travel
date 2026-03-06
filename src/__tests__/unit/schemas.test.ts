import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { TripInputSchema, DestinationSummarySchema, WeatherDataSchema } from '@/lib/ai/schemas'

const validTripInput = {
  dates: { flexible: true },
  travelers: 2,
  interests: ['Hiking', 'Food & Wine'],
  budgetLevel: 'moderate' as const,
  tripStyle: 'cultural' as const,
  locationPreference: { type: 'open' as const },
}

describe('TripInputSchema', () => {
  it('parses a valid minimal trip input', () => {
    const result = TripInputSchema.parse(validTripInput)
    expect(result.travelers).toBe(2)
    expect(result.budgetLevel).toBe('moderate')
  })

  it('defaults travelers to 1 when not provided', () => {
    const result = TripInputSchema.parse({ ...validTripInput, travelers: undefined })
    expect(result.travelers).toBe(1)
  })

  it('rejects traveler count below 1', () => {
    expect(() =>
      TripInputSchema.parse({ ...validTripInput, travelers: 0 })
    ).toThrow(z.ZodError)
  })

  it('rejects invalid tripStyle', () => {
    expect(() =>
      TripInputSchema.parse({ ...validTripInput, tripStyle: 'submarine' })
    ).toThrow(z.ZodError)
  })

  it.each(['road_trip', 'city_hopping', 'beach', 'adventure', 'cultural', 'mixed'] as const)(
    'accepts tripStyle "%s"',
    (tripStyle) => {
      expect(() => TripInputSchema.parse({ ...validTripInput, tripStyle })).not.toThrow()
    }
  )

  it('accepts road trip with driving_distance travelRange', () => {
    const result = TripInputSchema.parse({
      ...validTripInput,
      tripStyle: 'road_trip',
      travelRange: 'driving_distance',
    })
    expect(result.tripStyle).toBe('road_trip')
    expect(result.travelRange).toBe('driving_distance')
  })

  it('rejects dates without the required flexible field', () => {
    expect(() =>
      TripInputSchema.parse({ ...validTripInput, dates: {} })
    ).toThrow(z.ZodError)
  })
})

describe('WeatherDataSchema', () => {
  const validWeather = {
    destination: 'Barcelona',
    avgHighC: 28,
    avgLowC: 18,
    rainyDays: 3,
    sunshineHours: 9,
    description: 'Warm and sunny',
  }

  it('parses valid weather data', () => {
    const result = WeatherDataSchema.parse(validWeather)
    expect(result.destination).toBe('Barcelona')
    expect(result.avgHighC).toBe(28)
  })

  it('rejects missing required fields', () => {
    const { destination: _d, ...rest } = validWeather
    expect(() => WeatherDataSchema.parse(rest)).toThrow(z.ZodError)
  })
})

describe('DestinationSummarySchema', () => {
  const validSummary = {
    name: 'Lisbon',
    country: 'Portugal',
    coordinates: { lat: 38.72, lng: -9.14 },
    reasoning: 'Great weather and culture',
    matchScore: 85,
    estimatedDailyCostEur: 80,
    bestTimeToVisit: 'Spring',
    topActivities: ['Sightseeing', 'Food tours'],
    weather: {
      destination: 'Lisbon',
      avgHighC: 22,
      avgLowC: 14,
      rainyDays: 5,
      sunshineHours: 7,
      description: 'Mild',
    },
    suggestedDuration: '5-7 days',
  }

  it('parses a valid destination summary', () => {
    const result = DestinationSummarySchema.parse(validSummary)
    expect(result.name).toBe('Lisbon')
    expect(result.matchScore).toBe(85)
  })

  it('accepts optional road trip fields', () => {
    const roadTripSummary = {
      ...validSummary,
      routeStops: ['Porto', 'Sintra', 'Algarve'],
      drivingPace: 'relaxed' as const,
      estimatedTotalDriveHours: 6,
      travelMode: 'drive_only' as const,
    }
    const result = DestinationSummarySchema.parse(roadTripSummary)
    expect(result.routeStops).toEqual(['Porto', 'Sintra', 'Algarve'])
    expect(result.travelMode).toBe('drive_only')
  })

  it('rejects invalid drivingPace', () => {
    expect(() =>
      DestinationSummarySchema.parse({ ...validSummary, drivingPace: 'turbo' })
    ).toThrow(z.ZodError)
  })
})
