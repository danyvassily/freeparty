"use client";

import { useState, useEffect } from "react";
import type { Question } from "@/lib/questions/schema";
import type { PrismPlayer } from "@/lib/game/prism-engine";
import { sound } from "@/lib/audio/sound-engine";
import { checkTypedAnswer } from "@/lib/game/prism-engine";

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
      {/* Header : Points en jeu & indices */}
      <div className="w-full flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-fp-text-dim">
            {isProgressive ? "INDICES PROGRESSIFS" : "MODE BUZZER"}
          </span>
        </div>

        <div className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 font-mono text-sm font-extrabold text-amber-300">
          +{pointsValue} PTS
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
                  className={`rounded-2xl border p-4 transition-all duration-300 ${
                    isRevealed
                      ? isCurrent
                        ? "border-amber-400/60 bg-amber-400/10 text-white animate-rise shadow-lg shadow-amber-400/5"
                        : "border-white/10 bg-white/5 text-white/70"
                      : "border-white/5 bg-white/[0.02] text-transparent select-none blur-sm"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-1 text-white/50">
                    <span>Indice {i + 1}</span>
                    <span>{pts} pts</span>
                  </div>
                  <p className="font-display text-base font-semibold leading-relaxed">
                    {isRevealed ? clue : "••••••••••••••••••••••••••••••••••••••••••••••••"}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <h2 className="font-display text-2xl font-bold text-white leading-snug animate-rise">
            {question.question}
          </h2>
        )}
      </div>

      {/* Zone Buzzer ou Zone de Réponse */}
      {!isAnswering ? (
        <div className="w-full flex flex-col items-center my-4">
          {/* Gros Bouton Buzzer Tactile */}
          <button
            type="button"
            onClick={() => handleBuzzerClick(players[0]?.id || "p1")}
            className="group relative flex h-40 w-40 sm:h-48 sm:w-48 items-center justify-center rounded-full border-4 border-amber-400/80 bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 shadow-[0_0_50px_rgba(245,158,11,0.4)] transition-transform active:scale-95 hover:shadow-[0_0_70px_rgba(245,158,11,0.6)]"
          >
            <div className="absolute inset-2 rounded-full border border-white/40 bg-white/10 backdrop-blur-sm pointer-events-none" />
            <div className="flex flex-col items-center pointer-events-none">
              <span className="text-3xl sm:text-4xl">⚡</span>
              <span className="font-display text-xl sm:text-2xl font-black uppercase tracking-widest text-black mt-1">
                BUZZ !
              </span>
            </div>
          </button>

          {/* Joueurs verrouillés / exclus sur cette question */}
          {lockouts.length > 0 && (
            <div className="mt-4 flex gap-2">
              {lockouts.map((pid) => {
                const p = players.find((pl) => pl.id === pid);
                return (
                  <span key={pid} className="rounded-full bg-rose-500/20 border border-rose-500/40 px-3 py-1 text-xs text-rose-300 font-semibold">
                    🔒 {p?.name ?? "Joueur"} (-50 pts)
                  </span>
                );
              })}
            </div>
          )}

          <p className="mt-4 text-xs text-fp-text-dim text-center">
            Premier à buzzer = droit de répondre. Erreur = <strong>-50 pts</strong> !
          </p>
        </div>
      ) : (
        /* Le joueur a buzzé : Formulaire de réponse (QCM ou Tape) */
        <div className="w-full fp-card p-5 border border-amber-400/40 bg-white/[0.05] animate-pop">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <span className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <span>⚡</span> {lockedPlayer?.name} a la main !
            </span>
            <span className="font-mono text-sm font-bold text-red-400 animate-pulse">
              ⏱️ {answerTimeLeft}s
            </span>
          </div>

          {isTypedMode ? (
            <form onSubmit={handleTypedSubmit} className="flex flex-col gap-3">
              <input
                autoFocus
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="Tape ta réponse…"
                className="w-full rounded-2xl border border-white/20 bg-fp-bg px-4 py-3.5 text-base font-semibold text-white outline-none focus:border-amber-400"
              />
              <button type="submit" className="fp-btn-primary w-full text-base font-bold">
                Valider
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {question.answers.map((ans, i) => {
                let btnCls = "border-white/10 bg-white/5 hover:border-amber-400/50 hover:bg-white/10";
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
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-left text-sm font-medium transition-all ${btnCls}`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-mono font-bold">
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
