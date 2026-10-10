import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WinBanner } from "@/components/PrizeUI";
import { TipBar } from "@/components/TipBar";
import { getCurrentUser } from "@/lib/session";
import { getClaimablePrizes } from "@/lib/prizes";
import { getActiveTips } from "@/lib/tips";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: {
    default: "Nah, that's AI: Crowd-sourced AI image detection",
    template: "%s | Nah, that's AI",
  },
  description:
    "Can you spot the slop? Play the crowd-sourced AI-detection game: vote on images, videos & posts, or get the crowd's verdict by API and RSS.",
  applicationName: "Nah, that's AI",
  authors: [{ name: "peterultimate", url: "https://peterultimate.com" }],
  creator: "peterultimate",
  publisher: "peterultimate",
  alternates: {
    types: {
      "application/rss+xml": [
        { url: "/rss.xml", title: "Nah, that's AI: Latest media" },
      ],
    },
  },
  openGraph: {
    siteName: "Nah, that's AI",
    type: "website",
    url: env.appUrl,
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml", sizes: "any" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const [claimable, tips] = await Promise.all([
    user ? getClaimablePrizes(user.id).catch(() => []) : Promise.resolve([]),
    getActiveTips(6),
  ]);
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "@id": `${env.appUrl}/#org`,
                name: "Nah, that's AI",
                url: env.appUrl,
                description:
                  "Crowd-sourced AI-vs-real detection: verified humans vote whether media is AI-generated or real.",
                founder: { "@type": "Person", name: "peterultimate" },
                sameAs: [
                  "https://github.com/peterultimate/nahthatsai",
                  "https://peterultimate.com",
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "@id": `${env.appUrl}/#website`,
                name: "Nah, that's AI",
                url: env.appUrl,
                publisher: { "@id": `${env.appUrl}/#org` },
                potentialAction: {
                  "@type": "SearchAction",
                  target: `${env.appUrl}/search?q={search_term_string}`,
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "WebApplication",
                name: "Nah, that's AI",
                url: env.appUrl,
                applicationCategory: "GameApplication",
                operatingSystem: "Any (web)",
                offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
                publisher: { "@id": `${env.appUrl}/#org` },
              },
            ]),
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;900&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <TipBar tips={tips} />
        <SiteHeader user={user} />
        <WinBanner prizes={claimable.map((p) => ({ id: p.id, rewardLabel: p.rewardLabel, claimDeadline: p.claimDeadline }))} />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
