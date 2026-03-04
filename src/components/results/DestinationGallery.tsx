"use client";

import { useEffect, useState } from "react";

interface DestinationGalleryProps {
  name: string;
  country?: string;
  searchName?: string;
}

export function DestinationGallery({ name, country, searchName }: DestinationGalleryProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const query = searchName ?? name;
    const params = new URLSearchParams({ name: query });
    if (country) params.set("country", country);

    fetch(`/api/destination-gallery?${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data: { photos?: string[] }) => setPhotos(data.photos ?? []))
      .catch((err: unknown) => {
        if ((err as Error).name !== "AbortError") {
          // gallery is best-effort — silently ignore other errors
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [name, country, searchName]);

  if (!loading && photos.length === 0) return null;

  return (
    <div>
      <h2 className="font-display font-semibold text-base mb-3">Gallery</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-48 h-32 rounded-xl animate-shimmer snap-start"
              />
            ))
          : photos.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${name} photo ${i + 1}`}
                className="flex-shrink-0 w-48 h-32 rounded-xl object-cover snap-start"
                loading="lazy"
              />
            ))}
      </div>
    </div>
  );
}
