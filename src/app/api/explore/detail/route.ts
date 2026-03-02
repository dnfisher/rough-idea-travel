import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { TripInputSchema } from "@/lib/ai/schemas";
import {
  DESTINATION_DETAIL_SYSTEM_PROMPT,
  buildDetailPrompt,
} from "@/lib/ai/prompts";
import { z } from "zod";

export const maxDuration = 120;

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

    // Use plain generateText — no schema sent to the API.
    // The schema is described in the system prompt as a JSON shape,
    // and we parse the response ourselves. This avoids the
    // "compiled grammar is too large" error from Anthropic's
    // structured output engine.
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-5-20250929"),
      system: DESTINATION_DETAIL_SYSTEM_PROMPT,
      prompt: buildDetailPrompt(destinationName, country, tripInput),
      maxOutputTokens: 16384,
    });

    // Extract JSON from the response — handle possible markdown fences
    let jsonText = text.trim();
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonText = fenceMatch[1].trim();
    }
    // Also handle case where model prefixes with text before the JSON
    const braceStart = jsonText.indexOf("{");
    if (braceStart > 0) {
      jsonText = jsonText.slice(braceStart);
    }

    const data = JSON.parse(jsonText);
    return Response.json(data);
  } catch (error) {
    console.error("[explore/detail] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
