"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { ExplorationSummaryResultSchema } from "@/lib/ai/schemas";
import type { TripInput, ExplorationSummaryResult } from "@/lib/ai/schemas";
import type { DeepPartial } from "ai";
import { TripInputForm } from "@/components/explore/TripInputForm";
import { ResultsPanel } from "@/components/results/ResultsPanel";
import { BackgroundMap } from "@/components/explore/BackgroundMap";
import { UserButton } from "@/components/auth/UserButton";
import { SignInModal } from "@/components/auth/SignInModal";
import { useSearchGate } from "@/lib/hooks/useSearchGate";
import {
  savePendingAuthState,
  loadPendingAuthState,
  clearPendingAuthState,
} from "@/lib/auth-persistence";

export default function ExplorePage() {
  const { object, submit, isLoading, error } = useObject({
    api: "/api/explore",
    schema: ExplorationSummaryResultSchema,
  });

  const [currentTripInput, setCurrentTripInput] = useState<TripInput | null>(null);

  // Restored state from sessionStorage (survives OAuth redirect)
  const [restoredResult, setRestoredResult] = useState<DeepPartial<ExplorationSummaryResult> | null>(null);
  const [pendingAutoFavorite, setPendingAutoFavorite] = useState<string | null>(null);

  const {
    showSignInModal,
    signInReason,
    pendingFavoriteName,
    checkSearchAllowed,
    checkFavoriteAllowed,
    closeModal,
  } = useSearchGate();

  // Restore state from sessionStorage on mount (after OAuth redirect)
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

  // The effective result: live useObject data takes priority over restored data
  const effectiveResult = object ?? restoredResult;

  function handleSubmit(input: TripInput) {
    if (!checkSearchAllowed()) return;
    console.log("[Rough Idea] Submitting:", input);
    setRestoredResult(null);
    setCurrentTripInput(input);
    submit(input);

    // Scroll so user sees loading animation and results
    if (window.innerWidth < 1024) {
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // Save state to sessionStorage before OAuth redirect
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

  const hasResults = !!(effectiveResult?.summary || effectiveResult?.destinations?.length);

  return (
    <div className="min-h-screen bg-surface relative">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <a href="/" className="font-logo text-3xl uppercase tracking-[-0.02em]">
            ROUGH IDEA<span className="text-highlight">.</span>
          </a>
          <UserButton />
        </div>
      </header>

      {/* Background map — visible when no results */}
      {!hasResults && !isLoading && (
        <div className="absolute inset-0 top-[65px] z-0">
          <BackgroundMap />
          <div className="absolute inset-0 bg-gradient-to-b from-surface/60 via-surface/30 to-surface/80 pointer-events-none" />
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4 sm:gap-6 lg:gap-8">
          {/* Input sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
              <h2 className="font-display font-semibold text-xl mb-1">
                Where should you go?
              </h2>
              <p className="text-sm text-muted-foreground mb-4 sm:mb-6">
                Tell us roughly what you&apos;re after and we&apos;ll find your perfect trip.
              </p>
              <TripInputForm onSubmit={handleSubmit} isLoading={isLoading} hasResults={hasResults} />
            </div>
          </aside>

          {/* Results */}
          <section ref={resultsRef} className="min-w-0">
            <ResultsPanel
              result={effectiveResult ?? undefined}
              isLoading={isLoading}
              error={error ?? undefined}
              tripInput={currentTripInput}
              onAuthRequired={checkFavoriteAllowed}
              pendingAutoFavorite={pendingAutoFavorite}
              onAutoFavoriteComplete={handleAutoFavoriteComplete}
            />
          </section>
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
