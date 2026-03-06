"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { ExplorationSummaryResultSchema } from "@/lib/ai/schemas";
import type { TripInput, ExplorationSummaryResult } from "@/lib/ai/schemas";
import type { DeepPartial } from "ai";
import { TripInputForm } from "@/components/explore/TripInputForm";
import { ResultsPanel } from "@/components/results/ResultsPanel";
import { ExploreMap } from "@/components/results/ExploreMap";
import type { MapMarker } from "@/components/results/ExploreMapInner";
import { ExploreLoadingState } from "@/components/results/ExploreLoadingState";
import { BackgroundMap } from "@/components/explore/BackgroundMap";
import { UserButton } from "@/components/auth/UserButton";
import { SignInModal } from "@/components/auth/SignInModal";
import { useSearchGate } from "@/lib/hooks/useSearchGate";
import {
  savePendingAuthState,
  loadPendingAuthState,
  clearPendingAuthState,
} from "@/lib/auth-persistence";
import { useCurrency } from "@/components/CurrencyProvider";

const CLASH: React.CSSProperties = { fontFamily: "'Clash Display', system-ui, sans-serif" };

export default function ExplorePage() {
  const { object, submit, isLoading, error } = useObject({
    api: "/api/explore",
    schema: ExplorationSummaryResultSchema,
  });

  const { currency } = useCurrency();
  const [currentTripInput, setCurrentTripInput] = useState<TripInput | null>(null);

  const [restoredResult, setRestoredResult] = useState<DeepPartial<ExplorationSummaryResult> | null>(null);
  const [pendingAutoFavorite, setPendingAutoFavorite] = useState<string | null>(null);
  const [hoveredDestName, setHoveredDestName] = useState<string | null>(null);

  const {
    showSignInModal,
    signInReason,
    pendingFavoriteName,
    checkSearchAllowed,
    checkFavoriteAllowed,
    closeModal,
  } = useSearchGate();

  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayFading, setOverlayFading] = useState(false);
  const overlayFadingRef = useRef(false);

  const restoredRef = useRef(false);
  const resultsRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const saved = loadPendingAuthState();
    if (saved) {
      setCurrentTripInput(saved.tripInput);
      setRestoredResult(saved.results);
      if (saved.pendingFavoriteDestination) {
        setPendingAutoFavorite(saved.pendingFavoriteDestination);
      }
      clearPendingAuthState();
    }
  }, []);

  useEffect(() => {
    if (error) {
      console.error("[Rough Idea] API error:", error);
    }
  }, [error]);

  useEffect(() => {
    if (isLoading) {
      setOverlayVisible(true);
      setOverlayFading(false);
      overlayFadingRef.current = false;
    }
  }, [isLoading]);

  const effectiveResult = object ?? restoredResult;

  const destCount = (effectiveResult?.destinations ?? []).filter(Boolean).length;

  useEffect(() => {
    if (overlayVisible && destCount >= 2 && !overlayFadingRef.current) {
      overlayFadingRef.current = true;
      setOverlayFading(true);
      const timer = setTimeout(() => {
        setOverlayVisible(false);
        setOverlayFading(false);
        overlayFadingRef.current = false;
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [overlayVisible, destCount]);

  function handleSubmit(input: TripInput) {
    if (!checkSearchAllowed()) return;
    const enrichedInput = { ...input, currency };
    console.log("[Rough Idea] Submitting:", enrichedInput);
    setRestoredResult(null);
    setCurrentTripInput(enrichedInput);
    submit(enrichedInput);

    if (window.innerWidth < 1024) {
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const handleBeforeSignIn = useCallback(() => {
    const resultToSave = object ?? restoredResult;
    if (currentTripInput && resultToSave) {
      savePendingAuthState(
        currentTripInput,
        resultToSave,
        pendingFavoriteName ?? null
      );
    }
  }, [object, restoredResult, currentTripInput, pendingFavoriteName]);

  const handleAutoFavoriteComplete = useCallback(() => {
    setPendingAutoFavorite(null);
  }, []);

  const hasResults = !!effectiveResult?.destinations?.length;
  const showLayout = hasResults || isLoading;

  // Map markers for left-panel map
  const mapMarkers = useMemo((): MapMarker[] => {
    const dests = effectiveResult?.destinations ?? [];
    return dests
      .filter((d) => d?.coordinates?.lat != null && d?.coordinates?.lng != null)
      .map((d, i) => ({
        id: d!.name ?? `dest-${i}`,
        lat: d!.coordinates!.lat!,
        lng: d!.coordinates!.lng!,
        label: i + 1,
        title: d!.name ?? "Unknown",
        subtitle: d!.country,
      }));
  }, [effectiveResult?.destinations]);

  return (
    <div className="explore-page min-h-screen" style={{ background: "var(--background, #0F0E0D)" }}>
      {/* Full-screen loading overlay */}
      {overlayVisible && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "#0F0E0D",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: overlayFading ? 0 : 1,
            transition: "opacity 0.4s ease",
            pointerEvents: overlayFading ? "none" : "auto",
          }}
        >
          <ExploreLoadingState />
        </div>
      )}

      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border, #2E2B25)",
          background: "rgba(28,26,23,0.85)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <a
            href="/"
            style={{
              ...CLASH,
              fontSize: "24px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--foreground, #F2EEE8)",
              textDecoration: "none",
            }}
          >
            ROUGH IDEA<span style={{ color: "var(--dp-orange, #E8833A)" }}>.</span>
          </a>
          <UserButton />
        </div>
      </header>

      {/* Background map overlay — visible when no results */}
      {!showLayout && (
        <div className="absolute inset-0 top-[65px] z-0 pointer-events-none">
          <BackgroundMap />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(15,14,13,0.55) 0%, rgba(15,14,13,0.25) 40%, rgba(15,14,13,0.8) 100%)",
            }}
          />
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/*
          Single TripInputForm instance always in <aside> to preserve React state.
          Layout switches via parent CSS classes: centered column (pre) vs 2-col grid (post).
        */}
        <div
          className={
            showLayout
              ? "grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 py-4 sm:py-6"
              : "flex flex-col items-center pt-[8vh] pb-8"
          }
        >
          {/* Aside: form (+ map when results) */}
          <aside
            className={showLayout ? "lg:sticky lg:top-24 lg:self-start space-y-4" : "w-full max-w-[500px]"}
          >
            {/* Pre-search heading — hidden (not removed) when results exist to keep form in stable DOM position */}
            <div
              className="text-center"
              style={{ display: showLayout ? "none" : "block", marginBottom: "24px" }}
            >
              <h1
                style={{
                  ...CLASH,
                  fontSize: "clamp(26px, 5vw, 40px)",
                  fontWeight: 700,
                  color: "var(--foreground, #F2EEE8)",
                  lineHeight: 1.15,
                  marginBottom: "10px",
                }}
              >
                Where should you go?
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans, 'DM Sans'), sans-serif",
                  fontSize: "15px",
                  color: "var(--muted-foreground, #A89F94)",
                  lineHeight: 1.5,
                }}
              >
                Tell us roughly what you&apos;re after and we&apos;ll find your perfect trip.
              </p>
            </div>

            {/* Form card */}
            <div
              style={{
                borderRadius: showLayout ? "16px" : "20px",
                border: "1px solid var(--border, #2E2B25)",
                background: "var(--card, #1C1A17)",
                padding: showLayout ? "20px" : "28px",
                boxShadow: showLayout
                  ? "0 4px 24px rgba(0,0,0,0.3)"
                  : "0 8px 40px rgba(0,0,0,0.5)",
              }}
            >
              <TripInputForm
                onSubmit={handleSubmit}
                isLoading={isLoading}
                hasResults={hasResults}
              />
            </div>

            {/* Map — shown in left panel once results arrive */}
            {showLayout && !overlayVisible && mapMarkers.length > 0 && (
              <ExploreMap
                markers={mapMarkers}
                selectedId={hoveredDestName}
                showRoute={false}
                onMarkerClick={() => {}}
                onMarkerHover={(id) => setHoveredDestName(id)}
                panOnSelect={false}
                height={400}
              />
            )}
          </aside>

          {/* Results panel — right column (hidden when no results) */}
          {showLayout && !overlayVisible && (
            <section ref={resultsRef} className="min-w-0">
              <ResultsPanel
                result={effectiveResult ?? undefined}
                isLoading={isLoading}
                error={error ?? undefined}
                tripInput={currentTripInput}
                onAuthRequired={checkFavoriteAllowed}
                pendingAutoFavorite={pendingAutoFavorite}
                onAutoFavoriteComplete={handleAutoFavoriteComplete}
                hideMap={true}
                hoveredDestName={hoveredDestName}
                onCardHover={(name) => setHoveredDestName(name)}
              />
            </section>
          )}
        </div>
      </main>

      <SignInModal
        isOpen={showSignInModal}
        onClose={closeModal}
        reason={signInReason}
        onBeforeSignIn={handleBeforeSignIn}
      />
    </div>
  );
}
