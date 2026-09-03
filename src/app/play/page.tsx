"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store/game";
import { PrismGame } from "@/components/game/prism-game";
import { QuizGame } from "@/components/game/quiz-game";
import { TimelineGame } from "@/components/game/timeline-game";
import { TeamBattleGame } from "@/components/game/team-battle";
import { WyrGame } from "@/components/game/wyr-game";
import { GuessGame } from "@/components/game/guess-game";
import { DebateGame } from "@/components/game/debate-game";

const emptySubscribe = () => () => {};

export default function PlayPage() {
  const router = useRouter();
  const config = useGameStore((s) => s.config);
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  // Pas de config APRÈS hydratation → retour accueil
  useEffect(() => {
    if (isHydrated && !config) {
      router.replace("/");
    }
  }, [isHydrated, config, router]);

  if (!isHydrated || !config) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-fp-gray-5 border-t-fp-blue" />
        <p className="mt-4 text-[15px] text-fp-text-secondary">Chargement de la partie…</p>
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
    default:
      return <PrismGame />;
  }
}
