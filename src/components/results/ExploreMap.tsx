"use client";

import dynamic from "next/dynamic";
import type { MapMarker } from "./ExploreMapInner";

const ExploreMapInner = dynamic(() => import("./ExploreMapInner").then((m) => m.ExploreMapInner), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-xl animate-shimmer" />
  ),
});

interface ExploreMapProps {
  markers: MapMarker[];
  selectedId: string | null;
  showRoute: boolean;
  onMarkerClick?: (id: string) => void;
  height?: number;
}

export function ExploreMap({ markers, selectedId, showRoute, onMarkerClick, height = 350 }: ExploreMapProps) {
  return (
    <div
      className="rounded-xl border border-border overflow-hidden"
      style={{ height: `${height}px` }}
    >
      <ExploreMapInner
        markers={markers}
        selectedId={selectedId}
        showRoute={showRoute}
        onMarkerClick={onMarkerClick}
      />
    </div>
  );
}
