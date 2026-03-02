import type { TripInput } from "./schemas";
import { getCurrencySymbol, type CurrencyCode } from "@/lib/currency";

// Phase 1: Summary prompt — fast, 8-10 lightweight suggestions
export const EXPLORATION_SUMMARY_SYSTEM_PROMPT = `You are a travel planning expert helping users discover destinations based on loose preferences. You provide thoughtful, well-reasoned travel suggestions with accurate data.

Guidelines:
- Suggest 8-10 destinations ranked by match score (descending)
- Provide accurate GPS coordinates (latitude, longitude) for all locations
- Weather data should be realistic averages for the specified travel dates
- Numeric cost fields (estimatedDailyCostEur etc.) must always be in EUR. When mentioning prices in free-text (reasoning, tips, descriptions), use the user's preferred currency if specified; otherwise default to EUR
- Include a mix of well-known and off-the-beaten-path suggestions
- Match scores (0-100) should genuinely reflect how well each destination matches ALL stated preferences
- Keep reasoning concise: 1-2 sentences explaining why this destination fits
- Limit topActivities to the top 3-4 most relevant
- Do NOT include itineraries, pros/cons, or detailed breakdowns — just summary data`;

// Phase 2: Detail prompt — full itinerary + booking data for a single destination
export const DESTINATION_DETAIL_SYSTEM_PROMPT = `You are a travel planning expert. Generate a detailed trip plan for a single destination.

CRITICAL: Respond with ONLY a valid JSON object — no markdown, no code fences, no explanation. Just the raw JSON.

Guidelines:
- Day-by-day itinerary with GPS coordinates, highlights, and overnight stays
- Honest pros and cons (3-4 each)
- Drive times should be realistic. For road trips, max 4-5 hours daily driving
- Keep packing tips to 3 items, practical tips to 3 items
- For meals, 1 specific recommendation per meal (brief)
- Day tips: 1 concise sentence each
- Accommodation estimates: average nightly EUR rate for mid-range options. Numeric cost fields always in EUR; use user's preferred currency in free-text
- For flying trips: nearest airport IATA code, departure airport IATA code, estimated round-trip flight cost in EUR
- For road trips: provide drivingEstimate (estimatedGasCostEur, estimatedTotalDriveKm, estimatedDriveHours, startingPoint). If route is 4-5+ hours from home, also include flightEstimate
- Calculate estimatedTotalTripCostEur based on nightly rate, transport, and daily expenses
- Include 3-4 local insights (categories: Food & Drink, Customs, Language, Getting Around, Money, Hidden Gems, Local Tips). Keep each insight to 1-2 sentences
- Include 2-3 local events/festivals during or near travel dates. Each needs: name, date, brief description, type (one of: festival, cultural, music, food, sports, religious, market)
- Be concise throughout — brevity over exhaustiveness

Required JSON shape:
{
  "name": "string",
  "country": "string",
  "coordinates": { "lat": number, "lng": number },
  "reasoning": "string",
  "matchScore": number (0-100),
  "pros": ["string", ...],
  "cons": ["string", ...],
  "estimatedDailyCostEur": number,
  "bestTimeToVisit": "string",
  "topActivities": ["string", ...],
  "weather": { "destination": "string", "avgHighC": number, "avgLowC": number, "rainyDays": number, "sunshineHours": number, "description": "string" },
  "suggestedDuration": "string",
  "itinerary": {
    "destinationName": "string",
    "totalDays": number,
    "totalDriveTimeHours": number | null,
    "totalDistanceKm": number | null,
    "days": [{ "dayNumber": number, "location": "string", "coordinates": { "lat": number, "lng": number }, "highlights": ["string"], "driveTimeFromPrevious": "string" | null, "driveDistanceKm": number | null, "overnightStay": "string", "meals": ["string"] | null, "tips": "string" | null }],
    "estimatedTotalCostEur": number | null,
    "packingTips": ["string"] | null,
    "practicalTips": ["string"] | null
  },
  "accommodation": { "averageNightlyEur": number, "recommendedArea": "string", "nearestAirportCode": "string", "nearestAirportName": "string" } | null,
  "flightEstimate": { "roundTripEur": number, "fromAirportCode": "string", "toAirportCode": "string" } | null,
  "drivingEstimate": { "estimatedGasCostEur": number, "estimatedTotalDriveKm": number, "estimatedDriveHours": number, "startingPoint": "string" } | null,
  "estimatedTotalTripCostEur": number | null,
  "localInsights": [{ "category": "string", "insight": "string" }] | null,
  "localEvents": [{ "name": "string", "date": "string", "description": "string", "type": "festival|cultural|music|food|sports|religious|market" }] | null
}`;

