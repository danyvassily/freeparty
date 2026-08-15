"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store/game";
import { QuizGame } from "@/components/game/quiz-game";
import { TimelineGame } from "@/components/game/timeline-game";
import { TeamBattleGame } from "@/components/game/team-battle";
import { WyrGame } from "@/components/game/wyr-game";
import { GuessGame } from "@/components/game/guess-game";
import { DebateGame } from "@/components/game/debate-game";

export default function PlayPage() {
  const router = useRouter();
  const config = useGameStore((s) => s.config);

  // Pas de config → retour accueil
  useEffect(() => {
    if (!config) router.replace("/");
  }, [config, router]);

  if (!config) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center">
        <div className="animate-spin-slow text-5xl">🎲</div>
        <p className="mt-4 animate-pulse text-fp-text-dim">Redirection…</p>
      </main>
    );
  }

  switch (config.mode) {
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
      return null;
  }
}
