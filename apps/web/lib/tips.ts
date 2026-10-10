import "server-only";
import { sqlClient } from "./db";

const FALLBACK_TIPS: readonly string[] = [
  "Inspect hands for irregularities; AI often struggles with realistic finger placement",
  "Check teeth; AI-generated smiles can have unnatural gaps or unrealistic shapes",
  "Examine eyes for odd pupils; AI sometimes creates mismatched or oddly shaped eyes",
  "Look closely at ears; AI may produce distorted or oddly shaped ear features",
  "Analyze hair strands; AI often groups hair unnaturally or lacks detail in strands",
  "Scan text in the image; AI-generated text often contains gibberish or misspellings",
  "Check reflections; AI-generated reflections can appear unrealistic or missing entirely",
  "Spot repeated patterns; AI sometimes generates repetitive textures in backgrounds",
  "Inspect skin texture; AI often produces skin that looks too smooth and flawless",
  "Examine lighting; inconsistent shadows can signal an AI-generated image",
  "Use the magnifier to inspect people; AI details may falter under close examination",
  "Inspect shadows for unnatural directions; AI sometimes misaligns light sources",
];

/**
 * Return a shuffled slice of active tips, capped at `count`. Always returns
 * at least the fallback set if the DB is empty or the table does not exist.
 */
export async function getActiveTips(count: number = 6): Promise<string[]> {
  try {
    const cap = Math.max(1, Math.min(12, count | 0 || 6));
    const res = await sqlClient.execute({
      sql: `SELECT text FROM tips WHERE is_active = 1 ORDER BY RANDOM() LIMIT ?`,
      args: [cap],
    });
    const rows = (res.rows?.map((r) => r.text as string).filter(Boolean) ?? []);
    if (rows.length >= cap) return rows;
    const merged = [...rows];
    const fallbackPool = [...FALLBACK_TIPS].sort(() => Math.random() - 0.5);
    for (const t of fallbackPool) {
      if (merged.includes(t)) continue;
      merged.push(t);
      if (merged.length >= cap) break;
    }
    return merged.length ? merged : [...FALLBACK_TIPS].slice(0, cap);
  } catch {
    return [...FALLBACK_TIPS].sort(() => Math.random() - 0.5).slice(0, count);
  }
}

/** A single random active game tip. Kept for backwards compatibility. */
export async function getRandomTip(): Promise<string | null> {
  const tips = await getActiveTips(1);
  return tips[0] ?? null;
}
