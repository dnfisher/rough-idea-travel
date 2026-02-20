"use client";

import dynamic from "next/dynamic";

const BackgroundMapInner = dynamic(
  () => import("./BackgroundMapInner").then((m) => m.BackgroundMapInner),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-surface" />,
  }
);

export function BackgroundMap() {
  return (
    <div className="w-full h-full">
      <BackgroundMapInner />
    </div>
  );
}
