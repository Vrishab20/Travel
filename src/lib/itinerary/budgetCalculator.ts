import type {
  ActivityRecommendation,
  FlightRecommendation,
  HotelRecommendation,
  ItineraryDay,
  TripBudget,
  TripPreferences,
} from "@/lib/agent/schemas";
import { tripDurationNights } from "@/lib/agent/conversationState";

type BudgetInput = {
  preferences: TripPreferences;
  flights: FlightRecommendation[];
  hotels: HotelRecommendation[];
  activities: ActivityRecommendation[];
  itinerary: ItineraryDay[];
  selectedFlightId?: string;
  selectedHotelIds?: string[];
};

export function calculateTripBudget({
  preferences,
  flights,
  hotels,
  activities,
  itinerary,
  selectedFlightId,
  selectedHotelIds,
}: BudgetInput): TripBudget {
  const currency = preferences.budget?.currency ?? "USD";
  const travellers =
    preferences.travellers.adults +
    preferences.travellers.children +
    preferences.travellers.infants;
  const people = Math.max(1, travellers);
  const nights = tripDurationNights(preferences) ?? 3;

  const selectedFlight =
    flights.find((flight) => flight.id === selectedFlightId) ?? flights[0];
  const selectedHotels = hotels.filter((hotel) =>
    selectedHotelIds?.length ? selectedHotelIds.includes(hotel.id) : hotel.id === hotels[0]?.id,
  );

  const flightTotal = selectedFlight ? selectedFlight.price.amount * people : 0;
  const hotelTotal = selectedHotels.reduce((sum, hotel) => sum + hotel.totalPrice.amount, 0);

  const activityFromCards = activities
    .slice(0, Math.max(3, nights))
    .reduce((sum, activity) => sum + (activity.estimatedCost?.amount ?? 0), 0);
  const activityFromItinerary = itinerary.reduce((sum, day) => {
    return (
      sum +
      day.items
        .filter((item) => item.category === "activity")
        .reduce((inner, item) => inner + (item.estimatedCost?.amount ?? 0), 0)
    );
  }, 0);
  const activitiesTotal = Math.max(activityFromCards, activityFromItinerary) * people;

  const foodPerDay = preferences.travelStyle === "luxury" ? 90 : preferences.travelStyle === "budget" ? 35 : 55;
  const food = foodPerDay * nights * people;
  const localTransport = 18 * nights * people;
  const subtotal = flightTotal + hotelTotal + activitiesTotal + food + localTransport;
  const taxesAndFees = Math.round(subtotal * 0.08);
  const emergencyBuffer = Math.round(subtotal * 0.1);
  const total = subtotal + taxesAndFees + emergencyBuffer;

  return {
    currency,
    flights: flightTotal,
    hotels: hotelTotal,
    activities: activitiesTotal,
    localTransport,
    food,
    taxesAndFees,
    emergencyBuffer,
    total,
    perPerson: Math.round(total / people),
    isEstimate: true,
    notes: [
      "All figures are estimates for planning only.",
      selectedFlight?.isMockData || selectedHotels.some((hotel) => hotel.isMockData)
        ? "Mock provider prices are not live availability or booking quotes."
        : "Verify live rates with providers before booking.",
    ],
  };
}
