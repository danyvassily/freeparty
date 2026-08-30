"use client";

/**
 * Free Party — Accueil (style app Réglages iOS)
 * Grand titre, liste groupée des modes, entrée "Jouer en ligne".
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { ModeCard, SectionTitle } from "@/components/ui/primitives";
import { GameSetup } from "@/components/home/game-setup";
import { MODE_META, MODE_SECTIONS } from "@/lib/game/modes";
import { useGameStore, type GameMode } from "@/lib/store/game";

export function HomeClient() {
  const router = useRouter();
  const setConfig = useGameStore((s) => s.setConfig);
  const [setupMode, setSetupMode] = useState<GameMode | null>(null);

  if (setupMode) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-4">
        <GameSetup
          mode={setupMode}
          onBack={() => setSetupMode(null)}
          onLaunch={(cfg) => {
            setConfig(cfg);
            router.push("/play");
          }}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-4">
      {/* Barre de navigation */}
      <div className="flex items-center justify-end py-2">
        <button
          type="button"
          onClick={() => router.push("/settings")}
          aria-label="Réglages"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.04] text-fp-text-dim transition hover:bg-black/[0.08] hover:text-fp-text"
        >
          <Settings className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Grand titre iOS */}
      <header className="px-1 pb-5 pt-2">
        <h1 className="text-[34px] font-bold leading-tight tracking-tight text-fp-text">
          {BRAND.name}
        </h1>
        <p className="mt-1 text-[15px] text-fp-text-dim">{BRAND.tagline}</p>
      </header>

      {/* Jouer en ligne */}
      <SectionTitle>Multijoueur</SectionTitle>
      <div className="fp-list">
        <ModeCard
          title="Jouer en ligne"
          subtitle="Crée un salon ou rejoins tes amis avec un code — chacun sur son appareil, sans compte"
          icon="globe"
          iconBg="bg-[#34c759]"
          onClick={() => router.push("/play/online")}
        />
      </div>

      {/* Modes de jeu */}
      {MODE_SECTIONS.map((section) => (
        <section key={section.title} className="mt-7">
          <SectionTitle>{section.title}</SectionTitle>
          <div className="fp-list">
            {section.modes.map((modeId) => {
              const meta = MODE_META[modeId];
              return (
                <ModeCard
                  key={modeId}
                  title={meta.name}
                  subtitle={meta.subtitle}
                  icon={meta.icon}
                  iconBg={meta.iconBg}
                  onClick={() => setSetupMode(modeId)}
                />
              );
            })}
          </div>
        </section>
      ))}

      <footer className="mt-12 text-center text-[13px] text-fp-text-dim">
        <p>{BRAND.fullName} · Sur un appareil ou en ligne, sans inscription</p>
      </footer>
    </main>
  );
}
