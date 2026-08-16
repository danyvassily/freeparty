"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store/game";
import { useHistoryStore, toSelectionHistory } from "@/lib/store/history";
import type { Question } from "@/lib/questions/schema";
import { REPORT_REASONS } from "@/lib/questions/schema";
import {
  createInitialPrismState,
  calculateSpeedBonus,
  processLaLigneAnswer,
  LALIGNE_INITIAL_POSITION,
  LALIGNE_TIMER_SECONDS,
  type PrismGameState,
  type PrismPlayer,
} from "@/lib/game/prism-engine";
import { sound } from "@/lib/audio/sound-engine";
import { getSpecialtyById } from "@/lib/game/profile-specialty";
import { TimerBar, Confetti } from "@/components/ui/primitives";
import { AppIcon } from "@/components/ui/icons";
import { LaLigneGame } from "./la-ligne";
import { BuzzerScreen } from "./buzzer-screen";
import { LeCutModal } from "./le-cut-modal";
import { ArtworkViewer } from "./artwork-viewer";
import { calculateSeasonPointsAwarded } from "@/lib/game/leagues";
import {
  Zap,
  Trophy,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ShieldAlert,
} from "lucide-react";

export function PrismGame() {
  const router = useRouter();
  const config = useGameStore((s) => s.config);
  const { entries, addEntry, addReport } = useHistoryStore();

  const [gameState, setGameState] = useState<PrismGameState | null>(null);
  const [questionsPool, setQuestionsPool] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answeredIndex, setAnsweredIndex] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stealTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialisation et chargement des questions
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const playersConfig = config?.players && config.players.length > 0
          ? config.players
          : [
              { id: "p1", name: "Dany", specialtyId: "cinema", color: 0, score: 0, correct: 0, wrong: 0 },
              { id: "p2", name: "Anna", specialtyId: "litterature", color: 1, score: 0, correct: 0, wrong: 0 },
              { id: "p3", name: "Marc", specialtyId: "histoire", color: 2, score: 0, correct: 0, wrong: 0 },
              { id: "p4", name: "Lucy", specialtyId: "art", color: 3, score: 0, correct: 0, wrong: 0 },
            ];

        const initial = createInitialPrismState({
          duration: config?.duration ?? "express",
          thematicCategory: config?.category ?? "mixed",
          players: playersConfig,
        });

        const res = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            count: 35,
            category: config?.category,
            history: toSelectionHistory(entries),
          }),
        });

        if (!res.ok) throw new Error("Erreur de chargement des questions");
        const data = await res.json();
        if (cancelled) return;

        const pool = (data.questions ?? []) as Question[];
        if (pool.length === 0) {
          setError("Aucune question disponible pour cette discipline.");
          return;
        }

        setQuestionsPool(pool);
        initial.currentQuestion = pool[0];
        initial.phase = "turn-active";
        setGameState(initial);
        setLoading(false);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur inattendue");
      }
    }

    load();
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (stealTimerRef.current) clearInterval(stealTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentPhase = gameState?.phase;

  // Chronomètre du Tour Actif (15s)
  useEffect(() => {
    if (currentPhase !== "turn-active" || answeredIndex !== null) return;

    timerRef.current = setInterval(() => {
      setGameState((prev) => {
        if (!prev) return null;
        if (prev.questionTimeLeft <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          sound.playWrong();
          sound.playStealOpportunity();
          return {
            ...prev,
            questionTimeLeft: 0,
            phase: "turn-steal",
            stealTimeLeft: 5,
          };
        }
        if (prev.questionTimeLeft <= 4) sound.playTick();
        return { ...prev, questionTimeLeft: prev.questionTimeLeft - 1 };
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentPhase, answeredIndex]);

  // Passage à la question suivante
  const advanceToNextQuestion = useCallback(() => {
    setAnsweredIndex(null);
    setShowExplanation(false);

    setGameState((prev) => {
      if (!prev) return null;
      const nextQIndex = prev.currentQuestionIndex + 1;
      const nextPlayerIdx = (prev.activePlayerIndex + 1) % prev.players.length;

      // Déclenchement du Cut
      if (nextQIndex >= 12 || (prev.duration === "express" && nextQIndex >= 6)) {
        return {
          ...prev,
          phase: "le-cut",
        };
      }

      const nextQ = questionsPool[nextQIndex % questionsPool.length];
      const isRound2 = nextQIndex >= 4 && nextQIndex < 8;
      const isRound3 = nextQIndex >= 8;

      let nextPhase: PrismGameState["phase"] = "turn-active";
      let roundTitle = prev.roundTitle;
      let roundType: PrismGameState["roundType"] = "turn-based";

      if (isRound3) {
        nextPhase = "buzzer-wait";
        roundTitle = "Manche 3 · Buzzer & Indices";
        roundType = "buzzer";
      } else if (isRound2) {
        nextPhase = "turn-active";
        roundTitle = "Manche 2 · Duels de Catégories";
        roundType = "category-duel";
      }

      return {
        ...prev,
        phase: nextPhase,
        currentRound: isRound3 ? 3 : isRound2 ? 2 : 1,
        roundTitle,
        roundType,
        currentQuestionIndex: nextQIndex,
        currentQuestion: nextQ,
        activePlayerIndex: nextPlayerIdx,
        questionTimeLeft: 15,
        stealTimeLeft: 5,
        buzzerLockedById: null,
        buzzerLockouts: [],
        currentPointsValue: nextQ.progressiveClues ? 1000 : 100,
        progressiveClueIndex: 0,
      };
    });
  }, [questionsPool]);

  // Chronomètre de Steal (5s)
  useEffect(() => {
    if (!gameState || gameState.phase !== "turn-steal") return;

    stealTimerRef.current = setInterval(() => {
      setGameState((prev) => {
        if (!prev) return null;
        if (prev.stealTimeLeft <= 1) {
          if (stealTimerRef.current) clearInterval(stealTimerRef.current);
          advanceToNextQuestion();
          return { ...prev, stealTimeLeft: 0 };
        }
        return { ...prev, stealTimeLeft: prev.stealTimeLeft - 1 };
      });
    }, 1000);

    return () => {
      if (stealTimerRef.current) clearInterval(stealTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase]);

  // Réponse au Tour par Tour
  const handleActivePlayerAnswer = useCallback((index: number) => {
    if (!gameState || !gameState.currentQuestion || answeredIndex !== null) return;
    setAnsweredIndex(index);
    if (timerRef.current) clearInterval(timerRef.current);

    const q = gameState.currentQuestion;
    const correct = index === q.correctAnswer;

    if (correct) {
      sound.playCorrect();
      const speedBonus = calculateSpeedBonus(gameState.questionTimeLeft, 15);
      const totalPoints = 100 + speedBonus;

      setGameState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          players: prev.players.map((p, i) =>
            i === prev.activePlayerIndex
              ? {
                  ...p,
                  score: p.score + totalPoints,
                  correctAnswers: p.correctAnswers + 1,
                  fastBonusTotal: p.fastBonusTotal + speedBonus,
                }
              : p,
          ),
        };
      });

      addEntry({
        questionId: q.id,
        familyId: q.familyId,
        answeredCorrectly: true,
        responseTimeMs: (15 - gameState.questionTimeLeft) * 1000,
      });

      setShowExplanation(true);
      setTimeout(advanceToNextQuestion, 2000);
    } else {
      sound.playWrong();
      sound.playStealOpportunity();

      setGameState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          players: prev.players.map((p, i) =>
            i === prev.activePlayerIndex ? { ...p, wrongAnswers: p.wrongAnswers + 1 } : p,
          ),
          phase: "turn-steal",
          stealTimeLeft: 5,
        };
      });
    }
  }, [gameState, answeredIndex, addEntry, advanceToNextQuestion]);

  // Réponse d'un voleur (Steal)
  function handleStealAnswer(stealerPlayer: PrismPlayer, choiceIndex: number) {
    if (!gameState || !gameState.currentQuestion || stealTimerRef.current === null) return;
    if (stealTimerRef.current) clearInterval(stealTimerRef.current);

    const correct = choiceIndex === gameState.currentQuestion.correctAnswer;
    if (correct) {
      sound.playCorrect();
      setGameState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          players: prev.players.map((p) =>
            p.id === stealerPlayer.id
              ? { ...p, score: p.score + 50, stealsCount: p.stealsCount + 1 }
              : p,
          ),
        };
      });
    } else {
      sound.playWrong();
    }

    setShowExplanation(true);
    setTimeout(advanceToNextQuestion, 2000);
  }

  // Transition vers La Ligne après Le Cut
  function handleProceedToLaLigne(finalist1: PrismPlayer, finalist2: PrismPlayer) {
    sound.playDouble();
    setGameState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        phase: "la-ligne",
        roundTitle: "FINALE · LA LIGNE",
        laLigne: {
          cursorPosition: LALIGNE_INITIAL_POSITION,
          finalist1Id: finalist1.id,
          finalist2Id: finalist2.id,
          turnCount: 0,
          isDouble: false,
          secondsRemaining: LALIGNE_TIMER_SECONDS,
          winnerId: null,
          history: [],
        },
      };
    });
  }

  // Réponse dans La Ligne
  function handleLaLigneAnswer(finalistId: string, correct: boolean) {
    if (!gameState || !gameState.laLigne) return;
    const { nextState, winnerId } = processLaLigneAnswer(gameState.laLigne, finalistId, correct);

    if (winnerId) {
      sound.playVictory();
      setShowConfetti(true);
      setGameState((prev) => (prev ? { ...prev, phase: "champion", laLigne: nextState } : null));
    } else {
      const nextQ = questionsPool[(gameState.currentQuestionIndex + 1) % questionsPool.length];
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              currentQuestionIndex: prev.currentQuestionIndex + 1,
              currentQuestion: nextQ,
              laLigne: nextState,
            }
          : null,
      );
    }
  }

  function handleLaLigneTimeExpired() {
    if (!gameState || !gameState.laLigne) return;
    const final1 = gameState.players.find((p) => p.id === gameState.laLigne?.finalist1Id);
    const final2 = gameState.players.find((p) => p.id === gameState.laLigne?.finalist2Id);
    const winner = gameState.laLigne.cursorPosition > 5 ? final1 : final2;

    sound.playVictory();
    setShowConfetti(true);
    setGameState((prev) =>
      prev && prev.laLigne
        ? {
            ...prev,
            phase: "champion",
            laLigne: { ...prev.laLigne, winnerId: winner?.id ?? final1?.id ?? "p1" },
          }
        : null,
    );
  }

  // Vote Revanche
  function handleVoteRematch(playerId: string) {
    sound.playBuzzerPress();
    setGameState((prev) => {
      if (!prev) return null;
      const votes = prev.rematchVotes.includes(playerId)
        ? prev.rematchVotes
        : [...prev.rematchVotes, playerId];

      if (votes.length >= 2) {
        setTimeout(() => window.location.reload(), 300);
      }
      return { ...prev, rematchVotes: votes };
    });
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center text-center px-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/20 border border-violet-500/30 text-violet-300 animate-pulse">
          <Zap className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-sans text-xl font-bold text-white">PRISM</h1>
        <p className="mt-1.5 text-xs text-neutral-400">
          Sélection déterministe des questions d&apos;élite…
        </p>
      </main>
    );
  }

  if (error || !gameState) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <AlertCircle className="h-10 w-10 text-rose-400" />
        <h2 className="mt-4 font-sans text-xl font-bold text-white">Partie indisponible</h2>
        <p className="mt-2 text-xs text-neutral-400">{error ?? "Erreur inattendue"}</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="glass-primary mt-6 rounded-xl px-6 py-2.5 text-xs font-bold text-white"
        >
          Retour à l&apos;accueil
        </button>
      </main>
    );
  }

  const currentQ = gameState.currentQuestion;
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const activeSpecialty = getSpecialtyById(activePlayer.specialtyId);
  const otherPlayers = gameState.players.filter((_, i) => i !== gameState.activePlayerIndex);

  // -------------------------------------------------------------
  // PHASE : FINALE LA LIGNE
  // -------------------------------------------------------------
  if (gameState.phase === "la-ligne" && gameState.laLigne) {
    const f1 = gameState.players.find((p) => p.id === gameState.laLigne?.finalist1Id) ?? gameState.players[0];
    const f2 = gameState.players.find((p) => p.id === gameState.laLigne?.finalist2Id) ?? gameState.players[1];

    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-6">
        <LaLigneGame
          state={gameState.laLigne}
          finalist1={f1}
          finalist2={f2}
          currentQuestion={currentQ}
          onAnswer={handleLaLigneAnswer}
          onTimeExpired={handleLaLigneTimeExpired}
        />
      </main>
    );
  }

  // -------------------------------------------------------------
  // PHASE : LE CUT
  // -------------------------------------------------------------
  if (gameState.phase === "le-cut") {
    const sauvetageQ = questionsPool[gameState.currentQuestionIndex % questionsPool.length];
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center px-4 py-8">
        <LeCutModal
          players={gameState.players}
          sauvetageQuestion={sauvetageQ}
          onProceedToFinale={handleProceedToLaLigne}
        />
      </main>
    );
  }

  // -------------------------------------------------------------
  // PHASE : PODIUM & VICTOIRE DU CHAMPION
  // -------------------------------------------------------------
  if (gameState.phase === "champion") {
    const winnerId = gameState.laLigne?.winnerId ?? gameState.players[0].id;
    const champion = gameState.players.find((p) => p.id === winnerId) ?? gameState.players[0];
    const spec = getSpecialtyById(champion.specialtyId);
    const seasonPts = calculateSeasonPointsAwarded({
      placement: 1,
      isVictory: true,
      isFinalist: true,
      correctAnswersCount: champion.correctAnswers,
      streak: 3,
    });

    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center px-5 py-8 text-center animate-rise">
        {showConfetti && <Confetti />}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-widest text-amber-300 mb-4">
          <Trophy className="h-3.5 w-3.5" />
          <span>CHAMPION DE LA SESSION</span>
        </div>

        <h1 className="font-sans text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {champion.name}
        </h1>
        <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-violet-300 mt-2">
          <AppIcon name={spec.icon} className="h-3.5 w-3.5" />
          <span>Spécialiste {spec.name}</span>
        </p>

        <div className="glass-panel my-6 w-full rounded-3xl p-6 border-white/[0.1] text-left shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
            <span className="font-sans text-xs font-bold text-neutral-300">Gain de saison</span>
            <span className="font-mono text-lg font-black text-amber-300">+{seasonPts} PTS</span>
          </div>

          <div className="space-y-2.5 text-xs text-neutral-400">
            <div className="flex justify-between">
              <span>Victoire finale La Ligne</span>
              <span className="text-white font-semibold">+150 pts</span>
            </div>
            <div className="flex justify-between">
              <span>Bonnes réponses accumulées ({champion.correctAnswers})</span>
              <span className="text-white font-semibold">+{champion.correctAnswers * 5} pts</span>
            </div>
            <div className="flex justify-between">
              <span>Série de victoires (Bonus x3)</span>
              <span className="text-white font-semibold">+30 pts</span>
            </div>
          </div>
        </div>

        {/* Revanche */}
        <div className="w-full space-y-2.5">
          <button
            type="button"
            onClick={() => handleVoteRematch(gameState.players[0].id)}
            className="glass-primary flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/30"
          >
            <RefreshCw className="h-4 w-4" />
            <span>REVANCHE ({gameState.rematchVotes.length}/2 requis)</span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="glass-button w-full rounded-xl py-3 text-xs font-semibold text-neutral-300"
          >
            Retour au menu
          </button>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // PHASE : MANCHE BUZZER & INDICES PROGRESSIFS
  // -------------------------------------------------------------
  if (gameState.phase === "buzzer-wait" && currentQ) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 py-6">
        <BuzzerScreen
          question={currentQ}
          pointsValue={gameState.currentPointsValue}
          players={gameState.players}
          lockedPlayerId={gameState.buzzerLockedById}
          lockouts={gameState.buzzerLockouts}
          currentClueIndex={gameState.progressiveClueIndex}
          onBuzz={(pid) => setGameState((p) => (p ? { ...p, buzzerLockedById: pid } : null))}
          onSubmitAnswer={(pid, correct) => {
            if (correct) {
              setGameState((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  players: prev.players.map((pl) =>
                    pl.id === pid ? { ...pl, score: pl.score + prev.currentPointsValue } : pl,
                  ),
                };
              });
              setShowExplanation(true);
              setTimeout(advanceToNextQuestion, 2000);
            } else {
              setGameState((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  players: prev.players.map((pl) =>
                    pl.id === pid ? { ...pl, score: Math.max(0, pl.score - 50) } : pl,
                  ),
                  buzzerLockedById: null,
                  buzzerLockouts: [...prev.buzzerLockouts, pid],
                };
              });
            }
          }}
        />
      </main>
    );
  }

  // -------------------------------------------------------------
  // PHASE STANDARD : TOUR PAR TOUR & VOL DE QUESTION (STEAL)
  // -------------------------------------------------------------
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-12 pt-5">
      {/* Top HUD Apple Pro */}
      <header className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Quitter</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="font-sans text-xs font-bold uppercase tracking-wider text-violet-300">
            {gameState.roundTitle}
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            Question {gameState.currentQuestionIndex + 1}
          </span>
        </div>

        <span className="font-mono text-xs font-bold text-white bg-white/[0.04] border border-white/[0.08] px-3 py-1 rounded-full">
          {activePlayer.score} pts
        </span>
      </header>

      {/* Rangée des 4 Joueurs */}
      <div className="grid grid-cols-4 gap-2 my-3">
        {gameState.players.map((p, idx) => {
          const isActive = idx === gameState.activePlayerIndex;
          const spec = getSpecialtyById(p.specialtyId);
          return (
            <div
              key={p.id}
              className={`flex flex-col items-center rounded-xl p-2 border transition-all ${
                isActive
                  ? "border-violet-500/60 bg-violet-600/15 shadow-sm shadow-violet-600/20"
                  : "border-white/[0.06] bg-white/[0.02] opacity-60"
              }`}
            >
              <span className="font-sans text-xs font-bold text-white truncate max-w-full">
                {p.name}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-0.5">
                <AppIcon name={spec.icon} className="h-2.5 w-2.5" />
                <span className="font-mono">{p.score}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Timer de Réflexion (15s) */}
      {gameState.phase === "turn-active" && (
        <div className="my-2">
          <TimerBar seconds={gameState.questionTimeLeft} total={15} />
        </div>
      )}

      {/* Alerte Vol de Question (Steal 5s) */}
      {gameState.phase === "turn-steal" && (
        <div className="my-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-center animate-pulse">
          <div className="flex items-center justify-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <span className="font-sans text-xs font-bold text-rose-300">OPPORTUNITÉ DE VOL</span>
            <span className="font-mono text-xs font-bold text-white bg-rose-500/20 px-2 py-0.5 rounded-full">
              {gameState.stealTimeLeft}s
            </span>
          </div>
          <p className="text-xs text-neutral-300 mt-1">
            Les autres joueurs peuvent s&apos;emparer de cette question pour <strong>+50 pts</strong>.
          </p>
        </div>
      )}

      {/* Question & Oeuvre d'art */}
      {currentQ && (
        <section className="mt-4 flex-1 flex flex-col justify-between">
          <div className="glass-panel rounded-3xl p-6 border-white/[0.1] shadow-2xl">
            {/* Tag Catégorie / Spécialité */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-neutral-300">
                <AppIcon name={activeSpecialty.icon} className="h-3 w-3 text-violet-400" />
                <span>{currentQ.category} · {currentQ.difficulty}</span>
              </span>

              <span className="text-xs text-neutral-400">
                Tour de <strong className="text-white font-semibold">{activePlayer.name}</strong>
              </span>
            </div>

            {/* Oeuvre du musée si présente */}
            {currentQ.artwork && <ArtworkViewer artwork={currentQ.artwork} />}

            {/* Énoncé */}
            <h1 key={currentQ.id} className="animate-rise font-sans text-lg sm:text-2xl font-bold leading-snug text-white">
              {currentQ.question}
            </h1>

            {/* 4 choix de réponse Apple Pro */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentQ.answers.map((answer, i) => {
                let cls = "border-white/[0.08] bg-white/[0.03] text-neutral-200 hover:bg-white/[0.08] hover:border-white/[0.16]";
                if (answeredIndex !== null) {
                  if (i === currentQ.correctAnswer) cls = "border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold shadow-md shadow-emerald-500/20";
                  else if (i === answeredIndex) cls = "border-rose-500 bg-rose-500/20 text-rose-300";
                  else cls = "border-transparent bg-transparent opacity-30";
                }

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={answeredIndex !== null && gameState.phase !== "turn-steal"}
                    onClick={() => {
                      if (gameState.phase === "turn-active") handleActivePlayerAnswer(i);
                      else if (gameState.phase === "turn-steal") handleStealAnswer(otherPlayers[0], i);
                    }}
                    className={`flex items-center gap-3 rounded-xl border p-3.5 text-left text-xs sm:text-sm font-medium transition-all active:scale-[0.98] ${cls}`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-mono font-bold text-neutral-300">
                      {["A", "B", "C", "D"][i]}
                    </span>
                    <span className="flex-1 leading-snug">{answer}</span>
                  </button>
                );
              })}
            </div>

            {/* Explication concise */}
            {showExplanation && currentQ.explanation && (
              <div className="animate-fade mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-xs text-neutral-300 leading-relaxed">
                <span className="font-bold text-violet-300 mr-1.5">Éclairage :</span>
                {currentQ.explanation}
              </div>
            )}
          </div>

          {/* Signalement discret */}
          {showExplanation && !reportDone && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="text-[11px] text-neutral-400 hover:text-white transition-colors"
              >
                Signaler une anomalie sur cette question
              </button>
            </div>
          )}
        </section>
      )}

      {/* Modal Signalement */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" role="dialog">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 border-white/[0.15]">
            <h3 className="font-sans text-sm font-bold text-white mb-3">Signaler cette question</h3>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    if (currentQ) addReport(currentQ.id, r);
                    setReportOpen(false);
                    setReportDone(true);
                  }}
                  className="glass-button w-full text-left rounded-xl p-2.5 text-xs text-neutral-300 hover:text-white"
                >
                  {r.replace(/-/g, " ")}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setReportOpen(false)}
              className="mt-3 w-full py-2.5 text-xs text-neutral-400 hover:text-white"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
