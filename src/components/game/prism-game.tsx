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
import { LaLigneGame } from "./la-ligne";
import { BuzzerScreen } from "./buzzer-screen";
import { LeCutModal } from "./le-cut-modal";
import { ArtworkViewer } from "./artwork-viewer";
import { calculateSeasonPointsAwarded } from "@/lib/game/leagues";

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
          setError("Aucune question trouvée pour cette thématique.");
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

  // Chronomètre du Tour Actif (15s)
  useEffect(() => {
    if (!gameState || gameState.phase !== "turn-active" || answeredIndex !== null) return;

    timerRef.current = setInterval(() => {
      setGameState((prev) => {
        if (!prev) return null;
        if (prev.questionTimeLeft <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          sound.playWrong();
          // Déclenche la phase de Steal (Vol de question) pour les 3 autres
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
  }, [gameState?.phase, gameState?.currentQuestionIndex, answeredIndex]);

  // Chronomètre de Steal (5s)
  useEffect(() => {
    if (!gameState || gameState.phase !== "turn-steal") return;

    stealTimerRef.current = setInterval(() => {
      setGameState((prev) => {
        if (!prev) return null;
        if (prev.stealTimeLeft <= 1) {
          if (stealTimerRef.current) clearInterval(stealTimerRef.current);
          // Fin du steal sans preneur -> passe à la question suivante
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
  }, [gameState, answeredIndex, addEntry]);

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

  // Passer à la question ou manche suivante
  function advanceToNextQuestion() {
    setShowExplanation(false);
    setAnsweredIndex(null);
    setReportDone(false);

    setGameState((prev) => {
      if (!prev) return null;
      const nextQIndex = prev.currentQuestionIndex + 1;
      const nextPlayerIdx = (prev.activePlayerIndex + 1) % prev.players.length;

      // Passage des manches
      // Manche 1 (4 questions) -> Manche 2: Catégories & Duels
      // Manche 2 (4 questions) -> Manche 3: Buzzer & Clues
      // Manche 3 (4 questions) -> LE CUT !
      if (nextQIndex >= 12 || (prev.duration === "express" && nextQIndex >= 6)) {
        // Déclenche LE CUT
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
        roundTitle = "Manche 3 — Buzzer & Indices progressifs";
        roundType = "buzzer";
      } else if (isRound2) {
        nextPhase = "turn-active";
        roundTitle = "Manche 2 — Duels de Catégories";
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
  }

  // Transition vers La Ligne après Le Cut
  function handleProceedToLaLigne(finalist1: PrismPlayer, finalist2: PrismPlayer) {
    sound.playDouble();
    setGameState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        phase: "la-ligne",
        roundTitle: "FINALE — LA LIGNE",
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
      // Prochaine question de finale
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
    // Victoire selon le camp où se trouve le curseur
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

      // Si >= 2 joueurs acceptent la revanche, redémarre immédiatement !
      if (votes.length >= 2) {
        setTimeout(() => window.location.reload(), 300);
      }
      return { ...prev, rematchVotes: votes };
    });
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center text-center px-4">
        <div className="animate-spin-slow text-5xl">⚡</div>
        <h1 className="mt-4 font-display text-2xl font-bold text-white">PRISM</h1>
        <p className="mt-2 text-sm text-fp-text-dim animate-pulse">
          Calibrage des questions d&apos;élite & configuration des salons…
        </p>
      </main>
    );
  }

  if (error || !gameState) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl">⚠️</div>
        <h2 className="mt-4 font-display text-2xl font-bold text-white">Partie indisponible</h2>
        <p className="mt-2 text-sm text-fp-text-dim">{error ?? "Erreur inattendue"}</p>
        <button type="button" onClick={() => router.push("/")} className="fp-btn-primary mt-6">
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
        <div className="rounded-full border border-amber-400/50 bg-amber-400/10 px-4 py-1.5 text-xs font-mono font-extrabold uppercase tracking-widest text-amber-300 mb-4">
          CHAMPION DU PRISME
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-black text-white leading-tight">
          {champion.name}
        </h1>
        <p className="text-sm font-semibold text-violet-400 mt-1">
          {spec.emoji} Spécialiste {spec.name}
        </p>

        <div className="fp-card my-6 w-full p-6 border border-white/10 bg-white/[0.04] text-left">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <span className="font-display text-sm font-bold text-white/70">Points de saison</span>
            <span className="font-mono text-xl font-extrabold text-amber-300">+{seasonPts} PTS</span>
          </div>

          <div className="space-y-2 text-xs text-fp-text-dim">
            <div className="flex justify-between">
              <span>Victoire finale La Ligne</span>
              <span className="text-white font-semibold">+150 pts</span>
            </div>
            <div className="flex justify-between">
              <span>Bonnes réponses ({champion.correctAnswers})</span>
              <span className="text-white font-semibold">+{champion.correctAnswers * 5} pts</span>
            </div>
            <div className="flex justify-between">
              <span>Série de victoires (Streak x3)</span>
              <span className="text-white font-semibold">+30 pts</span>
            </div>
          </div>
        </div>

        {/* Revanche (2/4 joueurs nécessaires) */}
        <div className="w-full space-y-3">
          <button
            type="button"
            onClick={() => handleVoteRematch(gameState.players[0].id)}
            className="fp-btn-primary w-full text-lg font-bold"
          >
            🔄 REVANCHE ({gameState.rematchVotes.length}/2 requis)
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="fp-btn-ghost w-full text-sm"
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
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-10 pt-5">
      {/* Header : Manche active, Joueur au tour, Score */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-xs font-semibold text-fp-text-dim hover:text-white"
        >
          ✕ Quitter
        </button>

        <div className="flex flex-col items-center">
          <span className="font-display text-xs font-extrabold uppercase tracking-widest text-violet-400">
            {gameState.roundTitle}
          </span>
          <span className="text-[11px] font-mono text-white/50">
            Question {gameState.currentQuestionIndex + 1}
          </span>
        </div>

        <span className="font-mono text-xs font-extrabold text-amber-300 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
          {activePlayer.score} pts
        </span>
      </div>

      {/* Timer du tour */}
      {gameState.phase === "turn-active" && (
        <div className="mt-4">
          <TimerBar seconds={gameState.questionTimeLeft} total={15} />
        </div>
      )}

      {/* Alerte de Vol (Steal 5s) */}
      {gameState.phase === "turn-steal" && (
        <div className="mt-4 rounded-2xl border border-rose-500/50 bg-rose-500/10 p-3 text-center animate-pulse">
          <div className="flex items-center justify-center gap-2">
            <span className="text-rose-400 font-bold text-sm">⚡ OPPORTUNITÉ DE VOL !</span>
            <span className="font-mono text-xs font-bold text-white bg-rose-500/30 px-2 py-0.5 rounded-full">
              {gameState.stealTimeLeft}s
            </span>
          </div>
          <p className="text-xs text-fp-text-dim mt-1">
            Les autres joueurs peuvent voler cette question pour <strong>+50 pts</strong> !
          </p>
        </div>
      )}

      {/* Question & Oeuvre d'art le cas échéant */}
      {currentQ && (
        <section className="mt-5 flex-1 flex flex-col justify-between">
          <div>
            {/* Tag Catégorie / Spécialité */}
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-fp-text-dim flex items-center gap-1.5">
                <span>{activeSpecialty.emoji}</span>
                <span>{currentQ.category} · {currentQ.difficulty}</span>
              </span>

              <span className="text-xs text-white/70">
                Tour de : <strong className="text-white">{activePlayer.name}</strong>
              </span>
            </div>

            {/* Si c'est une question avec Peinture / Musée */}
            {currentQ.artwork && <ArtworkViewer artwork={currentQ.artwork} />}

            {/* Énoncé */}
            <h1 key={currentQ.id} className="animate-rise mt-4 font-display text-2xl font-bold leading-snug text-white">
              {currentQ.question}
            </h1>

            {/* Choix QCM */}
            <div className="mt-5 grid grid-cols-1 gap-2.5">
              {currentQ.answers.map((answer, i) => {
                let cls = "border-white/10 bg-white/[0.04] text-white hover:border-violet-500/60 hover:bg-white/[0.08]";
                if (answeredIndex !== null) {
                  if (i === currentQ.correctAnswer) cls = "border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold animate-pop";
                  else if (i === answeredIndex) cls = "border-rose-500 bg-rose-500/20 text-rose-300 animate-shake";
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
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-semibold transition-all active:scale-[0.98] ${cls}`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-mono font-bold">
                      {["A", "B", "C", "D"][i]}
                    </span>
                    <span className="flex-1">{answer}</span>
                  </button>
                );
              })}
            </div>

            {/* Explication culturelle post-réponse */}
            {showExplanation && currentQ.explanation && (
              <p className="animate-rise mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-fp-text-dim">
                💡 {currentQ.explanation}
              </p>
            )}
          </div>

          {/* Bouton de signalement discret */}
          {showExplanation && !reportDone && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="text-[11px] text-white/40 hover:text-white/80 transition-colors"
              >
                ⓘ Signaler une anomalie sur cette question
              </button>
            </div>
          )}
        </section>
      )}

      {/* Modal Signalement */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog">
          <div className="fp-card w-full max-w-sm p-5 border border-white/20 bg-fp-bg">
            <h3 className="font-display text-base font-bold text-white mb-3">Signaler cette question</h3>
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
                  className="w-full text-left rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-fp-text-dim hover:text-white hover:border-white/30"
                >
                  {r.replace(/-/g, " ")}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setReportOpen(false)}
              className="fp-btn-ghost mt-3 w-full text-xs"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
