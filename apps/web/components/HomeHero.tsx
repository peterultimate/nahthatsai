"use client";

import Link from "next/link";
import type { TagRow } from "@/lib/queries";
import { GridPulse } from "@/components/ui/grid-pulse";

const GUARD_STYLE: React.CSSProperties = {
  textShadow:
    "0 0 6px var(--bg), 0 0 14px var(--bg), 0 0 30px var(--bg), 0 0 52px var(--bg)",
};

export function HomeHero({ tags }: { tags: TagRow[] }) {
  return (
    <section className="hero hero--grid">
      <GridPulse
        cell={22}
        reach={2.8}
        ambient={3}
        maxLit={220}
        hueTop={270}
        hueSpan={110}
      />
      <div className="hero__content">
        <h1 style={GUARD_STYLE}>
          Nah, that&apos;s <span className="ai">AI slop.</span>
        </h1>
        <p data-grid-avoid style={GUARD_STYLE}>
          <strong>Built for BananaHack 2026.</strong> A crowd-powered game where
          you guess whether images are AI-generated or real. Rack up streaks,
          climb the leaderboard, and publish your own images for the community
          to judge: by web, RSS, or API.
        </p>
        <form className="hero-search" action="/search" method="get">
          <input
            type="search"
            name="q"
            placeholder="Search media, tags, posters…"
            aria-label="Search"
          />
          <Link
            href="/play"
            className="btn btn-primary"
            style={{ textDecoration: "none" }}
          >
            Play now
          </Link>
        </form>
        <div className="chips">
          {tags.slice(0, 14).map((t) => (
            <Link key={t.slug} href={`/t/${t.slug}`} className="chip">
              #{t.slug}
            </Link>
          ))}
          <Link href="/tags" className="chip">
            all tags →
          </Link>
        </div>
      </div>
    </section>
  );
}
