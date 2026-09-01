"use client";

/**
 * Free Party — Bataille d'équipes
 * Les joueurs sont répartis automatiquement en deux équipes
 * qui répondent à tour de rôle.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Question } from "@/lib/questions/schema";
import { useGameStore } from "@/lib/store/game";
import { useHistoryStore } from "@/lib/store/history";
import {
  loadGameQuestions,
  markQuestionAnswered,
  markQuestionDisplayed,
} from "@/lib/questions/question-client";
import { CATEGORY_LABELS } from "@/lib/game/modes";
import { TimerBar, Confetti, PillBadge } from "@/components/ui/primitives";
import { Trophy, Swords, AlertCircle, ChevronLeft } from "lucide-react";

export function TeamBattleGame() {
  const router = useRouter();
  const config = useGameStore((s) => s.config);
  const { entries } = useHistoryStore();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"loading" | "playing" | "answer" | "results">("loading");
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [currentTeam, setCurrentTeam] = useState<"A" | "B">("A");
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answeredRef = useRef(false);

  // Répartition automatique : un joueur sur deux dans chaque équipe
  const players = useMemo(() => config?.players ?? [], [config?.players]);
  const teamA = players.filter((_, i) => i % 2 === 0);
  const teamB = players.filter((_, i) => i % 2 === 1);
  const currentTeamPlayers = currentTeam === "A" ? teamA : teamB;
  const currentName =
    currentTeam === "A"
      ? teamA.map((p) => p.name).join(" · ") || "Équipe A"
      : teamB.map((p) => p.name).join(" · ") || "Équipe B";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setPhase("loading");
        setIndex(0);
        setSelected(null);
        setScoreA(0);
        setScoreB(0);
        setCurrentTeam("A");
        const data = await loadGameQuestions({
          count: config?.questionCount ?? 10,
          category: config?.category,
          difficulties: config?.difficulty && config.difficulty !== "mixed" ? [config.difficulty] : undefined,
          players,
          history: entries,
          sessionId: config?.sessionId ?? crypto.randomUUID(),
        });
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
  }, [reloadKey]);

  const current = questions[index];
  const isLast = index >= questions.length - 1;

  useEffect(() => {
    if (phase !== "playing" || !current) return;
    void markQuestionDisplayed({
      question: current,
      players,
      sessionId: config?.sessionId ?? "00000000-0000-4000-8000-000000000000",
    });
  }, [phase, current, players, config?.sessionId]);

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
            for (const player of currentTeamPlayers) {
              void markQuestionAnswered({
                question: current,
                player,
                sessionId: config?.sessionId ?? "00000000-0000-4000-8000-000000000000",
                correct: false,
              });
            }
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
    for (const player of currentTeamPlayers) {
      void markQuestionAnswered({
        question: current,
        player,
        sessionId: config?.sessionId ?? "00000000-0000-4000-8000-000000000000",
        correct: ok,
      });
    }
    setPhase("answer");
    setTimeout(next, 1800);
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fp-danger/10 text-fp-danger">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-[20px] font-semibold text-fp-text">Une erreur est survenue</h1>
        <p className="mt-2 text-[14px] text-fp-text-dim">{error}</p>
        <button type="button" onClick={() => router.push("/")} className="fp-btn-primary mt-6 px-6 py-2.5 text-[15px]">Retour</button>
      </main>
    );
  }

  if (phase === "loading") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-black/10 border-t-fp-primary" />
        <p className="mt-4 text-[14px] text-fp-text-dim">Préparation du match…</p>
      </main>
    );
  }

  if (phase === "results") {
    const winner =
      scoreA === scoreB ? "Égalité parfaite !" : scoreA > scoreB ? "L'équipe A gagne !" : "L'équipe B gagne !";
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center animate-rise">
        <Confetti />
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-fp-warning/15 text-fp-warning">
          <Trophy className="h-7 w-7" />
        </div>
        <h1 className="mt-3 text-[26px] font-bold text-fp-text">{winner}</h1>
        <div className="fp-card mt-6 w-full max-w-sm p-6">
          <div className="flex items-center justify-around">
            <div>
              <div className="text-[40px] font-bold tabular-nums text-fp-primary">{scoreA}</div>
              <div className="mt-1 text-[13px] text-fp-text-dim">Équipe A</div>
            </div>
            <div className="text-[20px] text-fp-text-dim">—</div>
            <div>
              <div className="text-[40px] font-bold tabular-nums text-[#ff2d55]">{scoreB}</div>
              <div className="mt-1 text-[13px] text-fp-text-dim">Équipe B</div>
            </div>
          </div>
        </div>
        <div className="mt-8 flex w-full max-w-sm gap-3">
          <button type="button" onClick={() => router.push("/")} className="fp-btn-secondary flex-1 py-3 text-[15px]">Accueil</button>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="fp-btn-primary flex-1 py-3 text-[15px]">Rejouer</button>
        </div>
      </main>
    );
  }

  if (!current) return null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-10 pt-3">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.push("/")} className="fp-btn-ghost inline-flex items-center gap-0.5 px-2 py-1 text-[15px]" aria-label="Quitter">
          <ChevronLeft className="h-5 w-5" />
          Quitter
        </button>
        <div className="flex items-center gap-2 rounded-full bg-black/[0.05] px-4 py-1.5 text-[14px] font-semibold tabular-nums">
          <span className="text-fp-primary">A · {scoreA}</span>
          <span className="text-fp-text-dim">|</span>
          <span className="text-[#ff2d55]">{scoreB} · B</span>
        </div>
        <span className="text-[13px] text-fp-text-dim tabular-nums">{index + 1}/{questions.length}</span>
      </div>

      <div className="mt-4">
        <TimerBar seconds={timeLeft} total={15} />
      </div>

      <section className="mt-5 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex animate-pop items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-white ${
              currentTeam === "A" ? "bg-fp-primary" : "bg-[#ff2d55]"
            }`}
          >
            <Swords className="h-3.5 w-3.5" />
            Équipe {currentTeam} — {currentName}
          </span>
          <PillBadge>{CATEGORY_LABELS[current.category]}</PillBadge>
        </div>
        <h1 key={current.id} className="animate-rise mt-4 text-[22px] font-semibold leading-snug text-fp-text sm:text-[26px]">
          {current.question}
        </h1>

        <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {current.answers.map((answer, i) => {
            let cls = "fp-card text-fp-text hover:bg-black/[0.02]";
            if (phase === "answer") {
              if (i === current.correctAnswer) cls = "border-2 border-fp-success bg-fp-success/10 text-fp-text animate-pop";
              else if (i === selected) cls = "border-2 border-fp-danger bg-fp-danger/10 text-fp-text";
              else cls = "fp-card opacity-40";
            }
            return (
              <button
                key={i}
                type="button"
                disabled={phase === "answer"}
                onClick={() => handleAnswer(i)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] font-medium transition-all active:scale-[0.98] ${cls}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-[13px] font-semibold text-fp-text-dim">
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
