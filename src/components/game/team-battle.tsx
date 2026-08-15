"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Question } from "@/lib/questions/schema";
import { useGameStore } from "@/lib/store/game";
import { useHistoryStore, toSelectionHistory } from "@/lib/store/history";
import { TimerBar, Confetti } from "@/components/ui/primitives";

export function TeamBattleGame() {
  const router = useRouter();
  const config = useGameStore((s) => s.config);
  const { entries, addEntry } = useHistoryStore();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"loading" | "playing" | "answer" | "results">("loading");
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [currentTeam, setCurrentTeam] = useState<"A" | "B">("A");
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answeredRef = useRef(false);

  const players = config?.players ?? [];
  const teamA = players.filter((p) => p.team !== "B");
  const teamB = players.filter((p) => p.team === "B");
  const currentName =
    currentTeam === "A" ? teamA.map((p) => p.name).join(" & ") || "Équipe A" : teamB.map((p) => p.name).join(" & ") || "Équipe B";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            count: config?.questionCount ?? 10,
            category: config?.category,
            difficulties: config?.difficulty && config.difficulty !== "mixed" ? [config.difficulty] : undefined,
            history: toSelectionHistory(entries),
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        const pool = (data.questions ?? []) as Question[];
        if (pool.length === 0) {
          setError("Aucune question disponible pour cette configuration.");
          return;
        }
        setQuestions(pool.slice(0, Math.min(config?.questionCount ?? 10, pool.length)));
        setPhase("playing");
        setTimeLeft(15);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      }
    }
    load();
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = questions[index];
  const isLast = index >= questions.length - 1;

  function next() {
    answeredRef.current = false;
    setSelected(null);
    setCurrentTeam((t) => (t === "A" ? "B" : "A"));
    if (isLast) {
      setPhase("results");
    } else {
      setIndex((i) => i + 1);
      setPhase("playing");
      setTimeLeft(15);
    }
  }

  useEffect(() => {
    if (phase !== "playing" || !current) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!answeredRef.current) {
            answeredRef.current = true;
            setSelected(-1);
            setPhase("answer");
            addEntry({ questionId: current.id, familyId: current.familyId, answeredCorrectly: false });
            setTimeout(next, 1800);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index, current]);

  function handleAnswer(i: number) {
    if (answeredRef.current || !current) return;
    answeredRef.current = true;
    setSelected(i);
    const ok = i === current.correctAnswer;
    if (ok) {
      if (currentTeam === "A") setScoreA((s) => s + 10);
      else setScoreB((s) => s + 10);
    }
    addEntry({ questionId: current.id, familyId: current.familyId, answeredCorrectly: ok });
    setPhase("answer");
    setTimeout(next, 1800);
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl">😕</div>
        <h1 className="mt-4 font-display text-2xl font-bold">Oups</h1>
        <p className="mt-2 text-fp-text-dim">{error}</p>
        <button type="button" onClick={() => router.push("/")} className="fp-btn-primary mt-8">Retour</button>
      </main>
    );
  }

  if (phase === "loading") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center">
        <div className="animate-spin-slow text-5xl">⚔️</div>
        <p className="mt-4 animate-pulse text-fp-text-dim">Préparation du combat…</p>
      </main>
    );
  }

  if (phase === "results") {
    const winner = scoreA === scoreB ? "Égalité parfaite !" : scoreA > scoreB ? "🏆 Équipe A gagne !" : "🏆 Équipe B gagne !";
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-6 text-center">
        <Confetti />
        <div className="animate-pop text-6xl">🏆</div>
        <h1 className="mt-4 font-display text-4xl font-bold">{winner}</h1>
        <div className="fp-card mt-8 w-full max-w-sm p-6">
          <div className="flex items-center justify-around">
            <div>
              <div className="font-display text-4xl font-bold text-fp-primary">{scoreA}</div>
              <div className="text-sm text-fp-text-dim">Équipe A</div>
            </div>
            <div className="font-display text-2xl text-fp-text-dim">—</div>
            <div>
              <div className="font-display text-4xl font-bold text-fp-primary-2">{scoreB}</div>
              <div className="text-sm text-fp-text-dim">Équipe B</div>
            </div>
          </div>
        </div>
        <div className="mt-8 flex w-full max-w-sm gap-3">
          <button type="button" onClick={() => router.push("/")} className="fp-btn-ghost flex-1">Accueil</button>
          <button type="button" onClick={() => window.location.reload()} className="fp-btn-primary flex-1">Rejouer</button>
        </div>
      </main>
    );
  }

  if (!current) return null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-10 pt-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.push("/")} className="text-sm text-fp-text-dim" aria-label="Quitter">✕</button>
        <div className="flex items-center gap-2 rounded-full border border-fp-border bg-fp-surface px-4 py-1.5 text-sm font-bold">
          <span className="text-fp-primary">A {scoreA}</span>
          <span className="text-fp-text-dim">·</span>
          <span className="text-fp-primary-2">{scoreB} B</span>
        </div>
        <span className="text-sm text-fp-text-dim">{index + 1}/{questions.length}</span>
      </div>

      <div className="mt-5">
        <TimerBar seconds={timeLeft} total={15} />
      </div>

      <section className="mt-6 flex-1">
        <div className="flex items-center justify-between">
          <span
            className={`animate-pop rounded-full px-3 py-1 text-xs font-bold text-white ${
              currentTeam === "A" ? "bg-fp-primary" : "bg-fp-primary-2"
            }`}
          >
            {currentTeam === "A" ? "⚔️ Équipe A" : "⚔️ Équipe B"} — {currentName}
          </span>
          <span className="rounded-full border border-fp-border bg-fp-surface px-3 py-1 text-xs text-fp-text-dim">
            {current.category}
          </span>
        </div>
        <h1 key={current.id} className="animate-rise mt-4 font-display text-2xl font-bold leading-snug">
          {current.question}
        </h1>

        <div className="mt-6 grid gap-3">
          {current.answers.map((answer, i) => {
            let cls = "border-fp-border bg-fp-surface hover:border-fp-primary";
            if (phase === "answer") {
              if (i === current.correctAnswer) cls = "animate-pop border-fp-success bg-fp-success/15 text-fp-success";
              else if (i === selected) cls = "animate-shake border-fp-danger bg-fp-danger/15 text-fp-danger";
              else cls = "border-fp-border bg-fp-surface opacity-40";
            }
            return (
              <button
                key={i}
                type="button"
                disabled={phase === "answer"}
                onClick={() => handleAnswer(i)}
                className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left font-semibold transition-all active:scale-[0.98] ${cls}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold">
                  {["A", "B", "C", "D"][i]}
                </span>
                <span className="flex-1">{answer}</span>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
