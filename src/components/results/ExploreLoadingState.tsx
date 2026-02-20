"use client";

import { useState, useEffect } from "react";
import { Plane, Compass, Globe2, MapPin, Sun, Mountain } from "lucide-react";

const subtitles = [
  "Comparing weather patterns...",
  "Calculating travel costs...",
  "Finding hidden gems...",
  "Building your itinerary...",
  "Checking local events...",
  "Scouting the best routes...",
];

const floatingIcons = [
  { Icon: Plane, className: "top-4 left-8 animate-float-1" },
  { Icon: Compass, className: "top-6 right-10 animate-float-2" },
  { Icon: Globe2, className: "bottom-12 left-12 animate-float-3" },
  { Icon: MapPin, className: "bottom-8 right-8 animate-float-1" },
  { Icon: Sun, className: "top-1/3 left-1/4 animate-float-2" },
  { Icon: Mountain, className: "top-1/3 right-1/4 animate-float-3" },
];

export function ExploreLoadingState() {
  const [subtitleIndex, setSubtitleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % subtitles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative rounded-2xl border border-border bg-card p-8 min-h-[300px] flex flex-col items-center justify-center overflow-hidden shadow-sm">
      {/* Floating background icons */}
      {floatingIcons.map(({ Icon, className }, i) => (
        <Icon
          key={i}
          className={`absolute h-8 w-8 text-primary/15 ${className}`}
        />
      ))}

      {/* Central content */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <p className="font-display text-xl font-medium text-foreground">
          Discovering your perfect destinations...
        </p>

        <p className="text-sm text-muted-foreground h-5 transition-opacity duration-300">
          {subtitles[subtitleIndex]}
        </p>

        {/* Pulsing dots */}
        <div className="flex gap-1.5 mt-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot-1" />
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot-2" />
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot-3" />
        </div>
      </div>
    </div>
  );
}
