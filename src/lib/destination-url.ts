import type { DeepPartial } from "ai";
import type { DestinationSuggestion, DestinationSummary, TripInput } from "@/lib/ai/schemas";

/** Data we stash in sessionStorage so the detail page can show Phase 1 data instantly */
export interface DestinationPageContext {
  tripInput?: TripInput;
  summary: DeepPartial<DestinationSummary>;
  detail?: DeepPartial<DestinationSuggestion>;
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

export function destinationImageUrl(name: string, country?: string, interests?: string[]): string {
  const params = new URLSearchParams({ name });
  if (country) params.set("country", country);
  if (interests?.length) params.set("interests", interests.slice(0, 5).join(","));
  return `/api/destination-image?${params.toString()}`;
}
