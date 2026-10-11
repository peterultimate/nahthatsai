import { NextResponse } from "next/server";
import { requireAdminApi, audit } from "@/lib/admin";
import { sqlClient } from "@/lib/db";
import { ids } from "@nahthatsai/db";
import { hashPassword } from "@/lib/password";
import { randomToken } from "@/lib/crypto";
import { recomputeUserStats } from "@/lib/guess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Realistic display names for demo users.
const DEMO_NAMES = [
  "Alex Chen", "Maya Patel", "Jordan Lee", "Sam Rivera", "Casey Kim",
  "Riley Morgan", "Avery Singh", "Quinn Foster", "Drew Hayes", "Sage Patel",
  "Morgan Lee", "Jamie Wong", "Taylor Brooks", "Reese Davis", "Skyler Nguyen",
  "Dakota Reyes", "Harper Stone", "Finley Cruz", "Emerson Cole", "Rowan Patel",
  "Ari Mitchell", "Kai Thompson", "Eden Clark", "Zion Walker", "Phoenix Rao",
];

// The featured top user on the leaderboard.
const TOP_USER = {
  name: "Homesh Peter Paul",
  email: "homesh@nahthatsai.example",
  // High accuracy + more guesses than everyone else so they sit at #1.
  accuracy: 0.94,
  guesses: 60,
};

// Generate a deterministic-ish password hash for demo users (password not exposed).
async function demoPassword() {
  return hashPassword(randomToken(24));
}

/**
 * Seed the leaderboard with demo users who have realistic guess histories.
 * Each user gets a random accuracy profile (40%-92%) and guesses against a
 * random subset of approved media. user_stats are recomputed afterward.
 */
export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => ({}));
  const userCount = Math.max(1, Math.min(50, Number(body.users ?? 12)));
  const guessesPerUser = Math.max(5, Math.min(80, Number(body.guessesPerUser ?? 25)));

  // Fetch approved media with their truth labels for scoring.
  const mediaRes = await sqlClient.execute({
    sql: `SELECT id, truth_label FROM media
          WHERE status = 'approved' AND truth_label IN ('ai','not_ai')
          ORDER BY RANDOM()`,
  });
  const media = mediaRes.rows as unknown as Array<{ id: string; truth_label: string }>;
  if (media.length < 5) {
    return NextResponse.json(
      { ok: false, error: "Not enough approved media to seed guesses. Need at least 5." },
      { status: 400 },
    );
  }

  const created: string[] = [];
  const password = await demoPassword();

  async function seedUser(opts: {
    name: string;
    email: string;
    accuracy: number;
    numGuesses: number;
  }): Promise<string> {
    const normalized = opts.email.toLowerCase();

    const existing = await sqlClient.execute({
      sql: "SELECT id FROM users WHERE email_normalized = ?",
      args: [normalized],
    });
    let userId: string;
    if (existing.rows.length > 0) {
      userId = existing.rows[0].id as string;
    } else {
      userId = ids.user();
      await sqlClient.execute({
        sql: `INSERT INTO users
              (id, email, email_normalized, password_hash, display_name, status, role,
               email_verified_at, created_at)
              VALUES (?, ?, ?, ?, ?, 'active', 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [userId, opts.email, normalized, password, opts.name],
      });
      await sqlClient.execute({
        sql: "INSERT OR IGNORE INTO user_stats (user_id) VALUES (?)",
        args: [userId],
      });
    }

    const count = Math.min(opts.numGuesses, media.length);
    const shuffled = [...media].sort(() => Math.random() - 0.5).slice(0, count);
    let streak = 0;

    for (const m of shuffled) {
      const dup = await sqlClient.execute({
        sql: "SELECT 1 FROM guesses WHERE media_id = ? AND user_id = ?",
        args: [m.id, userId],
      });
      if (dup.rows.length > 0) continue;

      const correct = Math.random() < opts.accuracy;
      const guess = correct ? m.truth_label : (m.truth_label === "ai" ? "not_ai" : "ai");
      const isCorrect = guess === m.truth_label ? 1 : 0;

      await sqlClient.execute({
        sql: `INSERT INTO guesses
              (id, media_id, user_id, guess, is_correct, is_scored, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, 1,
                      datetime('now', ? || ' minutes'), CURRENT_TIMESTAMP)`,
        args: [
          ids.guess(),
          m.id,
          userId,
          guess,
          isCorrect,
          `-${Math.floor(Math.random() * 20160)}`,
        ],
      });

      if (isCorrect) streak++;
      else streak = 0;
    }

    return userId;
  }

  // Seed the featured top user first with the best stats.
  created.push(await seedUser({
    name: TOP_USER.name,
    email: TOP_USER.email,
    accuracy: TOP_USER.accuracy,
    numGuesses: TOP_USER.guesses,
  }));

  // Seed the rest of the demo users with lower accuracy profiles.
  for (let i = 0; i < userCount; i++) {
    const name = DEMO_NAMES[i % DEMO_NAMES.length]!;
    const email = `demo${i + 1}@nahthatsai.example`;

    // Accuracy profile: weighted toward mid-high, but always below the top user.
    const accProfile = 0.5 + Math.random() * 0.38; // 50% - 88%
    const numGuesses = Math.min(
      guessesPerUser + Math.floor(Math.random() * 15) - 7,
      media.length,
    );

    created.push(await seedUser({
      name,
      email,
      accuracy: accProfile,
      numGuesses,
    }));
  }

  // Recompute stats for all created users.
  for (const uid of created) {
    await recomputeUserStats(uid).catch(() => {});
  }

  await audit(auth.user.id, "seed.leaderboard", "user_stats", "bulk", { userCount, guessesPerUser, topUser: TOP_USER.name });

  return NextResponse.json({
    ok: true,
    usersCreated: created.length,
    guessesPerUser,
    topUser: TOP_USER.name,
  });
}
