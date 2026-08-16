"use client";

import { useEffect, useState } from "react";
import type { LaLigneState, PrismPlayer } from "@/lib/game/prism-engine";
import { sound } from "@/lib/audio/sound-engine";
import type { Question } from "@/lib/questions/schema";
import { getSpecialtyById } from "@/lib/game/profile-specialty";

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

  const spec1 = getSpecialtyById(finalist1.specialtyId);
  const spec2 = getSpecialtyById(finalist2.specialtyId);

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
      // Alterne le finaliste actif pour la question suivante
      setActiveFinalistId((prev) => (prev === finalist1.id ? finalist2.id : finalist1.id));
      setAnsweredIndex(null);
      setShowExplanation(false);
    }, 1600);
  }

  const activePlayer = activeFinalistId === finalist1.id ? finalist1 : finalist2;
  const activeSpec = getSpecialtyById(activePlayer.specialtyId);

  // Calcule la position relative en pourcentage (0% à 100% sur 9 points)
  // Position 1 = 5%, Position 5 (centre) = 50%, Position 9 = 95%
  const cursorPercent = Math.min(95, Math.max(5, ((state.cursorPosition - 1) / 8) * 90 + 5));

  return (
    <div className="flex flex-col items-center justify-between min-h-[78vh] w-full max-w-2xl mx-auto px-4 py-3">
      {/* Header : Titre, Chrono 90s, Multiplicateur DOUBLE */}
      <div className="w-full flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 rounded-full bg-red-500 animate-ping" />
          <span className="font-display text-sm font-bold tracking-widest uppercase text-white/90">
            LA LIGNE — FINALE
          </span>
        </div>

        {state.isDouble && (
          <div className="animate-pulse rounded-full border border-amber-400/60 bg-amber-400/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-amber-300">
            ⚡ DOUBLE (2 cases)
          </div>
        )}

        <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-white/80 bg-white/5 border border-white/10 rounded-full px-3 py-1">
          <span>⏱️</span>
          <span className={seconds <= 15 ? "text-red-400 animate-pulse" : ""}>{seconds}s</span>
        </div>
      </div>

      {/* Duel Signature : Les 2 Finalistes & Le Tracé à 9 positions */}
      <div className="w-full my-6 fp-card p-6 border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
        {/* Noms et Spécialités des 2 Finalistes */}
        <div className="flex items-center justify-between mb-6">
          <div className={`flex flex-col items-start ${activeFinalistId === finalist1.id ? "scale-105 transition-transform" : "opacity-70"}`}>
            <span className="text-xs font-semibold text-violet-400">{spec1.emoji} {spec1.name}</span>
            <span className="font-display text-lg font-bold text-white flex items-center gap-2">
              {finalist1.name}
              {activeFinalistId === finalist1.id && <span className="h-2 w-2 rounded-full bg-violet-400 animate-ping" />}
            </span>
          </div>

          <span className="font-mono text-xs font-bold text-white/40 tracking-widest uppercase">VS</span>

          <div className={`flex flex-col items-end ${activeFinalistId === finalist2.id ? "scale-105 transition-transform" : "opacity-70"}`}>
            <span className="text-xs font-semibold text-cyan-400">{spec2.emoji} {spec2.name}</span>
            <span className="font-display text-lg font-bold text-white flex items-center gap-2">
              {activeFinalistId === finalist2.id && <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />}
              {finalist2.name}
            </span>
          </div>
        </div>

        {/* La Ligne Physique à 9 plots */}
        <div className="relative w-full py-6 flex items-center justify-between">
          {/* Ligne de fond */}
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-white/30 to-cyan-600 rounded-full" />

          {/* Les 9 plots */}
          {Array.from({ length: 9 }).map((_, i) => {
            const pos = i + 1;
            const isCenter = pos === 5;
            return (
              <div
                key={pos}
                className={`relative z-10 flex flex-col items-center justify-center transition-all ${
                  isCenter ? "h-5 w-5" : "h-3.5 w-3.5"
                }`}
              >
                <div
                  className={`rounded-full border transition-all ${
                    pos === state.cursorPosition
                      ? "h-5 w-5 bg-white border-white shadow-[0_0_15px_rgba(255,255,255,0.9)]"
                      : isCenter
                      ? "h-4 w-4 bg-white/40 border-white/60"
                      : "h-3 w-3 bg-fp-bg border-white/20"
                  }`}
                />
                <span className="absolute -bottom-5 text-[10px] font-mono text-white/30">{pos}</span>
              </div>
            );
          })}

          {/* Curseur dynamique / Pointeur */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500 ease-out z-20 pointer-events-none"
            style={{ left: `${cursorPercent}%` }}
          >
            <div className="flex flex-col items-center">
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 border-2 border-white shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-bounce flex items-center justify-center text-xs font-black text-black">
                ▲
              </div>
            </div>
          </div>
        </div>

        {/* Indication tactique */}
        <p className="mt-6 text-center text-xs text-fp-text-dim">
          Chaque bonne réponse pousse le curseur vers l&apos;adversaire. Atteins l&apos;extrémité pour triompher !
        </p>
      </div>

      {/* Question Active pour le finaliste au tour */}
      {currentQuestion && (
        <div className="w-full flex-1 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold px-3 py-1 rounded-full border border-white/10 bg-white/5 text-fp-text-dim">
              Au tour de : <strong className="text-white">{activePlayer.name}</strong> ({activeSpec.name})
            </span>
            <span className="text-xs font-mono text-white/40 uppercase">Tour {state.turnCount + 1}</span>
          </div>

          <h2 className="font-display text-xl sm:text-2xl font-bold text-white leading-snug mb-5 animate-rise">
            {currentQuestion.question}
          </h2>

          {/* QCM Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuestion.answers.map((answer, i) => {
              let btnClass = "border-white/10 bg-white/[0.04] text-white hover:border-white/30 hover:bg-white/[0.08]";
              if (answeredIndex !== null) {
                if (i === currentQuestion.correctAnswer) {
                  btnClass = "border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold animate-pop";
                } else if (i === answeredIndex) {
                  btnClass = "border-rose-500 bg-rose-500/20 text-rose-300 animate-shake";
                } else {
                  btnClass = "opacity-30 border-transparent bg-transparent";
                }
              }

              return (
                <button
                  key={i}
                  type="button"
                  disabled={answeredIndex !== null}
                  onClick={() => handleChoice(i)}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-all active:scale-[0.98] ${btnClass}`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold font-mono">
                    {["A", "B", "C", "D"][i]}
                  </span>
                  <span className="flex-1 leading-snug">{answer}</span>
                </button>
              );
            })}
          </div>

          {/* Explication culturelle post-réponse */}
          {showExplanation && currentQuestion.explanation && (
            <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-fp-text-dim animate-rise">
              💡 {currentQuestion.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
