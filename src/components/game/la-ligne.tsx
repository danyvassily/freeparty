"use client";

import { useEffect, useState } from "react";
import type { LaLigneState, PrismPlayer } from "@/lib/game/prism-engine";
import { sound } from "@/lib/audio/sound-engine";
import type { Question } from "@/lib/questions/schema";
import { getSpecialtyById } from "@/lib/game/profile-specialty";
import { AppIcon } from "@/components/ui/icons";
import { Clock, Zap, Swords, Check, X, Sparkles } from "lucide-react";

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
  // Position 1 = 6%, Position 5 (centre) = 50%, Position 9 = 94%
  const cursorPercent = Math.min(94, Math.max(6, ((state.cursorPosition - 1) / 8) * 88 + 6));

  return (
    <div className="flex flex-col items-center justify-between min-h-[78vh] w-full max-w-2xl mx-auto px-4 py-3">
      {/* Header : Titre, Chrono 90s, Multiplicateur DOUBLE */}
      <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Swords className="h-3.5 w-3.5" />
          </div>
          <span className="font-sans text-xs font-bold tracking-wider uppercase text-neutral-300">
            LA LIGNE · FINALE
          </span>
        </div>

        {state.isDouble && (
          <div className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 shadow-sm shadow-amber-500/20 animate-pulse">
            <Zap className="h-3.5 w-3.5" />
            <span>DOUBLE (2 cases)</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-neutral-300 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 py-1">
          <Clock className="h-3.5 w-3.5 text-neutral-400" />
          <span className={seconds <= 15 ? "text-rose-400 font-extrabold animate-pulse" : ""}>{seconds}s</span>
        </div>
      </div>

      {/* Profils des 2 Finalistes */}
      <div className="w-full grid grid-cols-2 gap-3 my-4">
        {/* Finaliste 1 (Gauche / Cyan) */}
        <div
          className={`glass-panel rounded-2xl p-3.5 border transition-all duration-200 ${
            activeFinalistId === finalist1.id
              ? "border-cyan-500/60 bg-cyan-950/20 shadow-lg shadow-cyan-500/10"
              : "border-white/[0.06] bg-white/[0.02] opacity-70"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold text-sm">
              {finalist1.name.charAt(0)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-sans text-sm font-bold text-white truncate">
                {finalist1.name}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-cyan-400 font-medium truncate">
                <AppIcon name={spec1.icon} className="h-3 w-3" />
                <span>{spec1.name}</span>
              </span>
            </div>
          </div>
          <div className="mt-2 text-right">
            <span className="font-mono text-xs font-bold text-neutral-400">{finalist1.score} pts</span>
          </div>
        </div>

        {/* Finaliste 2 (Droite / Rose) */}
        <div
          className={`glass-panel rounded-2xl p-3.5 border transition-all duration-200 ${
            activeFinalistId === finalist2.id
              ? "border-rose-500/60 bg-rose-950/20 shadow-lg shadow-rose-500/10"
              : "border-white/[0.06] bg-white/[0.02] opacity-70"
          }`}
        >
          <div className="flex items-center justify-end gap-2.5">
            <div className="flex flex-col text-right min-w-0">
              <span className="font-sans text-sm font-bold text-white truncate">
                {finalist2.name}
              </span>
              <span className="flex items-center justify-end gap-1 text-[11px] text-rose-400 font-medium truncate">
                <AppIcon name={spec2.icon} className="h-3 w-3" />
                <span>{spec2.name}</span>
              </span>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-sm">
              {finalist2.name.charAt(0)}
            </div>
          </div>
          <div className="mt-2 text-left">
            <span className="font-mono text-xs font-bold text-neutral-400">{finalist2.score} pts</span>
          </div>
        </div>
      </div>

      {/* DISPOSITIF SIGNATURE : LA LIGNE (9 POSITIONS) */}
      <div className="w-full my-6 glass-panel rounded-3xl p-6 border-white/[0.1] shadow-2xl">
        <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 mb-4 px-2">
          <span className="text-cyan-400">Camp {finalist1.name}</span>
          <span className="text-neutral-500 font-normal">Méridien Central</span>
          <span className="text-rose-400">Camp {finalist2.name}</span>
        </div>

        {/* Rail physique des 9 positions */}
        <div className="relative w-full h-12 flex items-center justify-between px-2">
          {/* Ligne de fond */}
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-white/[0.08]" />

          {/* Repère central */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-0.5 bg-white/20" />

          {/* 9 plots interactifs */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((pos) => {
            const isCenter = pos === 5;
            const isP1Side = pos < 5;
            const isCurrent = pos === state.cursorPosition;

            return (
              <div
                key={pos}
                className={`relative z-10 flex h-4 w-4 items-center justify-center rounded-full border transition-all duration-300 ${
                  isCurrent
                    ? "scale-125 border-white bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                    : isCenter
                      ? "border-white/30 bg-neutral-800"
                      : isP1Side
                        ? "border-cyan-500/40 bg-cyan-950/60"
                        : "border-rose-500/40 bg-rose-950/60"
                }`}
              >
                {isCenter && !isCurrent && <span className="h-1 w-1 rounded-full bg-white/50" />}
              </div>
            );
          })}

          {/* Curseur dynamique magnétique */}
          <div
            className="absolute top-1/2 -translate-y-1/2 z-20 transition-all duration-500 ease-out"
            style={{ left: `${cursorPercent}%`, transform: "translate(-50%, -50%)" }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white font-mono text-xs font-black shadow-[0_0_24px_rgba(168,85,247,0.7)] border border-white/40">
              {state.cursorPosition}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 mt-4 px-2">
          <span>Position 1</span>
          <span className="text-neutral-500">Position 5 (Départ)</span>
          <span>Position 9</span>
        </div>
      </div>

      {/* Question Active pour le Finaliste en jeu */}
      {currentQuestion && !state.winnerId && (
        <div className="w-full glass-panel rounded-3xl p-6 border-white/[0.1] animate-rise">
          {/* Badge Tour Actif */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-violet-400 animate-ping" />
              <span className="font-sans text-xs font-bold text-white">
                Au tour de {activePlayer.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
              <AppIcon name={activeSpec.icon} className="h-3 w-3 text-violet-400" />
              <span>{currentQuestion.category}</span>
            </div>
          </div>

          <h3 className="font-sans text-base sm:text-lg font-bold text-white leading-snug mb-5">
            {currentQuestion.question}
          </h3>

          {/* 4 choix de réponse Apple Pro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {currentQuestion.answers.map((ans, idx) => {
              const isSelected = answeredIndex === idx;
              const isCorrect = idx === currentQuestion.correctAnswer;
              let btnStyle = "border-white/[0.08] bg-white/[0.03] text-neutral-200 hover:bg-white/[0.08] hover:border-white/[0.16]";

              if (answeredIndex !== null) {
                if (isCorrect) {
                  btnStyle = "border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-md shadow-emerald-500/20 font-bold";
                } else if (isSelected && !isCorrect) {
                  btnStyle = "border-rose-500 bg-rose-500/20 text-rose-300";
                } else {
                  btnStyle = "opacity-30 border-white/[0.04]";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleChoice(idx)}
                  disabled={answeredIndex !== null}
                  className={`flex items-center justify-between rounded-xl border p-3.5 text-left text-xs sm:text-sm font-medium transition-all ${btnStyle}`}
                >
                  <span className="flex-1 mr-2">{ans}</span>
                  {answeredIndex !== null && isCorrect && (
                    <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  )}
                  {answeredIndex !== null && isSelected && !isCorrect && (
                    <X className="h-4 w-4 shrink-0 text-rose-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explication concise */}
          {showExplanation && currentQuestion.explanation && (
            <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-xs text-neutral-300 leading-relaxed animate-fade">
              <span className="font-bold text-violet-300 mr-1.5">Éclairage :</span>
              {currentQuestion.explanation}
            </div>
          )}
        </div>
      )}

      {/* Victoire finale */}
      {state.winnerId && (
        <div className="w-full glass-panel rounded-3xl p-8 border-violet-500/40 text-center animate-pop shadow-2xl">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-amber-400 text-white shadow-xl shadow-violet-600/40 mb-4">
            <Sparkles className="h-8 w-8" />
          </div>

          <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-white">
            {state.winnerId === finalist1.id ? finalist1.name : finalist2.name} remporte La Ligne !
          </h2>
          <p className="mt-2 text-xs text-neutral-400 max-w-sm mx-auto">
            Victoire incontestable en finale après avoir repoussé la ligne hors du camp adverse.
          </p>
        </div>
      )}
    </div>
  );
}
