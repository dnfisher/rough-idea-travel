import { streamText, Output } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { ExplorationResultSchema, TripInputSchema } from "@/lib/ai/schemas";
import {
  EXPLORATION_SYSTEM_PROMPT,
  buildExplorationPrompt,
} from "@/lib/ai/prompts";

const anthropic = createAnthropic({
  baseURL: "https://api.anthropic.com/v1",
  apiKey: process.env.ROUGH_IDEA_ANTHROPIC_API_KEY,
});

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json();
  const input = TripInputSchema.parse(body);

  const result = streamText({
    model: anthropic("claude-sonnet-4-5-20250929"),
    system: EXPLORATION_SYSTEM_PROMPT,
    prompt: buildExplorationPrompt(input),
    output: Output.object({ schema: ExplorationResultSchema }),
  });

  return result.toTextStreamResponse();
}
