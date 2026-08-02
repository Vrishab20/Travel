import type { TripPlan, TripPreferences } from "@/lib/agent/schemas";

export const REQUIRED_TRIP_FIELDS = [
  "originCity",
  "destinationCities",
  "departureDate",
  "returnDate",
  "travellers",
] as const;

export type RequiredTripField = (typeof REQUIRED_TRIP_FIELDS)[number];

export function getMissingRequiredFields(
  preferences: TripPreferences,
): RequiredTripField[] {
  const missing: RequiredTripField[] = [];

  if (!preferences.originCity?.trim()) {
    missing.push("originCity");
  }

  if (!preferences.destinationCities?.length) {
    missing.push("destinationCities");
  }

  if (!preferences.departureDate) {
    missing.push("departureDate");
  }

  if (!preferences.returnDate) {
    missing.push("returnDate");
  }

  if (!preferences.travellers?.adults || preferences.travellers.adults < 1) {
    missing.push("travellers");
  }

  return missing;
}

export function hasMinimumTripRequirements(preferences: TripPreferences): boolean {
  return getMissingRequiredFields(preferences).length === 0;
}

export function mergeTripPreferences(
  current: TripPreferences,
  updates: Partial<TripPreferences>,
): TripPreferences {
  return {
    ...current,
    ...updates,
    originCountry: updates.originCountry ?? current.originCountry,
    destinationCountry: updates.destinationCountry ?? current.destinationCountry,
    destinationCities:
      updates.destinationCities !== undefined
        ? updates.destinationCities
        : current.destinationCities,
    travellers: {
      ...current.travellers,
      ...(updates.travellers ?? {}),
    },
    budget: updates.budget
      ? { ...current.budget, ...updates.budget }
      : current.budget,
    flightPreference: updates.flightPreference
      ? { ...current.flightPreference, ...updates.flightPreference }
      : current.flightPreference,
    interests:
      updates.interests !== undefined ? updates.interests : current.interests,
    accessibilityNeeds:
      updates.accessibilityNeeds !== undefined
        ? updates.accessibilityNeeds
        : current.accessibilityNeeds,
    dietaryPreferences:
      updates.dietaryPreferences !== undefined
        ? updates.dietaryPreferences
        : current.dietaryPreferences,
  };
}

export function describeMissingFields(fields: RequiredTripField[]): string[] {
  const labels: Record<RequiredTripField, string> = {
    originCity: "Which city are you departing from?",
    destinationCities: "Which cities would you like to visit?",
    departureDate: "What is your departure date?",
    returnDate: "What is your return date?",
    travellers: "How many travellers are going?",
  };

  return fields.map((field) => labels[field]);
}

export function tripDurationNights(preferences: TripPreferences): number | null {
  if (!preferences.departureDate || !preferences.returnDate) return null;
  const start = new Date(preferences.departureDate);
  const end = new Date(preferences.returnDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return nights > 0 ? nights : null;
}

export function createEmptyTripPlan(
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
    selectedHotelIds: [],
    status: "incomplete",
    assumptions: [],
    suggestions: [],
    createdAt: now,
    updatedAt: now,
  };
}
