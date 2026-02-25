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
export const DESTINATION_DETAIL_SYSTEM_PROMPT = `You are a travel planning expert. Generate a trip plan for a single destination.

Guidelines:
- Provide a day-by-day itinerary with accurate GPS coordinates, highlights, and overnight stays
- Be specific with recommendations (neighborhood-level for restaurants/hotels)
- Provide honest pros and cons (3-4 each) — mention downsides like crowds, cost, logistics
- Drive times should be realistic
- For road trips, plan reasonable daily driving (no more than 4-5 hours on the road)
- For any driving leg exceeding 4 hours, break it with an overnight stop in a worthwhile town along the way. These stopover towns should have their own highlights and meal recommendations — make the journey part of the adventure
- Keep packing tips to 3-5 items maximum
- Keep practical tips to 3-5 items maximum
- For meals, suggest 1 specific restaurant or food type per meal (not multiple options)
- Day tips should be 1 concise sentence each
- Provide accommodation estimates: average nightly rate in EUR for mid-range options in the recommended area. Numeric cost fields must always be in EUR; use the user's preferred currency for any prices mentioned in free-text (reasoning, pros, cons, tips)
- For flying trips: Include the nearest airport IATA code and the departure airport IATA code from the user's home city. Estimate round-trip flight cost in EUR.
- For road trips (tripStyle: "road_trip"): Always provide drivingEstimate with: estimatedGasCostEur (total fuel cost, assume ~7L/100km at ~1.70 EUR/L), estimatedTotalDriveKm (total driving distance), estimatedDriveHours (total driving time), and startingPoint (the city where driving begins). If the route region is far from the user's home city (4-5+ hours drive), ALSO include flightEstimate with the flight to the nearest airport, and include airport details in accommodation. The user would fly in and hire a car — the road trip is the experience at the destination, not the journey to it. If within driving distance of home, omit flightEstimate.
- Calculate estimated total trip cost: For flights: (nightly rate x nights) + flight cost + (daily expenses x days). For fly+drive road trips: (nightly rate x nights) + flight cost + gas cost + (daily expenses x days). For drive-only road trips: (nightly rate x nights) + gas cost + (daily expenses x days).
- Include 5-8 local insights giving the traveler insider knowledge. Categories: "Food & Drink" (local specialities, dining customs, what to order), "Customs" (social norms, tipping, greetings), "Language" (useful phrases with meaning), "Getting Around" (local transport tips, taxi apps), "Money" (payment norms, bargaining), "Hidden Gems" (lesser-known spots locals love), "Local Tips" (timing, seasonal advice, things tourists get wrong). Each insight should be specific and actionable — not generic travel advice.
- Include 2-4 notable local events, festivals, or markets happening during or near the travel dates. For flexible/undated trips, suggest the most interesting seasonal events for the destination. Include festivals, weekly markets, cultural celebrations, food fairs, sporting events, and religious holidays unique to the region. Each event needs: name, approximate date/timing, a brief description, and type (festival/cultural/music/food/sports/religious/market).
- Focus on accuracy over exhaustiveness — be concise`;

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
- Populate the routeStops array with the key stops in order (e.g. ["Florence", "Siena", "Montepulciano", "Rome"])
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
