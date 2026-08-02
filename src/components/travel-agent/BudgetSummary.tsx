"use client";

import type { TripBudget } from "@/types/trip";

type BudgetSummaryProps = {
  budget?: TripBudget | null;
};

export function BudgetSummary({ budget }: BudgetSummaryProps) {
  if (!budget) {
    return (
      <p className="rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-[#9aa7b2]">
        Budget estimate appears after flights, hotels, and itinerary are drafted.
      </p>
    );
  }

  const rows: Array<[string, number]> = [
    ["Flights", budget.flights],
    ["Hotels", budget.hotels],
    ["Activities", budget.activities],
    ["Local transport", budget.local_transport],
    ["Food", budget.food],
    ["Taxes & fees", budget.taxes_and_fees],
    ["Emergency buffer", budget.emergency_buffer],
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-[#121a22]/85 px-4 py-4">
        <p className="text-sm text-[#9aa7b2]">Estimated total</p>
        <p className="mt-1 font-[family-name:var(--font-fraunces)] text-3xl text-[#c9a66b]">
          {budget.currency} {budget.total}
        </p>
        <p className="mt-1 text-sm text-[#b7c0c8]">
          About {budget.currency} {budget.per_person} per person · estimate only
        </p>
      </div>
      <dl className="space-y-2">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-[#121a22]/70 px-3 py-2 text-sm"
          >
            <dt className="text-[#b7c0c8]">{label}</dt>
            <dd className="text-[#f3efe6]">
              {budget.currency} {value}
            </dd>
          </div>
        ))}
      </dl>
      <ul className="list-disc space-y-1 pl-5 text-sm text-[#9aa7b2]">
        {budget.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}
