import "server-only";

/**
 * Resolves the AI provider for all chat + image generation calls.
 *
 * Defaults to OpenAI. Set `AI_PROVIDER=openrouter` to route every call through
 * OpenRouter (which is OpenAI-compatible) using `OPENROUTER_API_KEY`.
 *
 * OpenRouter model IDs are namespaced by provider (e.g. `openai/gpt-4o-mini`).
 * We auto-prefix bare model IDs with `openai/` so existing env values keep working.
 */

const PROVIDER = (process.env.AI_PROVIDER || "openai").toLowerCase();
export const USE_OPENROUTER = PROVIDER === "openrouter";

const BASE_OPENAI = "https://api.openai.com/v1";
const BASE_OPENROUTER = "https://openrouter.ai/api/v1";

export function aiBaseUrl(): string {
  return USE_OPENROUTER ? BASE_OPENROUTER : BASE_OPENAI;
}

export function aiApiKey(): string | undefined {
  return USE_OPENROUTER ? process.env.OPENROUTER_API_KEY : process.env.OPENAI_API_KEY;
}

/** Prefix a bare model id with `openai/` when routing through OpenRouter. */
export function aiModel(model: string): string {
  if (!USE_OPENROUTER) return model;
  if (model.includes("/")) return model;
  return `openai/${model}`;
}

export function aiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const key = aiApiKey();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key ?? ""}`,
    "Content-Type": "application/json",
    ...extra,
  };
  if (USE_OPENROUTER) {
    headers["HTTP-Referer"] = process.env.APP_URL || "https://nahthatsai.com";
    headers["X-Title"] = "Nah, that's AI";
  }
  return headers;
}
