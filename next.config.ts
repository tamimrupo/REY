import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Metadata blocks instead of streaming: title, description, canonical and the
  // Open Graph tags are in the first HTML every visitor and crawler receives.
  // Otherwise they arrive after the shell, in the body — invisible to
  // Lighthouse and to unfurlers that read only the head. The settings read
  // behind the metadata is cached, so blocking costs almost nothing.
  htmlLimitedBots: /.*/,

  // The CMS still carries near-duplicate pages for "about-us" and
  // "how-it-works" under /p/... — 301 them to their single static, canonical
  // pages so each URL has one source of truth.
  async redirects() {
    return [
      // www → apex: rey.bd is the canonical host. The www subdomain has no DNS
      // record yet; this redirect keeps every URL on one host the moment it is
      // added. (See note in the handoff about the DNS record itself.)
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.rey.bd" }],
        destination: "https://rey.bd/:path*",
        permanent: true,
      },
      { source: "/p/about-us", destination: "/about-us", statusCode: 301 },
      { source: "/p/how-it-works", destination: "/how-it-works", statusCode: 301 },

      // Duplicate-edition canonicalization (GSC round-1). A handful of catalog
      // titles were imported twice — once under a "-2" suffix or a second
      // transliteration — and the two URLs were splitting ranking signals.
      // 301 the loser to the canonical edition. Kept out of the sitemap (see
      // sitemap.ts) so no redirecting URL is ever advertised.
      { source: "/library/rich-dad-poor-dad-2", destination: "/library/rich-dad-poor-dad", statusCode: 301 },
      { source: "/library/putul-nacher-itikatha", destination: "/library/putulanacher-itikatha", statusCode: 301 },
      { source: "/library/chander-pahar-2", destination: "/library/chander-pahar", statusCode: 301 },
      { source: "/library/gora-2", destination: "/library/gora", statusCode: 301 },
    ];
  },
};

export default nextConfig;
