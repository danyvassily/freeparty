"use client";

/**
 * Free Party — Dilemmes (Would You Rather)
 * Les joueurs tranchent à tour de rôle, puis le groupe discute.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { pickWyrPair, WYR_CATEGORY_LABELS, type WouldYouRatherPair } from "@/lib/game/wyr-data";
import { useGameStore } from "@/lib/store/game";
import { useSettingsStore } from "@/lib/store/settings";
import { PlayerDot, PillBadge } from "@/components/ui/primitives";
import { Scale, ChevronLeft } from "lucide-react";

export function WyrGame() {
  const router = useRouter();
  const settings = useSettingsStore();
  const players = useGameStore((s) => s.config?.players) ?? [];
  const [pair, setPair] = useState<WouldYouRatherPair>(() => pickWyrPair([]));
  const [round, setRound] = useState(1);
  const [activePlayer, setActivePlayer] = useState(0);
  const [chosen, setChosen] = useState<"A" | "B" | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  const totalRounds = Math.max(settings.wyrRounds, players.length * 2);
  const active = players[activePlayer];

  function choose(opt: "A" | "B") {
    if (chosen) return;
    setChosen(opt);
    setHistory((h) => [...h, pair.id]);

    setTimeout(() => {
      if (round >= totalRounds) {
        setFinished(true);
        return;
      }
      setPair(pickWyrPair([...history, pair.id]));
      setChosen(null);
      setRound((r) => r + 1);
      setActivePlayer((p) => (p + 1) % Math.max(1, players.length));
    }, 2200);
  }

  function replay() {
    setPair(pickWyrPair([]));
    setRound(1);
    setActivePlayer(0);
    setChosen(null);
    setHistory([]);
    setFinished(false);
    setSessionKey((k) => k + 1);
  }

  if (finished) {
    return (
      <main key={sessionKey} className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center animate-rise">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-fp-primary/10 text-fp-primary">
          <Scale className="h-7 w-7" />
        </div>
        <h1 className="mt-3 text-[26px] font-bold text-fp-text">Dilemmes terminés</h1>
        <p className="mt-1 text-[14px] text-fp-text-dim">{totalRounds} dilemmes tranchés — belle discussion !</p>
        <div className="mt-8 flex w-full max-w-sm gap-3">
          <button type="button" onClick={() => router.push("/")} className="fp-btn-secondary flex-1 py-3 text-[15px]">Accueil</button>
          <button type="button" onClick={replay} className="fp-btn-primary flex-1 py-3 text-[15px]">Rejouer</button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-10 pt-3">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.push("/")} className="fp-btn-ghost inline-flex items-center gap-0.5 px-2 py-1 text-[15px]" aria-label="Quitter">
          <ChevronLeft className="h-5 w-5" />
          Quitter
        </button>
        <PillBadge>{round}/{totalRounds} · {WYR_CATEGORY_LABELS[pair.category]}</PillBadge>
      </div>

      <div className="mt-10 text-center">
        {active && (
          <p className="mb-2 inline-flex items-center gap-2 text-[15px] font-medium text-fp-text">
            <PlayerDot name={active.name} colorIndex={active.color} size={26} />
            À toi, {active.name}
          </p>
        )}
        <h1 className="text-[20px] font-semibold text-fp-text">Tu préfères…</h1>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={() => choose("A")}
          disabled={chosen !== null}
          className={`fp-card min-h-32 p-6 text-left transition-all active:scale-[0.98] ${
            chosen === "A" ? "ring-2 ring-fp-primary" : chosen === "B" ? "opacity-40" : "hover:bg-black/[0.02]"
          }`}
        >
          <span className="text-[12px] font-semibold uppercase tracking-wide text-fp-primary">Option A</span>
          <p className="mt-2 text-[18px] font-semibold leading-snug text-fp-text">{pair.optionA}</p>
        </button>

        <div className="text-center text-[15px] font-medium text-fp-text-dim" aria-hidden="true">ou</div>

        <button
          type="button"
          onClick={() => choose("B")}
          disabled={chosen !== null}
          className={`fp-card min-h-32 p-6 text-left transition-all active:scale-[0.98] ${
            chosen === "B" ? "ring-2 ring-fp-primary" : chosen === "A" ? "opacity-40" : "hover:bg-black/[0.02]"
          }`}
        >
          <span className="text-[12px] font-semibold uppercase tracking-wide text-fp-primary">Option B</span>
          <p className="mt-2 text-[18px] font-semibold leading-snug text-fp-text">{pair.optionB}</p>
        </button>
      </div>

      {chosen && (
        <p className="animate-pop mt-5 text-center text-[14px] text-fp-text-dim">
          {active?.name ?? "Le joueur"} a choisi l&apos;option {chosen} — à vous de débattre !
        </p>
      )}
    </main>
  );
}
