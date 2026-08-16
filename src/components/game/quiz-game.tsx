"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Question } from "@/lib/questions/schema";
import { REPORT_REASONS } from "@/lib/questions/schema";
import { useGameStore } from "@/lib/store/game";
import { useHistoryStore, toSelectionHistory } from "@/lib/store/history";
import { ProgressRing, TimerBar, Confetti } from "@/components/ui/primitives";
import { AlertCircle, Zap, Trophy } from "lucide-react";

interface QuizGameProps {
  mode: "classic" | "truefalse" | "rapidfire";
}

type Phase = "loading" | "playing" | "answer" | "results";

export function QuizGame({ mode }: QuizGameProps) {
  const router = useRouter();
  const config = useGameStore((s) => s.config);
  const addScore = useGameStore((s) => s.addScore);
  const { entries, addEntry, addReport } = useHistoryStore();

  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [roundScores, setRoundScores] = useState<Record<string, number>>({});
  const [correctCount, setCorrectCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answeredRef = useRef(false);
  const handleAnswerRef = useRef<(i: number) => void>(() => {});

  const timePerQuestion = config?.timePerQuestion ?? 15;
  const players = config?.players ?? [];

  // Chargement initial via l'API interne (anti-répétition serveur)
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
            difficulties:
              config?.difficulty && config.difficulty !== "mixed" ? [config.difficulty] : undefined,
            history: toSelectionHistory(entries),
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        const pool = (data.questions ?? []) as Question[];
        if (pool.length === 0) {
          setError("Aucune question disponible pour cette configuration. Essayez une catégorie différente.");
          return;
        }
        const qs =
          mode === "truefalse"
            ? pool.slice(0, Math.min(10, pool.length))
            : mode === "rapidfire"
              ? pool.slice(0, Math.min(20, pool.length))
              : pool;
        setQuestions(qs);
        setPhase("playing");
        setTimeLeft(timePerQuestion);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur de chargement");
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
    if (isLast) {
      setPhase("results");
    } else {
      setIndex((i) => i + 1);
      setPhase("playing");
      setTimeLeft(timePerQuestion);
    }
  }

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      if (answeredRef.current || !current) return;
      answeredRef.current = true;
      setSelected(answerIndex);

      const correct = answerIndex === current.correctAnswer;
      const points = correct ? (mode === "rapidfire" ? 1 : 10) : 0;
      if (correct) {
        setCorrectCount((c) => c + 1);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1200);
        // Score pour le joueur actif
        const active = players[0] ?? { id: "p1", name: "J1" };
        addScore(active.id, points);
        setRoundScores((s) => ({ ...s, [active.id]: (s[active.id] ?? 0) + points }));
      }

      addEntry({
        questionId: current.id,
        familyId: current.familyId,
        answeredCorrectly: correct,
        responseTimeMs: Math.round((timePerQuestion - timeLeft) * 1000),
      });

      setPhase("answer");
      setTimeout(next, 1800);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, players, addScore, addEntry, timePerQuestion, timeLeft, mode],
  );

  // Référence toujours fraîche pour le timer
  useEffect(() => {
    handleAnswerRef.current = handleAnswer;
  }, [handleAnswer]);

  // Timer
  useEffect(() => {
    if (phase !== "playing" || !current) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Timeout → mauvaise réponse
          if (!answeredRef.current) {
            answeredRef.current = true;
            setSelected(-1);
            setPhase("answer");
            handleAnswerRef.current(-1);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, index, current]);

  const reportReasons = REPORT_REASONS;

  if (error) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-sans text-xl font-bold text-white">Une erreur est survenue</h1>
        <p className="mt-2 text-xs text-neutral-400">{error}</p>
        <button type="button" onClick={() => router.push("/")} className="glass-primary mt-6 rounded-xl px-6 py-2.5 text-xs font-bold text-white">
          Retour au menu
        </button>
      </main>
    );
  }

  if (phase === "loading") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-300 border border-violet-500/30 animate-pulse">
          <Zap className="h-6 w-6" />
        </div>
        <p className="mt-4 text-xs text-neutral-400">Préparation des questions…</p>
      </main>
    );
  }

  if (phase === "results") {
    const total = questions.length;
    const pct = Math.round((correctCount / total) * 100);
    const grade = pct >= 90 ? "Score Parfait" : pct >= 70 ? "Excellente Performance" : pct >= 50 ? "Bonne Maîtrise" : "Entraînement Requis";
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center animate-rise">
        {pct >= 70 && <Confetti />}
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-xl mb-4">
          <Trophy className="h-7 w-7" />
        </div>
        <h1 className="font-sans text-3xl font-extrabold text-white">{grade}</h1>
        <div className="glass-panel mt-6 w-full max-w-sm rounded-3xl p-6 border-white/[0.1]">
          <div className="font-mono text-5xl font-black text-white">
            {correctCount}<span className="text-xl text-neutral-400 font-normal">/{total}</span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">{pct}% de réussite</p>
          {players.map((p) => (
            <div key={p.id} className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-2 text-xs">
              <span className="font-semibold text-white">{p.name}</span>
              <span className="font-mono font-bold text-amber-300">{roundScores[p.id] ?? 0} pts</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex w-full max-w-sm gap-3">
          <button type="button" onClick={() => router.push("/")} className="glass-button flex-1 rounded-xl py-3 text-xs font-semibold text-neutral-300">
            Accueil
          </button>
          <button type="button" onClick={() => window.location.reload()} className="glass-primary flex-1 rounded-xl py-3 text-xs font-bold text-white shadow-lg">
            Rejouer
          </button>
        </div>
      </main>
    );
  }

  if (!current) return null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-10 pt-6">
      {/* Header partie */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-sm text-fp-text-dim transition-colors hover:text-white"
          aria-label="Quitter la partie"
        >
          ✕
        </button>
        <div className="flex items-center gap-1.5" aria-label={`Question ${index + 1} sur ${questions.length}`}>
          {questions.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i < index ? "w-4 bg-fp-success" : i === index ? "w-6 bg-fp-primary" : "w-2 bg-white/15"
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-semibold text-fp-text-dim">
          {players[0]?.name ?? "Joueur"} · {roundScores[players[0]?.id ?? ""] ?? 0} pts
        </span>
      </div>

      {/* Timer */}
      {mode !== "rapidfire" && (
        <div className="mt-5">
          <TimerBar seconds={timeLeft} total={timePerQuestion} />
        </div>
      )}

      {/* Question */}
      <section className="mt-6 flex-1">
        <div className="flex items-center justify-between">
          <span className="rounded-full border border-fp-border bg-fp-surface px-3 py-1 text-xs font-semibold text-fp-text-dim">
            {current.category} · {current.difficulty}
          </span>
          {mode === "rapidfire" && (
            <ProgressRing seconds={timeLeft} total={timePerQuestion} size={52} danger={timeLeft <= 2} />
          )}
        </div>
        <h1
          key={current.id}
          className="animate-rise mt-4 font-display text-2xl font-bold leading-snug sm:text-3xl"
        >
          {current.question}
        </h1>

        <div className="mt-6 grid gap-3">
          {current.answers.map((answer, i) => {
            let cls = "border-fp-border bg-fp-surface text-fp-text hover:border-fp-primary";
            let disabled = false;
            if (phase === "answer") {
              disabled = true;
              if (i === current.correctAnswer) {
                cls = "border-fp-success bg-fp-success/15 text-fp-success animate-pop";
              } else if (i === selected) {
                cls = "border-fp-danger bg-fp-danger/15 text-fp-danger animate-shake";
              } else {
                cls = "border-fp-border bg-fp-surface opacity-40";
              }
            }
            return (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => handleAnswer(i)}
                className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left font-semibold transition-all active:scale-[0.98] ${cls}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold">
                  {["A", "B", "C", "D"][i]}
                </span>
                <span className="flex-1">{answer}</span>
                {phase === "answer" && i === current.correctAnswer && <span aria-hidden="true">✓</span>}
                {phase === "answer" && i === selected && i !== current.correctAnswer && (
                  <span aria-hidden="true">✗</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Explication */}
        {phase === "answer" && current.explanation && (
          <p className="animate-rise mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-xs text-neutral-300">
            <span className="font-bold text-violet-300 mr-1.5">Éclairage :</span>
            {current.explanation}
          </p>
        )}
      </section>

      {/* Signaler */}
      {phase === "answer" && !reportDone && (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="text-xs text-fp-text-dim/70 underline-offset-2 hover:underline"
          >
            Signaler cette question
          </button>
        </div>
      )}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Signaler la question">
          <div className="fp-card w-full max-w-md p-6">
            <h3 className="font-display text-lg font-bold">Signaler cette question</h3>
            <div className="mt-4 grid grid-cols-1 gap-2">
              {reportReasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    addReport(current.id, r);
                    setReportOpen(false);
                    setReportDone(true);
                  }}
                  className="rounded-xl border border-fp-border bg-fp-surface px-4 py-2.5 text-left text-sm font-medium transition-colors hover:border-fp-primary"
                >
                  {r.replace(/-/g, " ")}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setReportOpen(false)} className="fp-btn-ghost mt-4 w-full">
              Annuler
            </button>
          </div>
        </div>
      )}

      {showConfetti && <Confetti count={40} />}
    </main>
  );
}
