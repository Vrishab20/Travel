import type { HotelRecommendation } from "@/lib/agent/schemas";

export type HotelSearchRequest = {
  destination: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  rooms?: number;
  maxNightlyPrice?: number;
  currency?: string;
  preferredAreas?: string[];
  amenities?: string[];
};

export interface HotelProvider {
  searchHotels(request: HotelSearchRequest): Promise<HotelRecommendation[]>;
}
