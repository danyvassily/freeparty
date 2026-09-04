import { NextResponse } from "next/server";

/**
 * Version de l'application utilisée par les clients PWA pour détecter une
 * nouvelle mise en ligne. Les plateformes de déploiement fournissent
 * généralement un SHA de commit ; en local, le fallback reste stable pendant
 * toute la durée du processus serveur.
 */
export const dynamic = "force-dynamic";

export function GET() {
  const version =
    process.env.NEXT_PUBLIC_BUILD_ID ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.COMMIT_SHA ??
    process.env.npm_package_version ??
    "development";

  return NextResponse.json(
    { version },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );
}
