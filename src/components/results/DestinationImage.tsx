"use client";

import { useState, useMemo } from "react";
import { destinationImageUrl } from "@/lib/destination-url";

interface DestinationImageProps {
  name?: string;
  country?: string;
  className?: string;
  /** Override the name used for the image API query (e.g. first route stop instead of full route title) */
  searchName?: string;
  /** Short name for the gradient fallback when image fails (defaults to name) */
  fallbackName?: string;
  /** User interests — biases image selection toward relevant themes */
  interests?: string[];
}

// Deterministic gradient based on destination name
function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const gradients = [
    "from-emerald-800 to-teal-900",
    "from-slate-700 to-slate-900",
    "from-stone-600 to-stone-800",
    "from-cyan-800 to-blue-900",
    "from-indigo-800 to-slate-900",
    "from-teal-700 to-emerald-900",
    "from-zinc-700 to-zinc-900",
    "from-sky-800 to-indigo-900",
  ];
  return gradients[Math.abs(hash) % gradients.length];
}

export function DestinationImage({ name, country, className = "", searchName, fallbackName, interests }: DestinationImageProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  const imageUrl = useMemo(() => {
    const queryName = searchName || name;
    if (!queryName) return null;
    return destinationImageUrl(queryName, country, interests);
  }, [name, searchName, country, interests]);

  const displayName = fallbackName ?? name;

  if (!imageUrl) {
    return <Fallback name={displayName} country={country} className={className} />;
  }

  return (
    <div className={`relative bg-muted ${className}`}>
      {/* Shimmer placeholder */}
      {status === "loading" && (
        <div className="absolute inset-0 animate-shimmer" />
      )}

      {/* Error fallback — stylish gradient with name */}
      {status === "error" && <Fallback name={displayName} country={country} className="absolute inset-0" />}

      {/* Actual image */}
      <img
        src={imageUrl}
        alt={`${name}${country ? `, ${country}` : ""}`}
        className={`w-full h-full object-cover ${
          status === "loaded" ? "animate-fade-in" : "opacity-0"
        }`}
        loading="lazy"
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
      />
    </div>
  );
}

function Fallback({ name, country, className = "" }: { name?: string; country?: string; className?: string }) {
  const gradient = getGradient(name || "default");
  return (
    <div
      className={`flex flex-col items-center justify-center bg-gradient-to-br ${gradient} ${className}`}
    >
      <span className="text-white/90 font-display font-semibold text-lg drop-shadow-sm">
        {name || ""}
      </span>
      {country && (
        <span className="text-white/60 text-sm mt-0.5">{country}</span>
      )}
    </div>
  );
}
