import type { TripInput, ExplorationSummaryResult } from "@/lib/ai/schemas";
import type { DeepPartial } from "ai";

const STORAGE_KEY = "ri_auth_pending_state";
const TTL_MS = 30 * 60 * 1000; // 30 minutes

interface PendingAuthState {
  tripInput: TripInput;
  results: DeepPartial<ExplorationSummaryResult>;
  pendingFavoriteDestination: string | null;
  timestamp: number;
}

export function savePendingAuthState(
  tripInput: TripInput,
  results: DeepPartial<ExplorationSummaryResult>,
  pendingFavoriteDestination: string | null
): void {
  try {
    const state: PendingAuthState = {
      tripInput,
      // Ensure clean serialization (strip any non-serializable values)
      results: JSON.parse(JSON.stringify(results)),
      pendingFavoriteDestination,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage might be full or unavailable — fail silently
    console.warn("[auth-persistence] Failed to save state");
  }
}

export function loadPendingAuthState(): PendingAuthState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const state: PendingAuthState = JSON.parse(raw);

    // Expire after TTL
    if (Date.now() - state.timestamp > TTL_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return state;
  } catch {
    return null;
  }
}

export function clearPendingAuthState(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
