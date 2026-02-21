"use client";

import { useEffect } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { ExplorationResultSchema } from "@/lib/ai/schemas";
import type { TripInput } from "@/lib/ai/schemas";
import { TripInputForm } from "@/components/explore/TripInputForm";
import { ResultsPanel } from "@/components/results/ResultsPanel";
import { BackgroundMap } from "@/components/explore/BackgroundMap";
import { UserButton } from "@/components/auth/UserButton";

export default function ExplorePage() {
  const { object, submit, isLoading, error } = useObject({
    api: "/api/explore",
    schema: ExplorationResultSchema,
  });

  useEffect(() => {
    if (error) {
      console.error("[Rough Idea] API error:", error);
    }
  }, [error]);

  function handleSubmit(input: TripInput) {
    console.log("[Rough Idea] Submitting:", input);
    submit(input);
  }

  const hasResults = !!(object?.summary || object?.destinations?.length);

  return (
    <div className="min-h-screen bg-surface relative">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
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

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8">
          {/* Input sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-display font-semibold text-xl mb-1">
                Where should you go?
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Tell us roughly what you&apos;re after and we&apos;ll find your perfect trip.
              </p>
              <TripInputForm onSubmit={handleSubmit} isLoading={isLoading} hasResults={hasResults} />
            </div>
          </aside>

          {/* Results */}
          <section className="min-w-0">
            <ResultsPanel
              result={object ?? undefined}
              isLoading={isLoading}
              error={error ?? undefined}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
