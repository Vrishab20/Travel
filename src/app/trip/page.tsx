"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TravelAgentChat } from "@/components/travel-agent/TravelAgentChat";
import {
  localTripRepository,
  type RouteSelectionPayload,
} from "@/lib/trip/repository";

export default function TripPage() {
  const router = useRouter();
  const [selection, setSelection] = useState<RouteSelectionPayload | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localTripRepository.loadRouteSelection();
    if (!stored?.tripId || !stored?.threadId) {
      router.replace("/");
      return;
    }
    setSelection(stored);
    setReady(true);
  }, [router]);

  if (!ready || !selection) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#070b10] text-[#9aa7b2]">
        Opening travel planner…
      </div>
    );
  }

  return (
    <TravelAgentChat
      tripId={selection.tripId}
      threadId={selection.threadId}
      origin={selection.origin}
      destination={selection.destination}
    />
  );
}
