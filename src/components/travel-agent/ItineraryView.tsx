"use client";

import { useState } from "react";
import type { ItineraryDay, ItineraryItem } from "@/types/trip";

type ItineraryViewProps = {
  days: ItineraryDay[];
  highlightedItemId?: string | null;
  onRemoveItem: (itemId: string) => void;
  onRegenerateDay?: (date: string) => void;
  onFocusItem?: (item: ItineraryItem) => void;
};

export function ItineraryView({
  days,
  highlightedItemId,
  onRemoveItem,
  onRegenerateDay,
  onFocusItem,
}: ItineraryViewProps) {
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});

  if (!days.length) {
    return (
      <p className="rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-[#9aa7b2]">
        No itinerary yet. Once trip details are complete, Atlas will draft day-by-day plans.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {days.map((day) => {
        const open = openDays[day.date] ?? true;
        return (
          <section
            key={day.date}
            className="overflow-hidden rounded-2xl border border-white/10 bg-[#121a22]/85"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              onClick={() =>
                setOpenDays((current) => ({ ...current, [day.date]: !open }))
              }
              aria-expanded={open}
            >
              <div>
                <h3 className="text-[#f3efe6]">{day.title}</h3>
                <p className="text-sm text-[#9aa7b2]">
                  {day.city} · {day.date}
                </p>
              </div>
              <span className="text-[#c9a66b]">{open ? "−" : "+"}</span>
            </button>
            {open && (
              <div className="space-y-3 border-t border-white/10 px-4 py-4">
                <p className="text-sm text-[#b7c0c8]">{day.summary}</p>
                {day.items.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border px-3 py-3 ${
                      highlightedItemId === item.id
                        ? "border-[#c9a66b]/60 bg-[#c9a66b]/10"
                        : "border-white/10 bg-[#0b1218]/70"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.12em] text-[#8f9aa3]">
                          {item.start_time ?? "Flexible"} · {item.category}
                        </p>
                        <h4 className="mt-1 text-[#f3efe6]">{item.title}</h4>
                        {item.description && (
                          <p className="mt-1 text-sm text-[#b7c0c8]">{item.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {onFocusItem && item.latitude != null && item.longitude != null && (
                          <button
                            type="button"
                            className="text-xs text-[#c9a66b]"
                            onClick={() => onFocusItem(item)}
                          >
                            Map
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-xs text-[#d7a3a3]"
                          onClick={() => onRemoveItem(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {onRegenerateDay && (
                  <button
                    type="button"
                    onClick={() => onRegenerateDay(day.date)}
                    className="rounded-lg border border-white/15 px-3 py-2 text-sm text-[#f3efe6]"
                  >
                    Regenerate this day
                  </button>
                )}
                {day.estimated_daily_cost && (
                  <p className="text-sm text-[#9aa7b2]">
                    Estimated day cost: {day.estimated_daily_cost.currency}{" "}
                    {day.estimated_daily_cost.amount}
                  </p>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
