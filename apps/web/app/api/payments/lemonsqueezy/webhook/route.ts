import { NextResponse } from "next/server";
import { sqlClient } from "@/lib/db";
import { verifyLemonSqueezyWebhook } from "@/lib/lemonsqueezy";
import { env } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Lemon Squeezy webhook. Verifies the X-Signature header and, on a paid
 * order_created event, marks the matching payment 'confirmed' so the next
 * status poll grants it quickly. Configure LEMONSQUEEZY_WEBHOOK_SECRET + the
 * webhook URL in the Lemon Squeezy dashboard to enable this fast path.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyLemonSqueezyWebhook({
    signature: req.headers.get("x-signature"),
    rawBody: raw,
    secret: env.lemonSqueezy.webhookSecret,
  })) {
    return NextResponse.json({ ok: false, error: "Invalid signature." }, { status: 401 });
  }

  let evt: {
    meta?: { event_name?: string };
    data?: {
      attributes?: {
        status?: string;
        custom_data?: Record<string, unknown>;
      };
    };
  };
  try {
    evt = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const eventName = evt.meta?.event_name;
  const attrs = evt.data?.attributes || {};
  const paid = attrs.status === "paid" || eventName === "order_created";
  const custom = (attrs.custom_data || {}) as Record<string, unknown>;
  const ref = (custom.payment_ref as string) || null;

  if (paid && ref) {
    await sqlClient.execute({
      sql: `UPDATE payments SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = 'pending'`,
      args: [ref],
    });
  }
  return NextResponse.json({ ok: true });
}
