import { streamText, Output } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { ExplorationSummaryResultSchema, TripInputSchema } from "@/lib/ai/schemas";
import {
  EXPLORATION_SUMMARY_SYSTEM_PROMPT,
  ROAD_TRIP_SUMMARY_SYSTEM_PROMPT,
  isRoadTripInput,
  buildExplorationPrompt,
} from "@/lib/ai/prompts";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import {
  readSearchCount,
  isSearchAllowed,
  makeSearchCookie,
  COOKIE_NAME,
  COOKIE_OPTIONS,
} from "@/lib/search-gate";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ROUGH_IDEA_ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("[explore] ROUGH_IDEA_ANTHROPIC_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Anthropic API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const anthropic = createAnthropic({
      baseURL: "https://api.anthropic.com/v1",
      apiKey,
    });

    const session = await auth();
    const cookieStore = await cookies();
    if (!session?.user?.id) {
      const count = readSearchCount(cookieStore.get(COOKIE_NAME)?.value);
      if (!isSearchAllowed(count)) {
        return new Response(
          JSON.stringify({ error: "search_limit_reached" }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
      cookieStore.set(COOKIE_NAME, makeSearchCookie(count + 1), COOKIE_OPTIONS);
    }

    const body = await req.json();
    const input = TripInputSchema.parse(body);

    const isRoadTrip = isRoadTripInput(input);

    const systemPrompt = isRoadTrip
      ? ROAD_TRIP_SUMMARY_SYSTEM_PROMPT
      : EXPLORATION_SUMMARY_SYSTEM_PROMPT;

    const result = streamText({
      model: anthropic("claude-sonnet-4-5-20250929"),
      system: systemPrompt,
      prompt: buildExplorationPrompt(input),
      output: Output.object({ schema: ExplorationSummaryResultSchema }),
      maxOutputTokens: isRoadTrip ? 12288 : 8192,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[explore] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
