"use client";

import { useState } from "react";
import type { TripPreferences } from "@/types/trip";

type TripPreferencesFormProps = {
  preferences: TripPreferences;
  onSubmit: (updates: Partial<TripPreferences>) => void;
};

export function TripPreferencesForm({
  preferences,
  onSubmit,
}: TripPreferencesFormProps) {
  const [originCity, setOriginCity] = useState(preferences.origin_city ?? "");
  const [destinationCities, setDestinationCities] = useState(
    preferences.destination_cities.join(", "),
  );
  const [departureDate, setDepartureDate] = useState(preferences.departure_date ?? "");
  const [returnDate, setReturnDate] = useState(preferences.return_date ?? "");
  const [adults, setAdults] = useState(preferences.travellers.adults);
  const [budget, setBudget] = useState(preferences.budget?.amount?.toString() ?? "");
  const [style, setStyle] = useState(preferences.travel_style ?? "balanced");
  const [interests, setInterests] = useState(preferences.interests.join(", "));

  return (
    <form
      className="space-y-3 rounded-2xl border border-white/10 bg-[#121a22]/85 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          origin_city: originCity.trim() || undefined,
          destination_cities: destinationCities
            .split(",")
            .map((city) => city.trim())
            .filter(Boolean),
          departure_date: departureDate || undefined,
          return_date: returnDate || undefined,
          travellers: {
            adults: Number(adults) || 1,
            children: preferences.travellers.children,
            infants: preferences.travellers.infants,
          },
          budget: budget
            ? {
                amount: Number(budget),
                currency: preferences.budget?.currency ?? "USD",
              }
            : undefined,
          travel_style: style as TripPreferences["travel_style"],
          interests: interests
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        });
      }}
    >
      <p className="font-[family-name:var(--font-fraunces)] text-lg text-[#f3efe6]">
        Trip details
      </p>
      <Field label="Origin city">
        <input
          value={originCity}
          onChange={(event) => setOriginCity(event.target.value)}
          className={inputClass}
          placeholder="e.g. Toronto"
          aria-label="Origin city"
        />
      </Field>
      <Field label="Destination cities">
        <input
          value={destinationCities}
          onChange={(event) => setDestinationCities(event.target.value)}
          className={inputClass}
          placeholder="e.g. Paris, Lyon"
          aria-label="Destination cities"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Departure">
          <input
            type="date"
            value={departureDate}
            onChange={(event) => setDepartureDate(event.target.value)}
            className={inputClass}
            aria-label="Departure date"
          />
        </Field>
        <Field label="Return">
          <input
            type="date"
            value={returnDate}
            onChange={(event) => setReturnDate(event.target.value)}
            className={inputClass}
            aria-label="Return date"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Adults">
          <input
            type="number"
            min={1}
            value={adults}
            onChange={(event) => setAdults(Number(event.target.value))}
            className={inputClass}
            aria-label="Number of adults"
          />
        </Field>
        <Field label="Budget (optional)">
          <input
            type="number"
            min={0}
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            className={inputClass}
            placeholder="3000"
            aria-label="Budget amount"
          />
        </Field>
      </div>
      <Field label="Travel style">
        <select
          value={style ?? "balanced"}
          onChange={(event) =>
            setStyle(event.target.value as NonNullable<TripPreferences["travel_style"]>)
          }
          className={inputClass}
          aria-label="Travel style"
        >
          <option value="budget">Budget</option>
          <option value="balanced">Balanced</option>
          <option value="comfort">Comfort</option>
          <option value="luxury">Luxury</option>
        </select>
      </Field>
      <Field label="Interests">
        <input
          value={interests}
          onChange={(event) => setInterests(event.target.value)}
          className={inputClass}
          placeholder="food, museums, walking"
          aria-label="Interests"
        />
      </Field>
      <button
        type="submit"
        className="w-full rounded-lg bg-[#c9a66b] px-4 py-2.5 text-sm font-medium text-[#12100c] transition hover:bg-[#d8b87d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a66b]"
      >
        Save details & continue
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm text-[#9aa7b2]">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-[#0b1218] px-3 py-2 text-[#f3efe6] outline-none transition focus:border-[#c9a66b]/50";
