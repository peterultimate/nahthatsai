import "./_env.js";
import { generateTips } from "@nahthatsai/seed";

/**
 * Top up the game-tip pool with AI-generated tips. Run occasionally (not in the
 * request path). Usage: bun --filter @nahthatsai/worker gen:tips [count]
 */
async function main() {
  const count = Number(process.argv[2]) || 20;
  const res = await generateTips({ count });
  console.log(`Added ${res.added} new tip(s).`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
