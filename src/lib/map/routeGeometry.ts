import { greatCircle, length as turfLength } from "@turf/turf";
import type { Feature, LineString, Position } from "geojson";
import type { Coordinates } from "@/types/travel";

/**
 * Build a smooth great-circle route between two lon/lat points.
 * Longitudes are unwrapped so the path stays continuous across the antimeridian.
 */
export function buildGreatCircleRoute(
  origin: Coordinates,
  destination: Coordinates,
  npoints = 128,
): Feature<LineString> {
  const arc = greatCircle(origin, destination, {
    npoints,
    properties: {
      kind: "route",
    },
  });

  const rawCoords = arc.geometry.coordinates as Position[];
  const unwrapped = unwrapLongitudes(rawCoords);

  return {
    type: "Feature",
    properties: {
      ...arc.properties,
      distanceKm: Number(turfLength(arc, { units: "kilometers" }).toFixed(1)),
    },
    geometry: {
      type: "LineString",
      coordinates: unwrapped,
    },
  };
}

/** Slice a route for draw-in animation (progress from 0 to 1). */
export function sliceRouteByProgress(
  route: Feature<LineString>,
  progress: number,
): Feature<LineString> {
  const coords = route.geometry.coordinates;
  if (coords.length < 2) {
    return route;
  }

  const clamped = Math.min(1, Math.max(0, progress));
  if (clamped <= 0) {
    return {
      ...route,
      geometry: {
        type: "LineString",
        coordinates: [coords[0], coords[0]],
      },
    };
  }

  if (clamped >= 1) {
    return route;
  }

  const exactIndex = clamped * (coords.length - 1);
  const endIndex = Math.max(1, Math.ceil(exactIndex));
  const sliced = coords.slice(0, endIndex + 1);

  return {
    ...route,
    geometry: {
      type: "LineString",
      coordinates: sliced,
    },
  };
}

/**
 * Adjust successive longitudes so steps never jump more than 180°.
 * This keeps great-circle arcs continuous when crossing the date line.
 */
export function unwrapLongitudes(coords: Position[]): Position[] {
  if (coords.length === 0) {
    return [];
  }

  const result: Position[] = [[coords[0][0], coords[0][1]]];

  for (let i = 1; i < coords.length; i += 1) {
    const prevLng = result[i - 1][0];
    let lng = coords[i][0];
    const lat = coords[i][1];

    while (lng - prevLng > 180) lng -= 360;
    while (lng - prevLng < -180) lng += 360;

    result.push([lng, lat]);
  }

  return result;
}

export function getRouteDistanceKm(route: Feature<LineString>): number {
  const value = route.properties?.distanceKm;
  if (typeof value === "number") {
    return value;
  }
  return Number(turfLength(route, { units: "kilometers" }).toFixed(1));
}
