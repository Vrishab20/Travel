"use client";

import type { HotelRecommendation } from "@/types/trip";

type HotelRecommendationsProps = {
  hotels: HotelRecommendation[];
  selectedHotelIds: string[];
  onSelect: (hotelId: string) => void;
  onFocus?: (hotel: HotelRecommendation) => void;
};

export function HotelRecommendations({
  hotels,
  selectedHotelIds,
  onSelect,
  onFocus,
}: HotelRecommendationsProps) {
  if (!hotels.length) {
    return (
      <p className="rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-[#9aa7b2]">
        No hotel recommendations yet. Complete dates and destination cities to search.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {hotels.map((hotel) => {
        const selected = selectedHotelIds.includes(hotel.id);
        return (
          <article
            key={hotel.id}
            className={`rounded-2xl border px-4 py-4 ${
              selected
                ? "border-[#5fad9a]/55 bg-[#5fad9a]/10"
                : "border-white/10 bg-[#121a22]/85"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg text-[#f3efe6]">{hotel.name}</h3>
                <p className="text-sm text-[#9aa7b2]">
                  {hotel.city}
                  {hotel.neighbourhood ? ` · ${hotel.neighbourhood}` : ""}
                </p>
                {hotel.recommendation_category && (
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#8f9aa3]">
                    {hotel.recommendation_category}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg text-[#5fad9a]">
                  {hotel.nightly_price.currency} {hotel.nightly_price.amount}
                  <span className="text-sm text-[#9aa7b2]"> / night</span>
                </p>
                <p className="text-sm text-[#b7c0c8]">
                  Total {hotel.total_price.currency} {hotel.total_price.amount}
                </p>
                {hotel.is_mock_data && (
                  <p className="text-xs text-amber-200/80">Mock estimate</p>
                )}
              </div>
            </div>
            <p className="mt-2 text-sm text-[#b7c0c8]">
              {hotel.star_rating ? `${hotel.star_rating}★ · ` : ""}
              {hotel.review_score ? `Score ${hotel.review_score}` : ""}
            </p>
            <p className="mt-2 text-sm text-[#d7dde3]">{hotel.recommendation_reason}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {hotel.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-[#b7c0c8]"
                >
                  {amenity}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSelect(hotel.id)}
                className="rounded-lg bg-[#5fad9a] px-3 py-2 text-sm font-medium text-[#0c1412]"
              >
                Select for plan
              </button>
              {onFocus && hotel.latitude != null && hotel.longitude != null && (
                <button
                  type="button"
                  onClick={() => onFocus(hotel)}
                  className="rounded-lg border border-white/15 px-3 py-2 text-sm text-[#f3efe6]"
                >
                  View on map
                </button>
              )}
              {hotel.booking_url && (
                <a
                  href={hotel.booking_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-white/15 px-3 py-2 text-sm text-[#f3efe6]"
                >
                  Open provider
                </a>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
