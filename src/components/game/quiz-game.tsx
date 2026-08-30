"use client";

/**
 * Free Party — Quiz Classique / Vrai-Faux / Rapid Fire
 * Multi-joueurs sur un seul appareil : tour par tour avec écran
 * "passe l'appareil" entre chaque question, scores individuels.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Question } from "@/lib/questions/schema";
import { REPORT_REASONS } from "@/lib/questions/schema";
import { useGameStore, type Player } from "@/lib/store/game";
import { useHistoryStore, toSelectionHistory } from "@/lib/store/history";
import { CATEGORY_LABELS } from "@/lib/game/modes";
import { ProgressRing, TimerBar, Confetti, PlayerDot, PillBadge } from "@/components/ui/primitives";
import { AlertCircle, Flag, Trophy, ChevronLeft, HandMetal } from "lucide-react";

interface QuizGameProps {
  mode: "classic" | "truefalse" | "rapidfire";
}

type Phase = "loading" | "handoff" | "playing" | "answer" | "results";

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Facile",
  medium: "Moyen",
  hard: "Difficile",
  expert: "Expert",
};

export function QuizGame({ mode }: QuizGameProps) {
  const router = useRouter();
  const config = useGameStore((s) => s.config);
  const { entries, addEntry, addReport } = useHistoryStore();

  const players: Player[] = config?.players?.length
    ? config.players
    : [{ id: "p1", name: "Joueur 1", color: 0, score: 0, correct: 0, wrong: 0 }];
  const solo = players.length === 1;

  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  /** Scores locaux par joueur : { [playerId]: { score, correct } } */
  const [scores, setScores] = useState<Record<string, { score: number; correct: number }>>({});
  const [reloadKey, setReloadKey] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answeredRef = useRef(false);
  const handleAnswerRef = useRef<(i: number) => void>(() => {});

  const timePerQuestion = config?.timePerQuestion ?? 15;
  const current = questions[index];
  const isLast = index >= questions.length - 1;
  const activePlayer = players[index % players.length];

  // Chargement initial via l'API interne (anti-répétition serveur)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setPhase("loading");
        setIndex(0);
        setSelected(null);
        setScores({});
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
          setError("Aucune question disponible pour cette configuration. Essaie une autre catégorie.");
          return;
        }
        const qs =
          mode === "truefalse"
            ? pool.slice(0, Math.min(10, pool.length))
            : mode === "rapidfire"
              ? pool.slice(0, Math.min(20, pool.length))
              : pool;
        setQuestions(qs);
        // En solo on joue direct ; en multi, écran de passage de relais
        setPhase(solo ? "playing" : "handoff");
        if (solo) setTimeLeft(timePerQuestion);
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
  }, [reloadKey]);

  const goNext = useCallback(() => {
    answeredRef.current = false;
    setSelected(null);
    if (isLast) {
      setPhase("results");
    } else {
      setIndex((i) => i + 1);
      if (solo) {
        setPhase("playing");
        setTimeLeft(timePerQuestion);
      } else {
        setPhase("handoff");
      }
    }
  }, [isLast, solo, timePerQuestion]);

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      if (answeredRef.current || !current) return;
      answeredRef.current = true;
      setSelected(answerIndex);

      const correct = answerIndex === current.correctAnswer;
      const points = correct ? (mode === "rapidfire" ? 10 : 10) : 0;
      setScores((s) => ({
        ...s,
        [activePlayer.id]: {
          score: (s[activePlayer.id]?.score ?? 0) + points,
          correct: (s[activePlayer.id]?.correct ?? 0) + (correct ? 1 : 0),
        },
      }));

      addEntry({
        questionId: current.id,
        familyId: current.familyId,
        answeredCorrectly: correct,
        responseTimeMs: Math.round((timePerQuestion - timeLeft) * 1000),
      });

      setPhase("answer");
      setTimeout(goNext, 1800);
    },
    [current, activePlayer, addEntry, timePerQuestion, timeLeft, mode, goNext],
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
          if (!answeredRef.current) {
            answeredRef.current = true;
            setSelected(-1);
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

  function startTurn() {
    setTimeLeft(timePerQuestion);
    setPhase("playing");
  }

  // ---------- Erreur ----------
  if (error) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fp-danger/10 text-fp-danger">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-[20px] font-semibold text-fp-text">Une erreur est survenue</h1>
        <p className="mt-2 text-[14px] text-fp-text-dim">{error}</p>
        <button type="button" onClick={() => router.push("/")} className="fp-btn-primary mt-6 px-6 py-2.5 text-[15px]">
          Retour à l&apos;accueil
        </button>
      </main>
    );
  }

  // ---------- Chargement ----------
  if (phase === "loading") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-black/10 border-t-fp-primary" />
        <p className="mt-4 text-[14px] text-fp-text-dim">Préparation des questions…</p>
      </main>
    );
  }

  // ---------- Résultats ----------
  if (phase === "results") {
    const ranking = players
      .map((p) => ({ player: p, score: scores[p.id]?.score ?? 0, correct: scores[p.id]?.correct ?? 0 }))
      .sort((a, b) => b.score - a.score || b.correct - a.correct);
    const total = questions.length;
    const winner = ranking[0];

    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-16 pt-10 animate-rise">
        {winner && winner.score > 0 && <Confetti />}
        <div className="text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-fp-warning/15 text-fp-warning">
            <Trophy className="h-7 w-7" />
          </div>
          <h1 className="mt-3 text-[28px] font-bold text-fp-text">
            {solo ? "Partie terminée" : `${winner.player.name} gagne !`}
          </h1>
          {solo && (
            <p className="mt-1 text-[15px] text-fp-text-dim">
              {winner.correct}/{total} bonnes réponses
            </p>
          )}
        </div>

        <div className="fp-list mt-8">
          {ranking.map((r, i) => (
            <div key={r.player.id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-5 text-center text-[15px] font-semibold text-fp-text-dim tabular-nums">
                {i + 1}
              </span>
              <PlayerDot name={r.player.name} colorIndex={r.player.color} size={32} />
              <span className="flex-1 text-[15px] font-medium text-fp-text">{r.player.name}</span>
              <span className="text-[13px] text-fp-text-dim tabular-nums">
                {r.correct}/{Math.ceil(total / players.length)} ✓
              </span>
              <span className="w-14 text-right text-[15px] font-semibold text-fp-text tabular-nums">
                {r.score} pts
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex w-full gap-3">
          <button type="button" onClick={() => router.push("/")} className="fp-btn-secondary flex-1 py-3 text-[15px]">
            Accueil
          </button>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="fp-btn-primary flex-1 py-3 text-[15px]">
            Rejouer
          </button>
        </div>
      </main>
    );
  }

  // ---------- Passage de relais (multi-joueurs, un appareil) ----------
  if (phase === "handoff" && activePlayer) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center px-6 text-center animate-fade">
        <p className="text-[13px] font-medium uppercase tracking-wide text-fp-text-dim">
          Question {index + 1} sur {questions.length}
        </p>
        <div className="mt-6">
          <PlayerDot name={activePlayer.name} colorIndex={activePlayer.color} size={84} />
        </div>
        <h1 className="mt-5 text-[26px] font-bold text-fp-text">À toi, {activePlayer.name}</h1>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[14px] text-fp-text-dim">
          <HandMetal className="h-4 w-4" />
          Passe l&apos;appareil au bon joueur
        </p>
        <div className="mt-3">
          <PillBadge>{scores[activePlayer.id]?.score ?? 0} pts</PillBadge>
        </div>
        <button type="button" onClick={startTurn} className="fp-btn-primary mt-8 w-full max-w-xs py-3.5 text-[17px]">
          C&apos;est moi
        </button>
      </main>
    );
  }

  if (!current) return null;

  // ---------- Jeu ----------
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-10 pt-3">
      {/* Barre de navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="fp-btn-ghost inline-flex items-center gap-0.5 px-2 py-1 text-[15px]"
          aria-label="Quitter la partie"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Quitter</span>
        </button>
        <span className="text-[13px] font-medium text-fp-text-dim tabular-nums">
          {index + 1}/{questions.length}
        </span>
        {!solo && activePlayer ? (
          <span className="flex items-center gap-1.5">
            <PlayerDot name={activePlayer.name} colorIndex={activePlayer.color} size={24} />
            <span className="text-[13px] font-semibold text-fp-text">{activePlayer.name}</span>
          </span>
        ) : (
          <span className="w-16" aria-hidden="true" />
        )}
      </div>

      {/* Timer */}
      {mode !== "rapidfire" && (
        <div className="mt-4">
          <TimerBar seconds={timeLeft} total={timePerQuestion} />
        </div>
      )}

      {/* Question */}
      <section className="mt-5 flex-1">
        <div className="flex items-center justify-between">
          <PillBadge>
            {CATEGORY_LABELS[current.category]} · {DIFFICULTY_LABELS[current.difficulty] ?? current.difficulty}
          </PillBadge>
          {mode === "rapidfire" && (
            <ProgressRing seconds={timeLeft} total={timePerQuestion} size={48} danger={timeLeft <= 2} />
          )}
        </div>
        <h1 key={current.id} className="animate-rise mt-4 text-[22px] font-semibold leading-snug text-fp-text sm:text-[26px]">
          {current.question}
        </h1>

        <div className="mt-6 grid gap-2">
          {current.answers.map((answer, i) => {
            let cls = "fp-card text-fp-text hover:bg-black/[0.02]";
            let disabled = false;
            if (phase === "answer") {
              disabled = true;
              if (i === current.correctAnswer) {
                cls = "border-2 border-fp-success bg-fp-success/10 text-fp-text animate-pop";
              } else if (i === selected) {
                cls = "border-2 border-fp-danger bg-fp-danger/10 text-fp-text";
              } else {
                cls = "fp-card opacity-40";
              }
            }
            return (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => handleAnswer(i)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] font-medium transition-all active:scale-[0.98] ${cls}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-[13px] font-semibold text-fp-text-dim">
                  {["A", "B", "C", "D"][i]}
                </span>
                <span className="flex-1">{answer}</span>
                {phase === "answer" && i === current.correctAnswer && (
                  <span className="font-bold text-fp-success" aria-hidden="true">✓</span>
                )}
                {phase === "answer" && i === selected && i !== current.correctAnswer && (
                  <span className="font-bold text-fp-danger" aria-hidden="true">✗</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Explication */}
        {phase === "answer" && current.explanation && (
          <p className="animate-rise mt-4 rounded-2xl bg-black/[0.03] px-4 py-3 text-[13px] leading-relaxed text-fp-text-dim">
            {current.explanation}
          </p>
        )}
      </section>

      {/* Signaler */}
      {phase === "answer" && !reportDone && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="inline-flex items-center gap-1 text-[13px] text-fp-text-dim underline-offset-2 hover:underline"
          >
            <Flag className="h-3 w-3" />
            Signaler cette question
          </button>
        </div>
      )}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Signaler la question">
          <div className="fp-card w-full max-w-md p-5 animate-pop">
            <h3 className="text-[17px] font-semibold text-fp-text">Signaler cette question</h3>
            <div className="mt-4 grid grid-cols-1 gap-1.5">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    addReport(current.id, r);
                    setReportOpen(false);
                    setReportDone(true);
                  }}
                  className="rounded-xl bg-black/[0.03] px-4 py-2.5 text-left text-[14px] font-medium text-fp-text transition-colors hover:bg-black/[0.06]"
                >
                  {r.replace(/-/g, " ")}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setReportOpen(false)} className="fp-btn-ghost mt-3 w-full py-2.5 text-[15px]">
              Annuler
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
