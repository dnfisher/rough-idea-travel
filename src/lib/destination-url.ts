import type { DeepPartial } from "ai";
import type { DestinationSummary, TripInput } from "@/lib/ai/schemas";

/** Data we stash in sessionStorage so the detail page can show Phase 1 data instantly */
export interface DestinationPageContext {
  tripInput: TripInput;
  summary: DeepPartial<DestinationSummary>;
  imageSearchName?: string;
  stableCountry?: string;
  rank?: number;
  isRecommended?: boolean;
}

const SESSION_KEY_PREFIX = "dest:";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function storeDestinationContext(slug: string, data: DestinationPageContext): void {
  try {
    sessionStorage.setItem(SESSION_KEY_PREFIX + slug, JSON.stringify(data));
  } catch {
    // sessionStorage quota exceeded or unavailable — not critical
  }
}

export function getDestinationContext(slug: string): DestinationPageContext | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY_PREFIX + slug);
    if (!raw) return null;
    return JSON.parse(raw) as DestinationPageContext;
  } catch {
    return null;
  }
}
