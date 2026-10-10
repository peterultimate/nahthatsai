import Link from "next/link";

/**
 * Homepage promo band positioning Nah, that's AI as a full Platform: play,
 * submit, rewards, feeds and API. Built for BananaHack 2026.
 */
export function CrowdPromo({
  images,
  votes,
  opinions,
}: {
  images: number;
  votes: number;
  opinions: number;
}) {
  const fmt = (n: number) => n.toLocaleString();
  return (
    <section className="promo">
      <div className="eyebrow">Built for BananaHack 2026 · The Platform</div>
      <h2>
        One crowd. <span className="grad">Every slop verdict you need.</span>
      </h2>
      <p className="lead">
        Skip the single-model detector. Thousands of real humans vote on every
        image. Climb the leaderboard by playing, post your own photos for
        judgement, or pipe verdicts straight into your app with the API.
      </p>

      <div className="promo-cta">
        <Link href="/play" className="btn btn-primary">Start a round →</Link>
        <Link href="/leaderboard" className="btn">Leaderboard</Link>
        <Link href="/submit" className="btn">Submit media</Link>
        <Link href="/prizes" className="btn">Weekly prizes</Link>
        <Link href="/api" className="btn">API docs</Link>
      </div>

      {(images > 0 || votes > 0) && (
        <div className="promo-stats">
          <div><div className="n ai">{fmt(images)}</div><div className="l">Images judged</div></div>
          <div><div className="n">{fmt(votes)}</div><div className="l">Votes from players</div></div>
          {opinions > 0 && <div><div className="n">{fmt(opinions)}</div><div className="l">Images through the API</div></div>}
        </div>
      )}

      <div className="promo-features">
        <div className="promo-feature">
          <div className="ft">Play to rank up</div>
          <div className="fd">Streaks, milestones, and weekly prizes: the more you vote, the higher you climb on the global leaderboard.</div>
        </div>
        <div className="promo-feature">
          <div className="ft">Submit, then watch</div>
          <div className="fd">Upload an image and let the crowd decide. Check live percentiles, provenance notes, and individual votes anytime.</div>
        </div>
        <div className="promo-feature">
          <div className="ft">Feeds &amp; API</div>
          <div className="fd">Every verdict ships over RSS and a simple REST API: integrate slop detection into feeds, bots, or apps with one call.</div>
        </div>
      </div>
    </section>
  );
}
