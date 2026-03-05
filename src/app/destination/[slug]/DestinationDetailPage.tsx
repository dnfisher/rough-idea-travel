"use client";

import { useEffect, useState, useMemo, useCallback, type ElementType } from "react";
import {
  ArrowLeft,
  Clock,
  Star,
  Sun,
  CloudRain,
  Thermometer,
  CalendarDays,
  Globe,
  Utensils,
  MessageCircle,
  MapPinned,
  Banknote,
  Gem,
  Lightbulb,
  Calendar,
  AlertTriangle,
  Loader2,
  Plane,
  Car,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Images,
} from "lucide-react";
import type { DeepPartial } from "ai";
import type { DestinationSuggestion } from "@/lib/ai/schemas";
import { getDestinationContext, type DestinationPageContext } from "@/lib/destination-url";
import { DestinationImage } from "@/components/results/DestinationImage";
import { ItineraryTimeline } from "@/components/results/ItineraryTimeline";
import { ExploreMap } from "@/components/results/ExploreMap";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { ShareButton } from "@/components/share/ShareButton";
import { useCurrency } from "@/components/CurrencyProvider";
import { formatPrice } from "@/lib/currency";
import type { MapMarker } from "@/components/results/ExploreMapInner";
import { useDetailStream } from "@/lib/hooks/useDetailStream";
import { useItineraryStream } from "@/lib/hooks/useItineraryStream";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

// ── Constants ──────────────────────────────────────────────────

const INSIGHT_ICONS: Record<string, ElementType> = {
  "Food & Drink": Utensils,
  Customs: Globe,
  Language: MessageCircle,
  "Getting Around": MapPinned,
  Money: Banknote,
  "Hidden Gems": Gem,
  "Local Tips": Lightbulb,
};

// Activity card tints: semi-transparent overlays over dark base
const ACTIVITY_TINTS = [
  "rgba(42,191,191,0.55)",
  "rgba(232,131,58,0.55)",
  "rgba(196,168,130,0.45)",
  "rgba(42,191,191,0.42)",
  "rgba(232,131,58,0.42)",
];

// ── Month bar ──────────────────────────────────────────────────

const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const MONTH_FULL = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];
const MONTH_SHORT = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

function parseMonthsFromText(text: string): { active: number[]; shoulder: number[] } {
  const lower = text.toLowerCase();
  let activeMonths: number[] = [];

  const rangeRegex = /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b[\s\S]{0,6}(?:to|through|[-–—])\s*\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/i;
  const m = lower.match(rangeRegex);

  if (m) {
    let si = MONTH_FULL.indexOf(m[1]);
    if (si === -1) si = MONTH_SHORT.indexOf(m[1]);
    let ei = MONTH_FULL.indexOf(m[2]);
    if (ei === -1) ei = MONTH_SHORT.indexOf(m[2]);

    if (si !== -1 && ei !== -1) {
      if (si <= ei) {
        activeMonths = Array.from({ length: ei - si + 1 }, (_, i) => si + i);
      } else {
        activeMonths = [
          ...Array.from({ length: 12 - si }, (_, i) => si + i),
          ...Array.from({ length: ei + 1 }, (_, i) => i),
        ];
      }
    }
  }

  const shoulder: number[] = [];
  if (activeMonths.length > 0) {
    const min = Math.min(...activeMonths);
    const max = Math.max(...activeMonths);
    const prev = (min - 1 + 12) % 12;
    const next = (max + 1) % 12;
    if (!activeMonths.includes(prev)) shoulder.push(prev);
    if (!activeMonths.includes(next)) shoulder.push(next);
  }

  return { active: activeMonths, shoulder };
}

// ── Typography helpers ─────────────────────────────────────────

const CLASH: React.CSSProperties = { fontFamily: "'Clash Display', system-ui, sans-serif" };
const DM: React.CSSProperties = { fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif" };

function label(extra?: React.CSSProperties): React.CSSProperties {
  return { ...DM, fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--dp-text-muted, #6B6258)", marginBottom: "8px", ...extra };
}

function body(extra?: React.CSSProperties): React.CSSProperties {
  return { ...DM, fontSize: "15px", fontWeight: 400, lineHeight: 1.65, ...extra };
}

// ── Skeleton components ────────────────────────────────────────

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="h-5 w-40 animate-shimmer rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 animate-shimmer rounded-lg" style={{ width: `${85 - i * 12}%` }} />
      ))}
    </div>
  );
}

function ProsConsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="h-4 w-4 animate-shimmer rounded-full flex-shrink-0 mt-0.5" />
          <div className="h-4 animate-shimmer rounded-lg flex-1" style={{ width: `${80 - i * 8}%` }} />
        </div>
      ))}
    </div>
  );
}

function ItinerarySkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-5 w-32 animate-shimmer rounded-lg" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl border border-border p-4 space-y-2">
          <div className="h-5 w-28 animate-shimmer rounded-lg" />
          <div className="h-4 w-full animate-shimmer rounded-lg" />
          <div className="h-4 w-2/3 animate-shimmer rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-0">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-4 py-5 border-l-2 border-border pl-5 border-b border-b-border">
          <div className="h-5 w-5 animate-shimmer rounded-full flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 animate-shimmer rounded-lg" />
            <div className="h-4 w-full animate-shimmer rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function GalleryShimmer() {
  return (
    <div className="grid grid-cols-[2fr_1fr_1fr] grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[55vh] max-h-[500px]">
      <div className="row-span-2 animate-shimmer" />
      <div className="animate-shimmer" />
      <div className="animate-shimmer" />
      <div className="animate-shimmer" />
      <div className="animate-shimmer" />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

interface DestinationDetailPageProps {
  slug: string;
}

export function DestinationDetailPage({ slug }: DestinationDetailPageProps) {
  const { currency } = useCurrency();

  // Phase 1 context from sessionStorage
  const [ctx, setCtx] = useState<DestinationPageContext | null>(null);
  const [noContext, setNoContext] = useState(false);

  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  // Capture current URL client-side only — avoids window access in the JSX render path
  const [currentHref, setCurrentHref] = useState("");
  useEffect(() => { setCurrentHref(window.location.href); }, []);

  // Track whether we're displaying pre-loaded Phase 2 data (no fetch needed)
  const [usePreloaded, setUsePreloaded] = useState(true);

  // Gallery photos from API
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Read context from sessionStorage on mount
  useEffect(() => {
    const data = getDestinationContext(slug);
    if (data) {
      setCtx(data);
    } else {
      setNoContext(true);
    }
  }, [slug]);

  // Memoize tripInput so hooks don't get a new reference if ctx ever updates
  const tripInput = useMemo(() => ctx?.tripInput, [ctx]);

  // Stream Phase 2 detail (skipped when pre-loaded detail is available)
  const shouldStream = ctx != null && !(ctx.detail && usePreloaded) && !!ctx.tripInput;
  const {
    detail: streamedDetail,
    isStreaming,
    error: streamError,
  } = useDetailStream(
    shouldStream ? ctx?.summary.name : undefined,
    shouldStream ? (ctx?.summary.country ?? "") : undefined,
    shouldStream ? tripInput : undefined
  );

  // Use pre-loaded detail (sessionStorage / prefetch cache) if available; else use stream
  const detail: DeepPartial<DestinationSuggestion> | null =
    ctx?.detail && usePreloaded
      ? (ctx.detail as DeepPartial<DestinationSuggestion>)
      : streamedDetail;
  const detailLoading = isStreaming;
  const detailError = streamError;

  // Merged data: Phase 1 summary is the base; Phase 2 detail fields layer on top.
  const destination: DeepPartial<DestinationSuggestion> | null = useMemo(() => {
    if (!ctx) return null;
    const base = ctx.summary as DeepPartial<DestinationSuggestion>;
    if (!detail) return base;
    return { ...base, ...detail };
  }, [detail, ctx]);

  // Image search name resolution (same logic as ResultsPanel)
  const imageSearchName = useMemo(() => {
    if (ctx?.imageSearchName) return ctx.imageSearchName;
    if (!destination) return undefined;
    const days = destination.itinerary?.days;
    const locations = days?.map((d) => d?.location).filter(Boolean) ?? [];
    const unique = [...new Set(locations)];
    if (unique.length > 1) return days?.[0]?.location ?? destination.country ?? undefined;
    return destination.name ?? undefined;
  }, [ctx, destination]);

  const { data: session } = useSession();
  const isAuthenticated = !!session?.user?.id;

  const {
    itinerary: streamedItinerary,
    isStreaming: itineraryStreaming,
    error: itineraryError,
    trigger: triggerItinerary,
  } = useItineraryStream(
    ctx?.summary.name,
    ctx?.summary.country ?? "",
    tripInput
  );

  // Use on-demand itinerary if generated, otherwise fall back to preloaded itinerary in detail
  const itineraryData = streamedItinerary ?? detail?.itinerary;

  const stableCountry = ctx?.stableCountry ?? destination?.country ?? undefined;

  // Map markers from itinerary
  const mapMarkers: MapMarker[] = useMemo(() => {
    return (itineraryData?.days ?? [])
      .filter((d) => d?.coordinates?.lat != null && d?.coordinates?.lng != null)
      .map((d, i) => ({
        id: `day-${d!.dayNumber ?? i + 1}`,
        lat: d!.coordinates!.lat!,
        lng: d!.coordinates!.lng!,
        label: d!.dayNumber ?? i + 1,
        title: `Day ${d!.dayNumber ?? i + 1}`,
        subtitle: d!.location,
        isItinerary: true,
      }));
  }, [itineraryData]);

  // Format the trip dates from the user's original search input for display in stats
  const tripDateLabel = useMemo(() => {
    const dates = ctx?.tripInput?.dates;
    if (!dates) return null;
    if (!dates.flexible && dates.startDate && dates.endDate) {
      const fmt = (d: string) => {
        try {
          const [year, month, day] = d.split("-").map(Number);
          return new Date(year, month - 1, day).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        } catch { return d; }
      };
      return `${fmt(dates.startDate)} – ${fmt(dates.endDate)}`;
    }
    if (dates.flexible && dates.description) return dates.description;
    return null;
  }, [ctx?.tripInput?.dates]);

  // Covers both 2-section format (overview) and legacy 3-section format (quick/insights)
  const hasOverview = !!(detail?.pros?.length || detail?.localInsights?.length);
  const hasItinerary = !!(itineraryData?.days?.length);
  const hasBooking = !!(detail?.accommodation || detail?.flightEstimate || detail?.drivingEstimate || detail?.estimatedTotalTripCostEur);
  const showRefresh = usePreloaded && !!ctx?.detail && !!ctx?.tripInput;
  const goBack = useCallback(() => window.close(), []);

  // Booking URL generation
  const bookingUrls = useMemo(() => {
    if (!destination) return null;
    const destName = destination.name ?? "";
    const country = destination.country ?? "";
    const firstStop = destination.itinerary?.days?.[0]?.location;
    const searchDestName = firstStop && destName.length > 40 ? firstStop : destName;
    const searchLocation = detail?.accommodation?.recommendedArea ?? `${searchDestName}, ${country}`;
    return {
      booking: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(searchLocation)}`,
      airbnb: `https://www.airbnb.com/s/${encodeURIComponent(`${searchDestName}, ${country}`)}/homes`,
      googleFlights: detail?.flightEstimate?.fromAirportCode && detail?.flightEstimate?.toAirportCode
        ? `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(detail.flightEstimate.fromAirportCode)}+to+${encodeURIComponent(detail.flightEstimate.toAirportCode)}`
        : null,
      googleMaps: `https://www.google.com/maps/search/${encodeURIComponent(`${searchDestName}, ${country}`)}`,
    };
  }, [destination, detail]);

  // Fetch gallery photos
  useEffect(() => {
    if (!destination?.name) return;
    const params = new URLSearchParams({
      name: destination.name,
      country: stableCountry ?? destination.country ?? "",
      ...(imageSearchName ? { searchName: imageSearchName } : {}),
    });
    fetch(`/api/destination-gallery?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.photos)) {
          setGalleryPhotos(data.photos);
        }
      })
      .catch(() => {
        // silently ignore gallery errors
      });
  }, [destination?.name, stableCountry, imageSearchName]);

  // Lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setLightboxIndex(null); return; }
      if (e.key === "ArrowRight") setLightboxIndex((i) => i === null ? null : Math.min(i + 1, galleryPhotos.length - 1));
      if (e.key === "ArrowLeft")  setLightboxIndex((i) => i === null ? null : Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, galleryPhotos.length]);

  // ── No context fallback ──
  if (noContext) {
    return (
      <div className="destination-page min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="font-display text-2xl font-semibold text-foreground" style={CLASH}>Destination not found</h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            This page needs to be opened from search results. Head back and click on a destination to view its details.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm hover:underline"
            style={{ color: "var(--primary)" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to search
          </a>
        </div>
      </div>
    );
  }

  // ── Loading state before context is ready ──
  if (!destination) {
    return (
      <div className="destination-page min-h-screen bg-background">
        <div className="h-[70vh] animate-shimmer" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <GalleryShimmer />
          <div className="grid lg:grid-cols-[1fr_380px] lg:gap-16">
            <div className="space-y-8">
              <SectionSkeleton />
              <ProsConsSkeleton />
              <ItinerarySkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Estimated total cost ──
  const totalCostEur = destination.estimatedTotalTripCostEur ?? null;
  const dailyCostEur = destination.estimatedDailyCostEur ?? null;

  // Shared button style for primary CTAs
  const primaryBtnStyle: React.CSSProperties = {
    background: "var(--primary)",
    color: "var(--primary-foreground)",
    fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
    fontSize: "14px",
    fontWeight: 600,
    borderRadius: "10px",
    padding: "14px 24px",
    border: "none",
    cursor: "pointer",
    transition: "background 0.15s ease, transform 0.1s ease",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  };

  return (
    <div className="destination-page min-h-screen bg-background">

      {/* ── 1. Hero ── */}
      <div className="relative" style={{ height: "70vh", minHeight: "500px" }}>
        <DestinationImage
          name={destination.name}
          country={stableCountry}
          searchName={imageSearchName ?? undefined}
          fallbackName={imageSearchName ?? destination.name ?? undefined}
          className="w-full h-full"
        />
        {/* Gradient overlay — bleeds seamlessly into page background */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(15,14,13,0.1) 0%, rgba(15,14,13,0.85) 80%, #0F0E0D 100%)" }}
        />

        {/* Back button — top left */}
        <div className="absolute top-0 inset-x-0 p-5 sm:p-7">
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/30 backdrop-blur-md transition-colors hover:bg-black/50"
            style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "13px", fontWeight: 500, color: "var(--muted-foreground)" }}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        {/* Match score — top right, subtle pill */}
        {destination.matchScore != null && (
          <div className="absolute top-5 right-5 sm:top-7 sm:right-7">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-foreground"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              <Star className="h-3 w-3" />
              {destination.matchScore}% match
            </span>
          </div>
        )}

        {/* Bottom: name + country */}
        <div className="absolute bottom-0 inset-x-0 px-6 pb-10 sm:px-10 sm:pb-12">
          <div className="max-w-7xl mx-auto">
            {ctx?.rank != null && (
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/20 backdrop-blur text-white text-xs font-bold mb-3">
                {ctx.rank}
              </span>
            )}
            <h1
              className="font-display text-foreground leading-tight"
              style={{ ...CLASH, fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 700 }}
            >
              {destination.name || "Loading..."}
              {ctx?.isRecommended && (
                <span
                  className="inline-flex items-center ml-3 align-middle px-2.5 py-1 rounded-full"
                  style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                    fontWeight: 600,
                    background: "var(--dp-orange, #E8833A)",
                    color: "#0F0E0D",
                    verticalAlign: "middle",
                  }}
                >
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Top Pick
                </span>
              )}
            </h1>
            {destination.country && (
              <p
                className="mt-2"
                style={{
                  fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--dp-text-muted, #6B6258)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {destination.country}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Outer container ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── 2. Photo Mosaic ── */}
        <div className="mt-6">
          {galleryPhotos.length === 0 ? (
            <GalleryShimmer />
          ) : (
            <div
              className="relative grid grid-cols-[2fr_1fr_1fr] grid-rows-2 overflow-hidden h-[55vh] max-h-[500px]"
              style={{ gap: "8px", borderRadius: "10px" }}
            >
              {/* Large left image */}
              <div className="row-span-2 relative overflow-hidden" style={{ borderRadius: "10px" }}>
                <DestinationImage
                  name={destination.name}
                  country={stableCountry}
                  searchName={imageSearchName ?? undefined}
                  fallbackName={imageSearchName ?? destination.name ?? undefined}
                  className="w-full h-full transition-opacity duration-200 hover:opacity-85"
                />
              </div>
              {/* 4 smaller cells */}
              {[0, 1, 2, 3].map((idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className="relative overflow-hidden bg-border w-full h-full"
                  style={{ borderRadius: "10px", cursor: "pointer", padding: 0, border: "none" }}
                  aria-label={`View photo ${idx + 1}`}
                >
                  {galleryPhotos[idx] ? (
                    <img
                      src={galleryPhotos[idx]}
                      alt={`${destination.name ?? "Destination"} photo ${idx + 1}`}
                      className="w-full h-full object-cover transition-opacity duration-200 hover:opacity-85"
                    />
                  ) : (
                    <div className="w-full h-full animate-shimmer" />
                  )}
                  {/* "Show all photos" overlay on last cell */}
                  {idx === 3 && galleryPhotos.length > 4 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span
                        className="flex items-center gap-2"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          padding: "6px 14px",
                          fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "var(--foreground)",
                          pointerEvents: "none",
                        }}
                      >
                        <Images className="h-4 w-4" />
                        +{galleryPhotos.length - 3} photos
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Main layout grid ── */}
        <div className="mt-8 pb-24 lg:pb-12 lg:grid lg:grid-cols-[1fr_380px] lg:gap-16">

          {/* ── Left / Main column ── */}
          <div className="space-y-10 min-w-0">

            {/* ── 3. Action row ── */}
            <div className="flex items-center gap-3 flex-wrap">
              <FavoriteButton
                destination={destination}
                isFavorited={!!favoriteId}
                favoriteId={favoriteId}
                onToggle={setFavoriteId}
                onAuthRequired={() => {
                  window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`;
                }}
                size="md"
              />
              <ShareButton destination={destination} size="md" />
              {detailLoading && (
                <span
                  className="flex items-center gap-1.5 ml-1"
                  style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "12px", color: "var(--muted-foreground)" }}
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Personalising your trip...
                </span>
              )}
              {detailError && !detailLoading && (
                <span
                  className="flex items-center gap-1.5"
                  style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "12px", color: "var(--muted-foreground)" }}
                >
                  <AlertTriangle className="h-3.5 w-3.5" style={{ color: "var(--dp-orange, #E8833A)" }} />
                  Some details unavailable
                </span>
              )}
              {showRefresh && (
                <span style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "12px", color: "var(--muted-foreground)" }}>
                  Showing saved data.{" "}
                  <button
                    onClick={() => setUsePreloaded(false)}
                    className="hover:underline"
                    style={{ color: "var(--primary)" }}
                  >
                    Refresh
                  </button>
                </span>
              )}
            </div>

            {/* ── 4. Editorial Lede ── */}
            {destination.reasoning && (
              <div style={{ padding: "48px 0" }}>
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                    fontSize: "17px",
                    fontWeight: 400,
                    lineHeight: 1.75,
                    color: "var(--muted-foreground)",
                    maxWidth: "680px",
                  }}
                >
                  {destination.reasoning}
                </p>
              </div>
            )}

            {/* ── 5. Top Activities ── */}
            {destination.topActivities && destination.topActivities.length > 0 && (
              <div>
                <p style={label()}>Experiences</p>
                <p className="font-display text-foreground mb-4" style={{ ...CLASH, fontSize: "26px", fontWeight: 500 }}>
                  Top Activities
                </p>
                <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
                  {destination.topActivities.map((activity, idx) => (
                    <div
                      key={activity}
                      className="relative flex-shrink-0 w-44 overflow-hidden group"
                      style={{
                        borderRadius: "14px",
                        minHeight: "160px",
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
                      }}
                    >
                      {/* Color tint overlay */}
                      <div
                        className="absolute inset-0"
                        style={{ background: ACTIVITY_TINTS[idx % ACTIVITY_TINTS.length], zIndex: 1 }}
                      />
                      {/* Bottom gradient for text legibility */}
                      <div
                        className="absolute bottom-0 inset-x-0"
                        style={{
                          height: "70%",
                          background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
                          zIndex: 2,
                        }}
                      />
                      {/* Hover: add to itinerary button */}
                      <div
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ zIndex: 3 }}
                      >
                        <button
                          style={{
                            border: "1px solid rgba(255,255,255,0.4)",
                            borderRadius: "6px",
                            padding: "4px 10px",
                            fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#F2EEE8",
                            background: "transparent",
                            cursor: "pointer",
                          }}
                        >
                          + Add
                        </button>
                      </div>
                      {/* Activity name pinned bottom-left */}
                      <div className="absolute bottom-0 inset-x-0 p-4" style={{ zIndex: 3 }}>
                        <p className="font-display text-foreground" style={{ ...CLASH, fontSize: "16px", fontWeight: 500 }}>
                          {activity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 6. Plan your trip CTA card ── */}
            {!hasItinerary && (
              <div
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "16px",
                  borderLeft: "4px solid var(--primary)",
                  padding: "32px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
              >
                <h3
                  className="font-display text-foreground mb-3"
                  style={{ ...CLASH, fontSize: "22px", fontWeight: 500 }}
                >
                  Build your perfect trip
                </h3>
                <p
                  className="mb-5"
                  style={body({ color: "var(--muted-foreground)" })}
                >
                  Get a personalised day-by-day itinerary including a route map, accommodation areas, and local meal suggestions.
                </p>
                {isAuthenticated ? (
                  <button
                    onClick={triggerItinerary}
                    disabled={itineraryStreaming}
                    className="disabled:opacity-60"
                    style={primaryBtnStyle}
                  >
                    {itineraryStreaming ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating itinerary…
                      </>
                    ) : (
                      <>
                        Generate My Itinerary
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <a
                    href={`/auth/signin?callbackUrl=${encodeURIComponent(currentHref)}`}
                    style={primaryBtnStyle}
                  >
                    Sign in to generate itinerary
                    <ChevronRight className="h-4 w-4" />
                  </a>
                )}
                {itineraryError && (
                  <p
                    className="mt-3"
                    style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "12px", color: "#e05555" }}
                  >
                    Failed to generate itinerary. Please try again.
                  </p>
                )}
              </div>
            )}

            {/* ── 7. Know Before You Go (Local Insights) ── */}
            {hasOverview ? (
              destination.localInsights && destination.localInsights.length > 0 ? (
                <div
                  className="rounded-2xl p-6 sm:p-8"
                  style={{ background: "var(--dp-bg-subtle, #252219)" }}
                >
                  <p style={label()}>Local Knowledge</p>
                  <p className="font-display text-foreground mb-6" style={{ ...CLASH, fontSize: "26px", fontWeight: 500 }}>
                    Know Before You Go
                  </p>
                  <div>
                    {destination.localInsights.map((insight, i) => {
                      if (!insight?.category || !insight?.insight) return null;
                      const Icon = INSIGHT_ICONS[insight.category] ?? Lightbulb;
                      const isLast = i === (destination.localInsights?.length ?? 0) - 1;
                      return (
                        <div
                          key={i}
                          className={cn("flex items-start gap-4", !isLast && "border-b border-border")}
                          style={{
                            padding: "20px 0",
                            paddingLeft: "20px",
                            borderLeft: "3px solid var(--primary)",
                          }}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "var(--primary)" }} />
                          <div>
                            <p
                              style={{
                                fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "var(--foreground)",
                                marginBottom: "4px",
                              }}
                            >
                              {insight.category}
                            </p>
                            <p
                              style={{
                                fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                                fontSize: "14px",
                                fontWeight: 400,
                                color: "var(--muted-foreground)",
                                lineHeight: 1.6,
                              }}
                            >
                              {insight.insight}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null
            ) : detailLoading ? (
              <div className="rounded-2xl p-6 sm:p-8" style={{ background: "var(--dp-bg-subtle, #252219)" }}>
                <p style={label()}>Local Knowledge</p>
                <p className="font-display text-foreground mb-6" style={{ ...CLASH, fontSize: "26px", fontWeight: 500 }}>
                  Know Before You Go
                </p>
                <InsightsSkeleton />
              </div>
            ) : null}

            {/* ── 8. Weather ── */}
            {destination.weather && (
              <div>
                <p style={label()}>Climate</p>
                <p className="font-display text-foreground mb-4" style={{ ...CLASH, fontSize: "26px", fontWeight: 500 }}>
                  Weather
                </p>
                <div
                  className="flex items-center divide-x divide-border"
                  style={{
                    background: "var(--card)",
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                  }}
                >
                  {destination.weather.avgHighC != null && (
                    <div className="flex-1 flex flex-col items-center gap-1 py-4 px-2">
                      <Sun className="h-5 w-5 text-amber-500" />
                      <p style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "22px", fontWeight: 500, color: "var(--foreground)" }}>
                        {destination.weather.avgHighC}°C
                      </p>
                      <p style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "12px", fontWeight: 400, color: "var(--dp-text-muted, #6B6258)" }}>
                        High
                      </p>
                    </div>
                  )}
                  {destination.weather.avgLowC != null && (
                    <div className="flex-1 flex flex-col items-center gap-1 py-4 px-2">
                      <Thermometer className="h-5 w-5 text-blue-400" />
                      <p style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "22px", fontWeight: 500, color: "var(--foreground)" }}>
                        {destination.weather.avgLowC}°C
                      </p>
                      <p style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "12px", fontWeight: 400, color: "var(--dp-text-muted, #6B6258)" }}>
                        Low
                      </p>
                    </div>
                  )}
                  {destination.weather.rainyDays != null && (
                    <div className="flex-1 flex flex-col items-center gap-1 py-4 px-2">
                      <CloudRain className="h-5 w-5 text-sky-500" />
                      <p style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "22px", fontWeight: 500, color: "var(--foreground)" }}>
                        {destination.weather.rainyDays}
                      </p>
                      <p style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "12px", fontWeight: 400, color: "var(--dp-text-muted, #6B6258)" }}>
                        Rainy days
                      </p>
                    </div>
                  )}
                  {destination.weather.sunshineHours != null && (
                    <div className="flex-1 flex flex-col items-center gap-1 py-4 px-2">
                      <Sun className="h-5 w-5 text-yellow-400" />
                      <p style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "22px", fontWeight: 500, color: "var(--foreground)" }}>
                        {destination.weather.sunshineHours}h
                      </p>
                      <p style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "12px", fontWeight: 400, color: "var(--dp-text-muted, #6B6258)" }}>
                        Sunshine
                      </p>
                    </div>
                  )}
                </div>
                {destination.weather.description && (
                  <p
                    className="mt-3"
                    style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "14px", fontWeight: 400, color: "var(--muted-foreground)", lineHeight: 1.6 }}
                  >
                    {destination.weather.description}
                  </p>
                )}
              </div>
            )}

            {/* ── 9. Things to Know (pros + cautionary notes) ── */}
            {hasOverview ? (
              (destination.pros?.length || destination.cons?.length) ? (
                <div>
                  <p style={label()}>At a glance</p>
                  <p className="font-display text-foreground mb-4" style={{ ...CLASH, fontSize: "26px", fontWeight: 500 }}>
                    Things to Know
                  </p>
                  <ul>
                    {[
                      ...(destination.pros ?? []).map((t) => ({ text: t, positive: true })),
                      ...(destination.cons ?? []).map((t) => ({ text: t, positive: false })),
                    ].map((item, i, arr) => (
                      <li
                        key={item.text}
                        className="flex items-start gap-3"
                        style={{
                          padding: "10px 0",
                          borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : undefined,
                        }}
                      >
                        {item.positive ? (
                          <CheckCircle2
                            className="h-4 w-4 flex-shrink-0 mt-0.5"
                            style={{ color: "var(--primary)" }}
                          />
                        ) : (
                          <span
                            className="h-4 w-4 flex-shrink-0 mt-0.5 flex items-center justify-center font-bold text-base leading-none"
                            style={{ color: "var(--dp-warm-grey, #C4A882)" }}
                          >
                            •
                          </span>
                        )}
                        <p
                          style={{
                            fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                            fontSize: "14px",
                            fontWeight: 400,
                            color: "var(--muted-foreground)",
                            lineHeight: 1.6,
                          }}
                        >
                          {item.text}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            ) : detailLoading ? (
              <div>
                <p style={label()}>At a glance</p>
                <p className="font-display text-foreground mb-4" style={{ ...CLASH, fontSize: "26px", fontWeight: 500 }}>
                  Things to Know
                </p>
                <ProsConsSkeleton />
              </div>
            ) : null}

            {/* ── 10. What's Happening (Events) ── */}
            {hasOverview && destination.localEvents && destination.localEvents.length > 0 && (
              <div>
                <p style={label()}>Events</p>
                <p className="font-display text-foreground mb-4" style={{ ...CLASH, fontSize: "26px", fontWeight: 500 }}>
                  What&apos;s Happening
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {destination.localEvents.map((event, i) => {
                    if (!event?.name) return null;
                    return (
                      <div
                        key={i}
                        style={{
                          background: "var(--card)",
                          borderRadius: "12px",
                          border: "1px solid var(--border)",
                          padding: "20px",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4
                            className="font-display text-foreground"
                            style={{ ...CLASH, fontSize: "16px", fontWeight: 500 }}
                          >
                            {event.name}
                          </h4>
                          {event.type && (
                            <span
                              style={{
                                background: "rgba(232,131,58,0.15)",
                                color: "var(--dp-orange, #E8833A)",
                                fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                                fontSize: "11px",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                borderRadius: "4px",
                                padding: "2px 8px",
                                flexShrink: 0,
                              }}
                            >
                              {event.type}
                            </span>
                          )}
                        </div>
                        {event.date && (
                          <p
                            className="flex items-center gap-1 mb-2"
                            style={{
                              fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                              fontSize: "12px",
                              fontWeight: 400,
                              color: "var(--dp-text-muted, #6B6258)",
                            }}
                          >
                            <CalendarDays className="h-3 w-3" />
                            {event.date}
                          </p>
                        )}
                        {event.description && (
                          <p
                            style={{
                              fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                              fontSize: "13px",
                              fontWeight: 400,
                              color: "var(--muted-foreground)",
                              lineHeight: 1.55,
                            }}
                          >
                            {event.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── 11. When to Go ── */}
            {destination.bestTimeToVisit && (
              <div
                className="rounded-2xl p-6"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDays className="h-5 w-5" style={{ color: "var(--primary)" }} />
                  <p className="font-display text-foreground" style={{ ...CLASH, fontSize: "26px", fontWeight: 500 }}>
                    When to Go
                  </p>
                </div>
                {(() => {
                  const { active, shoulder } = parseMonthsFromText(destination.bestTimeToVisit);
                  return (
                    <>
                      {active.length > 0 && (
                        <div className="mb-4">
                          <div className="flex gap-1 mb-2">
                            {MONTH_LABELS.map((lbl, i) => {
                              const isActive = active.includes(i);
                              const isShoulder = shoulder.includes(i);
                              return (
                                <div key={i} className="flex flex-col items-center flex-1 gap-1">
                                  <div
                                    style={{
                                      height: "8px",
                                      borderRadius: "999px",
                                      width: "100%",
                                      background: isActive
                                        ? "var(--primary)"
                                        : isShoulder
                                        ? "var(--dp-warm-grey, #C4A882)"
                                        : "var(--border)",
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                                      fontSize: "10px",
                                      fontWeight: 400,
                                      color: "var(--dp-text-muted, #6B6258)",
                                    }}
                                  >
                                    {lbl}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <p
                        style={{
                          fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                          fontSize: "14px",
                          fontWeight: 400,
                          color: "var(--muted-foreground)",
                          lineHeight: 1.65,
                        }}
                      >
                        {destination.bestTimeToVisit}
                      </p>
                    </>
                  );
                })()}
              </div>
            )}

            {/* ── 12. Book Your Trip ── */}
            {hasBooking ? (
              <div>
                <p style={label()}>Plan & Book</p>
                <p className="font-display text-foreground mb-4" style={{ ...CLASH, fontSize: "26px", fontWeight: 500 }}>
                  Book Your Trip
                </p>
                <div
                  style={{
                    background: "var(--card)",
                    borderRadius: "16px",
                    border: "1px solid var(--border)",
                    padding: "28px",
                  }}
                >
                  {/* Cost breakdown */}
                  {(dailyCostEur != null || totalCostEur != null) && (
                    <div className="space-y-3 pb-5 mb-5" style={{ borderBottom: "1px solid var(--border)" }}>
                      {dailyCostEur != null && (
                        <div className="flex items-center justify-between">
                          <span style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "14px", fontWeight: 400, color: "var(--muted-foreground)" }}>
                            Estimated daily cost
                          </span>
                          <span style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>
                            ~{formatPrice(dailyCostEur, currency)}
                          </span>
                        </div>
                      )}
                      {detail?.accommodation?.averageNightlyEur != null && (
                        <div className="flex items-center justify-between">
                          <span style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "14px", fontWeight: 400, color: "var(--muted-foreground)" }}>
                            Accommodation / night
                          </span>
                          <span style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>
                            ~{formatPrice(detail.accommodation.averageNightlyEur, currency)}
                          </span>
                        </div>
                      )}
                      {detail?.flightEstimate?.roundTripEur != null && (
                        <div className="flex items-center justify-between">
                          <span
                            className="flex items-center gap-1"
                            style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "14px", fontWeight: 400, color: "var(--muted-foreground)" }}
                          >
                            <Plane className="h-3 w-3" />
                            Flights (est.)
                          </span>
                          <span style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>
                            ~{formatPrice(detail.flightEstimate.roundTripEur, currency)}
                          </span>
                        </div>
                      )}
                      {detail?.drivingEstimate?.estimatedGasCostEur != null && (
                        <div className="flex items-center justify-between">
                          <span
                            className="flex items-center gap-1"
                            style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "14px", fontWeight: 400, color: "var(--muted-foreground)" }}
                          >
                            <Car className="h-3 w-3" />
                            Driving (est.)
                          </span>
                          <span style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>
                            ~{formatPrice(detail.drivingEstimate.estimatedGasCostEur, currency)}
                          </span>
                        </div>
                      )}
                      {totalCostEur != null && (
                        <div
                          className="flex items-center justify-between pt-4"
                          style={{ borderTop: "1px solid var(--border)" }}
                        >
                          <p className="font-display text-foreground" style={{ ...CLASH, fontSize: "32px", fontWeight: 600 }}>
                            ~{formatPrice(totalCostEur, currency)}
                          </p>
                          <span style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "13px", fontWeight: 400, color: "var(--dp-text-muted, #6B6258)" }}>
                            estimated total
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Booking links */}
                  {bookingUrls && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <a
                          href={bookingUrls.booking}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 transition-colors"
                          style={{
                            background: "var(--surface, #252219)",
                            border: "1px solid var(--border)",
                            borderRadius: "10px",
                            padding: "14px",
                            fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "var(--foreground)",
                            textDecoration: "none",
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Booking.com
                        </a>
                        <a
                          href={bookingUrls.airbnb}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 transition-colors"
                          style={{
                            background: "var(--surface, #252219)",
                            border: "1px solid var(--border)",
                            borderRadius: "10px",
                            padding: "14px",
                            fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "var(--foreground)",
                            textDecoration: "none",
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Airbnb
                        </a>
                      </div>
                      {bookingUrls.googleFlights && (
                        <a
                          href={bookingUrls.googleFlights}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full transition-colors"
                          style={{
                            background: "var(--surface, #252219)",
                            border: "1px solid var(--border)",
                            borderRadius: "10px",
                            padding: "14px",
                            fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "var(--foreground)",
                            textDecoration: "none",
                          }}
                        >
                          <Plane className="h-3.5 w-3.5" />
                          Search Flights on Google
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : detailLoading ? (
              <SectionSkeleton rows={2} />
            ) : null}

            {/* ── 13. Generated Itinerary ── */}
            {hasItinerary && (
              <div>
                <p style={label()}>Day by day</p>
                <p className="font-display text-foreground mb-4" style={{ ...CLASH, fontSize: "26px", fontWeight: 500 }}>
                  Your Itinerary
                </p>
                {mapMarkers.length > 0 && (
                  <div className="mb-6 rounded-2xl overflow-hidden">
                    <ExploreMap markers={mapMarkers} selectedId={null} showRoute={true} height={350} />
                  </div>
                )}
                <ItineraryTimeline itinerary={itineraryData!} />
              </div>
            )}

          </div>

          {/* ── Right column: sticky booking panel (desktop only) ── */}
          <aside className="hidden lg:block">
            <div
              className="sticky overflow-hidden"
              style={{
                top: "24px",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                padding: "24px",
              }}
            >
              {/* Header */}
              <div className="pb-4 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <p style={label()}>Estimated trip</p>
                {totalCostEur != null ? (
                  <p className="font-display text-foreground" style={{ ...CLASH, fontSize: "32px", fontWeight: 600 }}>
                    ~{formatPrice(totalCostEur, currency)}
                  </p>
                ) : dailyCostEur != null ? (
                  <p className="font-display text-foreground" style={{ ...CLASH, fontSize: "32px", fontWeight: 600 }}>
                    ~{formatPrice(dailyCostEur, currency)}
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: 400,
                        fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                        color: "var(--muted-foreground)",
                      }}
                    >
                      /day
                    </span>
                  </p>
                ) : detailLoading ? (
                  <div className="h-9 w-40 animate-shimmer rounded-lg mt-1" />
                ) : (
                  <p className="font-display" style={{ fontSize: "20px", color: "var(--muted-foreground)" }}>
                    Cost loading...
                  </p>
                )}
              </div>

              {/* Line items */}
              <div className="space-y-3 pb-4 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                {dailyCostEur != null && (
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "13px", fontWeight: 400, color: "var(--muted-foreground)" }}>
                      Daily cost
                    </span>
                    <span style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "13px", fontWeight: 500, color: "var(--foreground)" }}>
                      ~{formatPrice(dailyCostEur, currency)}
                    </span>
                  </div>
                )}
                {tripDateLabel && (
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "13px", fontWeight: 400, color: "var(--muted-foreground)" }}>
                      Your dates
                    </span>
                    <span style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "13px", fontWeight: 500, color: "var(--foreground)" }}>
                      {tripDateLabel}
                    </span>
                  </div>
                )}
                {destination.suggestedDuration && (
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "13px", fontWeight: 400, color: "var(--muted-foreground)" }}>
                      Suggested stay
                    </span>
                    <span style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "13px", fontWeight: 500, color: "var(--foreground)" }}>
                      {destination.suggestedDuration}
                    </span>
                  </div>
                )}
                {detailLoading && (
                  <div className="space-y-2 pt-1">
                    <div className="h-4 w-full animate-shimmer rounded" />
                    <div className="h-4 w-4/5 animate-shimmer rounded" />
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="space-y-3">
                {isAuthenticated ? (
                  <button
                    onClick={triggerItinerary}
                    disabled={itineraryStreaming || hasItinerary}
                    className="flex items-center justify-center gap-2 w-full disabled:opacity-60"
                    style={{
                      background: "var(--primary)",
                      color: "var(--primary-foreground)",
                      fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                      fontSize: "14px",
                      fontWeight: 600,
                      borderRadius: "10px",
                      padding: "14px 24px",
                      border: "none",
                      cursor: "pointer",
                      transition: "background 0.15s ease, transform 0.1s ease",
                    }}
                  >
                    {itineraryStreaming ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating…
                      </>
                    ) : hasItinerary ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Itinerary Generated
                      </>
                    ) : (
                      "Generate My Itinerary"
                    )}
                  </button>
                ) : (
                  <a
                    href={`/auth/signin?callbackUrl=${encodeURIComponent(currentHref)}`}
                    className="flex items-center justify-center gap-2 w-full"
                    style={{
                      background: "var(--primary)",
                      color: "var(--primary-foreground)",
                      fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                      fontSize: "14px",
                      fontWeight: 600,
                      borderRadius: "10px",
                      padding: "14px 24px",
                      textDecoration: "none",
                      display: "flex",
                    }}
                  >
                    Sign in to plan trip
                  </a>
                )}

                {/* Booking quick links */}
                {bookingUrls && (
                  <p
                    className="text-center"
                    style={{
                      fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--dp-text-muted, #6B6258)",
                    }}
                  >
                    <a
                      href={bookingUrls.booking}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Booking.com
                    </a>
                    {" · "}
                    <a
                      href={bookingUrls.airbnb}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Airbnb
                    </a>
                    {bookingUrls.googleFlights && (
                      <>
                        {" · "}
                        <a
                          href={bookingUrls.googleFlights}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          Flights
                        </a>
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>
          </aside>

        </div>
      </div>

      {/* ── 14. Mobile sticky bottom bar ── */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 lg:hidden flex items-center gap-4"
        style={{
          background: "var(--card)",
          borderTop: "1px solid var(--border)",
          padding: "12px 20px",
        }}
      >
        <div className="flex-1 min-w-0">
          {totalCostEur != null ? (
            <>
              <p style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "16px", fontWeight: 600, color: "var(--foreground)", lineHeight: 1.2 }}>
                ~{formatPrice(totalCostEur, currency)}
              </p>
              <p style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "11px", fontWeight: 400, color: "var(--dp-text-muted, #6B6258)" }}>
                est. total
              </p>
            </>
          ) : dailyCostEur != null ? (
            <>
              <p style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "16px", fontWeight: 600, color: "var(--foreground)", lineHeight: 1.2 }}>
                ~{formatPrice(dailyCostEur, currency)}
                <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--muted-foreground)" }}>/day</span>
              </p>
              <p style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "11px", fontWeight: 400, color: "var(--dp-text-muted, #6B6258)" }}>
                est. daily cost
              </p>
            </>
          ) : (
            <p style={{ fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif", fontSize: "13px", color: "var(--muted-foreground)" }}>
              Calculating cost…
            </p>
          )}
        </div>
        {isAuthenticated ? (
          <button
            onClick={triggerItinerary}
            disabled={itineraryStreaming || hasItinerary}
            className="flex-shrink-0 flex items-center gap-2 disabled:opacity-50"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "10px",
              padding: "12px 20px",
              border: "none",
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}
          >
            {itineraryStreaming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : hasItinerary ? (
              "View Itinerary"
            ) : (
              "Generate Itinerary"
            )}
          </button>
        ) : (
          <a
            href={`/auth/signin?callbackUrl=${encodeURIComponent(currentHref)}`}
            className="flex-shrink-0 flex items-center gap-2"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "10px",
              padding: "12px 20px",
              textDecoration: "none",
            }}
          >
            Sign in to plan
          </a>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && galleryPhotos[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
          onClick={() => setLightboxIndex(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(0,0,0,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxIndex(null)}
            aria-label="Close lightbox"
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              cursor: "pointer",
              color: "#F2EEE8",
              fontSize: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>

          {/* Counter */}
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
              fontSize: "13px",
              color: "rgba(242,238,232,0.6)",
            }}
          >
            {lightboxIndex + 1} / {galleryPhotos.length}
          </div>

          {/* Prev */}
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => Math.max((i ?? 1) - 1, 0)); }}
              aria-label="Previous photo"
              style={{
                position: "absolute",
                left: "16px",
                background: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: "50%",
                width: "44px",
                height: "44px",
                cursor: "pointer",
                color: "#F2EEE8",
                fontSize: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ‹
            </button>
          )}

          {/* Image */}
          <img
            src={galleryPhotos[lightboxIndex]}
            alt={`${destination?.name ?? "Destination"} photo ${lightboxIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw",
              maxHeight: "85vh",
              objectFit: "contain",
              borderRadius: "8px",
              boxShadow: "0 8px 48px rgba(0,0,0,0.6)",
            }}
          />

          {/* Next */}
          {lightboxIndex < galleryPhotos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => Math.min((i ?? 0) + 1, galleryPhotos.length - 1)); }}
              aria-label="Next photo"
              style={{
                position: "absolute",
                right: "16px",
                background: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: "50%",
                width: "44px",
                height: "44px",
                cursor: "pointer",
                color: "#F2EEE8",
                fontSize: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ›
          </button>
          )}

          {/* Thumbnail strip */}
          {galleryPhotos.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                bottom: "16px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: "6px",
                overflowX: "auto",
                maxWidth: "90vw",
                padding: "4px",
              }}
            >
              {galleryPhotos.map((url, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                  aria-label={`View photo ${i + 1}`}
                  style={{
                    flexShrink: 0,
                    width: "52px",
                    height: "36px",
                    borderRadius: "4px",
                    overflow: "hidden",
                    border: i === lightboxIndex ? "2px solid #2ABFBF" : "2px solid transparent",
                    padding: 0,
                    cursor: "pointer",
                    opacity: i === lightboxIndex ? 1 : 0.55,
                    transition: "opacity 0.15s, border-color 0.15s",
                  }}
                >
                  <img
                    src={url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
