import type { Client } from "@libsql/client";

/**
 * Read a boolean app setting from the app_settings table.
 * Defaults to false when the key is missing or the table doesn't exist.
 */
export async function getBoolSetting(client: Client, key: string): Promise<boolean> {
  try {
    const r = await client.execute({
      sql: "SELECT value FROM app_settings WHERE key = ? LIMIT 1",
      args: [key],
    });
    const v = r.rows[0]?.value;
    return v === "1" || String(v).toLowerCase() === "true";
  } catch {
    return false;
  }
}

export const SETTINGS = {
  AUTO_GENERATE_AI: "auto_generate_ai",
} as const;
