"use client";

import type { ArtworkMetadata } from "@/lib/questions/schema";
import { Landmark, ShieldCheck } from "lucide-react";

interface ArtworkViewerProps {
  artwork: ArtworkMetadata;
}

export function ArtworkViewer({ artwork }: ArtworkViewerProps) {
  return (
    <div className="w-full flex flex-col items-center my-4 animate-rise">
      {/* Cadre de galerie */}
      <div className="relative w-full max-h-[340px] sm:max-h-[400px] overflow-hidden rounded-2xl bg-neutral-900 shadow-md flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="w-full h-full object-contain max-h-[340px] sm:max-h-[400px] transition-transform duration-700 hover:scale-[1.02]"
          loading="eager"
        />

        {/* Cartel du Musée & Statut Open Access CC0 */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-2xl bg-black/80 backdrop-blur-xl px-4 py-2.5 border border-white/[0.1] text-xs">
          <div className="flex flex-col truncate pr-3">
            <span className="font-sans font-bold text-white truncate">{artwork.title}</span>
            <span className="text-[11px] text-neutral-400 truncate">
              {artwork.artist} {artwork.yearStart ? `· ${artwork.yearStart}` : ""}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {artwork.museum && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.08] border border-white/[0.08] px-2.5 py-0.5 text-[10px] font-medium text-neutral-300">
                <Landmark className="h-2.5 w-2.5 text-neutral-400" />
                <span>{artwork.museum}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold">
              <ShieldCheck className="h-2.5 w-2.5" />
              <span>CC0 Open Access</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
