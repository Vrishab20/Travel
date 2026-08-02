import type { HotelRecommendation } from "@/lib/agent/schemas";
import type { HotelProvider, HotelSearchRequest } from "./types";

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return Math.max(1, nights);
}

/** Rough city anchors for map markers (mock coordinates). */
const CITY_COORDS: Record<string, [number, number]> = {
  paris: [2.3522, 48.8566],
  lyon: [4.8357, 45.764],
  nice: [7.2619, 43.7102],
  london: [-0.1276, 51.5072],
  tokyo: [139.6917, 35.6895],
  rome: [12.4964, 41.9028],
  barcelona: [2.1734, 41.3851],
  toronto: [-79.3832, 43.6532],
  vancouver: [-123.1207, 49.2827],
  default: [2.35, 48.85],
};

function coordsFor(destination: string): [number, number] {
  const key = destination.trim().toLowerCase();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (key.includes(city)) return coords;
  }
  return CITY_COORDS.default;
}

export class MockHotelProvider implements HotelProvider {
  async searchHotels(request: HotelSearchRequest): Promise<HotelRecommendation[]> {
    const currency = request.currency ?? "USD";
    const nights = nightsBetween(request.checkInDate, request.checkOutDate);
    const seed = hashSeed(
      [request.destination, request.checkInDate, request.checkOutDate, String(request.guests)].join(
        "|",
      ),
    );
    const [lng, lat] = coordsFor(request.destination);
    const area =
      request.preferredAreas?.[0] ??
      (seed % 2 === 0 ? "City center" : "Riverside district");

    const options: Array<Omit<HotelRecommendation, "id">> = [
      {
        provider: "mock-hotels",
        name: "Harbourlight Inn",
        city: request.destination,
        neighbourhood: area,
        starRating: 3,
        reviewScore: 8.2,
        nightlyPrice: { amount: 95 + (seed % 40), currency },
        totalPrice: { amount: 0, currency },
        amenities: ["Wi-Fi", "Breakfast available", "Air conditioning"],
        bookingUrl: "https://example.com/hotels/mock-budget",
        latitude: lat + 0.01,
        longitude: lng - 0.01,
        isMockData: true,
        recommendationReason: "Budget-friendly stay close to transit and walkable neighbourhoods.",
      },
      {
        provider: "mock-hotels",
        name: "Atelier Maison",
        city: request.destination,
        neighbourhood: area,
        starRating: 4,
        reviewScore: 8.9,
        nightlyPrice: { amount: 160 + (seed % 55), currency },
        totalPrice: { amount: 0, currency },
        amenities: ["Wi-Fi", "Gym", "Restaurant", "Concierge"],
        bookingUrl: "https://example.com/hotels/mock-balanced",
        latitude: lat,
        longitude: lng,
        isMockData: true,
        recommendationReason: "Strong reviews and a central location that fits most itineraries.",
      },
      {
        provider: "mock-hotels",
        name: "Maison Étoile",
        city: request.destination,
        neighbourhood: "Historic quarter",
        starRating: 5,
        reviewScore: 9.3,
        nightlyPrice: { amount: 290 + (seed % 80), currency },
        totalPrice: { amount: 0, currency },
        amenities: ["Spa", "Fine dining", "Butler service", "Airport transfer"],
        bookingUrl: "https://example.com/hotels/mock-luxury",
        latitude: lat - 0.012,
        longitude: lng + 0.008,
        isMockData: true,
        recommendationReason: "Luxury pick with higher comfort if the budget allows.",
      },
    ];

    let results = options.map((hotel, index) => {
      const total = hotel.nightlyPrice.amount * nights;
      return {
        ...hotel,
        id: `mock-hotel-${seed}-${index}`,
        totalPrice: { amount: total, currency },
      };
    });

    if (typeof request.maxNightlyPrice === "number") {
      results = results.filter(
        (hotel) => hotel.nightlyPrice.amount <= request.maxNightlyPrice!,
      );
    }

    return results;
  }
}
