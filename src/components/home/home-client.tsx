"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Globe2, LogIn, Play, ShieldCheck, UserPlus } from "lucide-react";
import { AppNavigation } from "@/components/ui/app-navigation";
import { PlayerDot } from "@/components/ui/primitives";
import { useAuth } from "@/lib/auth/use-auth";
import { BRAND } from "@/lib/brand";

export function HomeClient() {
  const { user, isLoggedIn } = useAuth();

  return (
    <>
      <AppNavigation />
      <main className="fp-page flex min-h-[calc(100dvh-4rem)] flex-col justify-center">
        <section className="grid items-center gap-8 overflow-hidden rounded-[2rem] border border-fp-cyan/70 bg-[linear-gradient(135deg,#ffffff_15%,#e8faf9_100%)] px-5 py-8 shadow-[0_24px_70px_rgba(17,139,120,0.12)] sm:px-10 sm:py-11 lg:grid-cols-[1.2fr_0.8fr] lg:px-14">
          <div>
            <span className="fp-eyebrow">Bienvenue sur {BRAND.name}</span>
            <h1 className="mt-4 max-w-3xl text-[2.35rem] font-black leading-[1.03] tracking-[-0.055em] text-fp-text sm:text-5xl lg:text-[3.45rem]">
              Une soirée, plein de façons de jouer.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-fp-text-dim sm:text-lg">
              Jouez immédiatement sans compte, ou connectez-vous pour synchroniser votre historique et vos salons.
            </p>

            {isLoggedIn && user ? (
              <div className="mt-7 rounded-2xl border border-fp-border bg-white/80 p-4">
                <div className="flex items-center gap-3">
                  <PlayerDot name={user.name} avatarUrl={user.avatarUrl} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-fp-text">Bonjour {user.name}</p>
                    <p className="truncate text-sm text-fp-text-dim">Votre historique est synchronisé.</p>
                  </div>
                  <ShieldCheck className="h-5 w-5 shrink-0 text-fp-success" />
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Link href="/play/local" className="fp-btn-primary flex-1 gap-2"><Play className="h-4.5 w-4.5 fill-current" />Jouer</Link>
                  <Link href="/auth" className="fp-btn-secondary flex-1">Gérer mon compte</Link>
                </div>
              </div>
            ) : (
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/play/local" className="fp-btn-primary gap-2 px-6"><Play className="h-4.5 w-4.5 fill-current" />Jouer sans compte</Link>
                <Link href="/auth?mode=register" className="fp-btn-secondary gap-2 px-6"><UserPlus className="h-4.5 w-4.5" />Créer un compte</Link>
                <Link href="/auth?mode=login" className="fp-btn-ghost gap-2 px-4 text-fp-primary"><LogIn className="h-4 w-4" />Se connecter</Link>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-fp-text-dim">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-fp-success" />Compte facultatif</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-fp-success" />1 à 8 joueurs</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-fp-success" />Questions inédites</span>
            </div>
          </div>

          <div className="relative flex min-h-64 items-center justify-center lg:min-h-[23rem]" aria-hidden="true">
            <span className="absolute h-64 w-64 rounded-full bg-fp-cyan/45 blur-3xl" />
            <Image
              src="/images/kawaii/home-duel.png"
              alt="Deux mascottes JOUXTA qui se défient en souriant"
              width={768}
              height={512}
              priority
              className="relative z-10 w-full max-w-[34rem] object-contain drop-shadow-[0_22px_30px_rgba(17,139,120,0.2)]"
            />
          </div>
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-3" aria-label="Sections de l’application">
          <Link href="/play/local" className="fp-card group flex min-h-32 items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-fp-primary/35">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-fp-primary/10 text-fp-primary"><Play className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><strong className="block text-base text-fp-text">Jeu local</strong><span className="mt-1 block text-sm text-fp-text-dim">Tous les modes sur un appareil</span></span>
            <ArrowRight className="h-5 w-5 text-fp-primary transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/play/online" className="fp-card group flex min-h-32 items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-fp-cyan">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-fp-cyan/45 text-fp-success"><Globe2 className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><strong className="block text-base text-fp-text">Salons en ligne</strong><span className="mt-1 block text-sm text-fp-text-dim">Chacun sur son appareil</span></span>
            <ArrowRight className="h-5 w-5 text-fp-success transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href={isLoggedIn ? "/auth" : "/auth?mode=register"} className="fp-card group flex min-h-32 items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-fp-primary/35">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-fp-yellow/45 text-fp-warning"><ShieldCheck className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><strong className="block text-base text-fp-text">{isLoggedIn ? "Mon compte" : "Créer un compte"}</strong><span className="mt-1 block text-sm text-fp-text-dim">Historique et appareils synchronisés</span></span>
            <ArrowRight className="h-5 w-5 text-fp-warning transition-transform group-hover:translate-x-1" />
          </Link>
        </section>
      </main>
    </>
  );
}
