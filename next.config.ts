import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/**/*": ["./questions/**/*"],
    "/**/*": ["./questions/**/*"],
  },
};

export default nextConfig;
