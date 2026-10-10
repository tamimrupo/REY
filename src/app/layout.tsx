import type { Metadata } from "next";

import { Analytics } from "@/components/analytics";
import { BackToTop } from "@/components/motion";
import { MetaPixel } from "@/components/meta-pixel";
import { JsonLd } from "@/components/json-ld";
import { RouteProgress } from "@/components/route-progress";
import { TableLabels } from "@/components/table-labels";
import { getSiteSettingsForMetadata } from "@/lib/data";
import { organizationJsonLd } from "@/lib/jsonld";
import { SITE_URL } from "@/lib/site-url";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettingsForMetadata();
  return {
    title: {
      default: `${site.name} — Book rental club in Bangladesh`,
      template: `%s · ${site.name}`,
    },
    description:
      "Rent books online in Bangladesh with REY BD. Choose 2, 4 or 8 titles a month, delivered to your door and collected when you're done — from ৳299/month.",
    metadataBase: new URL(SITE_URL),
    openGraph: {
      // No explicit title: og:title inherits each page's <title> (with the
      // "%s · REY BD" template applied) instead of the hardcoded site.name,
      // so every page's share title reflects its real title.
      description:
        "Rent books online in Bangladesh with REY BD. Choose 2, 4 or 8 titles a month, delivered to your door and collected when you're done.",
      type: "website",
      siteName: site.name,
      // No hardcoded `url` here: each page sets its own `openGraph.url` (a
      // relative path resolved against metadataBase) so og:url always equals
      // that page's canonical URL instead of the homepage.
      images: [{ url: `${SITE_URL}/hero/reader-1880.jpg` }],
    },
    twitter: {
      card: "summary_large_image",
      // No explicit title: twitter:title inherits each page's <title> too.
      description: "Book rental club in Bangladesh — delivered to your door.",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    applicationName: site.name,
    creator: site.name,
    publisher: site.name,
    ...(process.env.GSC_VERIFICATION
      ? { verification: { google: process.env.GSC_VERIFICATION } }
      : {}),
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Overpass:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,900;1,500;1,600;1,700&family=Noto+Sans+Bengali:wght@400;500;600&family=Noto+Serif+Bengali:wght@500;600;700&family=Caveat:wght@500;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-btn focus:border focus:border-ink focus:bg-paper focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
        >
          Skip to content
        </a>
        <RouteProgress />
        <TableLabels />
        {children}
        <BackToTop />
        <Analytics />
        <MetaPixel />
        <JsonLd data={organizationJsonLd()} />
      </body>
    </html>
  );
}
