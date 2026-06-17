"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Club } from "@/lib/types";
import { hasClubCoordinates, resolveClubLatitude, resolveClubLongitude } from "@/lib/clubContact";

type LeafletModule = typeof import("leaflet");
type LeafletMap = import("leaflet").Map;
type LeafletMarker = import("leaflet").Marker;

interface ClubMapProps {
  clubs: Club[];
  selectedClubId?: string | null;
  onSelectClub?: (club: Club) => void;
  className?: string;
  emptyMessage?: string;
}

const defaultCenter: [number, number] = [41.2995, 69.2401];

export function ClubMap({ clubs, selectedClubId, onSelectClub, className, emptyMessage }: ClubMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const selectableClubs = useMemo(() => clubs.filter(hasClubCoordinates), [clubs]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!containerRef.current || mapRef.current) {
        return;
      }

      const L = await import("leaflet");
      if (cancelled || !containerRef.current) {
        return;
      }

      leafletRef.current = L;
      const map = L.map(containerRef.current, {
        center: defaultCenter,
        zoom: 12,
        zoomControl: false,
        attributionControl: true
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
    }

    void initMap();

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    selectableClubs.forEach((club) => {
      const isSelected = club.id === selectedClubId;
      const marker = L.marker([resolveClubLatitude(club), resolveClubLongitude(club)], {
        icon: L.divIcon({
          className: `billuz-map-marker${isSelected ? " billuz-map-marker-selected" : ""}`,
          html: `<span>${escapeHtml(club.name.ru || club.name.en || "Place")}</span>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })
      });

      marker.on("click", () => {
        onSelectClub?.(club);
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });

    if (selectableClubs.length > 1) {
      const bounds = L.latLngBounds(selectableClubs.map((club) => [resolveClubLatitude(club), resolveClubLongitude(club)]));
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
      return;
    }

    if (selectableClubs.length === 1) {
      map.setView([resolveClubLatitude(selectableClubs[0]), resolveClubLongitude(selectableClubs[0])], 14);
      return;
    }

    map.setView(defaultCenter, 12);
  }, [mapReady, onSelectClub, selectableClubs, selectedClubId]);

  useEffect(() => {
    const map = mapRef.current;
    const club = selectableClubs.find((item) => item.id === selectedClubId);
    if (!mapReady || !map || !club) {
      return;
    }

    map.flyTo([resolveClubLatitude(club), resolveClubLongitude(club)], Math.max(map.getZoom(), 14), {
      duration: 0.45
    });
  }, [mapReady, selectableClubs, selectedClubId]);

  return (
    <div className={`billuz-map-shell${className ? ` ${className}` : ""}`}>
      <div ref={containerRef} className="billuz-map-canvas" />
      {selectableClubs.length === 0 ? (
        <div className="billuz-map-empty">{emptyMessage ?? "Координаты мест не добавлены"}</div>
      ) : null}
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
