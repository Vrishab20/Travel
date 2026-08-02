import type { Map as MapboxMap, GeoJSONSource } from "mapbox-gl";
import type { Feature, LineString } from "geojson";
import type { Coordinates, SelectedCountry } from "@/types/travel";
import { buildGreatCircleRoute } from "./routeGeometry";

export const COUNTRIES_SOURCE_ID = "countries";
export const ROUTE_SOURCE_ID = "route";
export const COUNTRY_FILL_LAYER_ID = "country-fill";
export const COUNTRY_BORDER_LAYER_ID = "country-border";
export const COUNTRY_HOVER_LAYER_ID = "country-hover";
export const COUNTRY_ORIGIN_LAYER_ID = "country-origin";
export const COUNTRY_DESTINATION_LAYER_ID = "country-destination";
export const ROUTE_LINE_LAYER_ID = "route-line";
export const ROUTE_GLOW_LAYER_ID = "route-glow";

export const EMPTY_ROUTE: Feature<LineString> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "LineString",
    coordinates: [],
  },
};

export function setCountryFeatureState(
  map: MapboxMap,
  isoCode: string | null | undefined,
  state: Record<string, boolean>,
) {
  if (!isoCode) return;
  map.setFeatureState({ source: COUNTRIES_SOURCE_ID, id: isoCode }, state);
}

export function clearCountryFeatureState(
  map: MapboxMap,
  isoCode: string | null | undefined,
) {
  if (!isoCode) return;
  map.removeFeatureState({ source: COUNTRIES_SOURCE_ID, id: isoCode });
}

export function setRouteGeoJSON(map: MapboxMap, route: Feature<LineString>) {
  const source = map.getSource(ROUTE_SOURCE_ID) as GeoJSONSource | undefined;
  source?.setData(route);
}

export function clearRouteGeoJSON(map: MapboxMap) {
  setRouteGeoJSON(map, EMPTY_ROUTE);
}

export function createRouteBetweenCountries(
  origin: SelectedCountry,
  destination: SelectedCountry,
): Feature<LineString> {
  return buildGreatCircleRoute(origin.coordinates, destination.coordinates);
}

/**
 * Frame both endpoints (and the route) without zooming in too aggressively.
 */
export function fitRouteInView(
  map: MapboxMap,
  origin: Coordinates,
  destination: Coordinates,
  route?: Feature<LineString>,
) {
  const points: Coordinates[] = [origin, destination];

  if (route?.geometry.coordinates.length) {
    for (const coord of route.geometry.coordinates) {
      points.push([coord[0], coord[1]]);
    }
  }

  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);

  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  const midLng = (minLng + maxLng) / 2;
  const midLat = (minLat + maxLat) / 2;

  const spanLng = Math.max(maxLng - minLng, 20);
  const spanLat = Math.max(maxLat - minLat, 14);
  const span = Math.max(spanLng, spanLat);

  // Keep a world-ish framing: never zoom past ~1.35 on the globe.
  const zoom = Math.min(1.85, Math.max(0.85, 3.2 - Math.log2(span / 40)));

  map.easeTo({
    center: [midLng, midLat],
    zoom,
    duration: 1400,
    essential: true,
    padding: { top: 80, bottom: 160, left: 48, right: 48 },
  });
}

export function createMarkerElement(kind: "origin" | "destination"): HTMLDivElement {
  const el = document.createElement("div");
  el.className = `atlas-marker atlas-marker--${kind}`;
  el.setAttribute("role", "img");
  el.setAttribute(
    "aria-label",
    kind === "origin" ? "Origin country marker" : "Destination country marker",
  );

  const pulse = document.createElement("span");
  pulse.className = "atlas-marker__pulse";
  const core = document.createElement("span");
  core.className = "atlas-marker__core";

  el.append(pulse, core);
  return el;
}
