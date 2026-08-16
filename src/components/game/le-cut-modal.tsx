"use client";

import { useState } from "react";
import type { PrismPlayer } from "@/lib/game/prism-engine";
import type { Question } from "@/lib/questions/schema";
import { sound } from "@/lib/audio/sound-engine";
import { getSpecialtyById } from "@/lib/game/profile-specialty";

interface LeCutModalProps {
  players: PrismPlayer[];
  sauvetageQuestion: Question | null;
  onProceedToFinale: (finalist1: PrismPlayer, finalist2: PrismPlayer) => void;
}

export function LeCutModal({
  players,
  sauvetageQuestion,
  onProceedToFinale,
}: LeCutModalProps) {
  const [phase, setPhase] = useState<"ranking" | "sauvetage-duel" | "qualification-revealed">("ranking");
  const [sauvetageWinner, setSauvetageWinner] = useState<PrismPlayer | null>(null);
  const [answeredIndex, setAnsweredIndex] = useState<number | null>(null);

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const top1 = sorted[0];
  const top2 = sorted[1];
  const p3 = sorted[2];
  const p4 = sorted[3];

  const hasSauvetage = !!(p3 && sauvetageQuestion);

  function startSauvetage() {
    sound.playDouble();
    setPhase("sauvetage-duel");
  }

  function handleSauvetageAnswer(player: PrismPlayer, index: number) {
    if (answeredIndex !== null || !sauvetageQuestion) return;
    setAnsweredIndex(index);
    const correct = index === sauvetageQuestion.correctAnswer;

    if (correct) {
      sound.playCorrect();
      setSauvetageWinner(player);
    } else {
      sound.playWrong();
      setSauvetageWinner(null);
    }

    setTimeout(() => {
      setPhase("qualification-revealed");
    }, 1500);
  }

  function proceed() {
    // Si un joueur du sauvetage a réussi, il remplace le 2e, sinon les 2 premiers restent
    const final2 = sauvetageWinner ?? top2;
    onProceedToFinale(top1, final2);
  }

  return (
    <div className="w-full max-w-xl mx-auto my-auto p-6 fp-card border border-white/15 bg-fp-bg/95 backdrop-blur-xl animate-pop">
      {/* Header Le Cut */}
      <div className="text-center pb-4 border-b border-white/10">
        <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-red-400">
          🔴 ÉLIMINATION HYBRIDE
        </span>
        <h2 className="font-display text-3xl font-extrabold text-white mt-1">LE CUT</h2>
        <p className="text-xs text-fp-text-dim mt-1">
          {phase === "ranking"
            ? "Les 2 premiers accèdent à la finale La Ligne. Les autres ont une dernière chance de sauvetage !"
            : phase === "sauvetage-duel"
            ? "Question de sauvetage : le plus rapide à répondre juste peut voler la 2e place !"
            : "Les deux finalistes sont désignés !"}
        </p>
      </div>

      {phase === "ranking" && (
        <div className="my-6 space-y-3">
          {sorted.map((p, i) => {
            const spec = getSpecialtyById(p.specialtyId);
            const isQualified = i < 2;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  isQualified
                    ? "border-emerald-500/50 bg-emerald-500/10 text-white font-bold"
                    : "border-rose-500/30 bg-rose-500/5 text-white/70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-black text-white/50">{i + 1}</span>
                  <div className="flex flex-col">
                    <span className="font-display text-base font-bold flex items-center gap-2">
                      {p.name}
                      {isQualified && (
                        <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 text-[10px] uppercase font-mono">
                          Qualifié
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-fp-text-dim">{spec.emoji} {spec.name}</span>
                  </div>
                </div>

                <span className="font-mono text-base font-extrabold text-amber-300">
                  {p.score} pts
                </span>
              </div>
            );
          })}

          {/* Bouton Action */}
          <div className="pt-4 flex gap-3">
            {hasSauvetage ? (
              <button
                type="button"
                onClick={startSauvetage}
                className="fp-btn-primary w-full text-base font-bold"
              >
                ⚡ Lancer le Sauvetage ({p3.name} & {p4?.name ?? "Challenger"})
              </button>
            ) : (
              <button
                type="button"
                onClick={proceed}
                className="fp-btn-primary w-full text-base font-bold"
              >
                🔴 Accéder à La Ligne
              </button>
            )}
          </div>
        </div>
      )}

      {phase === "sauvetage-duel" && sauvetageQuestion && (
        <div className="my-6 animate-rise">
          <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-3 mb-4 text-center">
            <span className="text-xs font-bold text-amber-300">
              Duel de sauvetage pour {p3?.name} {p4 ? `et ${p4.name}` : ""} !
            </span>
          </div>

          <h3 className="font-display text-xl font-bold text-white mb-4">
            {sauvetageQuestion.question}
          </h3>

          <div className="grid grid-cols-1 gap-2.5">
            {sauvetageQuestion.answers.map((ans, i) => (
              <button
                key={i}
                type="button"
                disabled={answeredIndex !== null}
                onClick={() => handleSauvetageAnswer(p3, i)}
                className={`p-3.5 rounded-xl border text-left text-sm font-semibold transition-all ${
                  answeredIndex !== null
                    ? i === sauvetageQuestion.correctAnswer
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold"
                      : "opacity-30 border-transparent"
                    : "border-white/10 bg-white/5 hover:border-amber-400/50 text-white"
                }`}
              >
                {ans}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "qualification-revealed" && (
        <div className="my-6 text-center animate-pop">
          <div className="text-5xl mb-3">🔥</div>
          <h3 className="font-display text-2xl font-bold text-white">Finalistes Confirmés !</h3>
          <p className="text-sm text-fp-text-dim mt-2 mb-6">
            {sauvetageWinner
              ? `${sauvetageWinner.name} a réussi son sauvetage et se qualifie pour La Ligne !`
              : `${top1.name} et ${top2.name} conservent leur place pour La Ligne !`}
          </p>

          <button
            type="button"
            onClick={proceed}
            className="fp-btn-primary w-full text-lg font-bold"
          >
            🔴 Lancer LA LIGNE
          </button>
        </div>
      )}
    </div>
  );
}
