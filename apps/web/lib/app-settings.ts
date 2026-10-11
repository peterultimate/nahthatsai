import "server-only";
import { sqlClient } from "./db";

/**
 * Read a boolean app setting from the app_settings table.
 * Defaults to false when the key is missing or not "1"/"true".
 */
export async function getBoolSetting(key: string): Promise<boolean> {
  try {
    const r = await sqlClient.execute({
      sql: "SELECT value FROM app_settings WHERE key = ? LIMIT 1",
      args: [key],
    });
    const v = r.rows[0]?.value;
    return v === "1" || String(v).toLowerCase() === "true";
  } catch {
    // If the table doesn't exist yet (pre-migration), default to off.
    return false;
  }
}

export async function setBoolSetting(key: string, value: boolean): Promise<void> {
  await sqlClient.execute({
    sql: `INSERT INTO app_settings (key, value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
    args: [key, value ? "1" : "0"],
  });
}

/** Well-known setting keys. */
export const SETTINGS = {
  AUTO_GENERATE_AI: "auto_generate_ai",
} as const;
