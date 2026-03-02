"use client";

import { useState, useCallback, useRef } from "react";
import type { DeepPartial } from "ai";
import type { DestinationSuggestion, TripInput } from "@/lib/ai/schemas";

interface UseDetailFetchReturn {
  /** Full Phase 2 detail data for a destination, or null if not yet fetched */
  getDetail: (name: string) => DeepPartial<DestinationSuggestion> | null;
  /** Whether a fetch is currently in progress for the given destination */
  isLoading: (name: string) => boolean;
  /** The most recent error, if any */
  error: Error | null;
  /** Kick off a detail fetch for a destination (no-ops if already cached and complete) */
  fetchDetail: (name: string, country: string, tripInput: TripInput) => void;
  /** Clear the entire cache (e.g. when a new search starts) */
  clearCache: () => void;
}

export function useDetailFetch(): UseDetailFetchReturn {
  const [cache, setCache] = useState<Record<string, DeepPartial<DestinationSuggestion>>>({});
  const [loadingName, setLoadingName] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchDetail = useCallback(
    (name: string, country: string, tripInput: TripInput) => {
      // Check if we already have a complete cached result
      const cached = cache[name];
      if (cached) {
        const isComplete =
          cached.itinerary?.days &&
          cached.itinerary.days.length > 0 &&
          cached.pros &&
          cached.pros.length > 0;
        if (isComplete) return;
      }

      // Abort any in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setLoadingName(name);
      setError(null);

      fetch("/api/explore/detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationName: name,
          country,
          tripInput,
        }),
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) {
            return res.json().then(
              (body) => {
                throw new Error(body.error || `Request failed (${res.status})`);
              },
              () => {
                throw new Error(`Request failed (${res.status})`);
              }
            );
          }
          return res.json();
        })
        .then((data: DeepPartial<DestinationSuggestion>) => {
          setCache((prev) => ({ ...prev, [name]: data }));
          setLoadingName(null);
        })
        .catch((err) => {
          if (err.name === "AbortError") return; // Silently ignore aborted requests
          console.error("[useDetailFetch] Error:", err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoadingName(null);
        });
    },
    [cache]
  );

  const getDetail = useCallback(
    (name: string): DeepPartial<DestinationSuggestion> | null => {
      return cache[name] ?? null;
    },
    [cache]
  );

  const isLoading = useCallback(
    (name: string): boolean => {
      return loadingName === name;
    },
    [loadingName]
  );

  const clearCache = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setCache({});
    setLoadingName(null);
    setError(null);
  }, []);

  return { getDetail, isLoading, error, fetchDetail, clearCache };
}
