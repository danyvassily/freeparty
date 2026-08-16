"use client";

import { useState } from "react";
import type { PrismPlayer } from "@/lib/game/prism-engine";
import type { Question } from "@/lib/questions/schema";
import { sound } from "@/lib/audio/sound-engine";
import { getSpecialtyById } from "@/lib/game/profile-specialty";
import { AppIcon } from "@/components/ui/icons";
import { Swords, Check, ArrowRight, Sparkles, AlertTriangle } from "lucide-react";

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
    const final2 = sauvetageWinner ?? top2;
    onProceedToFinale(top1, final2);
  }

  return (
    <div className="w-full max-w-xl mx-auto my-auto p-6 sm:p-8 glass-panel rounded-3xl border-white/[0.12] shadow-2xl animate-pop">
      {/* Header Le Cut */}
      <div className="text-center pb-4 border-b border-white/[0.08]">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-rose-300 mb-2">
          <AlertTriangle className="h-3 w-3" />
          <span>ÉLIMINATION HYBRIDE</span>
        </div>
        <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-white">LE CUT</h2>
        <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
          {phase === "ranking"
            ? "Les 2 premiers sont pré-qualifiés pour La Ligne. Les autres disposent d'une ultime question de sauvetage."
            : phase === "sauvetage-duel"
            ? "Question de sauvetage : une bonne réponse permet de dérober la seconde place de finaliste."
            : "Les deux finalistes sont officiellement désignés."}
        </p>
      </div>

      {phase === "ranking" && (
        <div className="my-6 space-y-2.5">
          {sorted.map((p, i) => {
            const spec = getSpecialtyById(p.specialtyId);
            const isQualified = i < 2;

            return (
              <div key={p.id}>
                {i === 2 && (
                  <div className="my-3 flex items-center gap-2">
                    <div className="h-px flex-1 bg-rose-500/40" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                      LIGNE DU CUT
                    </span>
                    <div className="h-px flex-1 bg-rose-500/40" />
                  </div>
                )}

                <div
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isQualified
                      ? "border-emerald-500/40 bg-emerald-500/10 text-white"
                      : "border-white/[0.06] bg-white/[0.02] text-neutral-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-neutral-400 w-4">{i + 1}</span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-sm font-bold text-white">{p.name}</span>
                        {isQualified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 text-[9px] uppercase font-mono font-bold">
                            <Check className="h-2.5 w-2.5" />
                            <span>Qualifié</span>
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-[11px] text-neutral-400 mt-0.5">
                        <AppIcon name={spec.icon} className="h-3 w-3" />
                        <span>{spec.name}</span>
                      </span>
                    </div>
                  </div>

                  <span className="font-mono text-sm font-bold text-white">{p.score} pts</span>
                </div>
              </div>
            );
          })}

          <div className="mt-6 flex gap-3">
            {hasSauvetage ? (
              <button
                type="button"
                onClick={startSauvetage}
                className="glass-primary flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30"
              >
                <Swords className="h-4 w-4" />
                <span>Lancer la Question de Sauvetage ({p3?.name} vs {p4?.name ?? "..."})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={proceed}
                className="glass-primary flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30"
              >
                <span>Accéder à La Ligne</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {phase === "sauvetage-duel" && sauvetageQuestion && (
        <div className="my-6 animate-rise">
          <div className="glass-panel-subtle rounded-2xl p-5 border border-amber-400/30 mb-5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-300 block mb-1">
              QUESTION DÉCISIVE DE SAUVETAGE
            </span>
            <h3 className="font-sans text-base font-bold text-white leading-snug">
              {sauvetageQuestion.question}
            </h3>
          </div>

          {/* Boutons pour P3 et P4 */}
          <div className="space-y-4">
            {[p3, p4].filter(Boolean).map((player) => (
              <div key={player.id} className="glass-panel rounded-2xl p-4 border-white/[0.08]">
                <span className="text-xs font-bold text-neutral-300 block mb-2.5">
                  Réponse de {player.name} :
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {sauvetageQuestion.answers.map((ans, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={answeredIndex !== null}
                      onClick={() => handleSauvetageAnswer(player, idx)}
                      className="glass-button rounded-xl p-2.5 text-left text-xs font-medium text-neutral-200 hover:text-white"
                    >
                      {ans}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === "qualification-revealed" && (
        <div className="my-6 text-center animate-pop">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30 mb-3">
            <Sparkles className="h-6 w-6" />
          </div>

          <h3 className="font-sans text-lg font-bold text-white">
            {sauvetageWinner
              ? `${sauvetageWinner.name} réussit son sauvetage et se qualifie !`
              : "Le classement initial est maintenu pour la finale."}
          </h3>

          <div className="my-4 flex justify-center gap-3">
            <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-4 py-1.5 text-xs font-bold text-cyan-300">
              Finaliste 1 : {top1.name}
            </span>
            <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-4 py-1.5 text-xs font-bold text-rose-300">
              Finaliste 2 : {(sauvetageWinner ?? top2).name}
            </span>
          </div>

          <button
            type="button"
            onClick={proceed}
            className="glass-primary mt-4 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold text-white shadow-lg shadow-violet-600/30"
          >
            <span>Entrer dans La Ligne</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
