"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RouteSelectionPanel } from "@/components/RouteSelectionPanel";
import { TravelGlobe } from "@/components/TravelGlobe";
import { createTrip } from "@/lib/api/travelAgentClient";
import { localTripRepository } from "@/lib/trip/repository";
import type { SelectedCountry, SelectionStep } from "@/types/travel";

export default function HomePage() {
  const router = useRouter();
  const [origin, setOrigin] = useState<SelectedCountry | null>(null);
  const [destination, setDestination] = useState<SelectedCountry | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [continueError, setContinueError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectionStep: SelectionStep = useMemo(() => {
    if (!origin) return "origin";
    if (!destination) return "destination";
    return "complete";
  }, [origin, destination]);

  const handleSwap = useCallback(() => {
    if (!origin || !destination) return;
    setOrigin(destination);
    setDestination(origin);
  }, [origin, destination]);

  const handleReset = useCallback(() => {
    setOrigin(null);
    setDestination(null);
    setContinueError(null);
  }, []);

  const handleContinue = useCallback(() => {
    if (!origin || !destination || isPending) return;
    setContinueError(null);

    startTransition(async () => {
      try {
        const created = await createTrip({
          origin_country: origin.name,
          destination_country: destination.name,
        });

        localTripRepository.clearTrip();
        localTripRepository.saveRouteSelection({
          tripId: created.trip_id,
          threadId: created.thread_id,
          origin: {
            name: origin.name,
            isoCode: origin.isoCode,
            coordinates: origin.coordinates,
          },
          destination: {
            name: destination.name,
            isoCode: destination.isoCode,
            coordinates: destination.coordinates,
          },
        });

        router.push("/trip");
      } catch (error) {
        setContinueError(
          error instanceof Error
            ? error.message
            : "Could not start trip planning. Is the Python backend running on port 8000?",
        );
      }
    });
  }, [origin, destination, isPending, router]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#070b10] text-[#f3efe6]">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-40">
        <div className="pointer-events-auto flex items-start justify-between px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))] md:px-8 md:pt-6">
          <div>
            <p className="font-[family-name:var(--font-fraunces)] text-3xl tracking-[0.04em] text-[#f3efe6] md:text-4xl">
              Atlas
            </p>
            <p className="mt-1 text-sm text-[#9aa7b2]">Plan your next journey</p>
          </div>

          <button
            type="button"
            aria-label="Open settings menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#101820]/85 text-[#f3efe6] shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:border-[#c9a66b]/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a66b]"
          >
            <MenuIcon />
          </button>
        </div>
      </header>

      <main className="absolute inset-0">
        <TravelGlobe
          origin={origin}
          destination={destination}
          onOriginChange={setOrigin}
          onDestinationChange={setDestination}
          onMapLoadedChange={setMapLoaded}
        />
      </main>

      <RouteSelectionPanel
        origin={origin}
        destination={destination}
        selectionStep={selectionStep}
        onSwap={handleSwap}
        onReset={handleReset}
        onContinue={handleContinue}
      />

      {(continueError || isPending) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-28 z-50 flex justify-center px-4 md:bottom-32">
          <p
            className={`pointer-events-auto rounded-xl border px-4 py-2 text-sm backdrop-blur-md ${
              continueError
                ? "border-red-400/30 bg-red-950/70 text-red-100"
                : "border-white/10 bg-[#101820]/85 text-[#d7dde3]"
            }`}
            role="status"
          >
            {continueError ?? "Starting travel planner…"}
          </p>
        </div>
      )}

      <span className="sr-only" aria-live="polite">
        {mapLoaded ? "Globe ready" : "Globe loading"}
        {origin ? `, origin ${origin.name}` : ""}
        {destination ? `, destination ${destination.name}` : ""}
      </span>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3.5 5.5h11M3.5 9h11M3.5 12.5h11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
