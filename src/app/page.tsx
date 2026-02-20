import { Compass, MapPin, Sun, Route, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="font-logo text-3xl uppercase tracking-[-0.02em]">
            ROUGH IDEA<span className="text-highlight">.</span>
          </span>
          <Link
            href="/explore"
            className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Start Exploring
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 pt-24 pb-16">
        <div className="max-w-3xl text-center space-y-10">
          <div className="space-y-5">
            <p className="text-sm font-medium tracking-widest uppercase text-primary">
              Travel Planning, Reimagined
            </p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              Got a rough idea?
              <br />
              <span className="text-gradient">We&apos;ll plan the rest.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Tell us when, where-ish, and what you&apos;re into. Our AI compares
              destinations, checks the weather, and builds your perfect itinerary.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-foreground text-background font-medium hover:opacity-90 transition-opacity shadow-lg"
            >
              <Compass className="h-5 w-5" />
              Explore Destinations
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-8">
            {[
              {
                icon: MapPin,
                title: "Smart Suggestions",
                desc: "AI-powered destination ideas tailored to your vague preferences",
              },
              {
                icon: Sun,
                title: "Weather Intel",
                desc: "Side-by-side climate data for your exact travel window",
              },
              {
                icon: Route,
                title: "Full Itinerary",
                desc: "Day-by-day plans with routes, restaurants, and local tips",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-card p-6 text-left space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent">
                  <Icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
