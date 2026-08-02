"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl, { type Map as MapboxMap, type MapLayerMouseEvent, Marker } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { CountryTooltip } from "@/components/CountryTooltip";
import { GlobeControls } from "@/components/GlobeControls";
import {
  COUNTRY_ID_PROPERTY,
  getCountryIsoCode,
  getCountryName,
  loadCountriesGeoJSON,
  toSelectedCountry,
  type CountryFeature,
} from "@/lib/map/countryData";
import {
  COUNTRIES_SOURCE_ID,
  COUNTRY_BORDER_LAYER_ID,
  COUNTRY_DESTINATION_LAYER_ID,
  COUNTRY_FILL_LAYER_ID,
  COUNTRY_HOVER_LAYER_ID,
  COUNTRY_ORIGIN_LAYER_ID,
  clearCountryFeatureState,
  clearRouteGeoJSON,
  createMarkerElement,
  createRouteBetweenCountries,
  EMPTY_ROUTE,
  fitRouteInView,
  ROUTE_GLOW_LAYER_ID,
  ROUTE_LINE_LAYER_ID,
  ROUTE_SOURCE_ID,
  setCountryFeatureState,
  setRouteGeoJSON,
} from "@/lib/map/mapHelpers";
import { sliceRouteByProgress } from "@/lib/map/routeGeometry";
import type {
  HoveredCountry,
  MousePosition,
  SelectedCountry,
} from "@/types/travel";

type TravelGlobeProps = {
  origin: SelectedCountry | null;
  destination: SelectedCountry | null;
  onOriginChange: (country: SelectedCountry | null) => void;
  onDestinationChange: (country: SelectedCountry | null) => void;
  onMapLoadedChange?: (loaded: boolean) => void;
};

const INITIAL_CENTER: [number, number] = [10, 18];
const INITIAL_ZOOM = 1.15;

