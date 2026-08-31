import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description:
    "Le jeu de quiz et de débats entre amis. Tour par tour, buzzer, dilemmes et discussions — sur un appareil ou en ligne.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: BRAND.name,
  },
  keywords: [
    "quiz", "culture générale", "jeu entre amis", "buzzer", "débat", "philosophie",
    "histoire", "cinéma", "soirée",
  ],
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: "Le jeu de quiz et de débats entre amis.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f2f2f7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (document.cookie && document.cookie.length > 2500) {
                  var cs = document.cookie.split(";");
                  for (var i = 0; i < cs.length; i++) {
                    var c = cs[i].trim();
                    var eq = c.indexOf("=");
                    var n = eq > -1 ? c.substring(0, eq) : c;
                    if (c.indexOf("data:image") > -1 || (n.indexOf("sb-") === 0 && c.length > 1800)) {
                      document.cookie = n + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    }
                  }
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
