"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "nts-tipbar-dismissed";
const ROTATE_MS = 6000;

export function TipBar({ tips }: { tips: readonly string[] }) {
  const safeTips = useMemo(
    () => tips.filter((t) => t && typeof t === "string"),
    [tips],
  );
  const [idx, setIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const total = safeTips.length;
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") {
        setDismissed(true);
        setHidden(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (hidden || total <= 1) {
      if (ivRef.current) {
        clearInterval(ivRef.current);
        ivRef.current = null;
      }
      return;
    }
    ivRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % Math.max(1, total));
    }, ROTATE_MS);
    return () => {
      if (ivRef.current) clearInterval(ivRef.current);
      ivRef.current = null;
    };
  }, [hidden, total]);

  const dismiss = useCallback(() => {
    setHidden(true);
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  }, []);

  if (!total) return null;
  if (!mounted) return null;
  if (dismissed) return null;

  return (
    <div
      className={`tip-bar ${hidden ? "is-hiding" : ""}`}
      onTransitionEnd={(e) => {
        if (e.propertyName === "opacity" && hidden) setDismissed(true);
      }}
    >
      <div className="container">
        <div className="tip-core" aria-live="polite" aria-atomic="true">
          <span className="tip-icon" aria-hidden="true">💡</span>
          <span className="tip-label" aria-hidden="true">Tip</span>
          <div className="tip-text-wrap">
            {safeTips.map((t, i) => (
              <span
                key={i}
                className={`tip-text ${i === idx ? "is-active" : ""}`}
                aria-hidden={i !== idx}
              >
                {t}
              </span>
            ))}
          </div>

          <button
            type="button"
            className="tip-dismiss"
            onClick={dismiss}
            aria-label="Dismiss tips"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
