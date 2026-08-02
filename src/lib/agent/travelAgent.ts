import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import {
  createEmptyTripPlan,
  describeMissingFields,
  getMissingRequiredFields,
  hasMinimumTripRequirements,
  mergeTripPreferences,
} from "@/lib/agent/conversationState";
import { getLanguageModel, hasLlmConfigured } from "@/lib/agent/llm";
import { tripPlanSchema, type TripPlan, type TripPreferences } from "@/lib/agent/schemas";
import { buildTravelAgentSystemPrompt } from "@/lib/agent/systemPrompt";
import { createTravelAgentTools } from "@/lib/agent/tools";
import { calculateTripBudget } from "@/lib/itinerary/budgetCalculator";
import { generateItinerary } from "@/lib/itinerary/itineraryGenerator";
import { getFlightProvider } from "@/lib/providers/flights/flightProvider";
import { getHotelProvider } from "@/lib/providers/hotels/hotelProvider";
import { getPlacesProvider } from "@/lib/providers/places/placesProvider";

export type TravelAgentRunInput = {
  messages: UIMessage[];
  tripState: TripPlan | null;
};

function ensureTrip(tripState: TripPlan | null): TripPlan {
  if (tripState) {
    return tripPlanSchema.parse(tripState);
  }
  return createEmptyTripPlan({
    originCountry: "Unknown",
    destinationCountry: "Unknown",
    destinationCities: [],
    travellers: { adults: 1, children: 0, infants: 0 },
    interests: [],
  });
}

function extractLatestUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.role !== "user") continue;
    const text = message.parts
      ?.filter((part) => part.type === "text")
      .map((part) => ("text" in part ? part.text : ""))
      .join("\n");
    if (text?.trim()) return text.trim();
  }
  return "";
}

function heuristicPreferenceUpdates(text: string, current: TripPreferences): Partial<TripPreferences> {
  const updates: Partial<TripPreferences> = {};
  const cityFrom = text.match(/from\s+([A-Z][a-zA-Z\s-]+)/i)?.[1]?.trim();
  const cityTo = text.match(/(?:to|visit(?:ing)?)\s+([A-Z][a-zA-Z\s-]+)/i)?.[1]?.trim();
  const dates = [...text.matchAll(/(\d{4}-\d{2}-\d{2})/g)].map((match) => match[1]);
  const adults = text.match(/(\d+)\s+adult/i)?.[1];
  const budget = text.match(/\$?\s?(\d{3,5})\s*(usd|eur|cad)?/i);

  if (cityFrom && !current.originCity) updates.originCity = cityFrom;
  if (cityTo && current.destinationCities.length === 0) {
    updates.destinationCities = [cityTo.replace(/\.$/, "")];
  }
  if (dates[0]) updates.departureDate = dates[0];
  if (dates[1]) updates.returnDate = dates[1];
  if (adults) {
    updates.travellers = {
      ...current.travellers,
      adults: Number(adults),
    };
  }
  if (budget) {
    updates.budget = {
      amount: Number(budget[1]),
      currency: (budget[2] ?? "USD").toUpperCase(),
    };
  }
  if (/direct flight/i.test(text)) {
    updates.flightPreference = {
      ...current.flightPreference,
      directFlightsPreferred: true,
    };
  }
  if (/luxury/i.test(text)) updates.travelStyle = "luxury";
  if (/budget/i.test(text)) updates.travelStyle = "budget";
  if (/vegetarian|vegan/i.test(text)) {
    updates.dietaryPreferences = [
      ...(current.dietaryPreferences ?? []),
      /vegan/i.test(text) ? "vegan" : "vegetarian",
    ];
  }

  return updates;
}

