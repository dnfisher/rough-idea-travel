import type { TripInput } from "./schemas";

export const EXPLORATION_SYSTEM_PROMPT = `You are a travel planning expert helping users discover destinations based on loose preferences. You provide thoughtful, well-reasoned travel suggestions with accurate data.

Guidelines:
- Suggest 3-4 destinations unless the user specifies places to compare
- Provide accurate GPS coordinates (latitude, longitude) for all locations
- Weather data should be realistic averages for the specified travel dates
- Cost estimates should be in EUR and reflect actual current prices
- Drive times should be realistic (account for mountain roads, border crossings, rest stops)
- For road trips, plan reasonable daily driving (no more than 4-5 hours on the road)
- Include a mix of well-known and off-the-beaten-path suggestions
- Be specific with recommendations (neighborhood-level for restaurants/hotels)
- Pros and cons should be honest — mention downsides like crowds, cost, logistics
- Match scores (0-100) should genuinely reflect how well each destination matches ALL stated preferences
- Each destination must include its own full itinerary with day-by-day plans
- When suggesting itineraries, include rest days and allow for spontaneity
- Itineraries should be tailored to that specific destination's strengths and the user's interests`;

export function buildExplorationPrompt(input: TripInput): string {
  const parts: string[] = [];

  // Home city & travel range
  if (input.homeCity) {
    parts.push(`Home city: ${input.homeCity}`);
  }
  if (input.travelRange && input.travelRange !== "any") {
    const rangeLabels: Record<string, string> = {
      short_haul: "Short-haul (under 3 hours flight / nearby driving distance)",
      medium_haul: "Medium-haul (3-6 hours flight / neighboring countries)",
      long_haul: "Long-haul (6+ hours flight / different continent)",
    };
    parts.push(`Travel range: ${rangeLabels[input.travelRange]}`);
  }

  // Dates
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

  // Travelers
  if (input.travelers > 1) {
    parts.push(`Travelers: ${input.travelers}`);
  }

  // Interests
  if (input.interests.length > 0) {
    parts.push(`Interests: ${input.interests.join(", ")}`);
  }

  // Weather
  if (input.weatherPreference) {
    parts.push(`Weather preference: ${input.weatherPreference}`);
  }

  // Budget
  parts.push(`Budget level: ${input.budgetLevel}`);

  // Style
  parts.push(`Trip style: ${input.tripStyle.replace(/_/g, " ")}`);

  // Location
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

  // Starting point (explicit or fall back to home city)
  if (input.startingPoint) {
    parts.push(`Starting from: ${input.startingPoint}`);
  } else if (input.homeCity) {
    parts.push(`Starting from: ${input.homeCity}`);
  }

  // Notes
  if (input.additionalNotes) {
    parts.push(`Additional context: ${input.additionalNotes}`);
  }

  return parts.join("\n");
}
