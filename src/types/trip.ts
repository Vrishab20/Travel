/**
 * Frontend types mirroring the Python FastAPI / LangGraph trip domain (snake_case wire format).
 */

export type Travellers = {
  adults: number;
  children: number;
  infants: number;
};

export type Money = {
  amount: number;
  currency: string;
};

export type FlightPreference = {
  cabin_class?: "economy" | "premium_economy" | "business" | "first" | null;
  direct_flights_preferred?: boolean | null;
  checked_bags?: number | null;
};

export type TripPreferences = {
  origin_country: string;
  origin_city?: string | null;
  destination_country: string;
  destination_cities: string[];
  departure_date?: string | null;
  return_date?: string | null;
  travellers: Travellers;
  budget?: Money | null;
  travel_style?: "budget" | "balanced" | "comfort" | "luxury" | null;
  interests: string[];
  accommodation_preference?: string | null;
  flight_preference?: FlightPreference | null;
  pace?: "relaxed" | "balanced" | "packed" | null;
  accessibility_needs?: string[];
  dietary_preferences?: string[];
  notes?: string | null;
};

export type FlightRecommendation = {
  id: string;
  provider: string;
  airline: string;
  flight_numbers: string[];
  origin_airport: string;
  destination_airport: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  stops: number;
  cabin_class: string;
  price: Money;
  baggage_summary?: string | null;
  booking_url?: string | null;
  is_mock_data: boolean;
  recommendation_category?: "best_value" | "best_schedule" | "most_comfortable" | null;
  recommendation_reason: string;
};

export type HotelRecommendation = {
  id: string;
  provider: string;
  name: string;
  city: string;
  neighbourhood?: string | null;
  star_rating?: number | null;
  review_score?: number | null;
  check_in_date?: string | null;
  check_out_date?: string | null;
  nightly_price: Money;
  total_price: Money;
  amenities: string[];
  image_url?: string | null;
  booking_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_mock_data: boolean;
  recommendation_category?: "budget" | "balanced" | "premium" | null;
  recommendation_reason: string;
};

export type ActivityRecommendation = {
  id: string;
  name: string;
  city: string;
  category: string;
  description: string;
  estimated_cost?: Money | null;
  duration_minutes?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  booking_url?: string | null;
  is_mock_data: boolean;
  recommendation_reason: string;
};

export type ItineraryItem = {
  id: string;
  start_time?: string | null;
  end_time?: string | null;
  category: string;
  title: string;
  description?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  estimated_cost?: Money | null;
  booking_url?: string | null;
};

export type ItineraryDay = {
  date: string;
  city: string;
  title: string;
  summary: string;
  items: ItineraryItem[];
  estimated_daily_cost?: Money | null;
};

export type TripBudget = {
  currency: string;
  flights: number;
  hotels: number;
  activities: number;
  local_transport: number;
  food: number;
  taxes_and_fees: number;
  emergency_buffer: number;
  total: number;
  per_person: number;
  is_estimate: true;
  notes: string[];
};

export type TripPlan = {
  id: string;
  preferences: TripPreferences;
  flights: FlightRecommendation[];
  hotels: HotelRecommendation[];
  activities: ActivityRecommendation[];
  itinerary: ItineraryDay[];
  budget?: TripBudget | null;
  selected_flight_id?: string | null;
  selected_hotel_ids: string[];
  status: "draft" | "incomplete" | "ready" | "partial";
  assumptions: string[];
  warnings: string[];
  suggestions: string[];
  data_freshness?: {
    flights: string;
    hotels: string;
    activities: string;
  } | null;
  created_at: string;
  updated_at: string;
};

export type TravelAgentStage =
  | "collecting_requirements"
  | "awaiting_user_input"
  | "classifying_request"
  | "searching_flights"
  | "searching_hotels"
  | "searching_activities"
  | "building_itinerary"
  | "calculating_budget"
  | "assembling_plan"
  | "ready"
  | "refining"
  | "partial_failure"
  | "error";

export type CreateTripResponse = {
  trip_id: string;
  thread_id: string;
  status: string;
};

export type TripResponse = {
  trip_id: string;
  thread_id: string;
  status: string;
  current_stage?: TravelAgentStage | null;
  trip_plan?: TripPlan | null;
  assistant_summary?: string | null;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

export type TravelAgentStreamEvent =
  | { type: "assistant_token"; content: string }
  | { type: "stage_changed"; stage: TravelAgentStage; label: string }
  | { type: "provider_started"; provider: "flights" | "hotels" | "activities" }
  | {
      type: "provider_completed";
      provider: "flights" | "hotels" | "activities";
      result_count: number;
    }
  | {
      type: "provider_failed";
      provider: "flights" | "hotels" | "activities";
      recoverable: boolean;
      message: string;
    }
  | { type: "trip_plan_updated"; trip_plan: TripPlan }
  | { type: "graph_completed"; stage: TravelAgentStage }
  | { type: "error"; message: string };

export type TripWorkspaceTab =
  | "overview"
  | "flights"
  | "hotels"
  | "itinerary"
  | "budget"
  | "map";

export type MapFocusEvent = {
  latitude: number;
  longitude: number;
  label?: string;
  itemId?: string;
};

export function emptyTripPreferences(
  originCountry: string,
  destinationCountry: string,
): TripPreferences {
  return {
    origin_country: originCountry,
    destination_country: destinationCountry,
    destination_cities: [],
    travellers: { adults: 1, children: 0, infants: 0 },
    interests: [],
    accessibility_needs: [],
    dietary_preferences: [],
  };
}

export function emptyTripPlan(
  preferences: TripPreferences,
  id = crypto.randomUUID(),
): TripPlan {
  const now = new Date().toISOString();
  return {
    id,
    preferences,
    flights: [],
    hotels: [],
    activities: [],
    itinerary: [],
    selected_hotel_ids: [],
    status: "incomplete",
    assumptions: [],
    warnings: [],
    suggestions: [],
    created_at: now,
    updated_at: now,
  };
}
