import type { FlightRecommendation } from "@/lib/agent/schemas";

export type FlightSearchRequest = {
  originAirportOrCity: string;
  destinationAirportOrCity: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  cabinClass?: string;
  directOnly?: boolean;
  maxPrice?: number;
  currency?: string;
};

export interface FlightProvider {
  searchFlights(request: FlightSearchRequest): Promise<FlightRecommendation[]>;
}
