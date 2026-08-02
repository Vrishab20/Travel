import { z } from "zod";

export const moneySchema = z.object({
  amount: z.number(),
  currency: z.string().default("USD"),
});

export const travellersSchema = z.object({
  adults: z.number().int().min(1).default(1),
  children: z.number().int().min(0).default(0),
  infants: z.number().int().min(0).default(0),
});

export const flightPreferenceSchema = z.object({
  cabinClass: z
    .enum(["economy", "premium_economy", "business", "first"])
    .optional(),
  directFlightsPreferred: z.boolean().optional(),
  checkedBags: z.number().int().min(0).optional(),
});

export const tripPreferencesSchema = z.object({
  originCountry: z.string().min(1),
  originCity: z.string().optional(),
  destinationCountry: z.string().min(1),
  destinationCities: z.array(z.string()).default([]),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),
  travellers: travellersSchema.default({ adults: 1, children: 0, infants: 0 }),
  budget: moneySchema.optional(),
  travelStyle: z.enum(["budget", "balanced", "comfort", "luxury"]).optional(),
  interests: z.array(z.string()).default([]),
  accommodationPreference: z.string().optional(),
  flightPreference: flightPreferenceSchema.optional(),
  pace: z.enum(["relaxed", "balanced", "packed"]).optional(),
  accessibilityNeeds: z.array(z.string()).optional(),
  dietaryPreferences: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const flightRecommendationSchema = z.object({
  id: z.string(),
  provider: z.string(),
  airline: z.string(),
  flightNumbers: z.array(z.string()),
  originAirport: z.string(),
  destinationAirport: z.string(),
  departureTime: z.string(),
  arrivalTime: z.string(),
  durationMinutes: z.number(),
  stops: z.number().int().min(0),
  cabinClass: z.string(),
  price: moneySchema,
  baggageSummary: z.string().optional(),
  bookingUrl: z.string().url().optional(),
  isMockData: z.boolean(),
  recommendationCategory: z
    .enum(["best_value", "best_schedule", "most_comfortable"])
    .optional(),
  recommendationReason: z.string(),
});

export const hotelRecommendationSchema = z.object({
  id: z.string(),
  provider: z.string(),
  name: z.string(),
  city: z.string(),
  neighbourhood: z.string().optional(),
  starRating: z.number().optional(),
  reviewScore: z.number().optional(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  nightlyPrice: moneySchema,
  totalPrice: moneySchema,
  amenities: z.array(z.string()),
  imageUrl: z.string().optional(),
  bookingUrl: z.string().url().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isMockData: z.boolean(),
  recommendationCategory: z.enum(["budget", "balanced", "premium"]).optional(),
  recommendationReason: z.string(),
});

export const activityRecommendationSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  category: z.enum([
    "attraction",
    "neighbourhood",
    "tour",
    "restaurant",
    "activity",
  ]),
  description: z.string(),
  estimatedCost: moneySchema.optional(),
  durationMinutes: z.number().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  bookingUrl: z.string().url().optional(),
  isMockData: z.boolean(),
  recommendationReason: z.string(),
});

export const itineraryItemSchema = z.object({
  id: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  category: z.enum([
    "flight",
    "hotel",
    "transport",
    "activity",
    "food",
    "free_time",
  ]),
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  estimatedCost: moneySchema.optional(),
  bookingUrl: z.string().url().optional(),
});

export const itineraryDaySchema = z.object({
  date: z.string(),
  city: z.string(),
  title: z.string(),
  summary: z.string(),
  items: z.array(itineraryItemSchema),
  estimatedDailyCost: moneySchema.optional(),
});

export const tripBudgetSchema = z.object({
  currency: z.string(),
  flights: z.number(),
  hotels: z.number(),
  activities: z.number(),
  localTransport: z.number(),
  food: z.number(),
  taxesAndFees: z.number(),
  emergencyBuffer: z.number(),
  total: z.number(),
  perPerson: z.number(),
  isEstimate: z.literal(true),
  notes: z.array(z.string()).default([]),
});