async function buildPlanFromProviders(trip: TripPlan): Promise<TripPlan> {
  const prefs = trip.preferences;
  const origin = prefs.originCity ?? prefs.originCountry;
  const destination = prefs.destinationCities[0] ?? prefs.destinationCountry;
  const guests =
    prefs.travellers.adults + prefs.travellers.children + prefs.travellers.infants;

  const [flightsResult, hotelsResult, activitiesResult] = await Promise.allSettled([
    getFlightProvider().searchFlights({
      originAirportOrCity: origin,
      destinationAirportOrCity: destination,
      departureDate: prefs.departureDate!,
      returnDate: prefs.returnDate,
      adults: prefs.travellers.adults,
      children: prefs.travellers.children,
      infants: prefs.travellers.infants,
      cabinClass: prefs.flightPreference?.cabinClass,
      directOnly: prefs.flightPreference?.directFlightsPreferred,
      currency: prefs.budget?.currency,
    }),
    getHotelProvider().searchHotels({
      destination,
      checkInDate: prefs.departureDate!,
      checkOutDate: prefs.returnDate!,
      guests: Math.max(1, guests),
      currency: prefs.budget?.currency,
    }),
    getPlacesProvider().searchActivities({
      destination,
      startDate: prefs.departureDate!,
      endDate: prefs.returnDate!,
      interests: prefs.interests,
      budgetLevel: prefs.travelStyle,
    }),
  ]);

  const flights = flightsResult.status === "fulfilled" ? flightsResult.value : [];
  const hotels = hotelsResult.status === "fulfilled" ? hotelsResult.value : [];
  const activities = activitiesResult.status === "fulfilled" ? activitiesResult.value : [];

  const assumptions = [
    "Recommendations are generated from mock providers for development.",
    "Prices and availability are estimates, not live booking quotes.",
  ];
  if (flightsResult.status === "rejected") {
    assumptions.push("Flight search failed — hotel/activity planning continued with partial results.");
  }
  if (hotelsResult.status === "rejected") {
    assumptions.push("Hotel search failed — flight results are still available.");
  }

  const selectedFlight = flights[0];
  const selectedHotels = hotels.slice(0, 1);
  const itinerary = generateItinerary({
    preferences: prefs,
    selectedFlight,
    selectedHotels,
    activities,
  });
  const budget = calculateTripBudget({
    preferences: prefs,
    flights,
    hotels,
    activities,
    itinerary,
    selectedFlightId: selectedFlight?.id,
    selectedHotelIds: selectedHotels.map((hotel) => hotel.id),
  });

  return {
    ...trip,
    flights,
    hotels,
    activities,
    itinerary,
    budget,
    selectedFlightId: selectedFlight?.id,
    selectedHotelIds: selectedHotels.map((hotel) => hotel.id),
    status: "ready",
    assumptions,
    suggestions: [
      "Ask for cheaper flights or direct-only options.",
      "Request a more relaxed day or different neighbourhood hotel.",
      "Add dietary preferences to reshape food stops.",
    ],
    updatedAt: new Date().toISOString(),
  };
}

function localAgentReply(trip: TripPlan, userText: string): { text: string; trip: TripPlan } {
  let next = trip;
  const updates = heuristicPreferenceUpdates(userText, trip.preferences);
  if (Object.keys(updates).length > 0) {
    const preferences = mergeTripPreferences(trip.preferences, updates);
    next = {
      ...trip,
      preferences,
      status: hasMinimumTripRequirements(preferences) ? "draft" : "incomplete",
      updatedAt: new Date().toISOString(),
    };
  }

  const missing = getMissingRequiredFields(next.preferences);
  if (missing.length > 0) {
    const questions = describeMissingFields(missing);
    return {
      trip: next,
      text: [
        `Great — planning ${next.preferences.originCountry} → ${next.preferences.destinationCountry}.`,
        "",
        "I still need a few details:",
        ...questions.map((question) => `- ${question}`),
        "",
        "Optional: budget, travel style, interests, or dietary needs.",
        "",
        "_Running in local agent mode (no LLM_API_KEY). Mock providers will be used once details are complete._",
      ].join("\n"),
    };
  }

  return {
    trip: next,
    text: "Thanks — I have the minimum details. Building flight, hotel, itinerary, and budget recommendations now.",
  };
}

export async function runTravelAgent({ messages, tripState }: TravelAgentRunInput) {
  let trip = ensureTrip(tripState);

  if (!hasLlmConfigured()) {
    const userText = extractLatestUserText(messages);
    const local = localAgentReply(trip, userText || "hello");
    trip = local.trip;

    if (hasMinimumTripRequirements(trip.preferences) && trip.status !== "ready") {
      trip = await buildPlanFromProviders(trip);
    }

    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        writer.write({ type: "start" });
        writer.write({ type: "text-start", id: "local-text" });
        const finalText =
          trip.status === "ready"
            ? [
                local.text,
                "",
                `### Trip snapshot`,
                `- Flights: ${trip.flights.length} mock options`,
                `- Hotels: ${trip.hotels.length} mock options`,
                `- Itinerary days: ${trip.itinerary.length}`,
                `- Estimated total: ${trip.budget?.currency ?? "USD"} ${trip.budget?.total ?? "—"}`,
                "",
                "All prices are **mock development estimates**, not live booking quotes.",
                "Tell me what to refine (cheaper flight, different hotel, calmer day 3, vegetarian food, etc.).",
              ].join("\n")
            : local.text;
        writer.write({ type: "text-delta", id: "local-text", delta: finalText });
        writer.write({ type: "text-end", id: "local-text" });
        writer.write({
          type: "data-trip-state",
          data: trip,
        });
        writer.write({ type: "finish" });
      },
    });

    return createUIMessageStreamResponse({ stream });
  }

  const tools = createTravelAgentTools({
    getTrip: () => trip,
    setTrip: (next) => {
      trip = next;
    },
  });

  const result = streamText({
    model: getLanguageModel(),
    system: buildTravelAgentSystemPrompt(trip),
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(8),
    onFinish: async () => {
      // trip is mutated by tools during the run
    },
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: () => ({ tripUpdatedAt: new Date().toISOString() }),
    onFinish: () => undefined,
  });
}

/**
 * TODO: basic rate-limiting hooks (IP / session) before production traffic.
 */
export function assertRateLimitPlaceholder(): void {
  // no-op placeholder
}
