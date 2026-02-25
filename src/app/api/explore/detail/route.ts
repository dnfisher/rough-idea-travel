import { streamObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { DestinationSuggestionSchema, TripInputSchema } from "@/lib/ai/schemas";
import {
  DESTINATION_DETAIL_SYSTEM_PROMPT,
  buildDetailPrompt,
} from "@/lib/ai/prompts";
import { z } from "zod";

export const maxDuration = 60;

const DetailRequestSchema = z.object({
  destinationName: z.string(),
  country: z.string(),
  tripInput: TripInputSchema,
});

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ROUGH_IDEA_ANTHROPIC_API_KEY;
    if (!apiKey) {
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
    const { destinationName, country, tripInput } = DetailRequestSchema.parse(body);

    const result = streamObject({
      model: anthropic("claude-sonnet-4-5-20250929"),
      schema: DestinationSuggestionSchema,
      system: DESTINATION_DETAIL_SYSTEM_PROMPT,
      prompt: buildDetailPrompt(destinationName, country, tripInput),
      temperature: 0.7,
      maxOutputTokens: 16384,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[explore/detail] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
