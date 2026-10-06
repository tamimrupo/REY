import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Metadata blocks instead of streaming: title, description, canonical and the
  // Open Graph tags are in the first HTML every visitor and crawler receives.
  // Otherwise they arrive after the shell, in the body — invisible to
  // Lighthouse and to unfurlers that read only the head. The settings read
  // behind the metadata is cached, so blocking costs almost nothing.
  htmlLimitedBots: /.*/,
};

export default nextConfig;
