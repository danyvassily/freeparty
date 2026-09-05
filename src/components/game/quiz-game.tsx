"use client";

/**
 * Free Party — Quiz Classique / Vrai-Faux / Rapid Fire
 * Multi-joueurs sur un seul appareil : tour par tour avec écran
 * "passe l'appareil" entre chaque question, scores individuels.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Question } from "@/lib/questions/schema";
import { REPORT_REASONS } from "@/lib/questions/schema";
import { makePlayer, useGameStore, type Player } from "@/lib/store/game";
import { useHistoryStore } from "@/lib/store/history";
import {
  loadGameQuestions,
  markQuestionAnswered,
  markQuestionDisplayed,
} from "@/lib/questions/question-client";
import { useLanguageStore } from "@/lib/store/language";
import { localizeQuestion } from "@/lib/questions/localize";
import { CATEGORY_LABELS } from "@/lib/game/modes";
import { ProgressRing, TimerBar, Confetti, PlayerDot, PillBadge } from "@/components/ui/primitives";
import { KawaiiMascot } from "@/components/ui/kawaii-mascot";
import { RoundRoastPanel } from "@/components/game/round-roast-panel";
import { AlertCircle, Flag, ChevronLeft, HandMetal, Check, X } from "lucide-react";
import { sound } from "@/lib/audio/sound-engine";
import { isQuizAnswerCorrect, playerQuestionCount, startQuestionCountdown } from "@/lib/game/quiz-round";
import { recordEloResults } from "@/lib/ranking/client";

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
  const { entries, addReport } = useHistoryStore();

  const players: Player[] = useMemo(
    () => (config?.players?.length ? config.players : [makePlayer(0, "Joueur 1")]),
    [config],
  );
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
  const [sessionId, setSessionId] = useState(() => config?.sessionId ?? crypto.randomUUID());
  const eloRecordedRef = useRef(false);

  const answeredRef = useRef(false);
  const handleAnswerRef = useRef<(i: number) => void>(() => {});

  const timePerQuestion = config?.timePerQuestion ?? 15;
  const lang = useLanguageStore((s) => s.language);
  const currentRaw = questions[index];
  // Question affichée dans la langue choisie (repli français) ; l'index de
  // bonne réponse est identique dans toutes les langues.
  const current = useMemo(
    () => (currentRaw ? { ...currentRaw, ...localizeQuestion(currentRaw, lang) } : undefined),
    [currentRaw, lang],
  );
  const isLast = index >= questions.length - 1;
  const activePlayer = players[index % players.length];

  // Dérivation d'assertion binaire pour le mode Vrai ou Faux (50% vrai, 50% distracteur)
  const tfAssertion = useMemo(() => {
    if (mode !== "truefalse" || !current) return null;
    const charSum = current.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) + index;
    const isTrue = charSum % 2 === 0;

    if (isTrue) {
      return {
        proposedAnswer: current.answers[current.correctAnswer],
        isTrue: true,
      };
    } else {
      const wrongIndices = [0, 1, 2, 3].filter((i) => i !== current.correctAnswer);
      const chosenWrongIndex = wrongIndices[charSum % wrongIndices.length];
      return {
        proposedAnswer: current.answers[chosenWrongIndex],
        isTrue: false,
      };
    }
  }, [mode, current, index]);

  // Chargement initial via l'API interne (anti-répétition serveur)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setPhase("loading");
        setIndex(0);
        setSelected(null);
        setScores({});
        eloRecordedRef.current = false;
        setError(null);
        setReportOpen(false);
        setReportDone(false);
        answeredRef.current = false;
        const data = await loadGameQuestions({
          count: mode === "rapidfire" ? 20 : mode === "truefalse" ? 10 : config?.questionCount ?? 10,
          category: config?.category,
          difficulties: config?.difficulty && config.difficulty !== "mixed" ? [config.difficulty] : undefined,
          players,
          history: entries,
          sessionId,
          language: lang,
        });
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  useEffect(() => {
    if (phase !== "results" || eloRecordedRef.current || players.length < 2) return;
    eloRecordedRef.current = true;
    void recordEloResults(sessionId, players, Object.fromEntries(players.map((p) => [p.id, scores[p.id]?.score ?? 0])));
  }, [phase, players, scores, sessionId]);

  const goNext = useCallback(() => {
    answeredRef.current = false;
    setSelected(null);
    setReportDone(false);
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

  useEffect(() => {
    if (phase !== "playing" || !currentRaw) return;
    void markQuestionDisplayed({
      question: currentRaw,
      players,
      sessionId,
    });
  }, [phase, currentRaw, players, sessionId]);

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      if (answeredRef.current || !current) return;
      answeredRef.current = true;
      setSelected(answerIndex);

      const correct = isQuizAnswerCorrect(answerIndex, currentRaw!.correctAnswer, tfAssertion?.isTrue);

      if (correct) {
        sound.playCorrect();
      } else {
        sound.playWrong();
      }

      const points = correct ? 10 : 0;
      setScores((s) => ({
        ...s,
        [activePlayer.id]: {
          score: (s[activePlayer.id]?.score ?? 0) + points,
          correct: (s[activePlayer.id]?.correct ?? 0) + (correct ? 1 : 0),
        },
      }));

      void markQuestionAnswered({
        question: currentRaw!,
        player: activePlayer,
        sessionId,
        correct,
        responseTimeMs: answerIndex === -1 ? timePerQuestion * 1000 : Math.round((timePerQuestion - timeLeft) * 1000),
      });

      setPhase("answer");
    },
    [current, currentRaw, activePlayer, sessionId, timePerQuestion, timeLeft, tfAssertion],
  );

  // Référence toujours fraîche pour le timer
  useEffect(() => {
    handleAnswerRef.current = handleAnswer;
  }, [handleAnswer]);

  // Timer
  useEffect(() => {
    if (phase !== "playing" || !currentRaw) return;
    return startQuestionCountdown(timePerQuestion, setTimeLeft, () => handleAnswerRef.current(-1));
  }, [phase, currentRaw, timePerQuestion]);

  useEffect(() => {
    if (phase !== "answer" || reportOpen) return;
    const timeout = setTimeout(goNext, 1800);
    return () => clearTimeout(timeout);
  }, [phase, reportOpen, goNext]);

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
          <div className="mx-auto mb-2 flex justify-center">
            <KawaiiMascot theme="party-dance" size={88} animation="celebrate" className="border border-black/[0.05] shadow-sm" />
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
                {r.correct}/{playerQuestionCount(total, players.findIndex((p) => p.id === r.player.id), players.length)} ✓
              </span>
              <span className="w-14 text-right text-[15px] font-semibold text-fp-text tabular-nums">
                {r.score} pts
              </span>
            </div>
          ))}
        </div>

        <RoundRoastPanel
          seed={sessionId}
          players={ranking.map((entry) => ({
            id: entry.player.id,
            name: entry.player.name,
            score: entry.score,
            correct: entry.correct,
            total: playerQuestionCount(total, players.findIndex((player) => player.id === entry.player.id), players.length),
            colorIndex: entry.player.color,
          }))}
        />

        <div className="mt-8 flex w-full gap-3">
          <button type="button" onClick={() => router.push("/")} className="fp-btn-secondary flex-1 py-3 text-[15px]">
            Accueil
          </button>
          <button type="button" onClick={() => { setSessionId(crypto.randomUUID()); setReloadKey((k) => k + 1); }} className="fp-btn-primary flex-1 py-3 text-[15px]">
            Rejouer
          </button>
        </div>
      </main>
    );
  }

  // ---------- Passage de relais (multi-joueurs, un appareil) ----------
  if (phase === "handoff" && activePlayer) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center px-6 text-center animate-rise">
        <p className="text-[13px] font-semibold uppercase tracking-wider text-fp-text-dim">
          Question {index + 1} sur {questions.length}
        </p>

        {/* Mascotte Arbitre Animée */}
        <div className="mt-6 flex flex-col items-center">
          <KawaiiMascot theme="referee" size={110} animation="bounce" className="shadow-md" />
          <div className="mt-4 flex items-center gap-2 rounded-full bg-black/[0.04] px-3.5 py-1.5">
            <PlayerDot name={activePlayer.name} colorIndex={activePlayer.color} size={28} />
            <span className="text-[15px] font-bold text-fp-text">{activePlayer.name}</span>
          </div>
        </div>

        <h1 className="mt-4 text-[26px] sm:text-[30px] font-bold text-fp-text">
          À toi de jouer, {activePlayer.name} !
        </h1>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[14px] text-fp-text-dim">
          <HandMetal className="h-4 w-4" />
          Passe l&apos;appareil au bon joueur
        </p>

        <div className="mt-3">
          <PillBadge>{scores[activePlayer.id]?.score ?? 0} pts</PillBadge>
        </div>

        <button
          type="button"
          onClick={startTurn}
          className="fp-btn-primary mt-8 w-full max-w-xs py-4 text-[17px]"
        >
          C&apos;est parti !
        </button>
      </main>
    );
  }

  if (!current) return null;

  const isCorrect =
    phase === "answer" &&
    isQuizAnswerCorrect(selected, currentRaw.correctAnswer, tfAssertion?.isTrue);
  const isWrong = phase === "answer" && !isCorrect;

  // ---------- Jeu ----------
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl sm:max-w-3xl flex-col px-4 sm:px-6 pb-12 pt-3 animate-rise">
      {/* Barre de navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="fp-btn-ghost inline-flex items-center gap-1 px-2 py-1 text-[15px]"
          aria-label="Quitter la partie"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Quitter</span>
        </button>
        <span className="text-[14px] font-semibold text-fp-text-dim tabular-nums">
          {index + 1}/{questions.length}
        </span>
        {!solo && activePlayer ? (
          <span className="flex items-center gap-1.5">
            <PlayerDot name={activePlayer.name} colorIndex={activePlayer.color} size={26} />
            <span className="text-[14px] font-bold text-fp-text">{activePlayer.name}</span>
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

        {/* Mascotte interactive selon l'état de réflexion / résultat */}
        <div className="mt-4 flex items-center gap-3.5 rounded-2xl bg-white p-3.5 border border-black/[0.04] shadow-xs">
          {phase === "playing" && (
            <>
              <KawaiiMascot theme="thinking" size={62} animation="float" />
              <div>
                <p className="text-[14px] font-bold text-fp-text">Prends le temps de réfléchir 🤔</p>
                <p className="text-[12px] text-fp-text-dim">Sélectionne la réponse qui te semble exacte.</p>
              </div>
            </>
          )}
          {isCorrect && (
            <>
              <KawaiiMascot theme="happy" size={62} animation="celebrate" />
              <div>
                <p className="text-[14px] font-bold text-fp-success">Excellent ! Bonne réponse 🎉</p>
                <p className="text-[12px] text-fp-text-dim">+10 points pour votre score !</p>
              </div>
            </>
          )}
          {isWrong && (
            <>
              <KawaiiMascot theme="sad" size={62} animation="shake" />
              <div>
                <p className="text-[14px] font-bold text-fp-danger">Aïe… Mauvaise réponse 😢</p>
                <p className="text-[12px] text-fp-text-dim">Regarde l&apos;explication ci-dessous.</p>
              </div>
            </>
          )}
        </div>

        <h1 key={current.id} className="animate-rise mt-4 text-[22px] sm:text-[28px] font-bold leading-snug text-fp-text">
          {current.question}
        </h1>

        {mode === "truefalse" && tfAssertion ? (
          <div className="mt-6 space-y-4">
            {/* Proposition d'assertion */}
            <div className="rounded-2xl border-2 border-dashed border-fp-primary/30 bg-fp-primary/5 p-4 sm:p-5 text-center">
              <span className="text-[12px] font-bold uppercase tracking-wider text-fp-primary">Proposition</span>
              <p className="mt-1 text-[20px] sm:text-[24px] font-extrabold text-fp-text">
                « {tfAssertion.proposedAnswer} »
              </p>
            </div>

            {/* Deux gros boutons Vrai / Faux */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                type="button"
                disabled={phase === "answer"}
                onClick={() => handleAnswer(0)}
                className={`group flex min-h-[90px] sm:min-h-[100px] flex-col items-center justify-center rounded-2xl border-2 p-3 sm:p-4 font-black transition-all ${
                  phase === "answer"
                    ? tfAssertion.isTrue
                      ? "border-fp-success bg-fp-success text-white shadow-lg animate-pop"
                      : selected === 0
                        ? "border-fp-danger bg-fp-danger/10 text-fp-danger"
                        : "border-fp-border opacity-40 text-fp-text-dim"
                    : "border-fp-success/40 bg-white text-fp-success shadow-sm hover:border-fp-success hover:bg-fp-success/10 active:scale-[0.98]"
                }`}
              >
                <Check className="h-7 w-7 mb-1 transition-transform group-hover:scale-110" strokeWidth={3} />
                <span className="text-[19px] sm:text-[22px] tracking-wide">VRAI</span>
              </button>

              <button
                type="button"
                disabled={phase === "answer"}
                onClick={() => handleAnswer(1)}
                className={`group flex min-h-[90px] sm:min-h-[100px] flex-col items-center justify-center rounded-2xl border-2 p-3 sm:p-4 font-black transition-all ${
                  phase === "answer"
                    ? !tfAssertion.isTrue
                      ? "border-fp-success bg-fp-success text-white shadow-lg animate-pop"
                      : selected === 1
                        ? "border-fp-danger bg-fp-danger/10 text-fp-danger"
                        : "border-fp-border opacity-40 text-fp-text-dim"
                    : "border-fp-danger/40 bg-white text-fp-danger shadow-sm hover:border-fp-danger hover:bg-fp-danger/10 active:scale-[0.98]"
                }`}
              >
                <X className="h-7 w-7 mb-1 transition-transform group-hover:scale-110" strokeWidth={3} />
                <span className="text-[19px] sm:text-[22px] tracking-wide">FAUX</span>
              </button>
            </div>

            {/* Révélation si faux */}
            {phase === "answer" && !tfAssertion.isTrue && (
              <p className="animate-rise text-center text-[14px] font-medium text-fp-text-dim">
                La bonne réponse était : <strong className="text-fp-success font-bold">{current.answers[current.correctAnswer]}</strong>
              </p>
            )}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {current.answers.map((answer, i) => {
              let cls = "text-fp-text";
              let disabled = false;
              if (phase === "answer") {
                disabled = true;
                if (i === current.correctAnswer) {
                  cls = "border-2 border-fp-success bg-fp-success/10 text-fp-text animate-pop";
                } else if (i === selected) {
                  cls = "border-2 border-fp-danger bg-fp-danger/10 text-fp-text";
                } else {
                  cls = "opacity-40";
                }
              }
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleAnswer(i)}
                  className={`fp-answer flex min-h-[64px] items-center gap-3.5 px-5 py-4 text-left text-[16px] font-medium ${cls}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-[14px] font-bold text-fp-text-dim">
                    {["A", "B", "C", "D"][i]}
                  </span>
                  <span className="flex-1 leading-snug">{answer}</span>
                  {phase === "answer" && i === current.correctAnswer && (
                    <span className="font-bold text-fp-success text-lg" aria-hidden="true">✓</span>
                  )}
                  {phase === "answer" && i === selected && i !== current.correctAnswer && (
                    <span className="font-bold text-fp-danger text-lg" aria-hidden="true">✗</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

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
