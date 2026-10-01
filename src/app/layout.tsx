import type { Metadata } from "next";

import { BackToTop } from "@/components/motion";
import { RouteProgress } from "@/components/route-progress";
import { TableLabels } from "@/components/table-labels";
import { getSiteSettingsForMetadata } from "@/lib/data";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettingsForMetadata();
  return {
    title: {
      default: `${site.name} — Book rental club in Bangladesh`,
      template: `%s · ${site.name}`,
    },
    description: site.tagline,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    openGraph: {
      title: site.name,
      description: site.tagline,
      type: "website",
    },
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@500;600;700;900&display=swap"
        />
      </head>
      <body className="min-h-screen antialiased">
        <RouteProgress />
        <TableLabels />
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
