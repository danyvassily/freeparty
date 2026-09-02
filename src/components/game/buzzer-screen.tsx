"use client";

/**
 * Free Party — Buzzer (manche 3 PRISM)
 * Sur un appareil : chaque joueur a son propre bouton de buzz.
 * Mauvaise réponse = -50 pts et exclusion de la question.
 */
import { useState, useEffect } from "react";
import type { Question } from "@/lib/questions/schema";
import type { PrismPlayer } from "@/lib/game/prism-engine";
import { sound } from "@/lib/audio/sound-engine";
import { checkTypedAnswer } from "@/lib/game/prism-engine";
import { PlayerDot } from "@/components/ui/primitives";
import { Zap, Clock, Ban, Sparkles } from "lucide-react";

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
  const activePlayers = players.filter((p) => !lockouts.includes(p.id));

  // Chrono 8s pour le joueur qui a buzzé
  useEffect(() => {
    if (!isAnswering || !lockedPlayerId) return;

    const timer = setInterval(() => {
      setAnswerTimeLeft((tl) => {
        if (tl <= 1) {
          clearInterval(timer);
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
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-between px-4">
      {/* Header */}
      <div className="flex w-full items-center justify-between pb-2">
        <span className="text-[13px] font-semibold uppercase tracking-wide text-fp-text-dim">
          {isProgressive ? "Indices progressifs" : "Manche buzzer"}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-fp-warning/15 px-3 py-1 text-[13px] font-bold text-fp-warning tabular-nums">
          <Sparkles className="h-3.5 w-3.5" />
          +{pointsValue} pts
        </span>
      </div>

      {/* Indices progressifs ou question */}
      <div className="my-5 w-full text-center">
        {isProgressive ? (
          <div className="space-y-2.5 text-left">
            {question.progressiveClues?.map((clue, i) => {
              const isRevealed = i <= currentClueIndex;
              const isCurrent = i === currentClueIndex;
              const pts = i === 0 ? 1000 : i === 1 ? 750 : 500;

              return (
                <div
                  key={i}
                  className={`fp-card p-4 transition-all duration-300 ${
                    isRevealed
                      ? isCurrent
                        ? "ring-2 ring-fp-warning animate-rise"
                        : ""
                      : "select-none opacity-40"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-fp-text-dim">
                    <span className="uppercase tracking-wide">Indice {i + 1}</span>
                    <span className="tabular-nums">{pts} pts</span>
                  </div>
                  <p className="text-[14px] font-medium leading-relaxed text-fp-text sm:text-[15px]">
                    {isRevealed ? clue : "••••••••••••••••••••"}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="fp-card p-6">
            <h2 className="animate-rise text-[19px] font-semibold leading-snug text-fp-text sm:text-[22px]">
              {question.question}
            </h2>
          </div>
        )}
      </div>

      {/* Zone buzzer ou réponse */}
      {!isAnswering ? (
        <div className="my-4 flex w-full flex-col items-center">
          <p className="mb-3 text-[13px] font-medium text-fp-text-dim">Qui a buzzé ?</p>
          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
            {players.map((p) => {
              const locked = lockouts.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={locked}
                  onClick={() => handleBuzzerClick(p.id)}
                  className={`flex items-center justify-center gap-2 rounded-2xl py-4 transition-all active:scale-95 ${
                    locked
                      ? "bg-black/[0.03] text-fp-text-dim opacity-50"
                      : "bg-fp-primary text-white shadow-md shadow-fp-primary/30 hover:bg-fp-primary-press"
                  }`}
                >
                  {locked ? <Ban className="h-4 w-4" /> : <Zap className="h-4 w-4 fill-current" />}
                  <span className="max-w-[90px] truncate text-[14px] font-semibold">{p.name}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-center text-[12px] text-fp-text-dim">
            Premier à buzzer. Toute mauvaise réponse coûte <strong>50 points</strong>.
            {activePlayers.length === 0 && " Tout le monde est verrouillé — question suivante…"}
          </p>
        </div>
      ) : (
        /* Réponse du joueur ayant buzzé */
        <div className="fp-card w-full p-5 ring-2 ring-fp-warning animate-pop">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-fp-text">
              <PlayerDot name={lockedPlayer?.name ?? "?"} colorIndex={lockedPlayer?.avatarColor ?? 0} size={26} />
              <span>{lockedPlayer?.name} a la main</span>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold tabular-nums ${answerTimeLeft <= 3 ? "bg-fp-danger/15 text-fp-danger" : "bg-black/[0.05] text-fp-text"}`}>
              <Clock className="h-3 w-3" />
              {answerTimeLeft}s
            </span>
          </div>

          {isTypedMode ? (
            <form onSubmit={handleTypedSubmit} className="flex flex-col gap-3">
              <input
                autoFocus
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="Ta réponse…"
                className="fp-input w-full px-4 py-3 text-[15px] font-medium"
              />
              <button type="submit" className="fp-btn-primary w-full py-3 text-[15px]">
                Valider
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {question.answers.map((ans, i) => {
                let btnCls = "bg-black/[0.03] text-fp-text hover:bg-black/[0.06]";
                if (answeredIndex !== null) {
                  if (i === question.correctAnswer) btnCls = "bg-fp-success/15 font-semibold ring-2 ring-fp-success";
                  else if (i === answeredIndex) btnCls = "bg-fp-danger/15 ring-2 ring-fp-danger";
                  else btnCls = "opacity-35";
                }

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={answeredIndex !== null}
                    onClick={() => handleChoiceQCM(i)}
                    className={`fp-answer flex items-center gap-3 px-3.5 py-3 text-left text-[14px] font-medium text-fp-text ${btnCls}`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-[12px] font-semibold text-fp-text-dim">
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
