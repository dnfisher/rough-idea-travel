import type { TripInput } from "./schemas";

// Phase 1: Summary prompt — fast, 8-10 lightweight suggestions
export const EXPLORATION_SUMMARY_SYSTEM_PROMPT = `You are a travel planning expert helping users discover destinations based on loose preferences. You provide thoughtful, well-reasoned travel suggestions with accurate data.

Guidelines:
- Suggest 8-10 destinations ranked by match score (descending)
- Provide accurate GPS coordinates (latitude, longitude) for all locations
- Weather data should be realistic averages for the specified travel dates
- Cost estimates should be in EUR and reflect actual current prices
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
- Keep packing tips to 3-5 items maximum
- Keep practical tips to 3-5 items maximum
- For meals, suggest 1 specific restaurant or food type per meal (not multiple options)
- Day tips should be 1 concise sentence each
- Provide accommodation estimates: average nightly rate in EUR for mid-range options in the recommended area
- For flying trips: Include the nearest airport IATA code and the departure airport IATA code from the user's home city. Estimate round-trip flight cost in EUR.
- For road trips (tripStyle: "road_trip"): Do NOT include flightEstimate or airport codes. Instead, provide drivingEstimate with: estimatedGasCostEur (total fuel cost, assume ~7L/100km at ~1.70 EUR/L), estimatedTotalDriveKm (total driving distance), estimatedDriveHours (total driving time), and startingPoint.
- Calculate estimated total trip cost: For flights: (nightly rate x nights) + flight cost + (daily expenses x days). For road trips: (nightly rate x nights) + gas cost + (daily expenses x days).
- Focus on accuracy over exhaustiveness — be concise`;

// Legacy prompt (kept for reference)
export const EXPLORATION_SYSTEM_PROMPT = EXPLORATION_SUMMARY_SYSTEM_PROMPT;

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

  if (input.tripStyle === "road_trip") {
    parts.push("IMPORTANT: This is a road trip. Do NOT suggest flights. Focus on driving routes and provide gas/fuel cost estimates instead of flight costs.");
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
  return parts.join("\n");
}
