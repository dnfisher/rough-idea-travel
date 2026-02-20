"use client";

import { useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: number;
  title: string;
  subtitle?: string;
  isItinerary?: boolean;
}

interface ExploreMapInnerProps {
  markers: MapMarker[];
  selectedId: string | null;
  showRoute: boolean;
  onMarkerClick?: (id: string) => void;
}

function createIcon(label: number, isSelected: boolean, isItinerary: boolean) {
  const selectedClass = isSelected ? " selected" : "";
  const typeClass = isItinerary ? " itinerary" : "";
  return L.divIcon({
    className: "",
    html: `<div class="custom-marker${selectedClass}${typeClass}">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (markers.length === 0) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    }, 300);

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [markers, map]);

  return null;
}

function PanToSelected({ markers, selectedId }: { markers: MapMarker[]; selectedId: string | null }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) return;
    const marker = markers.find((m) => m.id === selectedId);
    if (marker) {
      map.panTo([marker.lat, marker.lng], { animate: true });
    }
  }, [selectedId, markers, map]);

  return null;
}

export function ExploreMapInner({
  markers,
  selectedId,
  showRoute,
  onMarkerClick,
}: ExploreMapInnerProps) {
  const routePositions = useMemo(
    () => markers.map((m): [number, number] => [m.lat, m.lng]),
    [markers]
  );

  if (markers.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Waiting for destination coordinates...
      </div>
    );
  }

  const center: [number, number] = [markers[0].lat, markers[0].lng];

  return (
    <MapContainer
      center={center}
      zoom={5}
      className="h-full w-full"
      scrollWheelZoom={true}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds markers={markers} />
      <PanToSelected markers={markers} selectedId={selectedId} />

      {showRoute && routePositions.length > 1 && (
        <Polyline
          positions={routePositions}
          pathOptions={{ color: "#1a4a4a", weight: 3, dashArray: "8 8", opacity: 0.7 }}
        />
      )}

      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={createIcon(marker.label, marker.id === selectedId, !!marker.isItinerary)}
          eventHandlers={{
            click: () => onMarkerClick?.(marker.id),
          }}
        >
          <Popup>
            <div className="font-sans text-sm">
              <strong>{marker.title}</strong>
              {marker.subtitle && (
                <div className="text-muted-foreground text-xs mt-0.5">{marker.subtitle}</div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
