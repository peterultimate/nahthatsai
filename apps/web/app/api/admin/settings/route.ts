import { NextResponse } from "next/server";
import { requireAdminApi, audit } from "@/lib/admin";
import { getBoolSetting, setBoolSetting, SETTINGS } from "@/lib/app-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET  /api/admin/settings  -> returns the current auto_generate_ai value.
 * POST /api/admin/settings  -> body { autoGenerateAi: boolean } toggles it.
 */
export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const autoGenerateAi = await getBoolSetting(SETTINGS.AUTO_GENERATE_AI);
  return NextResponse.json({ ok: true, autoGenerateAi });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => ({}));
  const autoGenerateAi = body.autoGenerateAi === true;

  await setBoolSetting(SETTINGS.AUTO_GENERATE_AI, autoGenerateAi);
  await audit(auth.user.id, "settings.update", "app_settings", SETTINGS.AUTO_GENERATE_AI, {
    autoGenerateAi,
  });

  return NextResponse.json({ ok: true, autoGenerateAi });
}
