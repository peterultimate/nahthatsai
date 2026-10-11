"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function SponsorForm({ minUsd, loggedIn }: { minUsd: number; loggedIn: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!loggedIn) {
    return (
      <div className="notice">
        <Link href="/login">Sign in</Link> to sponsor a weekly prize.
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/sponsor/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sponsorName: fd.get("sponsorName"),
        sponsorUrl: fd.get("sponsorUrl"),
        prizeLabel: fd.get("prizeLabel"),
        message: fd.get("message"),
        amountUsd: Number(fd.get("amountUsd")),
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setBusy(false);
      setErr(data.error || "Could not start checkout.");
      return;
    }
    // Redirect to the hosted Lemon Squeezy checkout.
    window.location.href = data.checkoutUrl;
  }

  return (
    <form onSubmit={onSubmit} className="form-card" style={{ margin: "12px 0" }}>
      <div className="field">
        <label htmlFor="sponsorName">Sponsor name *</label>
        <input id="sponsorName" name="sponsorName" required maxLength={60} placeholder="Your name or brand" />
      </div>
      <div className="field">
        <label htmlFor="sponsorUrl">Link (optional)</label>
        <input id="sponsorUrl" name="sponsorUrl" type="url" placeholder="https://your-site.com" />
      </div>
      <div className="field">
        <label htmlFor="prizeLabel">Prize you&apos;re offering *</label>
        <input id="prizeLabel" name="prizeLabel" required maxLength={120} placeholder="e.g. $50 gift card, 1-year Pro plan, …" />
      </div>
      <div className="field">
        <label htmlFor="message">Short message (optional)</label>
        <input id="message" name="message" maxLength={200} placeholder="Shown with your shout-out" />
      </div>
      <div className="field">
        <label htmlFor="amountUsd">Sponsorship (USD, min ${minUsd})</label>
        <input id="amountUsd" name="amountUsd" type="number" min={minUsd} step="1" defaultValue={minUsd} required />
      </div>
      {err && <div className="form-error">{err}</div>}
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? "Starting…" : "Sponsor this week →"}
      </button>
    </form>
  );
}

export function SponsorCheckoutPoller({
  id,
  amountUsd,
  prizeLabel,
}: {
  id: string;
  amountUsd: number;
  prizeLabel: string;
}) {
  const [status, setStatus] = useState("pending");
  useEffect(() => {
    if (status === "active") return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/sponsor/status?id=${id}`);
      const data = await res.json();
      if (data.ok) {
        setStatus(data.status);
        if (data.status === "active") clearInterval(t);
      }
    }, 4000);
    return () => clearInterval(t);
  }, [id, status]);

  if (status === "active") {
    return (
      <div className="form-card container-narrow">
        <h1>Sponsorship confirmed</h1>
        <div className="form-ok">Thank you! Your prize, <strong>{prizeLabel}</strong>, is now part of this week&apos;s pack, with your shout-out on the prizes page.</div>
        <p style={{ marginTop: 16 }}><Link href="/prizes" className="btn btn-primary">See the prizes →</Link></p>
      </div>
    );
  }
  return (
    <div className="form-card container-narrow">
      <h1>Waiting for payment</h1>
      <p className="muted">
        Complete your ${amountUsd} sponsorship at the checkout. This page updates automatically once your
        payment is confirmed.
      </p>
      <div className="notice"><span className="rss-title">Checking payment status…</span><div className="muted-sm">Status: {status}. Keep this tab open after you finish paying.</div></div>
    </div>
  );
}
