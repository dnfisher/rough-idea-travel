"use client";

import { useState, useRef, useCallback } from "react";
import type { DeepPartial } from "ai";
import type { DestinationSuggestion, TripInput } from "@/lib/ai/schemas";

export interface ItineraryStreamResult {
  itinerary: DeepPartial<DestinationSuggestion>["itinerary"] | null;
  isStreaming: boolean;
  error: Error | null;
  trigger: () => void;
}

/**
 * On-demand itinerary fetch. Call `trigger()` to start the stream.
 * Only processes the "itinerary" NDJSON line from the detail API (mode: itinerary_only).
 * Once successfully fetched, will not re-fetch. On error, resets so the user can retry.
 */
export function useItineraryStream(
  name: string | undefined,
  country: string | undefined,
  tripInput: TripInput | undefined
): ItineraryStreamResult {
  const [itinerary, setItinerary] = useState<
    DeepPartial<DestinationSuggestion>["itinerary"] | null
  >(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetchedRef = useRef(false);

  const trigger = useCallback(() => {
    if (!name || !country || !tripInput || fetchedRef.current) return;
    fetchedRef.current = true;

    setIsStreaming(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch("/api/explore/detail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destinationName: name,
            country,
            tripInput,
            mode: "itinerary_only",
          }),
        });

        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as { error?: string }).error ||
              `Request failed (${res.status})`
          );
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const processLine = (line: string) => {
          const trimmed = line.trim();
          if (!trimmed) return;
          try {
            const section = JSON.parse(trimmed) as Record<string, unknown>;
            const { type, ...data } = section;
            if (type === "itinerary") {
              setItinerary({
                destinationName: name,
                ...(data as object),
              } as DeepPartial<DestinationSuggestion>["itinerary"]);
            }
          } catch {
            // skip malformed lines
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) processLine(line);
        }

        // Parse any remaining buffered content (last line may lack trailing newline)
        if (buffer.trim()) processLine(buffer);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        fetchedRef.current = false; // allow retry
      } finally {
        setIsStreaming(false);
      }
    })();
  }, [name, country, tripInput]);

  return { itinerary, isStreaming, error, trigger };
}
