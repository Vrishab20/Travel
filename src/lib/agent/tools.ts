import { tool } from "ai";
import { z } from "zod";
import {
  mergeTripPreferences,
  hasMinimumTripRequirements,
} from "@/lib/agent/conversationState";
import {
  tripPreferencesSchema,
  type TripPlan,
} from "@/lib/agent/schemas";
import { calculateTripBudget } from "@/lib/itinerary/budgetCalculator";
import { generateItinerary } from "@/lib/itinerary/itineraryGenerator";
import { getFlightProvider } from "@/lib/providers/flights/flightProvider";
import { getHotelProvider } from "@/lib/providers/hotels/hotelProvider";
import { getPlacesProvider } from "@/lib/providers/places/placesProvider";

type ToolContext = {
  getTrip: () => TripPlan;
  setTrip: (trip: TripPlan) => void;
};

const withTimeout = async <T>(promise: Promise<T>, ms = 8000): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Provider timed out")), ms);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export function createTravelAgentTools(ctx: ToolContext) {
  return {
    updateTripPreferences: tool({
      description:
        "Merge new trip preference details from the user into the structured trip state.",
      inputSchema: z.object({
        updates: tripPreferencesSchema.partial(),
      }),
      execute: async ({ updates }) => {
        const trip = ctx.getTrip();
        const preferences = mergeTripPreferences(trip.preferences, updates);
        const next: TripPlan = {
          ...trip,
          preferences,
          status: hasMinimumTripRequirements(preferences) ? "draft" : "incomplete",
          updatedAt: new Date().toISOString(),
        };
        ctx.setTrip(next);
        return {
          ok: true,
          preferences: next.preferences,
          status: next.status,
          tripState: next,
        };
      },
    }),

    searchFlights: tool({
      description: "Search flight options using the configured flight provider (mock in development).",
      inputSchema: z.object({
        originAirportOrCity: z.string(),
        destinationAirportOrCity: z.string(),
        departureDate: z.string(),
        returnDate: z.string().optional(),
        adults: z.number().int().min(1),
        children: z.number().int().min(0).optional(),
        infants: z.number().int().min(0).optional(),
        cabinClass: z.string().optional(),
        directOnly: z.boolean().optional(),
        maxPrice: z.number().optional(),
        currency: z.string().optional(),
      }),
      execute: async (input) => {
        try {
          const flights = await withTimeout(getFlightProvider().searchFlights(input));
          const trip = ctx.getTrip();
          const next: TripPlan = {
            ...trip,
            flights,
            selectedFlightId: flights[0]?.id,
            updatedAt: new Date().toISOString(),
            assumptions: [
              ...trip.assumptions.filter((item) => !item.includes("flight")),
              "Flight options currently come from mock development data.",
            ],
          };
          ctx.setTrip(next);
          return {
            ok: true,
            count: flights.length,
            flights,
            warning: flights.length === 0 ? "No flights matched the search." : undefined,
            tripState: next,
          };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : "Flight search failed",
            flights: [],
          };
        }
      },
    }),

    searchHotels: tool({
      description: "Search hotel options using the configured hotel provider (mock in development).",
      inputSchema: z.object({
        destination: z.string(),
        checkInDate: z.string(),
        checkOutDate: z.string(),
        guests: z.number().int().min(1),
        rooms: z.number().int().min(1).optional(),
        maxNightlyPrice: z.number().optional(),
        currency: z.string().optional(),
        preferredAreas: z.array(z.string()).optional(),
        amenities: z.array(z.string()).optional(),
      }),
      execute: async (input) => {
        try {
          const hotels = await withTimeout(getHotelProvider().searchHotels(input));
          const trip = ctx.getTrip();
          const next: TripPlan = {
            ...trip,
            hotels,
            selectedHotelIds: hotels[0] ? [hotels[0].id] : [],
            updatedAt: new Date().toISOString(),
            assumptions: [
              ...trip.assumptions.filter((item) => !item.includes("hotel")),
              "Hotel options currently come from mock development data.",
            ],
          };
          ctx.setTrip(next);
          return {
            ok: true,
            count: hotels.length,
            hotels,
            warning: hotels.length === 0 ? "No hotels matched the search." : undefined,
            tripState: next,
          };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : "Hotel search failed",
            hotels: [],
          };
        }
      },
    }),

    searchActivities: tool({
      description: "Search activities, attractions, and food ideas for the destination.",
      inputSchema: z.object({
        destination: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        interests: z.array(z.string()).default([]),
        budgetLevel: z.string().optional(),
      }),
      execute: async (input) => {
        try {
          const activities = await withTimeout(getPlacesProvider().searchActivities(input));
          const trip = ctx.getTrip();
          const next: TripPlan = {
            ...trip,
            activities,
            updatedAt: new Date().toISOString(),
          };
          ctx.setTrip(next);
          return { ok: true, count: activities.length, activities, tripState: next };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : "Activity search failed",
            activities: [],
          };
        }
      },
    }),

    generateItinerary: tool({
      description: "Build a day-by-day itinerary from preferences and selected recommendations.",
      inputSchema: z.object({
        selectedFlightId: z.string().optional(),
        selectedHotelIds: z.array(z.string()).optional(),
      }),
      execute: async ({ selectedFlightId, selectedHotelIds }) => {
        const trip = ctx.getTrip();
        const flight =
          trip.flights.find((item) => item.id === (selectedFlightId ?? trip.selectedFlightId)) ??
          trip.flights[0];
        const hotels = trip.hotels.filter((hotel) =>
          (selectedHotelIds ?? trip.selectedHotelIds).includes(hotel.id),
        );
        const itinerary = generateItinerary({
          preferences: trip.preferences,
          selectedFlight: flight,
          selectedHotels: hotels.length ? hotels : trip.hotels.slice(0, 1),
          activities: trip.activities,
        });
        const next: TripPlan = {
          ...trip,
          itinerary,
          selectedFlightId: flight?.id,
          selectedHotelIds: hotels.length ? hotels.map((hotel) => hotel.id) : trip.selectedHotelIds,
          status: "ready",
          suggestions: [
            "Swap to a direct flight if connections feel tiring.",
            "Ask for a more relaxed day if the pace feels packed.",
            "Add another city only if transit time still leaves meaningful free time.",
          ],
          updatedAt: new Date().toISOString(),
        };
        ctx.setTrip(next);
        return { ok: true, itinerary, tripState: next };
      },
    }),

    calculateTripBudget: tool({
      description: "Estimate total trip cost including buffer. Results are estimates only.",
      inputSchema: z.object({}),
      execute: async () => {
        const trip = ctx.getTrip();
        const budget = calculateTripBudget({
          preferences: trip.preferences,
          flights: trip.flights,
          hotels: trip.hotels,
          activities: trip.activities,
          itinerary: trip.itinerary,
          selectedFlightId: trip.selectedFlightId,
          selectedHotelIds: trip.selectedHotelIds,
        });
        const next: TripPlan = {
          ...trip,
          budget,
          updatedAt: new Date().toISOString(),
        };
        ctx.setTrip(next);
        return { ok: true, budget, tripState: next };
      },
    }),
  };
}

export type TravelAgentTools = ReturnType<typeof createTravelAgentTools>;
