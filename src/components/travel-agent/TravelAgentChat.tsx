"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { streamAgentMessage } from "@/lib/api/travelAgentClient";
import { localTripRepository } from "@/lib/trip/repository";
import {
  emptyTripPlan,
  emptyTripPreferences,
  type ChatMessage as ChatMessageType,
  type MapFocusEvent,
  type TravelAgentStage,
  type TripPlan,
  type TripPreferences,
  type TripWorkspaceTab,
} from "@/types/trip";
import type { SelectedCountry } from "@/types/travel";
import { AgentProgress } from "./AgentProgress";
import { BudgetSummary } from "./BudgetSummary";
import { ChatMessage } from "./ChatMessage";
import { FlightRecommendations } from "./FlightRecommendations";
import { HotelRecommendations } from "./HotelRecommendations";
import { ItineraryView } from "./ItineraryView";
import { TripMap } from "./TripMap";
import { TripPreferencesForm } from "./TripPreferencesForm";
import { TripSummary } from "./TripSummary";

type TravelAgentChatProps = {
  tripId: string;
  threadId: string;
  origin: SelectedCountry;
  destination: SelectedCountry;
};

const TABS: Array<{ id: TripWorkspaceTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "flights", label: "Flights" },
  { id: "hotels", label: "Hotels" },
  { id: "itinerary", label: "Itinerary" },
  { id: "budget", label: "Budget" },
  { id: "map", label: "Map" },
];