export const tripPlanSchema = z.object({
  id: z.string(),
  preferences: tripPreferencesSchema,
  flights: z.array(flightRecommendationSchema).default([]),
  hotels: z.array(hotelRecommendationSchema).default([]),
  activities: z.array(activityRecommendationSchema).default([]),
  itinerary: z.array(itineraryDaySchema).default([]),
  budget: tripBudgetSchema.optional(),
  selectedFlightId: z.string().optional(),
  selectedHotelIds: z.array(z.string()).default([]),
  status: z.enum(["draft", "incomplete", "ready", "partial"]),
  assumptions: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
  dataFreshness: z
    .object({
      flights: z.string(),
      hotels: z.string(),
      activities: z.string(),
    })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const travelAgentStageSchema = z.enum([
  "collecting_requirements",
  "awaiting_user_input",
  "classifying_request",
  "searching_flights",
  "searching_hotels",
  "searching_activities",
  "building_itinerary",
  "calculating_budget",
  "assembling_plan",
  "ready",
  "refining",
  "partial_failure",
  "error",
]);

export const travelRefinementIntentSchema = z.enum([
  "provide_trip_information",
  "generate_initial_plan",
  "find_cheaper_flights",
  "find_direct_flights",
  "change_flight_preferences",
  "replace_hotel",
  "change_hotel_preferences",
  "modify_itinerary_day",
  "add_destination",
  "remove_destination",
  "change_dates",
  "change_budget",
  "change_travel_style",
  "change_interests",
  "change_dietary_preferences",
  "recalculate_budget",
  "general_trip_question",
  "start_over",
  "unknown",
]);

export const tripPlanSectionSchema = z.enum([
  "flights",
  "hotels",
  "activities",
  "itinerary",
  "budget",
]);

export const providerExecutionStatusSchema = z.enum([
  "idle",
  "running",
  "succeeded",
  "failed",
  "skipped",
]);

export const agentErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  provider: z.enum(["flights", "hotels", "activities"]).optional(),
  recoverable: z.boolean().default(true),
  timestamp: z.string(),
});

export const travelAgentStreamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("assistant_token"), content: z.string() }),
  z.object({
    type: z.literal("stage_changed"),
    stage: travelAgentStageSchema,
    label: z.string(),
  }),
  z.object({
    type: z.literal("provider_started"),
    provider: z.enum(["flights", "hotels", "activities"]),
  }),
  z.object({
    type: z.literal("provider_completed"),
    provider: z.enum(["flights", "hotels", "activities"]),
    resultCount: z.number(),
  }),
  z.object({
    type: z.literal("provider_failed"),
    provider: z.enum(["flights", "hotels", "activities"]),
    recoverable: z.boolean(),
    message: z.string(),
  }),
  z.object({ type: z.literal("trip_plan_updated"), tripPlan: tripPlanSchema }),
  z.object({
    type: z.literal("graph_completed"),
    stage: travelAgentStageSchema,
  }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);

export const travelAgentRequestSchema = z.object({
  tripId: z.string().min(1),
  threadId: z.string().min(1),
  message: z.string().min(1),
  initialContext: z
    .object({
      originCountry: z.string().min(1),
      destinationCountry: z.string().min(1),
    })
    .optional(),
});

export const ALLOWED_TOOL_NAMES = [
  "updateTripPreferences",
  "searchFlights",
  "searchHotels",
  "searchActivities",
  "generateItinerary",
  "calculateTripBudget",
] as const;

export type AllowedToolName = (typeof ALLOWED_TOOL_NAMES)[number];
export type TravelAgentStage = z.infer<typeof travelAgentStageSchema>;
export type TravelRefinementIntent = z.infer<typeof travelRefinementIntentSchema>;
export type TripPlanSection = z.infer<typeof tripPlanSectionSchema>;
export type ProviderExecutionStatus = z.infer<typeof providerExecutionStatusSchema>;
export type AgentError = z.infer<typeof agentErrorSchema>;
export type TravelAgentStreamEvent = z.infer<typeof travelAgentStreamEventSchema>;
export type TripPreferences = z.infer<typeof tripPreferencesSchema>;
export type FlightRecommendation = z.infer<typeof flightRecommendationSchema>;
export type HotelRecommendation = z.infer<typeof hotelRecommendationSchema>;
export type ActivityRecommendation = z.infer<typeof activityRecommendationSchema>;
export type ItineraryDay = z.infer<typeof itineraryDaySchema>;
export type ItineraryItem = z.infer<typeof itineraryItemSchema>;
export type TripBudget = z.infer<typeof tripBudgetSchema>;
export type TripPlan = z.infer<typeof tripPlanSchema>;
