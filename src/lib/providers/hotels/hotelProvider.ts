import type { HotelProvider } from "./types";
import { MockHotelProvider } from "./mockHotelProvider";

export function getHotelProvider(): HotelProvider {
  const mode = process.env.HOTEL_PROVIDER ?? "mock";
  if (mode !== "mock") {
    console.warn(`Unknown HOTEL_PROVIDER "${mode}", falling back to mock.`);
  }
  return new MockHotelProvider();
}

export type { HotelProvider, HotelSearchRequest } from "./types";
