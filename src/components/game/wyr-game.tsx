"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pickWyrPair, WYR_CATEGORY_LABELS, type WouldYouRatherPair } from "@/lib/game/wyr-data";
import { useGameStore } from "@/lib/store/game";
import { useSettingsStore } from "@/lib/store/settings";

export function WyrGame() {
  const router = useRouter();
  const settings = useSettingsStore();
  const players = useGameStore((s) => s.config?.players) ?? [];
  const [pair, setPair] = useState<WouldYouRatherPair>(() => pickWyrPair([]));
  const [round, setRound] = useState(1);
  const [activePlayer, setActivePlayer] = useState(0);
  const [chosen, setChosen] = useState<"A" | "B" | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [currentVotes, setCurrentVotes] = useState<{ A: number; B: number }>({ A: 0, B: 0 });
  const [allVotes, setAllVotes] = useState<Record<string, { A: number; B: number }>>({});
  const [finished, setFinished] = useState(false);

  const totalRounds = Math.max(settings.wyrRounds, players.length * 2);

  function choose(opt: "A" | "B") {
    if (chosen) return;
    setChosen(opt);
    setCurrentVotes((v) => ({ ...v, [opt]: v[opt] + 1 }));
    setHistory((h) => [...h, pair.id]);

    setTimeout(() => {
      if (round >= totalRounds) {
        setFinished(true);
        return;
      }
      const next = pickWyrPair(history);
      setAllVotes((v) => ({ ...v, [pair.id]: currentVotes[opt] >= 0 ? { ...currentVotes, [opt]: currentVotes[opt] + 1 } : currentVotes }));
      setPair(next);
      setChosen(null);
      setCurrentVotes({ A: 0, B: 0 });
      setRound((r) => r + 1);
      setActivePlayer((p) => (p + 1) % Math.max(1, players.length));
    }, 1800);
  }

  if (finished) {
    const totalVotes = Object.values(allVotes).reduce((sum, v) => sum + v.A + v.B, 0);
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-6 text-center">
        <div className="animate-pop text-6xl" aria-hidden="true">🤝</div>
        <h1 className="mt-4 font-display text-4xl font-bold">Débats tranchés !</h1>
        <p className="mt-2 text-fp-text-dim">{round - 1} dilemmes · {totalVotes} votes</p>
        <div className="mt-8 flex w-full max-w-sm gap-3">
          <button type="button" onClick={() => router.push("/")} className="fp-btn-ghost flex-1">Accueil</button>
          <button type="button" onClick={() => window.location.reload()} className="fp-btn-primary flex-1">Rejouer</button>
        </div>
      </main>
    );
  }

  const activeName = players[activePlayer]?.name ?? "Toi";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-10 pt-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.push("/")} className="text-sm text-fp-text-dim" aria-label="Quitter">✕</button>
        <span className="rounded-full border border-fp-border bg-fp-surface px-3 py-1 text-xs font-semibold text-fp-text-dim">
          {round}/{totalRounds} · {WYR_CATEGORY_LABELS[pair.category]}
        </span>
      </div>

      <p className="mt-8 text-center font-display text-lg text-fp-text-dim">
        {activeName}, choisis :
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <button
          type="button"
          onClick={() => choose("A")}
          disabled={chosen !== null}
          className={`fp-card min-h-36 p-6 text-left transition-all ${
            chosen === "A" ? "border-fp-primary shadow-lg shadow-fp-primary/30" : chosen === "B" ? "opacity-40" : "hover:border-fp-primary"
          }`}
        >
          <span className="font-display text-sm font-bold uppercase tracking-widest text-fp-primary">Option A</span>
          <p className="mt-2 font-display text-xl font-bold leading-snug">{pair.optionA}</p>
          {chosen && (
            <p className="mt-3 text-xs text-fp-text-dim">
              {currentVotes.A} vote{currentVotes.A > 1 ? "s" : ""}
            </p>
          )}
        </button>

        <div className="text-center font-display text-2xl font-bold text-fp-text-dim" aria-hidden="true">ou</div>

        <button
          type="button"
          onClick={() => choose("B")}
          disabled={chosen !== null}
          className={`fp-card min-h-36 p-6 text-left transition-all ${
            chosen === "B" ? "border-fp-primary-2 shadow-lg shadow-fp-primary-2/30" : chosen === "A" ? "opacity-40" : "hover:border-fp-primary-2"
          }`}
        >
          <span className="font-display text-sm font-bold uppercase tracking-widest text-fp-primary-2">Option B</span>
          <p className="mt-2 font-display text-xl font-bold leading-snug">{pair.optionB}</p>
          {chosen && (
            <p className="mt-3 text-xs text-fp-text-dim">
              {currentVotes.B} vote{currentVotes.B > 1 ? "s" : ""}
            </p>
          )}
        </button>
      </div>
    </main>
  );
}
