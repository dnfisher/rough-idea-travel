import { z } from "zod";

// --- Input Schema ---

export const TripInputSchema = z.object({
  homeCity: z.string().optional(),
  travelRange: z.enum(["short_haul", "medium_haul", "long_haul", "driving_distance", "any"]).optional(),
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
  currency: z.string().optional(),
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
  estimatedTotalCostEur: z.number().optional(),
  packingTips: z.array(z.string()).optional(),
  practicalTips: z.array(z.string()).optional(),
});

export type ItinerarySuggestion = z.infer<typeof ItinerarySuggestionSchema>;

// --- Summary schemas (Phase 1: fast initial results) ---

export const DestinationSummarySchema = z.object({
  name: z.string(),
  country: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  reasoning: z.string(),
  matchScore: z.number(),
  estimatedDailyCostEur: z.number(),
  bestTimeToVisit: z.string(),
  topActivities: z.array(z.string()),
  weather: WeatherDataSchema,
  suggestedDuration: z.string(),
  // Road trip route fields (optional, only for multi-stop routes)
  routeStops: z.array(z.string()).optional(),
  drivingPace: z.enum(["relaxed", "moderate", "intensive"]).optional(),
  estimatedTotalDriveHours: z.number().optional(),
  travelMode: z.enum(["drive_only", "fly_and_drive"]).optional(),
});

export type DestinationSummary = z.infer<typeof DestinationSummarySchema>;

export const ExplorationSummaryResultSchema = z.object({
  summary: z.string(),
  destinations: z.array(DestinationSummarySchema),
  weatherComparison: z.array(WeatherDataSchema),
  recommendedDestination: z.string(),
});

export type ExplorationSummaryResult = z.infer<typeof ExplorationSummaryResultSchema>;

// --- Full detail schemas (Phase 2: lazy-loaded per destination) ---

export const AccommodationEstimateSchema = z.object({
  averageNightlyEur: z.number(),
  recommendedArea: z.string(),
  nearestAirportCode: z.string(),
  nearestAirportName: z.string(),
});

export const FlightEstimateSchema = z.object({
  roundTripEur: z.number(),
  fromAirportCode: z.string(),
  toAirportCode: z.string(),
});

export const DrivingEstimateSchema = z.object({
  estimatedGasCostEur: z.number(),
  estimatedTotalDriveKm: z.number(),
  estimatedDriveHours: z.number(),
  startingPoint: z.string().optional(),
});

export type DrivingEstimate = z.infer<typeof DrivingEstimateSchema>;

export const LocalInsightSchema = z.object({
  category: z.string(),
  insight: z.string(),
});

export type LocalInsight = z.infer<typeof LocalInsightSchema>;

export const LocalEventSchema = z.object({
  name: z.string(),
  date: z.string(),
  description: z.string(),
  type: z.enum(["festival", "cultural", "music", "food", "sports", "religious", "market"]),
});

export type LocalEvent = z.infer<typeof LocalEventSchema>;

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
  accommodation: AccommodationEstimateSchema.optional(),
  flightEstimate: FlightEstimateSchema.optional(),
  drivingEstimate: DrivingEstimateSchema.optional(),
  estimatedTotalTripCostEur: z.number().optional(),
  localInsights: z.array(LocalInsightSchema).optional(),
  localEvents: z.array(LocalEventSchema).optional(),
});

export type DestinationSuggestion = z.infer<typeof DestinationSuggestionSchema>;

// Legacy full result schema (kept for shared trips compatibility)
export const ExplorationResultSchema = z.object({
  summary: z.string(),
  destinations: z.array(DestinationSuggestionSchema),
  weatherComparison: z.array(WeatherDataSchema),
  recommendedDestination: z.string(),
});

export type ExplorationResult = z.infer<typeof ExplorationResultSchema>;
