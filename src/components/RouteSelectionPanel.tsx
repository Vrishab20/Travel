"use client";

import type { SelectedCountry, SelectionStep } from "@/types/travel";

type RouteSelectionPanelProps = {
  origin: SelectedCountry | null;
  destination: SelectedCountry | null;
  selectionStep: SelectionStep;
  onSwap: () => void;
  onReset: () => void;
  onContinue: () => void;
};

const INSTRUCTIONS: Record<SelectionStep, string> = {
  origin: "Select your starting country",
  destination: "Now select your destination",
  complete: "Route selected. Choose a different country to start a new route",
};

export function RouteSelectionPanel({
  origin,
  destination,
  selectionStep,
  onSwap,
  onReset,
  onContinue,
}: RouteSelectionPanelProps) {
  const canContinue = Boolean(origin && destination);
  const canSwap = Boolean(origin && destination);

  return (
    <aside
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 md:inset-x-auto md:bottom-8 md:left-8 md:w-[380px]"
      aria-label="Route selection"
    >
      <div className="rounded-t-2xl border border-white/12 bg-[#0b1218]/92 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl md:rounded-2xl md:pb-5 md:shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 md:hidden" aria-hidden="true" />

        <div className="mb-4">
          <p className="font-[family-name:var(--font-fraunces)] text-lg tracking-wide text-[#f3efe6]">
            Your journey
          </p>
          <p className="mt-1 text-sm text-[#b7c0c8]" role="status" aria-live="polite">
            {INSTRUCTIONS[selectionStep]}
          </p>
        </div>

        <div className="space-y-3">
          <Field label="From" value={origin?.name} placeholder="Select origin" />
          <Field label="To" value={destination?.name} placeholder="Select destination" />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSwap}
            disabled={!canSwap}
            aria-label="Swap origin and destination"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#f3efe6] transition hover:border-[#c9a66b]/45 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a66b] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SwapIcon />
            Swap
          </button>

          <button
            type="button"
            onClick={onReset}
            aria-label="Reset selected route"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#f3efe6] transition hover:border-[#c9a66b]/45 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a66b]"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            aria-label="Continue with selected route"
            className="ml-auto inline-flex items-center rounded-lg bg-[#c9a66b] px-4 py-2 text-sm font-medium text-[#12100c] transition hover:bg-[#d8b87d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a66b] disabled:cursor-not-allowed disabled:bg-[#c9a66b]/35 disabled:text-[#12100c]/50"
          >
            Continue
          </button>
        </div>
      </div>
    </aside>
  );
}

function Field({
  label,
  value,
  placeholder,
}: {
  label: string;
  value?: string;
  placeholder: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#121a22]/75 px-3.5 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[#8f9aa3]">{label}</p>
      <p className={`mt-1 text-base ${value ? "text-[#f3efe6]" : "text-[#6f7b85]"}`}>
        {value || placeholder}
      </p>
    </div>
  );
}

function SwapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M4 3.5H11.5M11.5 3.5 9.5 1.5M11.5 3.5 9.5 5.5M10 10.5H2.5M2.5 10.5 4.5 8.5M2.5 10.5 4.5 12.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
