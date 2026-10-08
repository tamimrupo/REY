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
      { source: "/p/about-us", destination: "/about-us", statusCode: 301 },
      { source: "/p/how-it-works", destination: "/how-it-works", statusCode: 301 },
    ];
  },
};

export default nextConfig;
