import type {
  CreateTripResponse,
  TravelAgentStreamEvent,
  TripResponse,
} from "@/types/trip";

function apiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_TRAVEL_API_BASE_URL?.trim();
  return (base || "http://localhost:8000").replace(/\/$/, "");
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: unknown; error?: string };
    if (typeof data.error === "string") return data.error;
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item) =>
          typeof item === "object" && item && "msg" in item
            ? String((item as { msg: string }).msg)
            : JSON.stringify(item),
        )
        .join("; ");
    }
    return response.statusText || "Request failed";
  } catch {
    return response.statusText || "Request failed";
  }
}

export async function createTrip(input: {
  origin_country: string;
  destination_country: string;
}): Promise<CreateTripResponse> {
  const response = await fetch(`${apiBaseUrl()}/api/trips`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return (await response.json()) as CreateTripResponse;
}

export async function getTrip(tripId: string): Promise<TripResponse> {
  const response = await fetch(`${apiBaseUrl()}/api/trips/${encodeURIComponent(tripId)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return (await response.json()) as TripResponse;
}

export async function resetTrip(tripId: string): Promise<TripResponse> {
  const response = await fetch(
    `${apiBaseUrl()}/api/trips/${encodeURIComponent(tripId)}/reset`,
    {
      method: "POST",
      headers: { Accept: "application/json" },
    },
  );
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return (await response.json()) as TripResponse;
}

export type StreamAgentHandlers = {
  onEvent: (event: TravelAgentStreamEvent) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
};

/**
 * POST /api/travel-agent/stream and parse SSE (`event:` + `data:` blocks).
 */
export async function streamAgentMessage(
  input: { trip_id: string; thread_id: string; message: string },
  handlers: StreamAgentHandlers,
): Promise<void> {
  const response = await fetch(`${apiBaseUrl()}/api/travel-agent/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(input),
    signal: handlers.signal,
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }
  if (!response.body) {
    throw new Error("No response body from travel-agent stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventName = "message";

  const flushBlock = (block: string) => {
    const lines = block.split("\n");
    let dataLines: string[] = [];
    let localEvent = eventName;
    for (const line of lines) {
      if (line.startsWith("event:")) {
        localEvent = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trim());
      }
    }
    if (dataLines.length === 0) return;
    const raw = dataLines.join("\n");
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const type =
        typeof parsed.type === "string" ? parsed.type : localEvent || "message";
      handlers.onEvent({ ...parsed, type } as TravelAgentStreamEvent);
    } catch (error) {
      handlers.onError?.(
        error instanceof Error ? error : new Error("Failed to parse SSE event"),
      );
    }
    eventName = "message";
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      if (part.trim()) flushBlock(part);
    }
  }
  if (buffer.trim()) flushBlock(buffer);
}
