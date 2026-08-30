"use client";

/**
 * Free Party — La Ligne (finale PRISM)
 * 9 positions, curseur au centre, DOUBLE tous les 3 tours, chrono 90s.
 */
import { useEffect, useState } from "react";
import type { LaLigneState, PrismPlayer } from "@/lib/game/prism-engine";
import { sound } from "@/lib/audio/sound-engine";
import type { Question } from "@/lib/questions/schema";
import { CATEGORY_LABELS } from "@/lib/game/modes";
import { PlayerDot } from "@/components/ui/primitives";
import { Clock, Zap, Check, X, Trophy } from "lucide-react";

interface LaLigneProps {
  state: LaLigneState;
  finalist1: PrismPlayer;
  finalist2: PrismPlayer;
  currentQuestion: Question | null;
  onAnswer: (finalistId: string, isCorrect: boolean) => void;
  onTimeExpired: () => void;
}

export function LaLigneGame({
  state,
  finalist1,
  finalist2,
  currentQuestion,
  onAnswer,
  onTimeExpired,
}: LaLigneProps) {
  const [seconds, setSeconds] = useState(state.secondsRemaining);
  const [activeFinalistId, setActiveFinalistId] = useState<string>(finalist1.id);
  const [answeredIndex, setAnsweredIndex] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Chronomètre global de la finale (90s)
  useEffect(() => {
    if (state.winnerId) return;
    const timer = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer);
          onTimeExpired();
          return 0;
        }
        if (s <= 10) sound.playTick();
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state.winnerId, onTimeExpired]);

  function handleChoice(index: number) {
    if (answeredIndex !== null || !currentQuestion || state.winnerId) return;
    setAnsweredIndex(index);
    const correct = index === currentQuestion.correctAnswer;

    if (correct) {
      sound.playCorrect();
      sound.playLineMove(state.isDouble ? 2 : 1);
    } else {
      sound.playWrong();
    }

    setShowExplanation(true);

    setTimeout(() => {
      onAnswer(activeFinalistId, correct);
      setActiveFinalistId((prev) => (prev === finalist1.id ? finalist2.id : finalist1.id));
      setAnsweredIndex(null);
      setShowExplanation(false);
    }, 1600);
  }

  const activePlayer = activeFinalistId === finalist1.id ? finalist1 : finalist2;
  const cursorPercent = Math.min(94, Math.max(6, ((state.cursorPosition - 1) / 8) * 88 + 6));

  return (
    <div className="mx-auto flex min-h-[78vh] w-full max-w-2xl flex-col items-center justify-between px-4 py-3">
      {/* Header */}
      <div className="flex w-full items-center justify-between pb-3">
        <span className="text-[13px] font-semibold uppercase tracking-wide text-fp-text-dim">
          La Ligne · Finale
        </span>

        {state.isDouble && (
          <span className="inline-flex items-center gap-1 rounded-full bg-fp-warning/15 px-3 py-1 text-[12px] font-semibold text-fp-warning">
            <Zap className="h-3.5 w-3.5" />
            Double
          </span>
        )}

        <span className={`inline-flex items-center gap-1.5 rounded-full bg-black/[0.05] px-3 py-1 text-[13px] font-semibold tabular-nums ${seconds <= 15 ? "text-fp-danger" : "text-fp-text"}`}>
          <Clock className="h-3.5 w-3.5" />
          {seconds}s
        </span>
      </div>

      {/* Finalistes */}
      <div className="my-4 grid w-full grid-cols-2 gap-3">
        {[finalist1, finalist2].map((f) => {
          const isActive = activeFinalistId === f.id;
          return (
            <div
              key={f.id}
              className={`fp-card flex items-center gap-2.5 p-3 transition-all ${
                isActive ? "ring-2 ring-fp-primary" : "opacity-60"
              }`}
            >
              <PlayerDot name={f.name} colorIndex={f.avatarColor} size={34} />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-fp-text">{f.name}</p>
                <p className="text-[12px] text-fp-text-dim tabular-nums">{f.score} pts</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* LA LIGNE — 9 positions */}
      <div className="fp-card my-4 w-full p-5">
        <div className="mb-4 flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-wide text-fp-text-dim">
          <span>{finalist1.name}</span>
          <span>Centre</span>
          <span>{finalist2.name}</span>
        </div>

        <div className="relative flex h-12 w-full items-center justify-between px-2">
          <div className="absolute inset-x-4 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-black/[0.08]" />

          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((pos) => {
            const isCurrent = pos === state.cursorPosition;
            return (
              <div
                key={pos}
                className={`relative z-10 h-3.5 w-3.5 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? "scale-125 bg-fp-primary"
                    : pos === 5
                      ? "bg-black/25"
                      : "bg-black/[0.12]"
                }`}
              />
            );
          })}

          {/* Curseur */}
          <div
            className="absolute top-1/2 z-20 transition-all duration-500 ease-out"
            style={{ left: `${cursorPercent}%`, transform: "translate(-50%, -50%)" }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-fp-primary font-mono text-[13px] font-bold text-white shadow-lg shadow-fp-primary/40">
              {state.cursorPosition}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between px-1 text-[11px] text-fp-text-dim">
          <span>Victoire {finalist1.name}</span>
          <span>Victoire {finalist2.name}</span>
        </div>
      </div>

      {/* Question */}
      {currentQuestion && !state.winnerId && (
        <div className="fp-card w-full p-5 animate-rise">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-[13px] font-semibold text-fp-text">
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-fp-primary" />
              Au tour de {activePlayer.name}
            </span>
            <span className="text-[12px] text-fp-text-dim">{CATEGORY_LABELS[currentQuestion.category]}</span>
          </div>

          <h3 className="mb-4 text-[17px] font-semibold leading-snug text-fp-text sm:text-[19px]">
            {currentQuestion.question}
          </h3>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {currentQuestion.answers.map((ans, idx) => {
              const isSelected = answeredIndex === idx;
              const isCorrect = idx === currentQuestion.correctAnswer;
              let btnStyle = "bg-black/[0.03] text-fp-text hover:bg-black/[0.06]";

              if (answeredIndex !== null) {
                if (isCorrect) {
                  btnStyle = "bg-fp-success/15 font-semibold text-fp-text ring-2 ring-fp-success";
                } else if (isSelected) {
                  btnStyle = "bg-fp-danger/15 text-fp-text ring-2 ring-fp-danger";
                } else {
                  btnStyle = "opacity-35 bg-black/[0.02]";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleChoice(idx)}
                  disabled={answeredIndex !== null}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-left text-[14px] font-medium transition-all active:scale-[0.98] ${btnStyle}`}
                >
                  <span className="mr-2 flex-1">{ans}</span>
                  {answeredIndex !== null && isCorrect && <Check className="h-4 w-4 shrink-0 text-fp-success" />}
                  {answeredIndex !== null && isSelected && !isCorrect && <X className="h-4 w-4 shrink-0 text-fp-danger" />}
                </button>
              );
            })}
          </div>

          {showExplanation && currentQuestion.explanation && (
            <div className="mt-3 animate-fade rounded-xl bg-black/[0.03] p-3 text-[13px] leading-relaxed text-fp-text-dim">
              {currentQuestion.explanation}
            </div>
          )}
        </div>
      )}

      {/* Victoire */}
      {state.winnerId && (
        <div className="fp-card w-full p-8 text-center animate-pop">
          <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-fp-warning/15 text-fp-warning">
            <Trophy className="h-7 w-7" />
          </div>
          <h2 className="text-[24px] font-bold text-fp-text">
            {state.winnerId === finalist1.id ? finalist1.name : finalist2.name} remporte la finale !
          </h2>
        </div>
      )}
    </div>
  );
}
