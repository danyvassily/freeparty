"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { pickTimelineSet } from "@/lib/game/timeline-data";
import { useSettingsStore } from "@/lib/store/settings";

export function TimelineGame() {
  const router = useRouter();
  const settings = useSettingsStore();
  const [round, setRound] = useState(0);
  const [setId, setSetId] = useState<string | null>(null);
  const [events, setEvents] = useState(() => pickTimelineSet(null).events);
  const [order, setOrder] = useState<number[]>([]); // indices dans l'ordre choisi
  const [score, setScore] = useState(0);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);

  const correctOrder = useMemo(() => [...events].sort((a, b) => a.year - b.year), [events]);

  function pick(i: number) {
    if (checked !== null || order.includes(i)) return;
    setOrder((o) => [...o, i]);
  }

  function unselect(pos: number) {
    if (checked !== null) return;
    setOrder((o) => o.filter((_, idx) => idx !== pos));
  }

  function check() {
    if (order.length !== events.length) return;
    const ok = order.every((idx, pos) => events[idx].id === correctOrder[pos].id);
    setChecked(ok);
    if (ok) setScore((s) => s + 10);
    setTimeout(() => {
      if (ok && round >= settings.timelineRounds - 1) {
        setFinished(true);
        return;
      }
      const next = pickTimelineSet(setId);
      setSetId(next.setId);
      setEvents(next.events);
      setOrder([]);
      setChecked(null);
      setRound((r) => r + 1);
      if (!ok) setFinished(true);
    }, 2200);
  }

  if (finished) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-6 text-center">
        <div className="animate-pop text-6xl" aria-hidden="true">⏳</div>
        <h1 className="mt-4 font-display text-4xl font-bold">
          {score >= 20 ? "Maître du temps !" : "Fin de partie"}
        </h1>
        <p className="mt-2 text-fp-text-dim">
          {score} points sur {round + 1} manches
        </p>
        <div className="mt-8 flex w-full max-w-sm gap-3">
          <button type="button" onClick={() => router.push("/")} className="fp-btn-ghost flex-1">Accueil</button>
          <button type="button" onClick={() => window.location.reload()} className="fp-btn-primary flex-1">Rejouer</button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-10 pt-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.push("/")} className="text-xs font-semibold text-neutral-400 hover:text-white" aria-label="Quitter">✕ Quitter</button>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-semibold text-neutral-300">
          Manche {round + 1} · {score} pts
        </span>
      </div>

      <h1 className="mt-6 font-sans text-2xl sm:text-3xl font-extrabold text-white">Chronologie & Repères</h1>
      <p className="mt-2 text-xs text-neutral-400">Sélectionnez les événements dans l&apos;ordre chronologique exact (du plus ancien au plus récent).</p>

      {/* Ordre choisi */}
      <div className="mt-6 min-h-24 rounded-2xl border-2 border-dashed border-fp-border bg-fp-surface/40 p-3">
        <div className="flex flex-wrap gap-2">
          {order.map((idx, pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => unselect(pos)}
              className="animate-pop rounded-xl border border-fp-primary bg-fp-primary/15 px-3 py-2 text-sm font-semibold text-white"
            >
              {pos + 1}. {events[idx].label}
            </button>
          ))}
          {order.length === 0 && <span className="text-sm text-fp-text-dim/60">Sélectionne les événements ci-dessous…</span>}
        </div>
      </div>

      {/* Événements */}
      <div className="mt-4 grid gap-2">
        {events.map((ev, i) => {
          const isUsed = order.includes(i);
          const isWrong = checked === false && order.indexOf(i) !== correctOrder.findIndex((c) => c.id === ev.id);
          return (
            <button
              key={ev.id}
              type="button"
              onClick={() => pick(i)}
              disabled={isUsed || checked !== null}
              className={`rounded-2xl border-2 px-4 py-3 text-left font-semibold transition-all active:scale-[0.98] ${
                isUsed
                  ? isWrong
                    ? "border-fp-danger bg-fp-danger/10 opacity-60"
                    : "border-fp-border bg-fp-surface opacity-40"
                  : checked === true
                    ? "border-fp-success bg-fp-success/10"
                    : "border-fp-border bg-fp-surface hover:border-fp-primary"
              }`}
            >
              {ev.label}
            </button>
          );
        })}
      </div>

      {checked !== null && (
        <p className={`animate-pop mt-4 text-center font-bold ${checked ? "text-fp-success" : "text-fp-danger"}`}>
          {checked ? "✓ Parfait !" : "✗ Pas tout à fait…"}
        </p>
      )}

      <button
        type="button"
        onClick={check}
        disabled={order.length !== events.length || checked !== null}
        className="fp-btn-primary mt-6 w-full disabled:opacity-40"
      >
        Valider ({order.length}/{events.length})
      </button>
    </main>
  );
}
