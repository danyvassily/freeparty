import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description:
    "Jeu de culture compétitif pour adultes. Tour par tour, Buzzer, Le Cut et la finale signature La Ligne.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PRISM",
  },
  keywords: [
    "prism", "quiz", "culture générale", "jeu compétitif", "buzzer", "la ligne", "philosophie", "art",
    "histoire", "cinéma", "sciences humaines",
  ],
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: "Jeu de culture compétitif pour adultes.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0a12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="antialiased">
        <div className="fp-aurora" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
