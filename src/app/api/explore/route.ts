import { streamText, Output } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { ExplorationResultSchema, TripInputSchema } from "@/lib/ai/schemas";
import {
  EXPLORATION_SYSTEM_PROMPT,
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

    const result = streamText({
      model: anthropic("claude-sonnet-4-5-20250929"),
      system: EXPLORATION_SYSTEM_PROMPT,
      prompt: buildExplorationPrompt(input),
      output: Output.object({ schema: ExplorationResultSchema }),
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
