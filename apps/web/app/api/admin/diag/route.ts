import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { sqlClient } from "@/lib/db";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { mediaStorageDir } from "@nahthatsai/seed";

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

  const tsStats = await sqlClient.execute({
    sql: `SELECT seed_source, truth_label,
                 COUNT(*) AS n,
                 MIN(created_at) AS earliest,
                 MAX(created_at) AS latest
          FROM media
          GROUP BY seed_source, truth_label
          ORDER BY seed_source, truth_label`,
  });

  const unsplashSample = await sqlClient.execute({
    sql: `SELECT id, slug, title, status, truth_label, media_url, created_at
          FROM media
          WHERE seed_source = 'unsplash'
          ORDER BY created_at DESC
          LIMIT 10`,
  });

  // List files in the local media pool to see if AI images survived the DB reset.
  let mediaFiles: Array<{ name: string; size: number; mtime: string }> = [];
  let mediaDir = "";
  try {
    mediaDir = mediaStorageDir();
    const poolDir = join(mediaDir, "pool");
    const entries = await readdir(poolDir);
    for (const name of entries) {
      try {
        const s = await stat(join(poolDir, name));
        if (s.isFile()) {
          mediaFiles.push({ name, size: s.size, mtime: s.mtime.toISOString() });
        }
      } catch { /* skip */ }
    }
    mediaFiles.sort((a, b) => b.mtime.localeCompare(a.mtime));
  } catch (e) {
    mediaFiles = [{ name: `error: ${(e as Error).message}`, size: 0, mtime: "" }];
  }

  return NextResponse.json({
    ok: true,
    bySourceStatus: bySourceStatus.rows,
    recentAi: recentAi.rows,
    hiddenAi: hiddenAi.rows,
    poolBalance: poolBalance.rows,
    tsStats: tsStats.rows,
    unsplashSample: unsplashSample.rows,
    mediaDir,
    mediaFilesCount: mediaFiles.length,
    mediaFiles: mediaFiles.slice(0, 100),
  });
}