// Phase 1: Road trip summary prompt — themed multi-stop driving routes
export const ROAD_TRIP_SUMMARY_SYSTEM_PROMPT = `You are a travel planning expert specializing in road trips and driving holidays. You design multi-stop driving routes that are practical, scenic, and thematic.

Guidelines:
- Suggest 4-6 themed multi-stop driving ROUTES (not individual destinations)
- Each route should visit 3-6 locations connected by driving
- Give each route a distinct theme/flavour, for example:
  • Food & wine trail (vineyards, local markets, restaurants)
  • Coastal scenic drive (beaches, cliffs, seaside villages)
  • Nature & hiking (national parks, scenic vistas, trails)
  • Cultural heritage (historic towns, museums, architecture)
  • Off-the-beaten-path (lesser-known gems, local life)
  • Mix of above
- Route naming: Use short evocative names like "Tuscan Food Trail", "Amalfi Coastal Explorer", "Bavarian Alpine Circuit". Do NOT include location arrows or stop lists in the name — the routeStops array handles that separately
- Populate the routeStops array with the DESTINATION stops in order — do NOT include the departure/home city. For example, for a road trip from New York through New England: routeStops: ["New Haven", "Providence", "Portland", "Bar Harbor"], NOT ["New York", "New Haven", ...]. The first entry should be the first interesting stop, not where the traveller starts from
- Set drivingPace for each route:
  • "relaxed" = 1-3 hours driving per day
  • "moderate" = 3-4 hours driving per day
  • "intensive" = 4-5 hours driving per day
  NEVER suggest more than 5 hours of daily driving. Mix paces across suggestions.
- Set estimatedTotalDriveHours for total route driving time
- IMPORTANT — Fly & Drive logic: If the route region is more than ~4-5 hours drive from the user's home city, set travelMode to "fly_and_drive". The user flies to a nearby airport and hires a car locally — the road trip is the driving experience AT the destination, not the journey TO it. If within reasonable driving distance (under ~4-5 hours), set travelMode to "drive_only"
- Coordinates should be the route's starting point or central location
- Numeric cost fields (estimatedDailyCostEur etc.) must always be in EUR. When mentioning prices in free-text, use the user's preferred currency if specified; otherwise default to EUR
- Keep topActivities to 3-4 key highlights along the entire route
- Keep reasoning concise: 1-2 sentences explaining the route's appeal
- Match scores (0-100) should reflect how well the route matches ALL preferences
- Weather data should be for the route's primary region
- suggestedDuration should reflect total trip days (e.g. "7-10 days"). Factor in that long driving legs (4+ hours) should be broken into two days with an overnight stop — a route with 20 hours of total driving at moderate pace needs at least 6-7 driving days, not 5
- Do NOT include itineraries, pros/cons, or detailed breakdowns — just summary data`;

// Legacy prompt (kept for reference)
export const EXPLORATION_SYSTEM_PROMPT = EXPLORATION_SUMMARY_SYSTEM_PROMPT;

export function isRoadTripInput(input: TripInput): boolean {
  return input.tripStyle === "road_trip" || input.travelRange === "driving_distance";
}

