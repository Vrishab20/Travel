"use client";

import type { TripPlan } from "@/types/trip";
import { getMissingRequiredFields, tripDurationNights } from "@/lib/trip/preferences";

type TripSummaryProps = {
  trip: TripPlan;
};

export function TripSummary({ trip }: TripSummaryProps) {
  const missing = getMissingRequiredFields(trip.preferences);
  const nights = tripDurationNights(trip.preferences);
  const travellers =
    trip.preferences.travellers.adults +
    trip.preferences.travellers.children +
    trip.preferences.travellers.infants;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-[family-name:var(--font-fraunces)] text-2xl text-[#f3efe6]">
          Trip overview
        </h2>
        <p className="mt-1 text-sm text-[#9aa7b2]">
          Status: <span className="text-[#c9a66b]">{trip.status}</span>
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <Item
          label="From"
          value={trip.preferences.origin_city ?? trip.preferences.origin_country}
        />
        <Item
          label="To"
          value={
            trip.preferences.destination_cities.join(", ") ||
            trip.preferences.destination_country
          }
        />
        <Item label="Dates" value={formatDates(trip)} />
        <Item label="Duration" value={nights ? `${nights} night${nights === 1 ? "" : "s"}` : "—"} />
        <Item label="Travellers" value={String(travellers)} />
        <Item label="Style" value={trip.preferences.travel_style ?? "Not set"} />
        <Item
          label="Budget"
          value={
            trip.preferences.budget
              ? `${trip.preferences.budget.currency} ${trip.preferences.budget.amount}`
              : "Not set"
          }
        />
        <Item
          label="Interests"
          value={trip.preferences.interests.join(", ") || "Not set"}
        />
      </dl>

      {missing.length > 0 && (
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-[#f3efe6]">
          <p className="font-medium text-amber-100">Missing required details</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-50/90">
            {missing.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      )}

      {trip.assumptions.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#121a22] px-4 py-3 text-sm text-[#b7c0c8]">
          <p className="text-[#f3efe6]">Assumptions</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {trip.assumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#121a22]/80 px-3.5 py-3">
      <dt className="text-[11px] uppercase tracking-[0.14em] text-[#8f9aa3]">{label}</dt>
      <dd className="mt-1 text-[#f3efe6]">{value}</dd>
    </div>
  );
}

function formatDates(trip: TripPlan): string {
  const { departure_date, return_date } = trip.preferences;
  if (!departure_date && !return_date) return "Not set";
  if (departure_date && return_date) return `${departure_date} → ${return_date}`;
  return departure_date ?? return_date ?? "Not set";
}
