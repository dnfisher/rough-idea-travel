import { streamText, Output } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { ExplorationSummaryResultSchema, TripInputSchema } from "@/lib/ai/schemas";
import {
  EXPLORATION_SUMMARY_SYSTEM_PROMPT,
  ROAD_TRIP_SUMMARY_SYSTEM_PROMPT,
  isRoadTripInput,
  buildExplorationPrompt,
} from "@/lib/ai/prompts";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ROUGH_IDEA_ANTHROPIC_API_KEY;
    if (!apiKey) {
      const relevantKeys = Object.keys(process.env)
        .filter((k) => k.includes("ANTHROPIC") || k.includes("ROUGH"))
        .join(", ");
      console.error(
        "[explore] ROUGH_IDEA_ANTHROPIC_API_KEY is not set. Related env vars:",
        relevantKeys || "none found"
      );
      return new Response(
        JSON.stringify({ error: "Anthropic API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const anthropic = createAnthropic({
      baseURL: "https://api.anthropic.com/v1",
      apiKey,
    });

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
