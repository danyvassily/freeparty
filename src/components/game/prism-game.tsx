"use client";

/**
 * Free Party — PRISM (mode compétitif signature)
 * Tour par tour → Duels → Buzzer → Le Cut → Finale La Ligne.
 * Multi-joueurs sur un appareil (2 à 8).
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGameStore, makePlayer } from "@/lib/store/game";
import { useHistoryStore } from "@/lib/store/history";
import {
  loadGameQuestions,
  markQuestionAnswered,
  markQuestionDisplayed,
} from "@/lib/questions/question-client";
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
import { CATEGORY_LABELS } from "@/lib/game/modes";
import { TimerBar, Confetti, PlayerDot, PillBadge } from "@/components/ui/primitives";
import { LaLigneGame } from "./la-ligne";
import { BuzzerScreen } from "./buzzer-screen";
import { LeCutModal } from "./le-cut-modal";
import { ArtworkViewer } from "./artwork-viewer";
import { Trophy, AlertCircle, ChevronLeft, Zap } from "lucide-react";

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Facile",
  medium: "Moyen",
  hard: "Difficile",
  expert: "Expert",
};

export function PrismGame() {
  const router = useRouter();
  const config = useGameStore((s) => s.config);
  const { entries, addReport } = useHistoryStore();

  const [gameState, setGameState] = useState<PrismGameState | null>(null);
  const [questionsPool, setQuestionsPool] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answeredIndex, setAnsweredIndex] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stealTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialisation et chargement des questions
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setShowConfetti(false);
        setAnsweredIndex(null);
        setShowExplanation(false);

        const playersConfig =
          config?.players && config.players.length >= 2
            ? config.players
            : [makePlayer(0, "Joueur 1"), makePlayer(1, "Joueur 2")];

        const initial = createInitialPrismState({
          duration: "express",
          thematicCategory: config?.category ?? "mixed",
          players: playersConfig.map((p) => ({
            id: p.id,
            name: p.name,
            avatarColor: p.color,
          })),
        });

        const data = await loadGameQuestions({
          count: 35,
          category: config?.category,
          players: playersConfig,
          history: entries,
          sessionId: config?.sessionId ?? crypto.randomUUID(),
        });
        if (cancelled) return;

        const pool = (data.questions ?? []) as Question[];
        if (pool.length === 0) {
          setError("Aucune question disponible pour cette catégorie.");
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
  }, [reloadKey]);

  const currentPhase = gameState?.phase;

  useEffect(() => {
    if (!gameState?.currentQuestion || !config?.players?.length) return;
    void markQuestionDisplayed({
      question: gameState.currentQuestion,
      players: config.players,
      sessionId: config.sessionId,
    });
  }, [gameState?.currentQuestion, config?.players, config?.sessionId]);

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
          return { ...prev, questionTimeLeft: 0, phase: "turn-steal", stealTimeLeft: 5 };
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
      if (nextQIndex >= 12) {
        return { ...prev, phase: "le-cut" };
      }

      const nextQ = questionsPool[nextQIndex % questionsPool.length];
      const isRound2 = nextQIndex >= 4 && nextQIndex < 8;
      const isRound3 = nextQIndex >= 8;

      let nextPhase: PrismGameState["phase"] = "turn-active";
      let roundTitle = prev.roundTitle;
      let roundType: PrismGameState["roundType"] = "turn-based";

      if (isRound3) {
        nextPhase = "buzzer-wait";
        roundTitle = "Manche 3 · Buzzer";
        roundType = "buzzer";
      } else if (isRound2) {
        nextPhase = "turn-active";
        roundTitle = "Manche 2 · Duels";
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
  const handleActivePlayerAnswer = useCallback(
    (index: number) => {
      if (!gameState || !gameState.currentQuestion || answeredIndex !== null) return;
      setAnsweredIndex(index);
      if (timerRef.current) clearInterval(timerRef.current);

      const q = gameState.currentQuestion;
      const correct = index === q.correctAnswer;
      const activeId = gameState.players[gameState.activePlayerIndex]?.id;
      const activePlayer = config?.players?.find((player) => player.id === activeId);
      if (activePlayer) {
        void markQuestionAnswered({
          question: q,
          player: activePlayer,
          sessionId: config?.sessionId ?? "00000000-0000-4000-8000-000000000000",
          correct,
          responseTimeMs: (15 - gameState.questionTimeLeft) * 1000,
        });
      }

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
    },
    [gameState, answeredIndex, config?.players, config?.sessionId, advanceToNextQuestion],
  );

  // Réponse d'un voleur (Steal)
  function handleStealAnswer(stealerPlayer: PrismPlayer, choiceIndex: number) {
    if (!gameState || !gameState.currentQuestion) return;
    if (stealTimerRef.current) clearInterval(stealTimerRef.current);

    const correct = choiceIndex === gameState.currentQuestion.correctAnswer;
    const stealer = config?.players?.find((player) => player.id === stealerPlayer.id);
    if (stealer) {
      void markQuestionAnswered({
        question: gameState.currentQuestion,
        player: stealer,
        sessionId: config?.sessionId ?? "00000000-0000-4000-8000-000000000000",
        correct,
      });
    }
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
        roundTitle: "Finale · La Ligne",
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

  // ---------- Chargement ----------
  if (loading) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-black/10 border-t-fp-primary" />
        <h1 className="mt-4 text-[20px] font-semibold text-fp-text">Prism</h1>
        <p className="mt-1 text-[14px] text-fp-text-dim">Préparation des questions…</p>
      </main>
    );
  }

  if (error || !gameState) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fp-danger/10 text-fp-danger">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-[20px] font-semibold text-fp-text">Partie indisponible</h2>
        <p className="mt-2 text-[14px] text-fp-text-dim">{error ?? "Erreur inattendue"}</p>
        <button type="button" onClick={() => router.push("/")} className="fp-btn-primary mt-6 px-6 py-2.5 text-[15px]">
          Retour à l&apos;accueil
        </button>
      </main>
    );
  }

  const currentQ = gameState.currentQuestion;
  const activePlayer = gameState.players[gameState.activePlayerIndex];
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
  // PHASE : CHAMPION
  // -------------------------------------------------------------
  if (gameState.phase === "champion") {
    const winnerId = gameState.laLigne?.winnerId ?? gameState.players[0].id;
    const champion = gameState.players.find((p) => p.id === winnerId) ?? gameState.players[0];
    const ranking = [...gameState.players].sort((a, b) => b.score - a.score);

    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-16 pt-10 text-center animate-rise">
        {showConfetti && <Confetti />}
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-fp-warning/15 text-fp-warning">
          <Trophy className="h-7 w-7" />
        </div>
        <p className="mt-3 text-[13px] font-medium uppercase tracking-wide text-fp-text-dim">
          Champion de la partie
        </p>
        <h1 className="mt-1 text-[32px] font-bold tracking-tight text-fp-text">{champion.name}</h1>

        <div className="fp-list mt-8 text-left">
          {ranking.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-5 text-center text-[15px] font-semibold text-fp-text-dim tabular-nums">
                {i + 1}
              </span>
              <PlayerDot name={p.name} colorIndex={p.avatarColor} size={32} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-fp-text">{p.name}</p>
                <p className="text-[12px] text-fp-text-dim">
                  {p.correctAnswers} bonnes réponses{p.stealsCount > 0 ? ` · ${p.stealsCount} vol${p.stealsCount > 1 ? "s" : ""}` : ""}
                </p>
              </div>
              <span className="text-[15px] font-semibold text-fp-text tabular-nums">{p.score} pts</span>
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
              // Si tout le monde est verrouillé, on passe à la question suivante
              const allLocked = gameState.players.every(
                (pl) => pl.id === pid || gameState.buzzerLockouts.includes(pl.id),
              );
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
              if (allLocked) setTimeout(advanceToNextQuestion, 1200);
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
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-12 pt-3">
      {/* Barre de navigation */}
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="fp-btn-ghost inline-flex items-center gap-0.5 px-2 py-1 text-[15px]"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Quitter</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[13px] font-semibold text-fp-text">{gameState.roundTitle}</span>
          <span className="text-[12px] text-fp-text-dim tabular-nums">
            Question {gameState.currentQuestionIndex + 1}
          </span>
        </div>

        <span className="w-16" aria-hidden="true" />
      </header>

      {/* Joueurs */}
      <div className="fp-card mt-4 flex items-stretch gap-1 overflow-x-auto p-2">
        {gameState.players.map((p, idx) => {
          const isActive = idx === gameState.activePlayerIndex;
          return (
            <div
              key={p.id}
              className={`flex min-w-[72px] flex-1 flex-col items-center rounded-xl px-2 py-2 transition-all ${
                isActive ? "bg-fp-primary/10" : "opacity-50"
              }`}
            >
              <PlayerDot name={p.name} colorIndex={p.avatarColor} size={28} />
              <span className="mt-1 max-w-full truncate text-[12px] font-medium text-fp-text">
                {p.name}
              </span>
              <span className="text-[11px] font-semibold text-fp-text-dim tabular-nums">{p.score}</span>
            </div>
          );
        })}
      </div>

      {/* Timer de réflexion (15s) */}
      {gameState.phase === "turn-active" && (
        <div className="my-4">
          <TimerBar seconds={gameState.questionTimeLeft} total={15} />
        </div>
      )}

      {/* Alerte Vol de Question (Steal 5s) */}
      {gameState.phase === "turn-steal" && (
        <div className="my-4 rounded-2xl bg-fp-danger/10 p-3.5 text-center animate-pop">
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-4 w-4 text-fp-danger" />
            <span className="text-[14px] font-semibold text-fp-danger">Question à voler !</span>
            <span className="rounded-full bg-fp-danger/15 px-2 py-0.5 text-[12px] font-bold text-fp-danger tabular-nums">
              {gameState.stealTimeLeft}s
            </span>
          </div>
          <p className="mt-1 text-[13px] text-fp-text-dim">
            {otherPlayers[0]?.name ?? "Un autre joueur"} peut répondre pour <strong>+50 pts</strong>.
          </p>
        </div>
      )}

      {/* Question */}
      {currentQ && (
        <section className="mt-2 flex-1">
          <div className="fp-card p-5">
            <div className="flex items-center justify-between pb-3">
              <PillBadge>
                {CATEGORY_LABELS[currentQ.category]} · {DIFFICULTY_LABELS[currentQ.difficulty] ?? currentQ.difficulty}
              </PillBadge>
              <span className="text-[13px] text-fp-text-dim">
                Tour de <strong className="font-semibold text-fp-text">{activePlayer.name}</strong>
              </span>
            </div>

            {/* Oeuvre du musée si présente */}
            {currentQ.artwork && <ArtworkViewer artwork={currentQ.artwork} />}

            {/* Énoncé */}
            <h1 key={currentQ.id} className="animate-rise mt-2 text-[19px] font-semibold leading-snug text-fp-text sm:text-[22px]">
              {currentQ.question}
            </h1>

            {/* Réponses */}
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {currentQ.answers.map((answer, i) => {
                let cls = "bg-black/[0.03] text-fp-text hover:bg-black/[0.06]";
                if (answeredIndex !== null) {
                  if (i === currentQ.correctAnswer) cls = "bg-fp-success/15 font-semibold text-fp-text ring-2 ring-fp-success";
                  else if (i === answeredIndex) cls = "bg-fp-danger/15 text-fp-text ring-2 ring-fp-danger";
                  else cls = "opacity-35 bg-black/[0.02]";
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
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[14px] font-medium transition-all active:scale-[0.98] ${cls}`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-[12px] font-semibold text-fp-text-dim">
                      {["A", "B", "C", "D"][i]}
                    </span>
                    <span className="flex-1 leading-snug">{answer}</span>
                  </button>
                );
              })}
            </div>

            {/* Explication */}
            {showExplanation && currentQ.explanation && (
              <div className="animate-fade mt-4 rounded-xl bg-black/[0.03] p-3.5 text-[13px] leading-relaxed text-fp-text-dim">
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
                className="text-[13px] text-fp-text-dim underline-offset-2 hover:underline"
              >
                Signaler cette question
              </button>
            </div>
          )}
        </section>
      )}

      {/* Modal Signalement */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center" role="dialog" aria-modal="true">
          <div className="fp-card w-full max-w-sm p-5 animate-pop">
            <h3 className="text-[17px] font-semibold text-fp-text">Signaler cette question</h3>
            <div className="mt-4 space-y-1.5">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    if (currentQ) addReport(currentQ.id, r);
                    setReportOpen(false);
                    setReportDone(true);
                  }}
                  className="w-full rounded-xl bg-black/[0.03] px-4 py-2.5 text-left text-[14px] font-medium text-fp-text hover:bg-black/[0.06]"
                >
                  {r.replace(/-/g, " ")}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setReportOpen(false)}
              className="fp-btn-ghost mt-3 w-full py-2.5 text-[15px]"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
