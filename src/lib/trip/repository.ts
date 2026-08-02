import type { TripPlan } from "@/types/trip";

const SELECTION_KEY = "atlas.routeSelection";
const TRIP_PLAN_KEY = "atlas.tripPlan";

export type RouteSelectionPayload = {
  tripId: string;
  threadId: string;
  origin: {
    name: string;
    isoCode: string;
    coordinates: [number, number];
  };
  destination: {
    name: string;
    isoCode: string;
    coordinates: [number, number];
  };
};

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export const localTripRepository = {
  loadRouteSelection(): RouteSelectionPayload | null {
    if (!canUseStorage()) return null;
    const raw = window.sessionStorage.getItem(SELECTION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as RouteSelectionPayload;
    } catch {
      return null;
    }
  },
  saveRouteSelection(selection: RouteSelectionPayload): void {
    if (!canUseStorage()) return;
    window.sessionStorage.setItem(SELECTION_KEY, JSON.stringify(selection));
  },
  clearRouteSelection(): void {
    if (!canUseStorage()) return;
    window.sessionStorage.removeItem(SELECTION_KEY);
  },
  loadTrip(): TripPlan | null {
    if (!canUseStorage()) return null;
    const raw = window.localStorage.getItem(TRIP_PLAN_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as TripPlan;
    } catch {
      return null;
    }
  },
  saveTrip(trip: TripPlan): void {
    if (!canUseStorage()) return;
    window.localStorage.setItem(TRIP_PLAN_KEY, JSON.stringify(trip));
  },
  clearTrip(): void {
    if (!canUseStorage()) return;
    window.localStorage.removeItem(TRIP_PLAN_KEY);
  },
};
