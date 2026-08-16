"use client";

import { useState, useEffect } from "react";
import type { Question } from "@/lib/questions/schema";
import type { PrismPlayer } from "@/lib/game/prism-engine";
import { sound } from "@/lib/audio/sound-engine";
import { checkTypedAnswer } from "@/lib/game/prism-engine";
import { Zap, Clock, Lock, AlertCircle, Sparkles } from "lucide-react";

interface BuzzerScreenProps {
  question: Question;
  pointsValue: number;
  players: PrismPlayer[];
  lockedPlayerId: string | null;
  lockouts: string[];
  currentClueIndex: number;
  onBuzz: (playerId: string) => void;
  onSubmitAnswer: (playerId: string, isCorrect: boolean) => void;
}

export function BuzzerScreen({
  question,
  pointsValue,
  players,
  lockedPlayerId,
  lockouts,
  currentClueIndex,
  onBuzz,
  onSubmitAnswer,
}: BuzzerScreenProps) {
  const [typedInput, setTypedInput] = useState("");
  const [answerTimeLeft, setAnswerTimeLeft] = useState(8);
  const [answeredIndex, setAnsweredIndex] = useState<number | null>(null);

  const lockedPlayer = players.find((p) => p.id === lockedPlayerId);
  const isAnswering = lockedPlayerId !== null;
  const isProgressive = !!question.progressiveClues && question.progressiveClues.length === 3;
  const isTypedMode = question.inputMode === "typed";

  // Chrono 8s pour le joueur qui a buzzé
  useEffect(() => {
    if (!isAnswering || !lockedPlayerId) return;

    const timer = setInterval(() => {
      setAnswerTimeLeft((tl) => {
        if (tl <= 1) {
          clearInterval(timer);
          // Timeout = mauvaise réponse (-50 pts)
          sound.playWrong();
          onSubmitAnswer(lockedPlayerId, false);
          return 0;
        }
        if (tl <= 3) sound.playTick();
        return tl - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAnswering, lockedPlayerId, onSubmitAnswer]);

  function handleBuzzerClick(playerId: string) {
    if (isAnswering || lockouts.includes(playerId)) return;
    setAnswerTimeLeft(8);
    setTypedInput("");
    setAnsweredIndex(null);
    sound.playBuzzerPress();
    onBuzz(playerId);
  }

  function handleChoiceQCM(index: number) {
    if (!lockedPlayerId || answeredIndex !== null) return;
    setAnsweredIndex(index);
    const correct = index === question.correctAnswer;
    if (correct) sound.playCorrect();
    else sound.playWrong();

    setTimeout(() => {
      onSubmitAnswer(lockedPlayerId, correct);
      setAnsweredIndex(null);
    }, 1200);
  }

  function handleTypedSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lockedPlayerId || !typedInput.trim()) return;
    const official = question.answers[question.correctAnswer];
    const correct = checkTypedAnswer(typedInput, question.acceptedTypedAnswers, official);

    if (correct) sound.playCorrect();
    else sound.playWrong();

    onSubmitAnswer(lockedPlayerId, correct);
    setTypedInput("");
  }

  return (
    <div className="flex flex-col items-center justify-between min-h-[70vh] w-full max-w-xl mx-auto px-4">
      {/* Header : Points en jeu & modalité */}
      <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
            {isProgressive ? "INDICES PROGRESSIFS" : "MANCHE BUZZER"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 font-mono text-xs font-extrabold text-amber-300">
          <Sparkles className="h-3 w-3" />
          <span>+{pointsValue} PTS</span>
        </div>
      </div>

      {/* Affichage des indices progressifs ou de la question */}
      <div className="w-full my-6 text-center">
        {isProgressive ? (
          <div className="space-y-3 text-left">
            {question.progressiveClues?.map((clue, i) => {
              const isRevealed = i <= currentClueIndex;
              const isCurrent = i === currentClueIndex;
              const pts = i === 0 ? 1000 : i === 1 ? 750 : 500;

              return (
                <div
                  key={i}
                  className={`glass-panel rounded-2xl p-4 transition-all duration-300 border ${
                    isRevealed
                      ? isCurrent
                        ? "border-amber-400/50 bg-amber-500/10 text-white shadow-lg shadow-amber-500/10 animate-rise"
                        : "border-white/[0.08] bg-white/[0.03] text-neutral-300"
                      : "border-white/[0.04] bg-white/[0.01] text-transparent select-none blur-sm"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1 text-neutral-400">
                    <span className="font-bold uppercase">Indice {i + 1}</span>
                    <span className="text-amber-300">{pts} pts</span>
                  </div>
                  <p className="font-sans text-sm sm:text-base font-semibold leading-relaxed">
                    {isRevealed ? clue : "••••••••••••••••••••••••••••••••••••••••••••••••"}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel rounded-3xl p-6 border-white/[0.1] shadow-xl">
            <h2 className="font-sans text-xl sm:text-2xl font-bold text-white leading-snug animate-rise">
              {question.question}
            </h2>
          </div>
        )}
      </div>

      {/* Zone Buzzer Tactile ou Zone de Réponse Active */}
      {!isAnswering ? (
        <div className="w-full flex flex-col items-center my-4">
          {/* Bouton Buzzer Apple Titanium & Neon */}
          <button
            type="button"
            onClick={() => handleBuzzerClick(players[0]?.id || "p1")}
            className="group relative flex h-40 w-40 sm:h-44 sm:w-44 items-center justify-center rounded-full border border-amber-400/40 bg-gradient-to-b from-amber-500/20 via-neutral-900 to-black shadow-[0_0_40px_rgba(245,158,11,0.25)] transition-all duration-200 active:scale-95 hover:shadow-[0_0_60px_rgba(245,158,11,0.45)] hover:border-amber-400/70"
          >
            {/* Halo pulsant */}
            <div className="absolute inset-1 rounded-full border border-amber-400/20 bg-amber-500/5 animate-pulse-ring pointer-events-none" />

            <div className="flex flex-col items-center pointer-events-none">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-black shadow-lg shadow-amber-400/40 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 fill-black" />
              </div>
              <span className="font-sans text-sm font-black uppercase tracking-widest text-white mt-3">
                BUZZER
              </span>
            </div>
          </button>

          {/* Joueurs verrouillés / exclus sur cette question */}
          {lockouts.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {lockouts.map((pid) => {
                const p = players.find((pl) => pl.id === pid);
                return (
                  <span key={pid} className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-1 text-xs text-rose-300 font-semibold">
                    <Lock className="h-3 w-3" />
                    <span>{p?.name ?? "Joueur"} (-50 pts)</span>
                  </span>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-center gap-1.5 text-xs text-neutral-400 text-center">
            <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>Premier à buzzer. Toute mauvaise réponse coûte <strong>50 points</strong>.</span>
          </div>
        </div>
      ) : (
        /* Formulaire de réponse pour le joueur ayant buzzé */
        <div className="w-full glass-panel rounded-3xl p-6 border-amber-400/40 bg-white/[0.04] animate-pop shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
              <Zap className="h-4 w-4" />
              <span>{lockedPlayer?.name} a la main</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-xs font-bold text-rose-400 animate-pulse bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
              <Clock className="h-3 w-3" />
              <span>{answerTimeLeft}s</span>
            </div>
          </div>

          {isTypedMode ? (
            <form onSubmit={handleTypedSubmit} className="flex flex-col gap-3">
              <input
                autoFocus
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="Tapez votre réponse…"
                className="w-full rounded-xl border border-white/[0.12] bg-black/50 px-4 py-3.5 text-sm font-semibold text-white outline-none focus:border-amber-400 transition-colors"
              />
              <button type="submit" className="glass-primary w-full py-3 rounded-xl text-sm font-bold text-white shadow-lg">
                Valider la réponse
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {question.answers.map((ans, i) => {
                let btnCls = "border-white/[0.08] bg-white/[0.03] text-neutral-200 hover:bg-white/[0.08] hover:border-white/[0.16]";
                if (answeredIndex !== null) {
                  if (i === question.correctAnswer) btnCls = "border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold";
                  else if (i === answeredIndex) btnCls = "border-rose-500 bg-rose-500/20 text-rose-300";
                  else btnCls = "opacity-30 border-transparent";
                }

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={answeredIndex !== null}
                    onClick={() => handleChoiceQCM(i)}
                    className={`flex items-center gap-3 rounded-xl border p-3.5 text-left text-xs sm:text-sm font-medium transition-all ${btnCls}`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-mono font-bold text-neutral-300">
                      {["A", "B", "C", "D"][i]}
                    </span>
                    <span className="flex-1 leading-snug">{ans}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
