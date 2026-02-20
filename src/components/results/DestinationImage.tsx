"use client";

import { useState, useMemo } from "react";

interface DestinationImageProps {
  name?: string;
  country?: string;
  className?: string;
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

export function DestinationImage({ name, country, className = "" }: DestinationImageProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  const imageUrl = useMemo(() => {
    if (!name) return null;
    const params = new URLSearchParams({ name });
    if (country) params.set("country", country);
    return `/api/destination-image?${params.toString()}`;
  }, [name, country]);

  if (!imageUrl) {
    return <Fallback name={name} country={country} className={className} />;
  }

  return (
    <div className={`relative bg-muted ${className}`}>
      {/* Shimmer placeholder */}
      {status === "loading" && (
        <div className="absolute inset-0 animate-shimmer" />
      )}

      {/* Error fallback — stylish gradient with name */}
      {status === "error" && <Fallback name={name} country={country} className="absolute inset-0" />}

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
