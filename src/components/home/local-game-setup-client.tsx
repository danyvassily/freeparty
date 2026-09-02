"use client";

import { useRouter } from "next/navigation";
import { AppNavigation } from "@/components/ui/app-navigation";
import { GameSetup } from "@/components/home/game-setup";
import { useGameStore, type GameMode } from "@/lib/store/game";

export function LocalGameSetupClient({ mode }: { mode: GameMode }) {
  const router = useRouter();
  const setConfig = useGameStore((state) => state.setConfig);

  return (
    <>
      <AppNavigation />
      <main className="fp-narrow-page">
        <GameSetup
          mode={mode}
          onBack={() => router.push("/play/local")}
          onLaunch={(config) => {
            setConfig(config);
            router.push("/play");
          }}
        />
      </main>
    </>
  );
}
