"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { PlayerDot } from "@/components/ui/primitives";
import { buildRoundRoasts, type RoundRoastPlayer } from "@/lib/game/round-roast";

interface RoundRoastPanelProps {
  players: readonly (RoundRoastPlayer & { colorIndex?: number })[];
  seed: string;
}

export function RoundRoastPanel({ players, seed }: RoundRoastPanelProps) {
  const roasts = useMemo(() => buildRoundRoasts(players, seed), [players, seed]);
  const [failedGifs, setFailedGifs] = useState<Set<string>>(new Set());

  if (roasts.length === 0) return null;

  return (
    <section className="mt-8" aria-labelledby="round-roast-title">
      <div className="text-center">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-fp-primary">Le débrief qui pique</p>
        <h2 id="round-roast-title" className="mt-1 text-[22px] font-black text-fp-text">Le conseil de classe a parlé</h2>
        <p className="mt-1 text-[12px] text-fp-text-dim">C&apos;est taquin, jamais personnel — réclame ta revanche si ça fait trop mal.</p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {roasts.map((roast) => {
          const player = players.find((candidate) => candidate.id === roast.playerId)!;
          const gifFailed = failedGifs.has(roast.gif.id);
          return (
            <article key={roast.playerId} className="overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-sm">
              <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-fp-primary/15 to-fp-warning/20">
                {gifFailed ? (
                  <div className="flex h-full items-center justify-center text-6xl" role="img" aria-label="Réaction amusée">😏</div>
                ) : (
                  <Image
                    src={roast.gif.imageUrl}
                    alt={roast.gif.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, 320px"
                    unoptimized
                    className="object-cover"
                    onError={() => setFailedGifs((current) => new Set(current).add(roast.gif.id))}
                  />
                )}
                <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-black text-white backdrop-blur-sm">
                  #{roast.rank + 1}
                </span>
                <a
                  href={roast.gif.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-[9px] font-semibold text-white/85"
                >
                  {roast.gif.attribution}
                </a>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2.5">
                  <PlayerDot name={player.name} colorIndex={player.colorIndex ?? roast.rank} size={34} />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-black text-fp-text">{player.name}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-fp-primary">{roast.title}</p>
                  </div>
                </div>
                <p className="mt-3 text-[14px] font-medium leading-relaxed text-fp-text">{roast.comment}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
