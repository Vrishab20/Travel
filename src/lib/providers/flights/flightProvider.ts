import type { FlightProvider } from "./types";
import { MockFlightProvider } from "./mockFlightProvider";

export function getFlightProvider(): FlightProvider {
  const mode = process.env.FLIGHT_PROVIDER ?? "mock";
  // Real providers can be switched in here later using FLIGHT_API_KEY.
  if (mode !== "mock") {
    console.warn(`Unknown FLIGHT_PROVIDER "${mode}", falling back to mock.`);
  }
  return new MockFlightProvider();
}

export type { FlightProvider, FlightSearchRequest } from "./types";
