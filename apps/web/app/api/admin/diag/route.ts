import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { sqlClient } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Temporary diagnostic: inspect media pool by seed_source, status, truth_label. */
export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const bySourceStatus = await sqlClient.execute({
    sql: `SELECT seed_source, source_provider, status, truth_label, COUNT(*) AS n
          FROM media
          GROUP BY seed_source, source_provider, status, truth_label
          ORDER BY seed_source, status, truth_label`,
  });

  const recentAi = await sqlClient.execute({
    sql: `SELECT id, slug, title, status, truth_label, seed_source, source_provider,
                 media_url, created_at
          FROM media
          WHERE seed_source = 'openai' OR source_provider = 'openai'
          ORDER BY created_at DESC
          LIMIT 80`,
  });

  const hiddenAi = await sqlClient.execute({
    sql: `SELECT id, slug, title, status, truth_label, media_url, created_at
          FROM media
          WHERE truth_label = 'ai' AND status != 'approved'
          ORDER BY created_at DESC
          LIMIT 80`,
  });

  const poolBalance = await sqlClient.execute({
    sql: `SELECT truth_label, status, COUNT(*) AS n
          FROM media
          GROUP BY truth_label, status
          ORDER BY truth_label, status`,
  });

  return NextResponse.json({
    ok: true,
    bySourceStatus: bySourceStatus.rows,
    recentAi: recentAi.rows,
    hiddenAi: hiddenAi.rows,
    poolBalance: poolBalance.rows,
  });
}
