"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CopyButton } from "./CopyButton";
import { paymentSuccessContent } from "@/lib/payment-success";

export function BuyButton({
  purpose,
  priceUsd,
  label,
}: {
  purpose: "api_access" | "lifetime_membership" | "play_pass";
  priceUsd: number;
  label: string;
}) {
  const router = useRouter();
  const [promo, setPromo] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function buy() {
    setBusy(true);
    setErr(null);
    setOk(null);
    const res = await fetch("/api/payments/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose, promoCode: promo.trim() || undefined }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setBusy(false);
      setErr(data.error || "Could not start checkout.");
      return;
    }
    // 100%-off comp: granted instantly, no payment.
    if (data.granted) {
      setOk("Unlocked, thank you!");
      setTimeout(() => router.refresh(), 800);
      return;
    }
    // Redirect to the hosted Lemon Squeezy checkout.
    window.location.href = data.checkoutUrl;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={promo}
          onChange={(e) => setPromo(e.target.value.toUpperCase())}
          placeholder="PROMO CODE (optional)"
          aria-label="Promo code"
          style={{ background: "var(--panel-alt)", border: "1px solid var(--border-3)", borderRadius: 10, padding: "10px 12px", color: "var(--text)", letterSpacing: "0.06em", textTransform: "uppercase", width: 190 }}
        />
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={buy} disabled={busy}>
          {busy ? "Starting…" : `${label}: $${priceUsd}`}
        </button>
        {promo.trim() && <span className="muted-sm">a valid code discounts this at checkout</span>}
      </div>
      {err && <span className="form-error">{err}</span>}
      {ok && <span className="form-ok">{ok}</span>}
    </div>
  );
}

export function CheckoutPoller({
  paymentId,
  purpose,
  amountUsd,
}: {
  paymentId: string;
  purpose: string;
  amountUsd: number;
}) {
  const [status, setStatus] = useState("pending");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const success = paymentSuccessContent(purpose);

  useEffect(() => {
    if (status === "granted") return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/payments/status?id=${paymentId}`);
      const data = await res.json();
      if (data.ok) {
        setStatus(data.status);
        if (data.apiKey) setApiKey(data.apiKey);
        if (data.status === "granted") clearInterval(t);
      }
    }, 4000);
    return () => clearInterval(t);
  }, [paymentId, status]);

  if (status === "granted") {
    return (
      <div className="form-card container-narrow">
        <h1>Payment confirmed</h1>
        {purpose === "api_access" && apiKey ? (
          <>
            <div className="form-ok">API access granted. Here&apos;s your API key. Copy it now, it won&apos;t be shown again:</div>
            <div className="field">
              <input readOnly value={apiKey} style={{ fontFamily: "monospace" }} />
            </div>
            <CopyButton text={apiKey} label="Copy API key" />
          </>
        ) : (
          <div className="form-ok">{success.message}</div>
        )}
        <p style={{ marginTop: 16 }}>
          <Link href={success.primaryHref} className="btn btn-primary">{success.primaryLabel}</Link>
          {success.showApiDocs && <> · <Link href="/api">API docs</Link></>}
        </p>
      </div>
    );
  }

  return (
    <div className="form-card container-narrow">
      <h1>Waiting for payment</h1>
      <p className="muted">
        Complete your ${amountUsd} purchase at the checkout. This page updates automatically once your
        payment is confirmed.
      </p>
      <div className="notice">
        <span className="rss-title">Checking payment status…</span>
        <div className="muted-sm">Status: {status}. Keep this tab open after you finish paying.</div>
      </div>
    </div>
  );
}

export function ApiKeysManager({
  isMember,
  initialKeys,
}: {
  isMember: boolean;
  initialKeys: Array<{ id: string; prefix: string; label: string | null; requestCount: number; isActive: boolean }>;
}) {
  const [keys, setKeys] = useState(initialKeys);
  const [fresh, setFresh] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/account/api-keys");
    const data = await res.json();
    if (data.ok) setKeys(data.keys);
  }
  async function create() {
    setBusy(true);
    const res = await fetch("/api/account/api-keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const data = await res.json();
    setBusy(false);
    if (data.ok) {
      setFresh(data.apiKey);
      refresh();
    }
  }
  async function revoke(id: string) {
    await fetch(`/api/account/api-keys?id=${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div>
      <div className="section-head">
        <h2 style={{ fontSize: 20 }}>API keys</h2>
        {isMember ? (
          <button className="btn btn-sm btn-primary" onClick={create} disabled={busy}>
            {busy ? "Creating…" : "+ New key"}
          </button>
        ) : (
          <Link href="/api" className="btn btn-sm">Get API access ($1)</Link>
        )}
      </div>
      {fresh && (
        <div className="notice warn">
          <div className="rss-title">New key. Copy it now, it won&apos;t be shown again:</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input readOnly value={fresh} style={{ fontFamily: "monospace", flex: 1, background: "var(--panel-alt)", border: "1px solid var(--border-3)", borderRadius: 8, padding: "8px 10px", color: "var(--text)" }} />
            <CopyButton text={fresh} label="Copy" />
          </div>
        </div>
      )}
      {keys.length === 0 ? (
        <p className="muted-sm">No API keys yet.</p>
      ) : (
        <table className="lb-table">
          <thead><tr><th>Key</th><th>Label</th><th>Requests</th><th></th></tr></thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id}>
                <td style={{ fontFamily: "monospace" }}>{k.prefix}…{!k.isActive && " (revoked)"}</td>
                <td>{k.label || "-"}</td>
                <td>{k.requestCount}</td>
                <td>{k.isActive && <button className="btn btn-sm" onClick={() => revoke(k.id)}>Revoke</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
