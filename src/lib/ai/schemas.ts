import { z } from "zod";

// --- Input Schema ---

export const TripInputSchema = z.object({
  homeCity: z.string().optional(),
  travelRange: z.enum(["short_haul", "medium_haul", "long_haul", "any"]).optional(),
  dates: z.object({
    flexible: z.boolean(),
    description: z.string().optional(), // e.g. "mid-April"
    startDate: z.string().optional(), // ISO date
    endDate: z.string().optional(),
    durationDays: z
      .object({
        min: z.number(),
        max: z.number(),
      })
      .optional(),
  }),
  travelers: z.number().min(1).default(1),
  interests: z.array(z.string()),
  weatherPreference: z.string().optional(),
  budgetLevel: z.enum(["budget", "moderate", "comfortable", "luxury"]),
  tripStyle: z.enum([
    "road_trip",
    "city_hopping",
    "beach",
    "adventure",
    "cultural",
    "mixed",
  ]),
  locationPreference: z.object({
    type: z.enum(["open", "region", "specific"]),
    value: z.string().optional(),
    comparePlaces: z.array(z.string()).optional(),
  }),
  startingPoint: z.string().optional(),
  additionalNotes: z.string().optional(),
});

export type TripInput = z.infer<typeof TripInputSchema>;

// --- AI Output Schemas ---

export const WeatherDataSchema = z.object({
  destination: z.string(),
  avgHighC: z.number(),
  avgLowC: z.number(),
  rainyDays: z.number(),
  sunshineHours: z.number(),
  description: z.string(),
});

export type WeatherData = z.infer<typeof WeatherDataSchema>;

export const ItineraryDaySchema = z.object({
  dayNumber: z.number(),
  location: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  highlights: z.array(z.string()),
  driveTimeFromPrevious: z.string().optional(),
  driveDistanceKm: z.number().optional(),
  overnightStay: z.string(),
  meals: z.array(z.string()).optional(),
  tips: z.string().optional(),
});

export type ItineraryDay = z.infer<typeof ItineraryDaySchema>;

export const ItinerarySuggestionSchema = z.object({
  destinationName: z.string(),
  totalDays: z.number(),
  totalDriveTimeHours: z.number().optional(),
  totalDistanceKm: z.number().optional(),
  days: z.array(ItineraryDaySchema),
  estimatedTotalCostEur: z.number(),
  packingTips: z.array(z.string()),
  practicalTips: z.array(z.string()),
});

export type ItinerarySuggestion = z.infer<typeof ItinerarySuggestionSchema>;

export const DestinationSuggestionSchema = z.object({
  name: z.string(),
  country: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  reasoning: z.string(),
  matchScore: z.number(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  estimatedDailyCostEur: z.number(),
  bestTimeToVisit: z.string(),
  topActivities: z.array(z.string()),
  weather: WeatherDataSchema,
  suggestedDuration: z.string(),
  itinerary: ItinerarySuggestionSchema,
});

export type DestinationSuggestion = z.infer<typeof DestinationSuggestionSchema>;

export const ExplorationResultSchema = z.object({
  summary: z.string(),
  destinations: z.array(DestinationSuggestionSchema),
  weatherComparison: z.array(WeatherDataSchema),
  recommendedDestination: z.string(),
});

export type ExplorationResult = z.infer<typeof ExplorationResultSchema>;
