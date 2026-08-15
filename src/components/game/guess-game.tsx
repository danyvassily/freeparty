"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pickGuessItem, type GuessItem } from "@/lib/game/guess-data";
import { useSettingsStore } from "@/lib/store/settings";

export function GuessGame() {
  const router = useRouter();
  const settings = useSettingsStore();
  const [item, setItem] = useState<GuessItem>(() => pickGuessItem([]));
  const [hintsShown, setHintsShown] = useState(1);
  const [guess, setGuess] = useState("");
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [usedIds, setUsedIds] = useState<string[]>([]);

  function showHint() {
    setHintsShown((h) => Math.min(h + 1, item.hints.length));
  }

  function submit() {
    const ok = guess.trim().toLowerCase() === item.answer.toLowerCase();
    if (ok) {
      const points = Math.max(5, 25 - hintsShown * 5);
      setScore((s) => s + points);
      setStatus("won");
      setUsedIds((u) => [...u, item.id]);
      setTimeout(next, 2000);
    } else {
      setStatus("lost");
      setUsedIds((u) => [...u, item.id]);
      setTimeout(next, 2000);
    }
  }

  function next() {
    if (round >= settings.guessRounds) {
      setStatus(score >= 60 ? "won" : "lost");
      setRound(settings.guessRounds + 1); // termine
      return;
    }
    const nextItem = pickGuessItem(usedIds);
    setItem(nextItem);
    setHintsShown(1);
    setGuess("");
    setStatus("playing");
    setRound((r) => r + 1);
  }

  if (round > settings.guessRounds) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-6 text-center">
        <div className="animate-pop text-6xl" aria-hidden="true">🕵️</div>
        <h1 className="mt-4 font-display text-4xl font-bold">
          {score >= 60 ? "Maître détective !" : "Fin de partie"}
        </h1>
        <p className="mt-2 text-fp-text-dim">{score} points</p>
        <div className="mt-8 flex w-full max-w-sm gap-3">
          <button type="button" onClick={() => router.push("/")} className="fp-btn-ghost flex-1">Accueil</button>
          <button type="button" onClick={() => window.location.reload()} className="fp-btn-primary flex-1">Rejouer</button>
        </div>
      </main>
    );
  }

  const canGuess = hintsShown >= 2;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-10 pt-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.push("/")} className="text-sm text-fp-text-dim" aria-label="Quitter">✕</button>
        <span className="rounded-full border border-fp-border bg-fp-surface px-3 py-1 text-xs font-semibold text-fp-text-dim">
          Devinette {round}/{settings.guessRounds} · {score} pts
        </span>
      </div>

      <h1 className="mt-6 font-display text-3xl font-bold">🕵️ Guess</h1>
      <p className="mt-2 text-fp-text-dim">Dévoile les indices puis devine. Moins d&apos;indices = plus de points.</p>

      <div className="mt-6 space-y-2">
        {item.hints.slice(0, hintsShown).map((h, i) => (
          <div key={i} className="animate-rise rounded-2xl border border-fp-border bg-fp-surface px-4 py-3">
            <span className="font-display text-xs font-bold text-fp-primary">Indice {i + 1}</span>
            <p className="mt-1 font-medium">{h}</p>
          </div>
        ))}
        {hintsShown < item.hints.length && (
          <button type="button" onClick={showHint} className="fp-btn-ghost w-full">
            🔍 Dévoiler l&apos;indice {hintsShown + 1}
          </button>
        )}
      </div>

      <form
        className="mt-6 flex gap-2"
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
          className="flex-1 rounded-full border border-fp-border bg-fp-surface px-5 py-3 font-semibold outline-none transition-colors placeholder:text-fp-text-dim/60 focus:border-fp-primary disabled:opacity-50"
          aria-label="Ta réponse"
        />
        <button
          type="submit"
          disabled={!canGuess || !guess.trim() || status !== "playing"}
          className="fp-btn-primary disabled:opacity-40"
        >
          Deviner
        </button>
      </form>

      {status === "won" && (
        <p className="animate-pop mt-4 text-center font-bold text-fp-success">
          ✓ Bravo ! C&apos;était {item.answer} 🎉
        </p>
      )}
      {status === "lost" && (
        <p className="animate-pop mt-4 text-center font-bold text-fp-danger">
          ✗ C&apos;était {item.answer}
        </p>
      )}
    </main>
  );
}