function buildPreferenceParts(input: TripInput): string[] {
  const parts: string[] = [];

  if (input.homeCity) {
    parts.push(`Home city: ${input.homeCity}`);
  }
  if (input.travelRange && input.travelRange !== "any") {
    const rangeLabels: Record<string, string> = {
      short_haul: "Short-haul (under 3 hours flight / nearby driving distance)",
      medium_haul: "Medium-haul (3-6 hours flight / neighboring countries)",
      long_haul: "Long-haul (6+ hours flight / different continent)",
      driving_distance: "Driving distance only (road trip, no flights)",
    };
    parts.push(`Travel range: ${rangeLabels[input.travelRange]}`);
  }

  if (input.dates.flexible && input.dates.description) {
    parts.push(`Travel timing: ${input.dates.description}`);
  } else if (input.dates.startDate && input.dates.endDate) {
    parts.push(`Travel dates: ${input.dates.startDate} to ${input.dates.endDate}`);
  }
  if (input.dates.durationDays) {
    parts.push(
      `Duration: ${input.dates.durationDays.min}-${input.dates.durationDays.max} days`
    );
  }

  if (input.travelers > 1) {
    parts.push(`Travelers: ${input.travelers}`);
  }

  if (input.interests.length > 0) {
    parts.push(`Interests: ${input.interests.join(", ")}`);
  }

  if (input.weatherPreference) {
    parts.push(`Weather preference: ${input.weatherPreference}`);
  }

  parts.push(`Budget level: ${input.budgetLevel}`);
  parts.push(`Trip style: ${input.tripStyle.replace(/_/g, " ")}`);

  if (input.tripStyle === "road_trip" || input.travelRange === "driving_distance") {
    parts.push("IMPORTANT: This is a road trip. Each suggestion should be a DRIVING ROUTE visiting multiple locations, not a single destination. If the route is far from the home city (4-5+ hours drive), suggest flying to the nearest airport and hiring a car (fly_and_drive). Otherwise it's drive_only from home. Focus on the driving experience at the destination.");
  }

  if (
    input.locationPreference.type === "region" &&
    input.locationPreference.value
  ) {
    parts.push(`Region preference: ${input.locationPreference.value}`);
  } else if (
    input.locationPreference.type === "specific" &&
    input.locationPreference.comparePlaces?.length
  ) {
    parts.push(
      `Compare these destinations: ${input.locationPreference.comparePlaces.join(", ")}`
    );
  } else {
    parts.push("Open to anywhere in the world");
  }

  if (input.startingPoint) {
    parts.push(`Starting from: ${input.startingPoint}`);
  } else if (input.homeCity) {
    parts.push(`Starting from: ${input.homeCity}`);
  }

  if (input.additionalNotes) {
    parts.push(`Additional context: ${input.additionalNotes}`);
  }

  if (input.currency && input.currency !== "EUR") {
    const symbol = getCurrencySymbol(input.currency as CurrencyCode);
    parts.push(`Currency: Use ${symbol} (${input.currency}) for any prices mentioned in text. Numeric schema fields remain in EUR.`);
  }

  return parts;
}

export function buildExplorationPrompt(input: TripInput): string {
  return buildPreferenceParts(input).join("\n");
}

export function buildDetailPrompt(
  destinationName: string,
  country: string,
  input: TripInput
): string {
  const parts: string[] = [
    `Generate a full detailed trip plan for: ${destinationName}, ${country}`,
    "",
    "User preferences:",
    ...buildPreferenceParts(input),
  ];

  if (isRoadTripInput(input)) {
    parts.push("");
    parts.push("ROAD TRIP ROUTE INSTRUCTIONS:");
    parts.push("- This is a multi-stop driving route, NOT a single destination. The itinerary should progress through all the stops in order.");
    parts.push("- Each day should have a different location with accurate GPS coordinates for that stop.");
    parts.push("- Include realistic driveTimeFromPrevious and driveDistanceKm between consecutive stops.");
    parts.push("- Keep daily driving to a maximum of 4-5 hours. Plan rest days or short-drive days where appropriate.");
    parts.push("- For long distances between key stops (over 4 hours driving), break the journey with an overnight stop in an interesting town along the way. These transit stops should have full itinerary day entries with coordinates, highlights, overnight accommodation, and meal recommendations — they are part of the experience, not just logistics.");
    parts.push("- Highlights should be specific to each stop's location.");
    parts.push("- TRAVEL MODE: If the route region is more than ~4-5 hours drive from the user's home city, this is a 'fly and drive' trip. Include BOTH flightEstimate (flight to the nearest airport to the route start) AND drivingEstimate (for the road trip itself). Set drivingEstimate.startingPoint to the airport/car hire city, NOT the user's home city. Also include accommodation.nearestAirportCode and accommodation.nearestAirportName for the arrival airport.");
    parts.push("- If the route is within reasonable driving distance of the home city (~4-5 hours or less), do NOT include flightEstimate. Provide only drivingEstimate with startingPoint set to the home city.");
  }

  return parts.join("\n");
}
