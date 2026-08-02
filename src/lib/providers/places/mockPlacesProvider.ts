import type { ActivityRecommendation } from "@/lib/agent/schemas";
import type { PlacesProvider, PlacesSearchRequest } from "./types";

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const CATALOG: Array<Omit<ActivityRecommendation, "id" | "city" | "isMockData">> = [
  {
    name: "Old Town Walking Circuit",
    category: "neighbourhood",
    description: "Easy orientation walk through plazas, markets, and landmark streets.",
    estimatedCost: { amount: 0, currency: "USD" },
    durationMinutes: 150,
    recommendationReason: "Low-effort arrival-day activity with strong local context.",
  },
  {
    name: "Museum Highlights Pass",
    category: "attraction",
    description: "Curated museum visit with a paced schedule and cafe break.",
    estimatedCost: { amount: 28, currency: "USD" },
    durationMinutes: 180,
    recommendationReason: "Fits culture-focused travellers without overpacking the day.",
  },
  {
    name: "Seasonal Food Market Tour",
    category: "tour",
    description: "Guided tasting stop across a local market and nearby cafe.",
    estimatedCost: { amount: 55, currency: "USD" },
    durationMinutes: 150,
    recommendationReason: "Food-forward option that also works for couples and friends.",
  },
  {
    name: "Neighbourhood Bistro Dinner",
    category: "restaurant",
    description: "Reservation-friendly dinner with vegetarian-capable menus.",
    estimatedCost: { amount: 45, currency: "USD" },
    durationMinutes: 120,
    recommendationReason: "Reliable evening option with flexible dietary support.",
  },
  {
    name: "Riverside Park Picnic",
    category: "activity",
    description: "Relaxed outdoor break with optional bike rental nearby.",
    estimatedCost: { amount: 18, currency: "USD" },
    durationMinutes: 120,
    recommendationReason: "Useful for recovering after transit or long travel days.",
  },
  {
    name: "Sunset Viewpoint Walk",
    category: "attraction",
    description: "Short climb or promenade timed for golden-hour views.",
    estimatedCost: { amount: 0, currency: "USD" },
    durationMinutes: 90,
    recommendationReason: "Scenic and low cost — works well before dinner.",
  },
];

export class MockPlacesProvider implements PlacesProvider {
  async searchActivities(
    request: PlacesSearchRequest,
  ): Promise<ActivityRecommendation[]> {
    const seed = hashSeed(
      [request.destination, request.startDate, request.endDate, request.interests.join(",")].join(
        "|",
      ),
    );

    const interests = request.interests.map((item) => item.toLowerCase());
    let catalog = [...CATALOG];

    if (interests.some((item) => item.includes("food") || item.includes("restaurant"))) {
      catalog = [...catalog].sort((a, b) =>
        a.category === "restaurant" || a.category === "tour" ? -1 : 1,
      );
    }

    if (interests.some((item) => item.includes("museum") || item.includes("culture"))) {
      catalog = [...catalog].sort((a, b) => (a.category === "attraction" ? -1 : 1));
    }

    const rotated = [
      ...catalog.slice(seed % catalog.length),
      ...catalog.slice(0, seed % catalog.length),
    ];

    return rotated.slice(0, 5).map((activity, index) => ({
      ...activity,
      id: `mock-activity-${seed}-${index}`,
      city: request.destination,
      latitude: 48.85 + index * 0.01,
      longitude: 2.35 + index * 0.008,
      isMockData: true,
    }));
  }
}
