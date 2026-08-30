"use client";

/**
 * Free Party — Indices & Déduction (Guess)
 * À chaque manche, un joueur différent tente de deviner.
 * Moins d'indices dévoilés = plus de points.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { pickGuessItem, type GuessItem } from "@/lib/game/guess-data";
import { useSettingsStore } from "@/lib/store/settings";
import { useGameStore } from "@/lib/store/game";
import { PlayerDot, PillBadge } from "@/components/ui/primitives";
import { Trophy, ChevronLeft, Check, X } from "lucide-react";

export function GuessGame() {
  const router = useRouter();
  const settings = useSettingsStore();
  const players = useGameStore((s) => s.config?.players) ?? [];
  const solo = players.length <= 1;

  const [item, setItem] = useState<GuessItem>(() => pickGuessItem([]));
  const [hintsShown, setHintsShown] = useState(1);
  const [guess, setGuess] = useState("");
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [round, setRound] = useState(1);
  const [usedIds, setUsedIds] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);

  const activeIdx = (round - 1) % Math.max(1, players.length);
  const active = players[activeIdx];

  function showHint() {
    setHintsShown((h) => Math.min(h + 1, item.hints.length));
  }

  function submit() {
    const ok = guess.trim().toLowerCase() === item.answer.toLowerCase();
    if (ok) {
      const points = Math.max(5, 25 - hintsShown * 5);
      if (active) setScores((s) => ({ ...s, [active.id]: (s[active.id] ?? 0) + points }));
      setStatus("won");
    } else {
      setStatus("lost");
    }
    setUsedIds((u) => [...u, item.id]);
    setTimeout(next, 2000);
  }

  function next() {
    if (round >= settings.guessRounds) {
      setFinished(true);
      return;
    }
    setItem(pickGuessItem([...usedIds, item.id]));
    setHintsShown(1);
    setGuess("");
    setStatus("playing");
    setRound((r) => r + 1);
  }

  function replay() {
    setItem(pickGuessItem([]));
    setHintsShown(1);
    setGuess("");
    setStatus("playing");
    setRound(1);
    setUsedIds([]);
    setScores({});
    setFinished(false);
  }

  if (finished) {
    const ranking = players
      .map((p) => ({ player: p, score: scores[p.id] ?? 0 }))
      .sort((a, b) => b.score - a.score);
    const soloScore = ranking[0]?.score ?? 0;

    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-16 pt-10 text-center animate-rise">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-fp-warning/15 text-fp-warning">
          <Trophy className="h-7 w-7" />
        </div>
        <h1 className="mt-3 text-[26px] font-bold text-fp-text">
          {solo ? `${soloScore} points` : `${ranking[0]?.player.name ?? ""} gagne !`}
        </h1>
        {!solo && (
          <div className="fp-list mt-6 text-left">
            {ranking.map((r, i) => (
              <div key={r.player.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-5 text-center text-[15px] font-semibold text-fp-text-dim tabular-nums">{i + 1}</span>
                <PlayerDot name={r.player.name} colorIndex={r.player.color} size={30} />
                <span className="flex-1 text-[15px] font-medium text-fp-text">{r.player.name}</span>
                <span className="text-[15px] font-semibold text-fp-text tabular-nums">{r.score} pts</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-8 flex w-full gap-3">
          <button type="button" onClick={() => router.push("/")} className="fp-btn-secondary flex-1 py-3 text-[15px]">Accueil</button>
          <button type="button" onClick={replay} className="fp-btn-primary flex-1 py-3 text-[15px]">Rejouer</button>
        </div>
      </main>
    );
  }

  const canGuess = hintsShown >= 2;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-10 pt-3">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.push("/")} className="fp-btn-ghost inline-flex items-center gap-0.5 px-2 py-1 text-[15px]" aria-label="Quitter">
          <ChevronLeft className="h-5 w-5" />
          Quitter
        </button>
        <PillBadge>Manche {round}/{settings.guessRounds}</PillBadge>
      </div>

      <div className="mt-6">
        <h1 className="text-[22px] font-bold text-fp-text">De quoi s&apos;agit-il ?</h1>
        {!solo && active && (
          <p className="mt-1.5 inline-flex items-center gap-2 text-[14px] text-fp-text-dim">
            <PlayerDot name={active.name} colorIndex={active.color} size={22} />
            {active.name} répond · {scores[active.id] ?? 0} pts
          </p>
        )}
        <p className="mt-1 text-[13px] text-fp-text-dim">
          Dévoile les indices un par un. Moins tu en utilises, plus tu marques de points.
        </p>
      </div>

      <div className="mt-5 space-y-2">
        {item.hints.slice(0, hintsShown).map((h, i) => (
          <div key={i} className="fp-card animate-rise px-4 py-3">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-fp-primary">Indice {i + 1}</span>
            <p className="mt-0.5 text-[15px] font-medium text-fp-text">{h}</p>
          </div>
        ))}
        {hintsShown < item.hints.length && (
          <button type="button" onClick={showHint} className="fp-btn-secondary w-full py-3 text-[14px]">
            Dévoiler l&apos;indice {hintsShown + 1}
          </button>
        )}
      </div>

      <form
        className="mt-5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (canGuess && status === "playing") submit();
        }}
      >
        <input
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          disabled={!canGuess || status !== "playing"}
          placeholder={canGuess ? "Ta réponse…" : "Dévoile encore un indice…"}
          className="fp-input flex-1 px-4 py-3 text-[15px] font-medium disabled:opacity-40"
          aria-label="Ta réponse"
        />
        <button
          type="submit"
          disabled={!canGuess || !guess.trim() || status !== "playing"}
          className="fp-btn-primary px-5 py-3 text-[15px]"
        >
          Valider
        </button>
      </form>

      {status === "won" && (
        <p className="animate-pop mt-4 inline-flex items-center justify-center gap-1.5 text-center text-[15px] font-semibold text-fp-success">
          <Check className="h-4 w-4" /> Bonne réponse : {item.answer}
        </p>
      )}
      {status === "lost" && (
        <p className="animate-pop mt-4 inline-flex items-center justify-center gap-1.5 text-center text-[15px] font-semibold text-fp-danger">
          <X className="h-4 w-4" /> C&apos;était {item.answer}
        </p>
      )}
    </main>
  );
}
