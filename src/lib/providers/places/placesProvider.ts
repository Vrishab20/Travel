import type { PlacesProvider } from "./types";
import { MockPlacesProvider } from "./mockPlacesProvider";

export function getPlacesProvider(): PlacesProvider {
  const mode = process.env.PLACES_PROVIDER ?? "mock";
  if (mode !== "mock") {
    console.warn(`Unknown PLACES_PROVIDER "${mode}", falling back to mock.`);
  }
  return new MockPlacesProvider();
}

export type { PlacesProvider, PlacesSearchRequest } from "./types";
