/**
 * @deprecated Agent orchestration lives in the Python FastAPI backend.
 * Kept only so unused TS provider/itinerary helpers can still typecheck during the migration.
 */
export type AgentMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};
