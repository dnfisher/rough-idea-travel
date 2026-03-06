import { streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { TripInputSchema } from "@/lib/ai/schemas";
import {
  DESTINATION_DETAIL_NDJSON_SYSTEM_PROMPT,
  DESTINATION_DETAIL_NDJSON_NO_ITINERARY_SYSTEM_PROMPT,
  DESTINATION_ITINERARY_ONLY_SYSTEM_PROMPT,
  buildDetailPrompt,
} from "@/lib/ai/prompts";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { readSearchCount, isSearchAllowed, makeSearchCookie, COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/search-gate";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 120;

const DetailRequestSchema = z.object({
  destinationName: z.string().max(200),
  country: z.string().max(200),
  tripInput: TripInputSchema,
  mode: z.enum(['overview', 'itinerary_only', 'full']).default('overview'),
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

    const session = await auth();
    if (session?.user?.id && !checkRateLimit(session.user.id)) {
      return new Response(
        JSON.stringify({ error: "rate_limit_exceeded" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!session?.user?.id) {
      const cookieStore = await cookies();
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
    const { destinationName, country, tripInput, mode } = DetailRequestSchema.parse(body);

    const systemPrompt =
      mode === 'itinerary_only' ? DESTINATION_ITINERARY_ONLY_SYSTEM_PROMPT
      : mode === 'full' ? DESTINATION_DETAIL_NDJSON_SYSTEM_PROMPT
      : DESTINATION_DETAIL_NDJSON_NO_ITINERARY_SYSTEM_PROMPT;

    // Use streamText with no schema (avoids "compiled grammar is too large").
    // The system prompt is selected based on `mode` and instructs the model to output 1, 3, or 4 NDJSON lines accordingly.
    const result = streamText({
      model: anthropic("claude-sonnet-4-5-20250929"),
      system: systemPrompt,
      prompt: buildDetailPrompt(destinationName, country, tripInput),
      maxOutputTokens: 16384,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[explore/detail] Error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
