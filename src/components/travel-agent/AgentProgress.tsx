"use client";

import type { TravelAgentStage } from "@/types/trip";

const STAGE_LABELS: Partial<Record<TravelAgentStage, string>> = {
  collecting_requirements: "Understanding your trip",
  awaiting_user_input: "Waiting for your details",
  classifying_request: "Checking required details",
  searching_flights: "Searching flights",
  searching_hotels: "Comparing hotels",
  searching_activities: "Finding activities",
  building_itinerary: "Building your itinerary",
  calculating_budget: "Estimating your budget",
  assembling_plan: "Finalizing your trip",
  ready: "Trip ready",
  refining: "Updating your plan",
  partial_failure: "Partial results available",
  error: "Something went wrong",
};

type AgentProgressProps = {
  stage?: TravelAgentStage | null;
  label?: string | null;
};

export function AgentProgress({ stage, label }: AgentProgressProps) {
  if (!stage && !label) return null;
  const text = label ?? (stage ? STAGE_LABELS[stage] : null) ?? "Working…";

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#121a22] px-3 py-1.5 text-sm text-[#b7c0c8]"
      role="status"
      aria-live="polite"
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-[#c9a66b]" />
      {text}
    </div>
  );
}
