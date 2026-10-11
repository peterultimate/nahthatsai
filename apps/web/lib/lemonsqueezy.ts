import "server-only";
import crypto from "node:crypto";
import { env } from "./env";

export type LemonSqueezyCheckout = {
  id: string;
  url: string;
};

/**
 * Create a hosted Lemon Squeezy checkout. Returns the checkout id + URL the
 * buyer is redirected to. Pass customPriceCents only for "pay what you want"
 * variants (e.g. prize sponsorships).
 */
export async function createLemonSqueezyCheckout(args: {
  variantId: string;
  customPriceCents?: number;
  email?: string;
  custom?: Record<string, string>;
  redirectUrl?: string;
}): Promise<{ ok: true; checkout: LemonSqueezyCheckout } | { ok: false; error: string }> {
  if (!env.paymentsConfigured) {
    return { ok: false, error: "Payments are not configured on this server." };
  }
  if (!args.variantId) {
    return { ok: false, error: "No product variant configured for this item." };
  }
  try {
    const attributes: Record<string, unknown> = {
      checkout_data: {
        email: args.email,
        custom: args.custom,
      },
    };
    if (args.customPriceCents) {
      attributes.custom_price = args.customPriceCents;
    }
    if (args.redirectUrl) {
      attributes.product_options = { redirect_url: args.redirectUrl };
    }
    const res = await fetch(`${env.lemonSqueezy.baseUrl}/checkouts`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${env.lemonSqueezy.apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes,
          relationships: {
            store: { data: { type: "stores", id: env.lemonSqueezy.storeId } },
            variant: { data: { type: "variants", id: args.variantId } },
          },
        },
      }),
    });
    const data = (await res.json()) as {
      data?: { id?: string; attributes?: { url?: string } };
      errors?: Array<{ detail?: string }>;
    };
    if (!res.ok || !data.data?.attributes?.url) {
      const detail = data.errors?.[0]?.detail;
      return { ok: false, error: detail || `Lemon Squeezy error (${res.status}).` };
    }
    return {
      ok: true,
      checkout: { id: data.data.id as string, url: data.data.attributes.url as string },
    };
  } catch (err) {
    console.error(`[lemonsqueezy] create checkout failed:`, (err as Error).message);
    return { ok: false, error: (err as Error).message };
  }
}

/** Fetch a checkout by id to poll its status (paid/expired/pending). */
export async function getLemonSqueezyCheckout(
  id: string,
): Promise<{ status: string } | null> {
  if (!env.paymentsConfigured) return null;
  try {
    const res = await fetch(`${env.lemonSqueezy.baseUrl}/checkouts/${id}`, {
      headers: {
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${env.lemonSqueezy.apiKey}`,
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      data?: { attributes?: { status?: string } };
    };
    return { status: data.data?.attributes?.status || "pending" };
  } catch {
    return null;
  }
}

/** Verify the X-Signature header of an incoming Lemon Squeezy webhook. */
export function verifyLemonSqueezyWebhook(args: {
  signature: string | null;
  rawBody: string;
  secret: string;
}): boolean {
  if (!args.signature || !args.secret) return false;
  const hmac = crypto.createHmac("sha256", args.secret).update(args.rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(args.signature));
  } catch {
    return false;
  }
}

/** Lemon Squeezy checkout statuses that mean the order has been paid. */
export function isCheckoutPaid(status: string | undefined): boolean {
  return status === "paid";
}
