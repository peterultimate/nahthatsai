import type { Metadata } from "next";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "About",
  description:
    "Nah, that's AI is a free game and crowd-sourced AI slop detection service where verified humans vote whether media is AI-generated or real.",
  alternates: { canonical: "/about" },
};

const FAQ = [
  {
    q: "What is Nah, that's AI?",
    a: "A crowd-powered photorealistic media classifier. Real humans vote whether an image is AI-generated or real, and the crowd's consensus becomes the permanent ground-truth label, exposed via a public provenance API and RSS feeds.",
  },
  {
    q: "How do you play?",
    a: "Open Play, look at one image at a time, hover to zoom in on hands, text, and edges, and call it AI or NOT AI. Consecutive correct guesses build a streak that unlocks AI Scans and AI Verdicts. Playing is free. A free account saves your streak and puts you on the leaderboard.",
  },
  {
    q: "Is it free?",
    a: "Yes. Playing is completely free. Sponsorable prize pools let the community reward the top detectors, and a paid API gives developers programmatic access to the crowd's verdicts.",
  },
  {
    q: "Who builds Nah, that's AI?",
    a: "It's built for Banana Hacks 2026 by Homesh Peter Paul and Sun Xiaochi. The project is open source on GitHub.",
  },
  {
    q: "Can I use the crowd verdict in my own app?",
    a: "Yes. The public API returns the crowd's AI-vs-real verdict and provenance data. See the API docs page to get a key.",
  },
];

export default function AboutPage() {
  return (
    <div className="container-narrow" style={{ padding: "32px 24px", lineHeight: 1.7 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
      <h1>About Nah, that's AI</h1>
      <p>
        <strong>Nah, that's AI</strong> is a crowd-powered photorealistic media classifier.
        By 2027, most images online will be synthetic, and there's no scalable way to know
        what's real. We turned detection into a game: real humans vote whether each image is{" "}
        <a href="https://en.wikipedia.org/wiki/Synthetic_media" target="_blank" rel="noreferrer">
          AI-generated
        </a>{" "}
        or real, and the crowd's consensus becomes the ground truth. The verdict ships publicly
        on the web, by RSS, and via a REST API.
      </p>

      <h2>The idea in three layers</h2>
      <ul>
        <li><strong>The Arena:</strong> a fast, one-image-at-a-time game with a hover-to-zoom loupe, streaks, and AI-powered artifact scans.</li>
        <li><strong>The Reward Layer:</strong> hit streaks to unlock AI Scans (a vision model highlights suspected artifact regions) and AI Verdicts. Community-sponsored prizes reward the top detectors.</li>
        <li><strong>The Public Signal:</strong> every image gets a permanent provenance page. The crowd's verdict is exposed via REST API and 12 RSS feeds, so the output of the game is a public dataset.</li>
      </ul>

      <h2>Frequently asked questions</h2>
      {FAQ.map((f) => (
        <div key={f.q} style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 4 }}>{f.q}</h3>
          <p style={{ marginTop: 0 }}>{f.a}</p>
        </div>
      ))}

      <p style={{ marginTop: 24 }}>
        Built for Banana Hacks 2026 by{" "}
        <strong>Homesh Peter Paul</strong> and <strong>Sun Xiaochi</strong> ·{" "}
        <a href="https://github.com/peterultimate/nahthatsai" target="_blank" rel="noreferrer">Source on GitHub</a>
      </p>
      <p className="muted-sm">
        Play at <a href={env.appUrl}>{env.appUrl.replace(/^https?:\/\//, "")}</a>.
      </p>
    </div>
  );
}
