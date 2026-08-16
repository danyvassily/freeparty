"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pickGuessItem, type GuessItem } from "@/lib/game/guess-data";
import { useSettingsStore } from "@/lib/store/settings";
import { Trophy } from "lucide-react";

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
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center animate-rise">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-violet-600/20 text-violet-300 border border-violet-500/30 mb-3">
          <Trophy className="h-7 w-7" />
        </div>
        <h1 className="mt-2 font-sans text-3xl font-extrabold text-white">
          {score >= 60 ? "Excellente Déduction" : "Session Clôturée"}
        </h1>
        <p className="mt-1 text-xs text-neutral-400 font-mono">{score} points accumulés</p>
        <div className="mt-6 flex w-full max-w-sm gap-3">
          <button type="button" onClick={() => router.push("/")} className="glass-button flex-1 rounded-xl py-3 text-xs font-semibold text-neutral-300">Accueil</button>
          <button type="button" onClick={() => window.location.reload()} className="glass-primary flex-1 rounded-xl py-3 text-xs font-bold text-white shadow-lg">Rejouer</button>
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

      <h1 className="mt-6 font-sans text-2xl sm:text-3xl font-extrabold text-white">Indices & Déduction</h1>
      <p className="mt-2 text-xs text-neutral-400">Dévoilez les indices successifs puis formulez votre réponse. Moins d&apos;indices utilisés = plus de points.</p>

      <div className="mt-6 space-y-2">
        {item.hints.slice(0, hintsShown).map((h, i) => (
          <div key={i} className="animate-rise rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
            <span className="font-mono text-xs font-bold text-violet-400">Indice {i + 1}</span>
            <p className="mt-1 text-sm font-medium text-white">{h}</p>
          </div>
        ))}
        {hintsShown < item.hints.length && (
          <button type="button" onClick={showHint} className="glass-button w-full rounded-xl py-3 text-xs font-semibold text-neutral-300">
            Dévoiler l&apos;indice {hintsShown + 1}
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
          placeholder={canGuess ? "Votre proposition…" : "Dévoilez encore un indice…"}
          className="flex-1 rounded-xl border border-white/[0.1] bg-black/40 px-4 py-3 text-xs font-semibold outline-none transition-colors placeholder:text-neutral-500 focus:border-violet-400 disabled:opacity-40"
          aria-label="Ta réponse"
        />
        <button
          type="submit"
          disabled={!canGuess || !guess.trim() || status !== "playing"}
          className="glass-primary rounded-xl px-5 py-3 text-xs font-bold text-white shadow-lg disabled:opacity-40"
        >
          Valider
        </button>
      </form>

      {status === "won" && (
        <p className="animate-pop mt-4 text-center text-xs font-bold text-emerald-400">
          Bonne réponse : {item.answer}
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
