import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Coordinates, SelectedCountry } from "@/types/travel";

export const COUNTRIES_GEOJSON_URL = "/data/countries.geojson";

/** Natural Earth ADM0_A3 is used as the stable feature id / ISO code. */
export const COUNTRY_ID_PROPERTY = "ADM0_A3";
export const COUNTRY_NAME_PROPERTY = "NAME";

type CountryProperties = {
  NAME?: string;
  ADMIN?: string;
  ADM0_A3?: string;
  ISO_A2?: string;
  LABEL_X?: number;
  LABEL_Y?: number;
  [key: string]: unknown;
};

export type CountryFeature = Feature<Geometry, CountryProperties>;

export type CountriesCollection = FeatureCollection<Geometry, CountryProperties>;

let cachedCountries: CountriesCollection | null = null;

/**
 * Country boundaries come from Natural Earth Admin 0 (1:110m),
 * vendored at `public/data/countries.geojson`.
 * Source: https://github.com/nvkelso/natural-earth-vector
 */
export async function loadCountriesGeoJSON(): Promise<CountriesCollection> {
  if (cachedCountries) {
    return cachedCountries;
  }

  const response = await fetch(COUNTRIES_GEOJSON_URL);
  if (!response.ok) {
    throw new Error(`Failed to load country boundaries (${response.status})`);
  }

  const data = (await response.json()) as CountriesCollection;

  // Ensure every feature has a stable id for Mapbox feature-state.
  data.features = data.features.map((feature, index) => {
    const iso = getCountryIsoCode(feature) || `UNK_${index}`;
    return {
      ...feature,
      id: iso,
      properties: {
        ...feature.properties,
        [COUNTRY_ID_PROPERTY]: iso,
      },
    };
  });

  cachedCountries = data;
  return data;
}

export function getCountryName(feature: CountryFeature): string {
  return (
    feature.properties?.NAME ||
    feature.properties?.ADMIN ||
    "Unknown country"
  );
}

export function getCountryIsoCode(feature: CountryFeature): string {
  const code = feature.properties?.ADM0_A3;
  if (typeof code === "string" && code.trim() && code !== "-99") {
    return code.trim();
  }
  return "";
}

export function getCountryCoordinates(feature: CountryFeature): Coordinates {
  const labelX = feature.properties?.LABEL_X;
  const labelY = feature.properties?.LABEL_Y;

  if (typeof labelX === "number" && typeof labelY === "number") {
    return [labelX, labelY];
  }

  return getGeometryCentroid(feature.geometry);
}

export function toSelectedCountry(feature: CountryFeature): SelectedCountry {
  return {
    name: getCountryName(feature),
    isoCode: getCountryIsoCode(feature),
    coordinates: getCountryCoordinates(feature),
  };
}

function getGeometryCentroid(geometry: Geometry): Coordinates {
  const rings = collectCoordinateRings(geometry);
  if (rings.length === 0) {
    return [0, 0];
  }

  // Prefer the largest ring (by vertex count) for a representative center.
  const primary = rings.reduce((best, ring) =>
    ring.length > best.length ? ring : best,
  );

  let sumLng = 0;
  let sumLat = 0;
  let count = 0;

  for (const point of primary) {
    if (point.length < 2) continue;
    sumLng += point[0];
    sumLat += point[1];
    count += 1;
  }

  if (count === 0) {
    return [0, 0];
  }

  return [sumLng / count, sumLat / count];
}

function collectCoordinateRings(geometry: Geometry): number[][][] {
  switch (geometry.type) {
    case "Polygon":
      return geometry.coordinates;
    case "MultiPolygon":
      return geometry.coordinates.flat();
    case "Point":
      return [[geometry.coordinates]];
    case "MultiPoint":
    case "LineString":
      return [geometry.coordinates];
    case "MultiLineString":
      return geometry.coordinates;
    case "GeometryCollection":
      return geometry.geometries.flatMap(collectCoordinateRings);
    default:
      return [];
  }
}
