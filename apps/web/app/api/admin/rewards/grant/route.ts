import { NextResponse } from "next/server";
import { requireAdminApi, audit } from "@/lib/admin";
import { sqlClient } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Grant power-up rewards (hints, AI scans, AI verdicts) to a user.
 *
 * Body:
 *   email  - user's email (or use userId)
 *   userId - user's id (alternative to email)
 *   hints  - number of hints to add (default 0)
 *   aiScans - number of AI scans to add (default 0)
 *   aiVerdicts - number of AI verdicts to add (default 0)
 */
export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => ({}));

  let userId: string | undefined;
  if (typeof body.userId === "string") {
    userId = body.userId;
  } else if (typeof body.email === "string") {
    const row = await sqlClient.execute({
      sql: "SELECT id FROM users WHERE email_normalized = ? LIMIT 1",
      args: [body.email.toLowerCase()],
    });
    if (row.rows.length === 0) {
      return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
    }
    userId = row.rows[0].id as string;
  } else {
    return NextResponse.json(
      { ok: false, error: "Provide either 'email' or 'userId'." },
      { status: 400 },
    );
  }
  if (!userId) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
  }

  const hints = Math.max(0, Math.min(9999, Number(body.hints ?? 0)));
  const aiScans = Math.max(0, Math.min(9999, Number(body.aiScans ?? 0)));
  const aiVerdicts = Math.max(0, Math.min(9999, Number(body.aiVerdicts ?? 0)));

  if (hints === 0 && aiScans === 0 && aiVerdicts === 0) {
    return NextResponse.json(
      { ok: false, error: "At least one of hints, aiScans, aiVerdicts must be > 0." },
      { status: 400 },
    );
  }

  await sqlClient.execute({
    sql: "INSERT OR IGNORE INTO user_powerups (user_id) VALUES (?)",
    args: [userId],
  });
  await sqlClient.execute({
    sql: `UPDATE user_powerups
          SET hints = hints + ?, ai_scans = ai_scans + ?, ai_verdicts = ai_verdicts + ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?`,
    args: [hints, aiScans, aiVerdicts, userId],
  });

  const balances = await sqlClient.execute({
    sql: "SELECT hints, ai_scans, ai_verdicts FROM user_powerups WHERE user_id = ? LIMIT 1",
    args: [userId],
  });

  await audit(auth.user.id, "rewards.grant", "user_powerups", userId, {
    hints,
    aiScans,
    aiVerdicts,
  });

  return NextResponse.json({
    ok: true,
    userId,
    granted: { hints, aiScans, aiVerdicts },
    balances: {
      hints: Number(balances.rows[0]?.hints ?? 0),
      aiScans: Number(balances.rows[0]?.ai_scans ?? 0),
      aiVerdicts: Number(balances.rows[0]?.ai_verdicts ?? 0),
    },
  });
}
