"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useGameStore } from "@/lib/store/game";
import { PrismGame } from "@/components/game/prism-game";
import { QuizGame } from "@/components/game/quiz-game";
import { TimelineGame } from "@/components/game/timeline-game";
import { TeamBattleGame } from "@/components/game/team-battle";
import { WyrGame } from "@/components/game/wyr-game";
import { GuessGame } from "@/components/game/guess-game";
import { DebateGame } from "@/components/game/debate-game";
import { PsychoGame } from "@/components/game/psycho-game";
import { Play, Sparkles } from "lucide-react";
import { IQGame } from "@/components/game/iq-game";

const emptySubscribe = () => () => {};

export default function PlayPage() {
  const config = useGameStore((s) => s.config);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-fp-border border-t-fp-primary" />
        <p className="mt-4 text-[15px] text-fp-text-dim">Chargement de la partie…</p>
      </main>
    );
  }

  if (!config) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center animate-rise">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-fp-primary/10 text-fp-primary shadow-sm">
          <Sparkles className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-fp-text">Aucune partie active</h1>
        <p className="mt-2 text-sm text-fp-text-dim leading-relaxed">
          Choisissez un mode de jeu local pour configurer et lancer votre session entre amis.
        </p>
        <Link
          href="/play/local"
          className="fp-btn-primary mt-6 inline-flex w-full items-center justify-center gap-2 py-3.5 font-bold"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>Choisir un mode de jeu</span>
        </Link>
      </main>
    );
  }

  switch (config.mode) {
    case "prism":
      return <PrismGame />;
    case "classic":
    case "truefalse":
    case "rapidfire":
      return <QuizGame mode={config.mode} />;
    case "timeline":
      return <TimelineGame />;
    case "teambattle":
      return <TeamBattleGame />;
    case "wyr":
      return <WyrGame />;
    case "guess":
      return <GuessGame />;
    case "debate":
      return <DebateGame />;
    case "psycho":
      return <PsychoGame />;
    case "iq":
      return <IQGame />;
    default:
      return <PrismGame />;
  }
}
