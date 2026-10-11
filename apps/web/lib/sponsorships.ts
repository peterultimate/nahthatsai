import "server-only";
import { sqlClient } from "./db";
import { newId } from "@nahthatsai/db";
import { env } from "./env";
import { createLemonSqueezyCheckout, getLemonSqueezyCheckout, isCheckoutPaid } from "./lemonsqueezy";
import { currentWeekStart } from "./prizes";
import { sendEmail } from "./email";
import { escapeHtml } from "./html";
import { normalizeSponsorUrl } from "./sponsor-url";
import { MIN_SPONSOR_USD, normalizeSponsorAmountUsd } from "./sponsor-amount";

export { MIN_SPONSOR_USD };

export type Sponsorship = {
  id: string;
  sponsorName: string;
  sponsorUrl: string | null;
  prizeLabel: string;
  message: string | null;
  amountUsd: number;
  blockchain: string | null;
  paymentAddress: string | null;
  cryptoAmount: string | null;
  status: string;
  periodStart: string;
};

function rowToSponsorship(r: Record<string, unknown>): Sponsorship {
  return {
    id: r.id as string,
    sponsorName: r.sponsor_name as string,
    sponsorUrl: (r.sponsor_url as string) ?? null,
    prizeLabel: r.prize_label as string,
    message: (r.message as string) ?? null,
    amountUsd: Number(r.amount_usd),
    blockchain: (r.blockchain as string) ?? null,
    paymentAddress: (r.payment_address as string) ?? null,
    cryptoAmount: (r.crypto_amount as string) ?? null,
    status: r.status as string,
    periodStart: r.period_start as string,
  };
}

export type CreateSponsorInput = {
  userId: string | null;
  sponsorName: string;
  sponsorUrl?: string | null;
  prizeLabel: string;
  message?: string | null;
  amountUsd: unknown;
};

export async function createSponsorship(
  input: CreateSponsorInput,
): Promise<{ ok: true; id: string; checkoutUrl: string } | { ok: false; error: string }> {
  if (!env.paymentsConfigured) return { ok: false, error: "Payments are not configured." };
  const name = input.sponsorName.trim().slice(0, 60);
  const prize = input.prizeLabel.trim().slice(0, 120);
  if (!name) return { ok: false, error: "Sponsor name is required." };
  if (!prize) return { ok: false, error: "Describe the prize you're offering." };
  const sponsorUrl = normalizeSponsorUrl(input.sponsorUrl);
  if (!sponsorUrl.ok) return sponsorUrl;
  const sponsorAmount = normalizeSponsorAmountUsd(input.amountUsd);
  if (!sponsorAmount.ok) return sponsorAmount;
  const amount = sponsorAmount.amount;

  const id = newId("spo");
  const period = currentWeekStart();
  const created = await createLemonSqueezyCheckout({
    variantId: env.lemonSqueezy.variants.sponsor,
    customPriceCents: Math.round(amount * 100),
    custom: { purpose: "prize_sponsorship", sponsorship_id: id, app: "nahthatsai.com" },
    redirectUrl: `${env.appUrl}/sponsor/checkout/${id}`,
  });
  if (!created.ok) return { ok: false, error: created.error };
  const checkout = created.checkout;

  await sqlClient.execute({
    sql: `INSERT INTO prize_sponsorships
      (id, user_id, sponsor_name, sponsor_url, prize_label, message, amount_usd, blockchain,
       coinpay_payment_id, payment_address, crypto_amount, status, period_start)
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, NULL, NULL, 'pending', ?)`,
    args: [
      id, input.userId, name, sponsorUrl.url, prize, input.message?.trim()?.slice(0, 200) || null,
      amount, checkout.id, period,
    ],
  });
  return { ok: true, id, checkoutUrl: checkout.url };
}

export async function getSponsorship(id: string, userId?: string): Promise<Sponsorship | null> {
  const r = await sqlClient.execute({
    sql: userId
      ? "SELECT * FROM prize_sponsorships WHERE id = ? AND user_id = ? LIMIT 1"
      : "SELECT * FROM prize_sponsorships WHERE id = ? LIMIT 1",
    args: userId ? [id, userId] : [id],
  });
  return r.rows[0] ? rowToSponsorship(r.rows[0] as Record<string, unknown>) : null;
}

/** Poll Lemon Squeezy; activate the sponsorship on payment (idempotent). */
export async function checkSponsorship(id: string, userId?: string): Promise<{ status: string } | null> {
  const r = await sqlClient.execute({
    sql: userId
      ? "SELECT id, status, coinpay_payment_id, sponsor_name, prize_label, amount_usd FROM prize_sponsorships WHERE id = ? AND user_id = ? LIMIT 1"
      : "SELECT id, status, coinpay_payment_id, sponsor_name, prize_label, amount_usd FROM prize_sponsorships WHERE id = ? LIMIT 1",
    args: userId ? [id, userId] : [id],
  });
  const row = r.rows[0];
  if (!row) return null;
  if (row.status === "active" || row.status === "fulfilled") return { status: "active" };

  const ls = await getLemonSqueezyCheckout(row.coinpay_payment_id as string);
  if (!ls || !isCheckoutPaid(ls.status)) return { status: ls?.status || "pending" };

  const flip = await sqlClient.execute({
    sql: "UPDATE prize_sponsorships SET status = 'active', paid_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'",
    args: [id],
  });
  if (flip.rowsAffected > 0) {
    const sponsorNameHtml = escapeHtml(row.sponsor_name as string);
    const prizeLabelHtml = escapeHtml(row.prize_label as string);
    for (const admin of env.adminEmails) {
      await sendEmail({
        to: admin,
        subject: "New prize sponsorship on Nah, that's AI",
        html: `<p><strong>${sponsorNameHtml}</strong> sponsored this week's prize: <strong>${prizeLabelHtml}</strong> ($${Number(row.amount_usd)}).</p>`,
        text: `${row.sponsor_name} sponsored: ${row.prize_label} ($${Number(row.amount_usd)}).`,
      }).catch(() => {});
    }
  }
  return { status: "active" };
}

/** Active sponsorships for the current (being-played) week — shown on /prizes. */
export async function getCurrentSponsors(): Promise<Sponsorship[]> {
  const r = await sqlClient.execute({
    sql: "SELECT * FROM prize_sponsorships WHERE period_start = ? AND status IN ('active','fulfilled') ORDER BY created_at ASC",
    args: [currentWeekStart()],
  });
  return r.rows.map((row) => rowToSponsorship(row as Record<string, unknown>));
}
