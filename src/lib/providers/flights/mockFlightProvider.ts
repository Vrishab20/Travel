import type { FlightRecommendation } from "@/lib/agent/schemas";
import type { FlightProvider, FlightSearchRequest } from "./types";

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function airportCode(cityOrAirport: string): string {
  const cleaned = cityOrAirport.trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(cleaned)) return cleaned;
  return cleaned.replace(/[^A-Z]/g, "").slice(0, 3).padEnd(3, "X");
}

export class MockFlightProvider implements FlightProvider {
  async searchFlights(request: FlightSearchRequest): Promise<FlightRecommendation[]> {
    const currency = request.currency ?? "USD";
    const seed = hashSeed(
      [
        request.originAirportOrCity,
        request.destinationAirportOrCity,
        request.departureDate,
        request.returnDate ?? "",
        request.cabinClass ?? "economy",
        String(request.adults),
      ].join("|"),
    );

    const origin = airportCode(request.originAirportOrCity);
    const destination = airportCode(request.destinationAirportOrCity);
    const cabin = request.cabinClass ?? "economy";
    const base = 280 + (seed % 220);

    const options: Array<Omit<FlightRecommendation, "id">> = [
      {
        provider: "mock-flights",
        airline: "Atlas Air",
        flightNumbers: [`AA${100 + (seed % 50)}`],
        originAirport: origin,
        destinationAirport: destination,
        departureTime: `${request.departureDate}T08:15:00`,
        arrivalTime: `${request.departureDate}T20:40:00`,
        durationMinutes: 505 + (seed % 90),
        stops: 0,
        cabinClass: cabin,
        price: { amount: Math.round(base * 1.35), currency },
        baggageSummary: "1 personal item + 1 carry-on",
        bookingUrl: "https://example.com/flights/mock-direct",
        isMockData: true,
        recommendationReason: "Direct option with a balanced schedule and reliable daytime arrival.",
      },
      {
        provider: "mock-flights",
        airline: "Nordic Connect",
        flightNumbers: [`NC${200 + (seed % 40)}`, `NC${260 + (seed % 30)}`],
        originAirport: origin,
        destinationAirport: destination,
        departureTime: `${request.departureDate}T11:05:00`,
        arrivalTime: `${request.departureDate}T23:55:00`,
        durationMinutes: 650 + (seed % 80),
        stops: 1,
        cabinClass: cabin,
        price: { amount: Math.round(base * 0.92), currency },
        baggageSummary: "1 personal item; checked bag from $45",
        bookingUrl: "https://example.com/flights/mock-value",
        isMockData: true,
        recommendationReason: "Lower fare with one connection — good if budget is the priority.",
      },
      {
        provider: "mock-flights",
        airline: "Lumen Airways",
        flightNumbers: [`LU${300 + (seed % 60)}`],
        originAirport: origin,
        destinationAirport: destination,
        departureTime: `${request.departureDate}T16:40:00`,
        arrivalTime: `${request.departureDate}T05:10:00`,
        durationMinutes: 470 + (seed % 50),
        stops: 0,
        cabinClass: cabin === "economy" ? "premium_economy" : cabin,
        price: { amount: Math.round(base * 1.85), currency },
        baggageSummary: "2 checked bags included",
        bookingUrl: "https://example.com/flights/mock-premium",
        isMockData: true,
        recommendationReason: "Premium comfort option with stronger baggage allowance.",
      },
    ];

    let results = options.map((option, index) => ({
      ...option,
      id: `mock-flight-${seed}-${index}`,
    }));

    if (request.directOnly) {
      results = results.filter((flight) => flight.stops === 0);
    }

    if (typeof request.maxPrice === "number") {
      results = results.filter((flight) => flight.price.amount <= request.maxPrice!);
    }

    return results;
  }
}
