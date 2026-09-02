"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Minus, Play, Plus, Smartphone, Sparkles } from "lucide-react";
import { MODE_META, MODE_SECTIONS } from "@/lib/game/modes";
import {
  MAX_PLAYERS,
  makePlayer,
  newGameSessionId,
  resizePlayers,
  useGameStore,
} from "@/lib/store/game";
import { PlayerDot } from "@/components/ui/primitives";
import { AppIcon } from "@/components/ui/icons";
import { KawaiiMascot } from "@/components/ui/kawaii-mascot";
import { AppNavigation } from "@/components/ui/app-navigation";

export function LocalPlayClient() {
  const router = useRouter();
  const setConfig = useGameStore((state) => state.setConfig);
  const players = useGameStore((state) => state.players);
  const setPlayers = useGameStore((state) => state.setPlayers);
  const effectivePlayers = players.length >= 1 ? players : [makePlayer(0, "Joueur 1")];

  function setPlayerCount(delta: number) {
    const nextCount = Math.max(1, Math.min(MAX_PLAYERS, effectivePlayers.length + delta));
    setPlayers(resizePlayers(effectivePlayers, nextCount));
  }

  function launchQuickGame() {
    setConfig({
      sessionId: newGameSessionId(),
      mode: "classic",
      category: "mixed",
      difficulty: "mixed",
      players: effectivePlayers.map((player, index) => ({
        ...player,
        name: player.name.trim() || `Joueur ${index + 1}`,
      })),
      questionCount: 10,
      timePerQuestion: 15,
      debateMinutes: 5,
      debateMode: "standard",
    });
    router.push("/play");
  }

  return (
    <>
      <AppNavigation />
      <main className="fp-page">
        <header className="grid items-center gap-6 rounded-[2rem] border border-fp-primary/15 bg-[linear-gradient(135deg,#ffffff_10%,#f1efff_100%)] px-5 py-7 sm:px-9 lg:grid-cols-[1fr_auto]">
          <div>
            <span className="fp-eyebrow"><Smartphone className="h-4 w-4" />Jeu local</span>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] text-fp-text sm:text-4xl">Jouez ensemble sur un seul appareil</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-fp-text-dim">Choisissez le nombre de joueurs, puis passez le téléphone ou la tablette à chaque tour.</p>
          </div>
          <KawaiiMascot theme="quiz" size={104} className="hidden sm:inline-flex" />
        </header>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <article className="fp-card p-5 sm:p-6">
            <span className="fp-eyebrow"><Sparkles className="h-4 w-4" />Partie rapide</span>
            <h2 className="mt-2 text-xl font-extrabold text-fp-text">Quiz express</h2>
            <p className="mt-1 text-sm leading-6 text-fp-text-dim">10 questions variées, avec les réglages recommandés.</p>

            <div className="mt-5 flex items-center justify-between rounded-2xl border border-fp-border bg-fp-bg/65 p-3">
              <span className="text-sm font-bold text-fp-text">Joueurs</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPlayerCount(-1)} disabled={effectivePlayers.length <= 1} className="grid h-11 w-11 place-items-center rounded-xl border border-fp-border bg-white disabled:opacity-35" aria-label="Retirer un joueur"><Minus className="h-4 w-4" /></button>
                <span className="w-8 text-center text-lg font-black tabular-nums">{effectivePlayers.length}</span>
                <button type="button" onClick={() => setPlayerCount(1)} disabled={effectivePlayers.length >= MAX_PLAYERS} className="grid h-11 w-11 place-items-center rounded-xl border border-fp-border bg-white disabled:opacity-35" aria-label="Ajouter un joueur"><Plus className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {effectivePlayers.map((player) => (
                <span key={player.id} className="inline-flex items-center gap-2 rounded-full border border-fp-border bg-white py-1.5 pl-1.5 pr-3 text-xs font-semibold">
                  <PlayerDot name={player.name} colorIndex={player.color} size={24} />{player.name}
                </span>
              ))}
            </div>
            <button type="button" onClick={launchQuickGame} className="fp-btn-primary mt-5 w-full gap-2"><Play className="h-4.5 w-4.5 fill-current" />Lancer maintenant</button>
          </article>

          <div className="rounded-2xl border border-dashed border-fp-primary/25 bg-fp-primary/[0.035] p-5 sm:p-6">
            <p className="text-sm font-bold text-fp-primary">Comment ça marche ?</p>
            <ol className="mt-4 grid gap-4 sm:grid-cols-3">
              {["Ajoutez les joueurs", "Choisissez un mode", "Passez l’appareil à chaque tour"].map((label, index) => (
                <li key={label} className="flex gap-3 sm:block">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-fp-primary text-sm font-black text-white">{index + 1}</span>
                  <p className="mt-1 text-sm font-semibold leading-5 text-fp-text sm:mt-3">{label}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-14">
          <div className="max-w-2xl">
            <span className="fp-eyebrow">Tous les modes</span>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-fp-text">Choisissez votre jeu</h2>
            <p className="mt-2 text-fp-text-dim">Chaque mode ouvre sa propre page de configuration avant la partie.</p>
          </div>

          {MODE_SECTIONS.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex === 0 ? "mt-7" : "mt-10"}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-fp-text">{section.title}</h3>
                <span className="text-sm text-fp-text-dim">{section.modes.length} modes</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {section.modes.map((modeId) => {
                  const meta = MODE_META[modeId];
                  return (
                    <Link href={`/play/local/${modeId}`} key={modeId} className="fp-card group flex min-h-40 flex-col p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-fp-primary/35 hover:shadow-[0_16px_38px_rgba(23,24,41,0.08)]">
                      <div className="flex items-start justify-between gap-3">
                        <span className={`grid h-11 w-11 place-items-center rounded-xl text-white ${meta.iconBg}`}><AppIcon name={meta.icon} className="h-5 w-5" /></span>
                        <span className="rounded-full bg-fp-fill px-2.5 py-1 text-xs font-bold text-fp-text-dim">{meta.minPlayers === 1 ? "1–8 joueurs" : `${meta.minPlayers}–8 joueurs`}</span>
                      </div>
                      <h4 className="mt-4 text-base font-extrabold text-fp-text group-hover:text-fp-primary">{meta.name}</h4>
                      <p className="mt-1 flex-1 text-sm leading-5 text-fp-text-dim">{meta.subtitle}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-fp-primary">Configurer<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
