"use client";

/**
 * Free Party — Le Cut (élimination avant la finale PRISM)
 * Les 2 premiers sont pré-qualifiés ; les suivants jouent une
 * question de sauvetage pour dérober la seconde place.
 */
import { useState } from "react";
import type { PrismPlayer } from "@/lib/game/prism-engine";
import type { Question } from "@/lib/questions/schema";
import { sound } from "@/lib/audio/sound-engine";
import { PlayerDot } from "@/components/ui/primitives";
import { Swords, Check, ArrowRight, Scissors } from "lucide-react";

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

    setTimeout(() => setPhase("qualification-revealed"), 1500);
  }

  function proceed() {
    const final2 = sauvetageWinner ?? top2;
    onProceedToFinale(top1, final2);
  }

  return (
    <div className="fp-card mx-auto my-auto w-full max-w-xl p-6 animate-pop sm:p-8">
      {/* Header */}
      <div className="pb-4 text-center">
        <div className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-fp-danger/10 text-fp-danger">
          <Scissors className="h-5 w-5" />
        </div>
        <h2 className="text-[24px] font-bold text-fp-text">Le Cut</h2>
        <p className="mx-auto mt-1 max-w-md text-[13px] text-fp-text-dim">
          {phase === "ranking"
            ? "Les 2 premiers sont qualifiés pour la finale. Les autres ont une question de sauvetage."
            : phase === "sauvetage-duel"
              ? "Une bonne réponse vole la seconde place de finaliste."
              : "Les deux finalistes sont désignés."}
        </p>
      </div>

      {phase === "ranking" && (
        <div className="my-4 space-y-2">
          {sorted.map((p, i) => {
            const isQualified = i < 2;
            return (
              <div key={p.id}>
                {i === 2 && (
                  <div className="my-3 flex items-center gap-2">
                    <div className="h-px flex-1 bg-fp-danger/30" />
                    <span className="rounded-full bg-fp-danger/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-fp-danger">
                      Ligne du cut
                    </span>
                    <div className="h-px flex-1 bg-fp-danger/30" />
                  </div>
                )}

                <div
                  className={`flex items-center gap-3 rounded-xl p-3 ${
                    isQualified ? "bg-fp-success/10" : "bg-black/[0.02] opacity-70"
                  }`}
                >
                  <span className="w-4 text-center text-[13px] font-semibold text-fp-text-dim tabular-nums">
                    {i + 1}
                  </span>
                  <PlayerDot name={p.name} colorIndex={p.avatarColor} size={30} />
                  <span className="flex-1 text-[14px] font-medium text-fp-text">{p.name}</span>
                  {isQualified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-fp-success/15 px-2 py-0.5 text-[11px] font-semibold text-fp-success">
                      <Check className="h-3 w-3" />
                      Qualifié
                    </span>
                  )}
                  <span className="text-[14px] font-semibold text-fp-text tabular-nums">{p.score} pts</span>
                </div>
              </div>
            );
          })}

          <div className="mt-6">
            {hasSauvetage ? (
              <button
                type="button"
                onClick={startSauvetage}
                className="fp-btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-[15px]"
              >
                <Swords className="h-4 w-4" />
                <span>Question de sauvetage — {p3?.name}{p4 ? ` vs ${p4.name}` : ""}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={proceed}
                className="fp-btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-[15px]"
              >
                <span>Accéder à la finale</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {phase === "sauvetage-duel" && sauvetageQuestion && (
        <div className="my-4 animate-rise">
          <div className="mb-4 rounded-xl bg-fp-warning/10 p-4">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-fp-warning">
              Question de sauvetage
            </span>
            <h3 className="text-[15px] font-semibold leading-snug text-fp-text">
              {sauvetageQuestion.question}
            </h3>
          </div>

          <div className="space-y-3">
            {[p3, p4].filter(Boolean).map((player) => (
              <div key={player!.id} className="rounded-xl bg-black/[0.02] p-3.5">
                <span className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-fp-text">
                  <PlayerDot name={player!.name} colorIndex={player!.avatarColor} size={22} />
                  {player!.name}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {sauvetageQuestion.answers.map((ans, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={answeredIndex !== null}
                      onClick={() => handleSauvetageAnswer(player!, idx)}
                      className="rounded-lg bg-white px-2.5 py-2 text-left text-[13px] font-medium text-fp-text shadow-sm transition hover:bg-black/[0.03] active:scale-[0.98] disabled:opacity-50"
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
        <div className="my-4 text-center animate-pop">
          <h3 className="text-[17px] font-semibold text-fp-text">
            {sauvetageWinner
              ? `${sauvetageWinner.name} réussit son sauvetage !`
              : "Le classement est maintenu."}
          </h3>

          <div className="my-4 flex flex-wrap justify-center gap-2">
            {[top1, sauvetageWinner ?? top2].map((f) => (
              <span key={f.id} className="inline-flex items-center gap-2 rounded-full bg-fp-primary/10 px-3.5 py-1.5 text-[13px] font-semibold text-fp-primary">
                <PlayerDot name={f.name} colorIndex={f.avatarColor} size={20} />
                {f.name}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={proceed}
            className="fp-btn-primary mt-2 inline-flex items-center gap-2 px-6 py-3 text-[15px]"
          >
            <span>Entrer dans La Ligne</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
