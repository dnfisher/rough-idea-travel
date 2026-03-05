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
  { value: 'warm' as const, label: 'Warm & Sunny' },
  { value: 'mild' as const, label: 'Mild & Pleasant' },
  { value: 'hot' as const, label: 'Hot' },
  { value: 'cool' as const, label: 'Cool & Crisp' },
  { value: 'any' as const, label: "Don't Mind" },
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

export const DURATION_CHIPS = [
  { label: "Weekend", value: "weekend", days: 2 },
  { label: "7 days",  value: "7",       days: 7 },
  { label: "10 days", value: "10",      days: 10 },
  { label: "2 weeks", value: "14",      days: 14 },
  { label: "Other",   value: "other",   days: null },
] as const
