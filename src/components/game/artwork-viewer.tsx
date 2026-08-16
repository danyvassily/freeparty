"use client";

import type { ArtworkMetadata } from "@/lib/questions/schema";

interface ArtworkViewerProps {
  artwork: ArtworkMetadata;
}

export function ArtworkViewer({ artwork }: ArtworkViewerProps) {
  return (
    <div className="w-full flex flex-col items-center my-4 animate-rise">
      {/* Image du chef-d'œuvre avec cadre Apple-like épuré */}
      <div className="relative w-full max-h-[320px] sm:max-h-[380px] overflow-hidden rounded-3xl border border-white/15 bg-black/40 shadow-2xl flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="w-full h-full object-contain max-h-[320px] sm:max-h-[380px] transition-transform duration-500 hover:scale-105"
          loading="eager"
        />

        {/* Badge Musée & Licence CC0 */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-2xl bg-black/70 backdrop-blur-md px-3.5 py-2 border border-white/10 text-xs">
          <div className="flex flex-col truncate pr-2">
            <span className="font-display font-bold text-white truncate">{artwork.title}</span>
            <span className="text-[11px] text-fp-text-dim truncate">
              {artwork.artist} {artwork.yearStart ? `(${artwork.yearStart})` : ""}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {artwork.museum && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80">
                🏛️ {artwork.museum}
              </span>
            )}
            <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold">
              CC0 / Open Access
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
