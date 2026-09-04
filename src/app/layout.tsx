import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { LanguageHydrator } from "@/components/providers/language-hydrator";
import { UpdateChecker } from "@/components/providers/update-checker";

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
  themeColor: "#f7f7fb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body className="antialiased">
        <LanguageHydrator />
        <UpdateChecker />
        {children}
      </body>
    </html>
  );
}
