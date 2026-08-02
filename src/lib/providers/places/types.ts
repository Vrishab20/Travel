import type { ActivityRecommendation } from "@/lib/agent/schemas";

export type PlacesSearchRequest = {
  destination: string;
  startDate: string;
  endDate: string;
  interests: string[];
  budgetLevel?: string;
};

export interface PlacesProvider {
  searchActivities(request: PlacesSearchRequest): Promise<ActivityRecommendation[]>;
}
