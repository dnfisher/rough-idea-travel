"use client";

import { useState, useMemo, useRef, useEffect } from "react";

interface DestinationImageProps {
  name?: string;
  country?: string;
  className?: string;
  /** Override the name used for the image API query (e.g. first route stop instead of full route title) */
  searchName?: string;
  /** Short name for the gradient fallback when image fails (defaults to name) */
  fallbackName?: string;
}

// Module-level cache: all DestinationImage instances share resolved URLs.
// This guarantees that the card and detail views for the same destination
// always render the same image, regardless of mount timing or Vercel instance.
const resolvedUrlCache = new Map<string, string | null>();

// Track in-flight fetches so concurrent mounts coalesce into one request.
const pendingFetches = new Map<string, Promise<string | null>>();

async function resolveImageUrl(apiUrl: string): Promise<string | null> {
  if (resolvedUrlCache.has(apiUrl)) {
    return resolvedUrlCache.get(apiUrl)!;
  }
  if (pendingFetches.has(apiUrl)) {
    return pendingFetches.get(apiUrl)!;
  }
  const promise = fetch(apiUrl)
    .then((res) => {
      if (!res.ok) return null;
      return res.json();
    })
    .then((data) => {
      const url: string | null = data?.url ?? null;
      resolvedUrlCache.set(apiUrl, url);
      pendingFetches.delete(apiUrl);
      return url;
    })
    .catch(() => {
      resolvedUrlCache.set(apiUrl, null);
      pendingFetches.delete(apiUrl);
      return null;
    });
  pendingFetches.set(apiUrl, promise);
  return promise;
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

export function DestinationImage({ name, country, className = "", searchName, fallbackName }: DestinationImageProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);

  // Once an image has loaded, lock that URL to prevent flicker when props change during streaming.
  // Reset only when the destination identity (name) changes.
  const lockedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    lockedUrlRef.current = null;
    setResolvedSrc(null);
    setStatus("loading");
  }, [name]);

  const apiUrl = useMemo(() => {
    const queryName = searchName || name;
    if (!queryName) return null;
    const params = new URLSearchParams({ name: queryName });
    if (country) params.set("country", country);
    return `/api/destination-image?${params.toString()}`;
  }, [name, searchName, country]);

  // Fetch the resolved image URL from the JSON API (or use module-level cache)
  useEffect(() => {
    if (!apiUrl || lockedUrlRef.current) return;

    // Check module-level cache synchronously for instant hit
    if (resolvedUrlCache.has(apiUrl)) {
      const cached = resolvedUrlCache.get(apiUrl)!;
      if (cached) {
        setResolvedSrc(cached);
      } else {
        setStatus("error");
      }
      return;
    }

    let cancelled = false;
    resolveImageUrl(apiUrl).then((url) => {
      if (!cancelled) {
        if (url) {
          setResolvedSrc(url);
        } else {
          setStatus("error");
        }
      }
    });
    return () => { cancelled = true; };
  }, [apiUrl]);

  const imageUrl = lockedUrlRef.current ?? resolvedSrc;

  // No URL and not loading — show fallback
  if (!imageUrl && status !== "loading") {
    return <Fallback name={fallbackName ?? name} country={country} className={className} />;
  }

  // Still resolving — show shimmer
  if (!imageUrl) {
    return (
      <div className={`relative bg-muted ${className}`}>
        <div className="absolute inset-0 animate-shimmer" />
      </div>
    );
  }

  return (
    <div className={`relative bg-muted ${className}`}>
      {/* Shimmer placeholder */}
      {status === "loading" && (
        <div className="absolute inset-0 animate-shimmer" />
      )}

      {/* Error fallback — stylish gradient with name */}
      {status === "error" && <Fallback name={fallbackName ?? name} country={country} className="absolute inset-0" />}

      {/* Actual image */}
      <img
        src={imageUrl}
        alt={`${name}${country ? `, ${country}` : ""}`}
        className={`w-full h-full object-cover ${
          status === "loaded" ? "animate-fade-in" : "opacity-0"
        }`}
        loading="lazy"
        onLoad={() => {
          setStatus("loaded");
          lockedUrlRef.current = imageUrl;
        }}
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