export function TravelGlobe({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onMapLoadedChange,
}: TravelGlobeProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? "";

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const originMarkerRef = useRef<Marker | null>(null);
  const destinationMarkerRef = useRef<Marker | null>(null);
  const hoveredIdRef = useRef<string | null>(null);
  const originIdRef = useRef<string | null>(null);
  const destinationIdRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const onOriginChangeRef = useRef(onOriginChange);
  const onDestinationChangeRef = useRef(onDestinationChange);
  const onMapLoadedChangeRef = useRef(onMapLoadedChange);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<HoveredCountry>(null);
  const [mousePosition, setMousePosition] = useState<MousePosition | null>(null);

  useEffect(() => {
    onOriginChangeRef.current = onOriginChange;
  }, [onOriginChange]);

  useEffect(() => {
    onDestinationChangeRef.current = onDestinationChange;
  }, [onDestinationChange]);

  useEffect(() => {
    onMapLoadedChangeRef.current = onMapLoadedChange;
  }, [onMapLoadedChange]);

  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) {
      return;
    }

    let cancelled = false;
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      projection: "globe",
      attributionControl: true,
      logoPosition: "bottom-right",
    });

    mapRef.current = map;

    map.dragRotate.enable();
    map.touchZoomRotate.enableRotation();

    map.on("style.load", () => {
      map.setFog({
        color: "rgb(8, 12, 18)",
        "high-color": "rgb(36, 58, 82)",
        "horizon-blend": 0.08,
        "space-color": "rgb(4, 6, 10)",
        "star-intensity": 0.45,
      });
    });

    const handleCountryEnter = (event: MapLayerMouseEvent) => {
      map.getCanvas().style.cursor = "pointer";
      const feature = event.features?.[0] as CountryFeature | undefined;
      if (!feature) return;

      const isoCode = getCountryIsoCode(feature);
      if (!isoCode) return;

      if (hoveredIdRef.current && hoveredIdRef.current !== isoCode) {
        setCountryFeatureState(map, hoveredIdRef.current, { hover: false });
      }

      hoveredIdRef.current = isoCode;
      setCountryFeatureState(map, isoCode, { hover: true });
      setHoveredCountry({ name: getCountryName(feature), isoCode });
      setMousePosition(getMousePosition(event));
    };

    const handleCountryMove = (event: MapLayerMouseEvent) => {
      setMousePosition(getMousePosition(event));
    };

    const handleCountryLeave = () => {
      map.getCanvas().style.cursor = "";
      if (hoveredIdRef.current) {
        setCountryFeatureState(map, hoveredIdRef.current, { hover: false });
        hoveredIdRef.current = null;
      }
      setHoveredCountry(null);
      setMousePosition(null);
    };

    const handleCountryClick = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0] as CountryFeature | undefined;
      if (!feature) return;

      const selected = toSelectedCountry(feature);
      if (!selected.isoCode) return;

      const currentOrigin = originIdRef.current;
      const currentDestination = destinationIdRef.current;

      if (!currentOrigin) {
        onOriginChangeRef.current(selected);
        return;
      }

      if (!currentDestination) {
        if (selected.isoCode === currentOrigin) {
          return;
        }
        onDestinationChangeRef.current(selected);
        return;
      }

      // Both selected: next click starts a new route.
      if (selected.isoCode === currentOrigin) {
        return;
      }

      onDestinationChangeRef.current(null);
      onOriginChangeRef.current(selected);
    };

    map.once("load", async () => {
      try {
        const countries = await loadCountriesGeoJSON();
        if (cancelled || !mapRef.current) return;

        map.addSource(COUNTRIES_SOURCE_ID, {
          type: "geojson",
          data: countries,
          promoteId: COUNTRY_ID_PROPERTY,
        });

        map.addSource(ROUTE_SOURCE_ID, {
          type: "geojson",
          data: EMPTY_ROUTE,
        });

        map.addLayer({
          id: COUNTRY_FILL_LAYER_ID,
          type: "fill",
          source: COUNTRIES_SOURCE_ID,
          paint: {
            "fill-color": "#1b2733",
            "fill-opacity": 0.18,
          },
        });

        map.addLayer({
          id: COUNTRY_BORDER_LAYER_ID,
          type: "line",
          source: COUNTRIES_SOURCE_ID,
          paint: {
            "line-color": "#6f8799",
            "line-width": 0.6,
            "line-opacity": 0.45,
          },
        });

        map.addLayer({
          id: COUNTRY_HOVER_LAYER_ID,
          type: "fill",
          source: COUNTRIES_SOURCE_ID,
          paint: {
            "fill-color": "#7eb6c9",
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              0.34,
              0,
            ],
          },
        });

        map.addLayer({
          id: COUNTRY_ORIGIN_LAYER_ID,
          type: "fill",
          source: COUNTRIES_SOURCE_ID,
          paint: {
            "fill-color": "#c9a66b",
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "origin"], false],
              0.42,
              0,
            ],
          },
        });

        map.addLayer({
          id: COUNTRY_DESTINATION_LAYER_ID,
          type: "fill",
          source: COUNTRIES_SOURCE_ID,
          paint: {
            "fill-color": "#5fad9a",
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "destination"], false],
              0.42,
              0,
            ],
          },
        });

        map.addLayer({
          id: ROUTE_GLOW_LAYER_ID,
          type: "line",
          source: ROUTE_SOURCE_ID,
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#c9a66b",
            "line-width": 8,
            "line-opacity": 0.22,
            "line-blur": 1.2,
          },
        });

        map.addLayer({
          id: ROUTE_LINE_LAYER_ID,
          type: "line",
          source: ROUTE_SOURCE_ID,
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#f0d9a8",
            "line-width": 2.4,
            "line-opacity": 0.95,
          },
        });

        const interactiveLayers = [
          COUNTRY_FILL_LAYER_ID,
          COUNTRY_HOVER_LAYER_ID,
          COUNTRY_ORIGIN_LAYER_ID,
          COUNTRY_DESTINATION_LAYER_ID,
        ];

        for (const layerId of interactiveLayers) {
          map.on("mousemove", layerId, handleCountryMove);
          map.on("mouseenter", layerId, handleCountryEnter);
          map.on("mouseleave", layerId, handleCountryLeave);
          map.on("click", layerId, handleCountryClick);
        }

        setIsMapLoaded(true);
        onMapLoadedChangeRef.current?.(true);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to initialize the globe.";
        setLoadError(message);
        onMapLoadedChangeRef.current?.(false);
      }
    });

    map.on("error", (event) => {
      const message = event.error?.message || "Mapbox failed to load.";
      setLoadError(message);
    });

    return () => {
      cancelled = true;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      originMarkerRef.current?.remove();
      destinationMarkerRef.current?.remove();
      originMarkerRef.current = null;
      destinationMarkerRef.current = null;

      map.remove();
      mapRef.current = null;
      setIsMapLoaded(false);
      onMapLoadedChangeRef.current?.(false);
    };
  }, [token]);

  // Sync origin / destination feature-state + markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    if (originIdRef.current && originIdRef.current !== origin?.isoCode) {
      clearCountryFeatureState(map, originIdRef.current);
    }
    if (destinationIdRef.current && destinationIdRef.current !== destination?.isoCode) {
      clearCountryFeatureState(map, destinationIdRef.current);
    }

    originIdRef.current = origin?.isoCode ?? null;
    destinationIdRef.current = destination?.isoCode ?? null;

    if (origin) {
      setCountryFeatureState(map, origin.isoCode, { origin: true, destination: false });
    }
    if (destination) {
      setCountryFeatureState(map, destination.isoCode, {
        destination: true,
        origin: false,
      });
    }

    if (origin) {
      if (!originMarkerRef.current) {
        originMarkerRef.current = new mapboxgl.Marker({
          element: createMarkerElement("origin"),
          anchor: "center",
        })
          .setLngLat(origin.coordinates)
          .addTo(map);
      } else {
        originMarkerRef.current.setLngLat(origin.coordinates);
      }
    } else {
      originMarkerRef.current?.remove();
      originMarkerRef.current = null;
    }

    if (destination) {
      if (!destinationMarkerRef.current) {
        destinationMarkerRef.current = new mapboxgl.Marker({
          element: createMarkerElement("destination"),
          anchor: "center",
        })
          .setLngLat(destination.coordinates)
          .addTo(map);
      } else {
        destinationMarkerRef.current.setLngLat(destination.coordinates);
      }
    } else {
      destinationMarkerRef.current?.remove();
      destinationMarkerRef.current = null;
    }
  }, [origin, destination, isMapLoaded]);

  // Draw / animate route when both countries are selected.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (!origin || !destination) {
      clearRouteGeoJSON(map);
      return;
    }

    const fullRoute = createRouteBetweenCountries(origin, destination);
    const durationMs = 1100;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setRouteGeoJSON(map, sliceRouteByProgress(fullRoute, eased));

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(tick);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    fitRouteInView(map, origin.coordinates, destination.coordinates, fullRoute);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [origin, destination, isMapLoaded]);

  const zoomBy = useCallback((delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ zoom: map.getZoom() + delta, duration: 350 });
  }, []);

  const resetView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      bearing: 0,
      pitch: 0,
      duration: 900,
    });
  }, []);

  if (!token) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#070b10] px-6 text-center">
        <div className="max-w-md rounded-2xl border border-white/10 bg-[#101820] p-6 text-[#f3efe6]">
          <p className="font-[family-name:var(--font-fraunces)] text-2xl">Mapbox token required</p>
          <p className="mt-3 text-sm leading-relaxed text-[#b7c0c8]">
            Add your public token to <code className="text-[#c9a66b]">.env.local</code> as{" "}
            <code className="text-[#c9a66b]">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code>, then restart
            the dev server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#070b10]">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {!isMapLoaded && !loadError && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#070b10]/70">
          <p className="rounded-full border border-white/10 bg-[#101820]/90 px-4 py-2 text-sm text-[#f3efe6]">
            Loading globe…
          </p>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#070b10]/85 px-6 text-center">
          <div className="max-w-md rounded-2xl border border-red-400/30 bg-[#171016] p-6 text-[#f3efe6]">
            <p className="font-[family-name:var(--font-fraunces)] text-xl">Unable to load map</p>
            <p className="mt-2 text-sm text-[#d7c5c5]">{loadError}</p>
          </div>
        </div>
      )}

      <GlobeControls
        disabled={!isMapLoaded}
        onZoomIn={() => zoomBy(0.6)}
        onZoomOut={() => zoomBy(-0.6)}
        onResetView={resetView}
      />

      <CountryTooltip
        name={hoveredCountry?.name ?? null}
        position={mousePosition}
        visible={Boolean(hoveredCountry)}
      />
    </div>
  );
}

function getMousePosition(event: MapLayerMouseEvent): MousePosition {
  const original = event.originalEvent;
  if ("clientX" in original && "clientY" in original) {
    return { x: original.clientX, y: original.clientY };
  }
  return { x: event.point.x, y: event.point.y };
}
