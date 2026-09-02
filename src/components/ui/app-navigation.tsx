"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, House, Settings, UsersRound } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { useAuth } from "@/lib/auth/use-auth";
import { PlayerDot } from "@/components/ui/primitives";

const NAV_ITEMS = [
  { href: "/", label: "Accueil", icon: House },
  { href: "/play/local", label: "Jouer", icon: Gamepad2 },
  { href: "/play/online", label: "En ligne", icon: UsersRound },
  { href: "/settings", label: "Réglages", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/play/local") return pathname === "/play" || pathname.startsWith("/play/local");
  return pathname.startsWith(href);
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex min-h-11 items-center gap-2.5 rounded-xl" aria-label={`${BRAND.name}, accueil`}>
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-fp-primary text-sm font-black tracking-tight text-white shadow-[0_7px_18px_rgba(99,91,255,0.24)] transition-transform group-hover:-rotate-3">
        JX
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-base font-extrabold tracking-[-0.03em] text-fp-text">{BRAND.name}</span>
          <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.15em] text-fp-text-dim">Party game</span>
        </span>
      )}
    </Link>
  );
}

export function AppNavigation() {
  const pathname = usePathname();
  const { user, isLoggedIn } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-fp-border/90 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandMark />

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
            {NAV_ITEMS.slice(0, 4).map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition-colors ${
                    active ? "bg-fp-primary/10 text-fp-primary" : "text-fp-text-dim hover:bg-black/[0.04] hover:text-fp-text"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/auth"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-fp-border bg-white py-1.5 pl-1.5 pr-3 text-sm font-semibold text-fp-text shadow-sm transition hover:border-fp-primary/30 hover:bg-fp-primary/5"
          >
            <PlayerDot name={user?.name || "J"} avatarUrl={user?.avatarUrl} colorIndex={0} size={30} />
            <span className="hidden max-w-28 truncate sm:inline">{isLoggedIn && user ? user.name : "Mon compte"}</span>
          </Link>
        </div>
      </header>

      <nav
        className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 grid grid-cols-4 rounded-2xl border border-fp-border bg-white/95 p-1.5 shadow-[0_16px_45px_rgba(23,24,41,0.18)] backdrop-blur-xl md:hidden"
        aria-label="Navigation mobile"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-semibold transition-colors ${
                active ? "bg-fp-primary/10 text-fp-primary" : "text-fp-text-dim"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
