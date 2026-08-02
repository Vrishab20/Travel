import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export function hasLlmConfigured(): boolean {
  return Boolean(process.env.LLM_API_KEY?.trim());
}

export function getLanguageModel(): LanguageModel {
  const apiKey = process.env.LLM_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("LLM_API_KEY is not configured");
  }

  const provider = (process.env.LLM_PROVIDER ?? "openai").toLowerCase();
  const modelId = process.env.LLM_MODEL ?? "gpt-4o-mini";

  if (provider !== "openai") {
    // Provider abstraction seam — add Anthropic/Google adapters here later.
    console.warn(`LLM_PROVIDER "${provider}" is not implemented yet; using OpenAI-compatible client.`);
  }

  const openai = createOpenAI({ apiKey });
  return openai(modelId);
}
