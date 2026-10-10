/**
 * Resolves the AI provider for all chat + image generation calls in the seed
 * package. Mirrors apps/web/lib/ai-provider.ts (kept separate because seed is
 * a standalone package without a dependency on the web app).
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
