import { NextResponse } from "next/server";
import "server-only";
import { sqlClient } from "@/lib/db";
import { ids } from "@nahthatsai/db";
import { createSession } from "@/lib/session";
import { hashPassword } from "@/lib/password";
import { randomToken } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { hashIp } from "@/lib/crypto";
import { env, isAdminEmail } from "@/lib/env";

export const runtime = "nodejs";

// Opt-in feature gate. Demo login MUST NOT be enabled by default in production.
const DEMO_ENABLED =
  env.nodeEnv === "development" ||
  /^(1|true|yes|on)$/i.test(process.env.ENABLE_DEMO_LOGIN || "");

const DEMO_ADMIN_EMAIL = "admin@nahthatsai.com";
const DEMO_USER_EMAIL = "user@nahthatsai.com";
const VALID_ROLES = ["admin", "user"] as const;
type DemoRole = (typeof VALID_ROLES)[number];

function mapRole(roleRaw: unknown): DemoRole | null {
  const v = String(roleRaw || "").trim().toLowerCase();
  if ((VALID_ROLES as readonly string[]).includes(v)) return v as DemoRole;
  return null;
}

async function ensureDemoUser(role: DemoRole): Promise<{ userId: string; verified: boolean }> {
  const email = role === "admin" ? DEMO_ADMIN_EMAIL : DEMO_USER_EMAIL;
  const normalized = email.toLowerCase();
  const explicitRole: "admin" | "user" = role === "admin" ? "admin" : "user";

  const existing = await sqlClient.execute({
    sql: `SELECT id, status, email_verified_at
          FROM users WHERE email_normalized = ? LIMIT 1`,
    args: [normalized],
  });
  const row = existing.rows[0];

  if (row) {
    // Guard: if the stored role on a pre-existing row is not what was requested,
    // upgrade/downgrade silently for this controlled demo pair so the demo keeps
    // working even if ADMIN_EMAILS was later configured differently.
    await sqlClient.execute({
      sql: `UPDATE users
            SET role = ?, last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP,
                status = CASE WHEN status = 'pending_email_verification' THEN 'active' ELSE status END,
                email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP)
            WHERE id = ?`,
      args: [explicitRole, row.id as string],
    });
    await sqlClient.execute({
      sql: "INSERT OR IGNORE INTO user_stats (user_id) VALUES (?)",
      args: [row.id as string],
    });
    return { userId: row.id as string, verified: true };
  }

  const userId = ids.user();
  const displayName = role === "admin" ? "Demo Admin" : "Demo User";
  // Auto-generated password — never exposed anywhere. The only way to sign into
  // a demo account is through this route; the regular password form cannot be
  // used because the random password is not disclosed.
  const password = await hashPassword(randomToken(32));

  await sqlClient.execute({
    sql: `INSERT INTO users (id, email, email_normalized, password_hash, display_name, status, role, email_verified_at, created_at)
          VALUES (?, ?, ?, ?, ?, 'active', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    args: [userId, email, normalized, password, displayName, explicitRole],
  });
  await sqlClient.execute({
    sql: "INSERT OR IGNORE INTO user_stats (user_id) VALUES (?)",
    args: [userId],
  });

  return { userId, verified: true };
}

export async function POST(req: Request) {
  if (!DEMO_ENABLED) {
    return NextResponse.json(
      { ok: false, error: "Demo login is not enabled on this instance." },
      { status: 403 },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  const rl = await rateLimit(`demo-login:${hashIp(ip)}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Try again soon." },
      { status: 429 },
    );
  }

  let body: { role?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
  }

  const role = mapRole(body.role);
  if (!role) {
    return NextResponse.json(
      { ok: false, error: "Invalid role. Expected 'admin' or 'user'." },
      { status: 400 },
    );
  }

  // Safety net: if admin demo is enabled but the demo admin email is not in the
  // configured ADMIN_EMAILS allowlist for this env, still set role=admin on the
  // row (upserted above). Fallback: ensure env.adminEmails includes it so any
  // subsequent signup() calls would also grant admin access.
  if (role === "admin" && !isAdminEmail(DEMO_ADMIN_EMAIL)) {
    // No-op here — ensureDemoUser above sets the role explicitly regardless of
    // env.adminEmails. This comment documents the intent.
  }

  const { userId, verified } = await ensureDemoUser(role);
  await createSession(userId);
  return NextResponse.json({ ok: true, verified, role });
}
