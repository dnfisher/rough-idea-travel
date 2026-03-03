"use client";

import { useState, useRef, useEffect } from "react";
import type { DeepPartial } from "ai";
import type { DestinationSuggestion, TripInput } from "@/lib/ai/schemas";

export interface DetailStreamResult {
  detail: DeepPartial<DestinationSuggestion> | null;
  isStreaming: boolean;
  error: Error | null;
}

/**
 * Reads the NDJSON stream from /api/explore/detail and returns progressive
 * section updates. Returns null detail + isStreaming=false when any input is absent.
 *
 * Sections arrive in order: quick (~3-5s), itinerary (~8-12s),
 * insights (~12-18s), booking (~15-20s). State updates after each complete line.
 */
export function useDetailStream(
  name: string | undefined,
  country: string | undefined,
  tripInput: TripInput | undefined
): DetailStreamResult {
  const [detail, setDetail] = useState<DeepPartial<DestinationSuggestion> | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!name || !country || !tripInput || startedRef.current) return;
    startedRef.current = true;

    const controller = new AbortController();
    setIsStreaming(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch("/api/explore/detail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destinationName: name, country, tripInput }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as { error?: string }).error || `Request failed (${res.status})`
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
            if (type === "quick") {
              setDetail((prev) => ({ ...prev, ...data }));
            } else if (type === "itinerary") {
              setDetail((prev) => ({
                ...prev,
                itinerary: { destinationName: name, ...(data as object) },
              }));
            } else if (type === "insights") {
              setDetail((prev) => ({ ...prev, ...data }));
            } else if (type === "booking") {
              setDetail((prev) => ({ ...prev, ...data }));
            }
          } catch {
            // Silently skip malformed lines — rendered sections stay visible
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            processLine(line);
          }
        }

        // Parse any remaining buffered content (last line may lack trailing newline)
        if (buffer.trim()) {
          processLine(buffer);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsStreaming(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [name, country, tripInput]);

  return { detail, isStreaming, error };
}
