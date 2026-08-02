import type { TripPreferences } from "@/types/trip";

export const REQUIRED_TRIP_FIELDS = [
  "origin_city",
  "destination_cities",
  "departure_date",
  "return_date",
  "travellers",
] as const;

export type RequiredTripField = (typeof REQUIRED_TRIP_FIELDS)[number];

export function getMissingRequiredFields(
  preferences: TripPreferences,
): RequiredTripField[] {
  const missing: RequiredTripField[] = [];
  if (!preferences.origin_city?.trim()) missing.push("origin_city");
  if (!preferences.destination_cities?.length) missing.push("destination_cities");
  if (!preferences.departure_date) missing.push("departure_date");
  if (!preferences.return_date) missing.push("return_date");
  if (!preferences.travellers?.adults || preferences.travellers.adults < 1) {
    missing.push("travellers");
  }
  return missing;
}

export function tripDurationNights(preferences: TripPreferences): number | null {
  if (!preferences.departure_date || !preferences.return_date) return null;
  const start = new Date(preferences.departure_date);
  const end = new Date(preferences.return_date);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return nights > 0 ? nights : null;
}
