"use client";

import { useEffect, useRef } from "react";
import mapboxgl, { type Map as MapboxMap, Marker } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { buildGreatCircleRoute } from "@/lib/map/routeGeometry";
import type { MapFocusEvent, TripPlan } from "@/types/trip";
import type { SelectedCountry } from "@/types/travel";

type TripMapProps = {
  trip: TripPlan;
  origin?: SelectedCountry | null;
  destination?: SelectedCountry | null;
  focus?: MapFocusEvent | null;
  onMarkerSelect?: (itemId?: string) => void;
};

export function TripMap({
  trip,
  origin,
  destination,
  focus,
  onMarkerSelect,
}: TripMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? "";

  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: destination?.coordinates ?? origin?.coordinates ?? [10, 20],
      zoom: 1.4,
      projection: "globe",
    });
    mapRef.current = map;

    map.on("style.load", () => {
      map.setFog({
        color: "rgb(8, 12, 18)",
        "high-color": "rgb(36, 58, 82)",
        "horizon-blend": 0.08,
        "space-color": "rgb(4, 6, 10)",
        "star-intensity": 0.35,
      });
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [token, origin?.coordinates, destination?.coordinates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const addMarker = (
      lng: number,
      lat: number,
      color: string,
      label: string,
      itemId?: string,
    ) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "h-3.5 w-3.5 rounded-full border-2 border-[#0b1218]";
      el.style.background = color;
      el.setAttribute("aria-label", label);
      el.onclick = () => onMarkerSelect?.(itemId);
      const marker = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
      markersRef.current.push(marker);
    };

    if (origin) addMarker(origin.coordinates[0], origin.coordinates[1], "#c9a66b", "Origin");
    if (destination) {
      addMarker(destination.coordinates[0], destination.coordinates[1], "#5fad9a", "Destination");
    }

    for (const hotel of trip.hotels) {
      if (hotel.latitude == null || hotel.longitude == null) continue;
      addMarker(hotel.longitude, hotel.latitude, "#7eb6c9", hotel.name, hotel.id);
    }

    for (const day of trip.itinerary) {
      for (const item of day.items) {
        if (item.latitude == null || item.longitude == null) continue;
        addMarker(item.longitude, item.latitude, "#d8b87d", item.title, item.id);
      }
    }

    if (origin && destination) {
      const route = buildGreatCircleRoute(origin.coordinates, destination.coordinates);
      if (map.getSource("trip-route")) {
        (map.getSource("trip-route") as mapboxgl.GeoJSONSource).setData(route);
      } else {
        map.addSource("trip-route", { type: "geojson", data: route });
        map.addLayer({
          id: "trip-route-line",
          type: "line",
          source: "trip-route",
          paint: {
            "line-color": "#f0d9a8",
            "line-width": 2.2,
            "line-opacity": 0.9,
          },
        });
      }
    }
  }, [trip, origin, destination, onMarkerSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    map.easeTo({
      center: [focus.longitude, focus.latitude],
      zoom: Math.max(map.getZoom(), 5.5),
      duration: 900,
    });
  }, [focus]);

  if (!token) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-white/10 bg-[#121a22] p-6 text-center text-sm text-[#9aa7b2]">
        Mapbox token required to show the trip map.
      </div>
    );
  }

  return <div ref={containerRef} className="h-full min-h-[280px] w-full rounded-2xl" />;
}
