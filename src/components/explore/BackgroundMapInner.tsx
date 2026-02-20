"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export function BackgroundMapInner() {
  return (
    <MapContainer
      center={[42, 12]}
      zoom={4}
      className="w-full h-full"
      scrollWheelZoom={true}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
    </MapContainer>
  );
}
