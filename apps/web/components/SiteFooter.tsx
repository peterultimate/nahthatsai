import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <h4>Nah, that's AI</h4>
          <span className="muted-sm">
            A crowd-powered AI vs real media classifier. Every vote becomes
            public ground truth.
          </span>
        </div>
        <div>
          <h4>Explore</h4>
          <Link href="/">Latest</Link>
          <Link href="/search?sort=trending">Trending</Link>
          <Link href="/search?sort=hardest">Hardest</Link>
          <Link href="/tags">All tags</Link>
          <Link href="/leaderboard">Leaderboard</Link>
        </div>
        <div>
          <h4>RSS feeds</h4>
          <Link href="/rss.xml">Latest feed</Link>
          <Link href="/rss/trending.xml">Trending feed</Link>
          <Link href="/rss/featured.xml">Featured feed</Link>
          <Link href="/rss/leaderboard.xml">Leaderboard feed</Link>
          <Link href="/feeds">Feed directory</Link>
        </div>
        <div>
          <h4>Participate</h4>
          <Link href="/submit">Submit media</Link>
          <Link href="/signup">Create account</Link>
          <Link href="/api">Crowd-detection API</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/about">About</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>Built for BananaHack 2026</span>
        <span>
          © {new Date().getFullYear()}{" "}
          <a href="https://github.com/peterultimate/nahthatsai" target="_blank" rel="noreferrer">
            peterultimate
          </a>
        </span>
      </div>
    </footer>
  );
}
