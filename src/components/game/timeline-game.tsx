"use client";

/**
 * Free Party — Timeline
 * Replace les événements dans l'ordre chronologique.
 * Multi-joueurs : une manche chacun à son tour.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { pickTimelineSet } from "@/lib/game/timeline-data";
import { useSettingsStore } from "@/lib/store/settings";
import { useGameStore } from "@/lib/store/game";
import { PlayerDot, PillBadge } from "@/components/ui/primitives";
import { ChevronLeft, Clock } from "lucide-react";

export function TimelineGame() {
  const router = useRouter();
  const settings = useSettingsStore();
  const players = useGameStore((s) => s.config?.players) ?? [];
  const solo = players.length <= 1;

  const [round, setRound] = useState(0);
  const [setId, setSetId] = useState<string | null>(null);
  const [events, setEvents] = useState(() => pickTimelineSet(null).events);
  const [order, setOrder] = useState<number[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);

  const correctOrder = useMemo(() => [...events].sort((a, b) => a.year - b.year), [events]);
  const activeIdx = round % Math.max(1, players.length);
  const active = players[activeIdx];

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
    if (ok && active) {
      setScores((s) => ({ ...s, [active.id]: (s[active.id] ?? 0) + 10 }));
    }
    setTimeout(() => {
      if (round >= settings.timelineRounds - 1) {
        setFinished(true);
        return;
      }
      const next = pickTimelineSet(setId);
      setSetId(next.setId);
      setEvents(next.events);
      setOrder([]);
      setChecked(null);
      setRound((r) => r + 1);
    }, 2200);
  }

  function replay() {
    const first = pickTimelineSet(null);
    setRound(0);
    setSetId(first.setId);
    setEvents(first.events);
    setOrder([]);
    setChecked(null);
    setScores({});
    setFinished(false);
  }

  if (finished) {
    const ranking = players
      .map((p) => ({ player: p, score: scores[p.id] ?? 0 }))
      .sort((a, b) => b.score - a.score);

    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-16 pt-10 text-center animate-rise">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#5ac8fa]/15 text-[#5ac8fa]">
          <Clock className="h-7 w-7" />
        </div>
        <h1 className="mt-3 text-[26px] font-bold text-fp-text">
          {solo ? "Fin de partie" : `${ranking[0]?.player.name ?? ""} gagne !`}
        </h1>
        {solo ? (
          <p className="mt-1 text-[14px] text-fp-text-dim">{ranking[0]?.score ?? 0} points</p>
        ) : (
          <div className="fp-list mt-6 text-left">
            {ranking.map((r, i) => (
              <div key={r.player.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-5 text-center text-[15px] font-semibold text-fp-text-dim tabular-nums">{i + 1}</span>
                <PlayerDot name={r.player.name} colorIndex={r.player.color} size={30} />
                <span className="flex-1 text-[15px] font-medium text-fp-text">{r.player.name}</span>
                <span className="text-[15px] font-semibold text-fp-text tabular-nums">{r.score} pts</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-8 flex w-full gap-3">
          <button type="button" onClick={() => router.push("/")} className="fp-btn-secondary flex-1 py-3 text-[15px]">Accueil</button>
          <button type="button" onClick={replay} className="fp-btn-primary flex-1 py-3 text-[15px]">Rejouer</button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-10 pt-3">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.push("/")} className="fp-btn-ghost inline-flex items-center gap-0.5 px-2 py-1 text-[15px]" aria-label="Quitter">
          <ChevronLeft className="h-5 w-5" />
          Quitter
        </button>
        <PillBadge>Manche {round + 1}/{settings.timelineRounds}</PillBadge>
      </div>

      <div className="mt-6">
        <h1 className="text-[22px] font-bold text-fp-text">Du plus ancien au plus récent</h1>
        {!solo && active && (
          <p className="mt-1.5 inline-flex items-center gap-2 text-[14px] text-fp-text-dim">
            <PlayerDot name={active.name} colorIndex={active.color} size={22} />
            Au tour de {active.name} · {scores[active.id] ?? 0} pts
          </p>
        )}
      </div>

      {/* Ordre choisi */}
      <div className="mt-5 min-h-24 rounded-2xl border-2 border-dashed border-black/[0.1] bg-white/50 p-3">
        <div className="flex flex-wrap gap-2">
          {order.map((idx, pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => unselect(pos)}
              className="fp-card animate-pop px-3 py-2 text-[14px] font-semibold text-fp-text ring-1 ring-fp-primary/40"
            >
              {pos + 1}. {events[idx].label}
            </button>
          ))}
          {order.length === 0 && <span className="text-[14px] text-fp-text-dim">Touche les événements ci-dessous dans l&apos;ordre…</span>}
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
              className={`rounded-2xl px-4 py-3 text-left text-[15px] font-medium transition-all active:scale-[0.98] ${
                isUsed
                  ? isWrong
                    ? "bg-fp-danger/10 text-fp-text ring-2 ring-fp-danger opacity-70"
                    : "bg-black/[0.03] text-fp-text opacity-40"
                  : checked === true
                    ? "bg-fp-success/10 text-fp-text ring-2 ring-fp-success"
                    : "fp-card text-fp-text hover:bg-black/[0.02]"
              }`}
            >
              {ev.label}
            </button>
          );
        })}
      </div>

      {checked !== null && (
        <p className={`animate-pop mt-4 text-center text-[15px] font-semibold ${checked ? "text-fp-success" : "text-fp-danger"}`}>
          {checked ? "Parfait, ordre exact !" : "Pas tout à fait… regarde la bonne chronologie."}
        </p>
      )}
      {checked === false && (
        <p className="mt-2 text-center text-[13px] text-fp-text-dim">
          {correctOrder.map((e) => e.label).join(" → ")}
        </p>
      )}

      <button
        type="button"
        onClick={check}
        disabled={order.length !== events.length || checked !== null}
        className="fp-btn-primary mt-6 w-full py-3.5 text-[16px]"
      >
        Valider ({order.length}/{events.length})
      </button>
    </main>
  );
}
