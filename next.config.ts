import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
// Chaque build reçoit un identifiant immuable. Les hébergeurs peuvent fournir
// leur SHA de commit ; sinon l'horodatage garantit qu'un nouveau build est
// détecté par les applications installées sur l'écran d'accueil iOS.
const buildId =
  process.env.NEXT_PUBLIC_BUILD_ID ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  new Date().toISOString();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
  },
  async headers() {
    const noStore = [
      { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
      { key: "Pragma", value: "no-cache" },
    ];

    return [
      { source: "/", headers: noStore },
      { source: "/auth/:path*", headers: noStore },
      { source: "/play/:path*", headers: noStore },
      { source: "/settings/:path*", headers: noStore },
    ];
  },
  outputFileTracingIncludes: {
    "/api/**/*": ["./questions/**/*", "./debates/**/*"],
    "/**/*": ["./questions/**/*", "./debates/**/*"],
  },
  images: {
    unoptimized: true,
    remotePatterns: [new URL("https://media.giphy.com/media/**")],
  },
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
