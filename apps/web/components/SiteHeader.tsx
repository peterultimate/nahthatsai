"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SessionUser } from "@/lib/session";
import { LogoutButton } from "@/components/AuthForms";

export function Wordmark() {
  return (
    <Link href="/" className="wordmark" aria-label="Nah, that's AI home">
      <span className="nah">nah</span>
      <span className="comma">,</span>
      <span className="thats">that&apos;s</span>
      <span className="ai">AI</span>
    </Link>
  );
}

type MenuItem = { href: string; label: string; external?: boolean };

const EXPLORE_MENU: MenuItem[] = [
  { href: "/", label: "Latest" },
  { href: "/search?sort=trending", label: "Trending" },
  { href: "/tags", label: "Tags" },
];

const PLATFORM_MENU: MenuItem[] = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/rewards", label: "Rewards" },
  { href: "/prizes", label: "Prizes" },
  { href: "/refer", label: "Refer friends" },
  { href: "/feeds", label: "RSS / Feeds" },
  { href: "/api-docs", label: "API docs" },
];

function DropdownMenu({
  id,
  label,
  items,
  pathname,
}: {
  id: string;
  label: string;
  items: MenuItem[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function isActive(item: MenuItem): boolean {
    if (item.href === "/") return pathname === "/";
    const base = item.href.split("?")[0].split("#")[0];
    if (base === "/search") return pathname === "/search";
    return pathname.startsWith(base);
  }

  return (
    <div className="dropdown-wrap" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        id={`${id}-trigger`}
        className="nav-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{label}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`chev ${open ? "is-open" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          className="dropdown-menu"
          role="menu"
          aria-labelledby={`${id}-trigger`}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              className={`dropdown-item ${isActive(item) ? "is-active" : ""}`}
              onClick={() => setOpen(false)}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noreferrer noopener" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function isActiveItem(pathname: string, item: MenuItem): boolean {
  if (item.href === "/") return pathname === "/";
  const base = item.href.split("?")[0].split("#")[0];
  if (base === "/search") return pathname === "/search";
  return pathname.startsWith(base);
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  const base = href.split("?")[0].split("#")[0];
  return pathname === base || pathname.startsWith(base + "/");
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {open ? (
        <>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

function MobileNav({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    try {
      document.body.style.overflow = open ? "hidden" : "";
    } catch {}
    return () => {
      document.removeEventListener("keydown", onKey);
      try {
        document.body.style.overflow = "";
      } catch {}
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        className="nav-hamburger"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-controls="mobile-nav"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <HamburgerIcon open={open} />
      </button>

      <div
        className={`mobile-nav-backdrop ${open ? "is-open" : ""}`}
        aria-hidden="true"
        onMouseDown={() => setOpen(false)}
      />

      <aside
        id="mobile-nav"
        ref={panelRef}
        className={`mobile-nav ${open ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        <header className="mobile-nav__hdr">
          <Link href="/" onClick={() => setOpen(false)} aria-label="Nah, that's AI home" className="mobile-nav__brand">
            <span className="nah">nah</span>
            <span className="comma">,</span>
            <span className="thats">that&apos;s</span>
            <span className="ai">AI</span>
          </Link>
          <button
            type="button"
            className="mobile-nav__close"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </header>

        <nav className="mobile-nav__body" aria-label="Mobile">
          <div className="mobile-nav__group">
            <div className="mobile-nav__label">Explore</div>
            {EXPLORE_MENU.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-nav__item ${isActiveItem(pathname, item) ? "is-active" : ""}`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/play"
              className={`mobile-nav__item mobile-nav__item--accent ${isActivePath(pathname, "/play") ? "is-active" : ""}`}
              onClick={() => setOpen(false)}
            >
              Play
            </Link>
          </div>

          <div className="mobile-nav__group">
            <div className="mobile-nav__label">Platform</div>
            {PLATFORM_MENU.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-nav__item ${isActiveItem(pathname, item) ? "is-active" : ""}`}
                onClick={() => setOpen(false)}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noreferrer noopener" : undefined}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/submit"
              className={`mobile-nav__item mobile-nav__item--accent ${isActivePath(pathname, "/submit") ? "is-active" : ""}`}
              onClick={() => setOpen(false)}
            >
              Submit a post
            </Link>
          </div>

          <div className="mobile-nav__group">
            <div className="mobile-nav__label">More</div>
            <Link
              href="/about"
              className={`mobile-nav__item ${isActivePath(pathname, "/about") ? "is-active" : ""}`}
              onClick={() => setOpen(false)}
            >
              About
            </Link>
          </div>
        </nav>

        <div className="mobile-nav__auth">
          {user ? (
            <>
              {user.isAdmin && (
                <Link href="/admin" className="btn btn-sm w-full" onClick={() => setOpen(false)}>
                  Admin
                </Link>
              )}
              <Link href="/account" className="btn btn-sm w-full" onClick={() => setOpen(false)}>
                {user.displayName || "Account"}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-sm w-full" onClick={() => setOpen(false)}>
                Sign in
              </Link>
              <Link href="/signup" className="btn btn-sm btn-primary w-full" onClick={() => setOpen(false)}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

export function SiteHeader({ user }: { user: SessionUser | null }) {
  const pathname = usePathname() ?? "/";
  return (
    <header className="site-header">
      <Wordmark />
      <nav className="nav" aria-label="Primary">
        <DropdownMenu id="explore" label="Explore" items={EXPLORE_MENU} pathname={pathname} />
        <Link href="/play" className={`nav-link ${pathname === "/play" ? "is-active" : ""}`}>
          Play
        </Link>
        <DropdownMenu id="platform" label="Platform" items={PLATFORM_MENU} pathname={pathname} />
        <Link href="/submit" className={`nav-link ${pathname === "/submit" ? "is-active" : ""}`}>
          Submit
        </Link>
        <Link href="/about" className={`nav-link ${pathname === "/about" ? "is-active" : ""}`}>
          About
        </Link>
      </nav>
      <div className="nav-auth">
        {user ? (
          <>
            {user.isAdmin && (
              <Link href="/admin" className="btn btn-sm">
                Admin
              </Link>
            )}
            <Link href="/account" className="btn btn-sm">
              {user.displayName || "Account"}
            </Link>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login" className="nav-link">
              Sign in
            </Link>
            <Link href="/signup" className="btn btn-sm btn-primary">
              Sign up
            </Link>
          </>
        )}
      </div>
      <MobileNav user={user} />
    </header>
  );
}