export function TravelAgentChat({
  tripId,
  threadId,
  origin,
  destination,
}: TravelAgentChatProps) {
  const [trip, setTrip] = useState<TripPlan>(() =>
    emptyTripPlan(emptyTripPreferences(origin.name, destination.name), tripId),
  );
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [tab, setTab] = useState<TripWorkspaceTab>("overview");
  const [mobileWorkspaceOpen, setMobileWorkspaceOpen] = useState(false);
  const [input, setInput] = useState("");
  const [focus, setFocus] = useState<MapFocusEvent | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [stage, setStage] = useState<TravelAgentStage | null>("collecting_requirements");
  const [stageLabel, setStageLabel] = useState<string | null>("Understanding your trip");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bootstrapped = useRef(false);

  useEffect(() => {
    localTripRepository.saveTrip(trip);
  }, [trip]);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const greeting = [
      `Great choice. Planning **${origin.name} → ${destination.name}**.`,
      "",
      "To build your trip, I need a few details:",
      "- Which city are you departing from?",
      `- Which cities in ${destination.name} would you like to visit?`,
      "- What are your travel dates?",
      "- How many travellers are going?",
      "",
      "Optional details like budget and interests improve recommendations.",
      "",
      "_Powered by the Python LangGraph travel agent (mock providers by default)._",
    ].join("\n");

    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: greeting,
      },
    ]);
  }, [origin.name, destination.name]);

  const submitText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isBusy) return;

      setInput("");
      setError(null);
      setIsBusy(true);
      setStage("collecting_requirements");
      setStageLabel("Understanding your trip");

      const userMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      };
      const assistantId = crypto.randomUUID();
      setMessages((current) => [
        ...current,
        userMessage,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamAgentMessage(
          { trip_id: tripId, thread_id: threadId, message: trimmed },
          {
            signal: controller.signal,
            onEvent: (event) => {
              switch (event.type) {
                case "assistant_token":
                  setMessages((current) =>
                    current.map((message) =>
                      message.id === assistantId
                        ? { ...message, content: message.content + event.content }
                        : message,
                    ),
                  );
                  break;
                case "stage_changed":
                  setStage(event.stage);
                  setStageLabel(event.label);
                  break;
                case "trip_plan_updated":
                  setTrip(event.trip_plan);
                  break;
                case "graph_completed":
                  setStage(event.stage);
                  setStageLabel(
                    event.stage === "ready" ? "Trip ready" : event.stage.replaceAll("_", " "),
                  );
                  break;
                case "error":
                  setError(event.message);
                  break;
                default:
                  break;
              }
            },
          },
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(
          err instanceof Error
            ? err.message
            : "Could not reach the travel-agent backend.",
        );
      } finally {
        setIsBusy(false);
        setMessages((current) => {
          const last = current.find((message) => message.id === assistantId);
          if (last && !last.content.trim() && !error) {
            return current.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    content:
                      "I finished processing that request. Check the trip workspace for updates.",
                  }
                : message,
            );
          }
          return current;
        });
      }
    },
    [error, isBusy, threadId, tripId],
  );

  const suggestedReplies = useMemo(() => {
    if (trip.status === "ready" || trip.status === "partial") {
      return [
        { id: "cheaper", label: "Cheaper flight", message: "Find a cheaper flight." },
        { id: "direct", label: "Direct only", message: "Only show direct flights." },
        { id: "relax", label: "Relax day 3", message: "Make day three more relaxed." },
        { id: "veg", label: "Vegetarian", message: "Make the trip vegetarian friendly." },
      ];
    }
    return [
      {
        id: "sample",
        label: "Use sample details",
        message: sampleDetailsMessage(origin, destination),
      },
      {
        id: "budget",
        label: "Budget trip",
        message: "I prefer a budget trip with food and walking.",
      },
    ];
  }, [trip.status, origin, destination]);

  const applyPreferenceUpdates = async (updates: Partial<TripPreferences>) => {
    const lines = [
      "Here are my trip details:",
      updates.origin_city ? `Origin city: ${updates.origin_city}` : null,
      updates.destination_cities?.length
        ? `Destination cities: ${updates.destination_cities.join(", ")}`
        : null,
      updates.departure_date ? `Departure: ${updates.departure_date}` : null,
      updates.return_date ? `Return: ${updates.return_date}` : null,
      updates.travellers ? `Adults: ${updates.travellers.adults}` : null,
      updates.budget
        ? `Budget: ${updates.budget.currency} ${updates.budget.amount}`
        : null,
      updates.travel_style ? `Style: ${updates.travel_style}` : null,
      updates.interests?.length ? `Interests: ${updates.interests.join(", ")}` : null,
    ].filter(Boolean);
    await submitText(lines.join("\n"));
  };

  const workspace = (
    <div className="flex h-full flex-col">
      <div className="flex gap-2 overflow-x-auto border-b border-white/10 px-3 py-3">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition ${
              tab === item.id
                ? "bg-[#c9a66b] text-[#12100c]"
                : "border border-white/10 text-[#d7dde3] hover:bg-white/5"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "overview" && <TripSummary trip={trip} />}
        {tab === "flights" && (
          <FlightRecommendations
            flights={trip.flights}
            selectedFlightId={trip.selected_flight_id}
            onSelect={(flightId) =>
              setTrip((current) => ({
                ...current,
                selected_flight_id: flightId,
                updated_at: new Date().toISOString(),
              }))
            }
          />
        )}
        {tab === "hotels" && (
          <HotelRecommendations
            hotels={trip.hotels}
            selectedHotelIds={trip.selected_hotel_ids}
            onSelect={(hotelId) =>
              setTrip((current) => ({
                ...current,
                selected_hotel_ids: [hotelId],
                updated_at: new Date().toISOString(),
              }))
            }
            onFocus={(hotel) => {
              if (hotel.latitude == null || hotel.longitude == null) return;
              setFocus({
                latitude: hotel.latitude,
                longitude: hotel.longitude,
                label: hotel.name,
                itemId: hotel.id,
              });
              setTab("map");
            }}
          />
        )}
        {tab === "itinerary" && (
          <ItineraryView
            days={trip.itinerary}
            highlightedItemId={highlightedItemId}
            onRemoveItem={(itemId) =>
              setTrip((current) => ({
                ...current,
                itinerary: current.itinerary.map((day) => ({
                  ...day,
                  items: day.items.filter((item) => item.id !== itemId),
                })),
                updated_at: new Date().toISOString(),
              }))
            }
            onRegenerateDay={(date) =>
              void submitText(`Please regenerate the itinerary for ${date}.`)
            }
            onFocusItem={(item) => {
              if (item.latitude == null || item.longitude == null) return;
              setHighlightedItemId(item.id);
              setFocus({
                latitude: item.latitude,
                longitude: item.longitude,
                label: item.title,
                itemId: item.id,
              });
              setTab("map");
            }}
          />
        )}
        {tab === "budget" && <BudgetSummary budget={trip.budget} />}
        {tab === "map" && (
          <div className="h-[min(60vh,520px)]">
            <TripMap
              trip={trip}
              origin={origin}
              destination={destination}
              focus={focus}
              onMarkerSelect={(itemId) => {
                setHighlightedItemId(itemId ?? null);
                if (itemId) setTab("itinerary");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh flex-col bg-[#070b10] text-[#f3efe6] md:flex-row">
      <section className="flex min-h-0 flex-1 flex-col border-white/10 md:border-r">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <p className="font-[family-name:var(--font-fraunces)] text-xl">Atlas</p>
            <p className="text-sm text-[#9aa7b2]">
              {origin.name} → {destination.name}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-white/15 px-3 py-2 text-sm md:hidden"
              onClick={() => setMobileWorkspaceOpen(true)}
            >
              Trip plan
            </button>
            <a
              href="/"
              className="rounded-lg border border-white/15 px-3 py-2 text-sm text-[#f3efe6]"
            >
              New trip
            </a>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isBusy && <AgentProgress stage={stage} label={stageLabel} />}
          {error && (
            <p className="rounded-xl border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-100">
              {error}
            </p>
          )}
          <TripPreferencesForm
            preferences={trip.preferences}
            onSubmit={(updates) => void applyPreferenceUpdates(updates)}
          />
        </div>

        <div className="border-t border-white/10 px-4 py-3">
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestedReplies.map((reply) => (
              <button
                key={reply.id}
                type="button"
                disabled={isBusy}
                onClick={() => void submitText(reply.message)}
                className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#d7dde3] hover:border-[#c9a66b]/45 disabled:opacity-40"
              >
                {reply.label}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void submitText(input);
            }}
          >
            <label className="sr-only" htmlFor="agent-input">
              Message Atlas
            </label>
            <input
              id="agent-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask Atlas to refine your trip…"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#121a22] px-3 py-3 text-sm text-[#f3efe6] outline-none focus:border-[#c9a66b]/45"
              disabled={isBusy}
            />
            <button
              type="submit"
              disabled={isBusy || !input.trim()}
              className="rounded-xl bg-[#c9a66b] px-4 py-3 text-sm font-medium text-[#12100c] disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      </section>

      <aside className="hidden min-h-0 w-[48%] md:flex md:flex-col">{workspace}</aside>

      {mobileWorkspaceOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#070b10] md:hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="font-[family-name:var(--font-fraunces)] text-lg">Trip workspace</p>
            <button
              type="button"
              className="rounded-lg border border-white/15 px-3 py-2 text-sm"
              onClick={() => setMobileWorkspaceOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1">{workspace}</div>
        </div>
      )}
    </div>
  );
}

function sampleDetailsMessage(origin: SelectedCountry, destination: SelectedCountry) {
  const start = new Date();
  start.setDate(start.getDate() + 21);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const toIso = (date: Date) => date.toISOString().slice(0, 10);
  return [
    `Departing from a major city in ${origin.name}.`,
    `Visit the capital region in ${destination.name}.`,
    `Departure ${toIso(start)} return ${toIso(end)}.`,
    "2 adults.",
    "Budget around 3500 USD.",
    "Balanced trip with food and museums.",
  ].join(" ");
}
