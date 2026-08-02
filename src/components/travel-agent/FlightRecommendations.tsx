"use client";

import type { FlightRecommendation } from "@/types/trip";

type FlightRecommendationsProps = {
  flights: FlightRecommendation[];
  selectedFlightId?: string | null;
  onSelect: (flightId: string) => void;
};

export function FlightRecommendations({
  flights,
  selectedFlightId,
  onSelect,
}: FlightRecommendationsProps) {
  if (!flights.length) {
    return <Empty label="No flight recommendations yet. Share trip dates to search." />;
  }

  return (
    <div className="space-y-3">
      {flights.map((flight) => {
        const selected = flight.id === selectedFlightId;
        return (
          <article
            key={flight.id}
            className={`rounded-2xl border px-4 py-4 ${
              selected
                ? "border-[#c9a66b]/55 bg-[#c9a66b]/10"
                : "border-white/10 bg-[#121a22]/85"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg text-[#f3efe6]">{flight.airline}</h3>
                <p className="text-sm text-[#9aa7b2]">
                  {flight.origin_airport} → {flight.destination_airport} ·{" "}
                  {flight.flight_numbers.join(", ")}
                </p>
                {flight.recommendation_category && (
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#8f9aa3]">
                    {flight.recommendation_category.replaceAll("_", " ")}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg text-[#c9a66b]">
                  {flight.price.currency} {flight.price.amount}
                </p>
                {flight.is_mock_data && (
                  <p className="text-xs text-amber-200/80">Mock estimate</p>
                )}
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-[#b7c0c8] sm:grid-cols-4">
              <Meta label="Depart" value={formatTime(flight.departure_time)} />
              <Meta label="Arrive" value={formatTime(flight.arrival_time)} />
              <Meta
                label="Duration"
                value={`${Math.round(flight.duration_minutes / 60)}h ${flight.duration_minutes % 60}m`}
              />
              <Meta label="Stops" value={flight.stops === 0 ? "Direct" : String(flight.stops)} />
              <Meta label="Cabin" value={flight.cabin_class} />
              <Meta label="Bags" value={flight.baggage_summary ?? "See provider"} />
            </dl>
            <p className="mt-3 text-sm text-[#d7dde3]">{flight.recommendation_reason}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSelect(flight.id)}
                className="rounded-lg bg-[#c9a66b] px-3 py-2 text-sm font-medium text-[#12100c]"
              >
                Select for plan
              </button>
              {flight.booking_url && (
                <a
                  href={flight.booking_url}
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.12em] text-[#8f9aa3]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatTime(value: string) {
  return value.includes("T") ? value.slice(11, 16) : value;
}

function Empty({ label }: { label: string }) {
  return (
    <p className="rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-[#9aa7b2]">
      {label}
    </p>
  );
}
