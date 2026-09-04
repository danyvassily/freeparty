"use client";

import { useState } from "react";
import Image from "next/image";

export type KawaiiTheme =
  | "quiz"
  | "debate"
  | "party"
  | "speed"
  | "referee"
  | "thinking"
  | "waiting"
  | "happy"
  | "sad"
  | "conference"
  | "sweating"
  | string;

interface KawaiiMascotProps {
  theme: KawaiiTheme;
  size?: number;
  className?: string;
  alt?: string;
  animation?: "float" | "wobble" | "bounce" | "dance" | "celebrate" | "shake" | "pop" | "none";
}

const MASCOT_SOURCES: Record<string, { src: string; alt: string; emoji: string; bg: string }> = {
  conference: {
    src: "/images/kawaii/conference.webp",
    alt: "Mascotte Débat Conférence à l'Assemblée Kawaii",
    emoji: "🏛️",
    bg: "from-amber-100 to-orange-200",
  },
  sweating: {
    src: "/images/kawaii/sad.webp",
    alt: "Mascotte Débat Éprouvant - Ouf c'était chaud !",
    emoji: "🥵",
    bg: "from-orange-100 to-rose-200",
  },
  referee: {
    src: "/images/kawaii/referee.webp",
    alt: "Mascotte Arbitre Kawaii - Prêt pour le départ !",
    emoji: "🏁",
    bg: "from-blue-100 to-indigo-200",
  },
  thinking: {
    src: "/images/kawaii/thinking.webp",
    alt: "Mascotte Qui Réfléchit Kawaii",
    emoji: "🤔",
    bg: "from-purple-100 to-violet-200",
  },
  waiting: {
    src: "/images/kawaii/waiting-phone.webp",
    alt: "Mascotte En Attente sur son smartphone Kawaii",
    emoji: "⏳",
    bg: "from-sky-100 to-blue-200",
  },
  happy: {
    src: "/images/kawaii/happy.webp",
    alt: "Mascotte Joyeuse - Bonne Réponse !",
    emoji: "✨",
    bg: "from-emerald-100 to-green-200",
  },
  sad: {
    src: "/images/kawaii/sad.webp",
    alt: "Mascotte Triste - Mauvaise Réponse",
    emoji: "🥺",
    bg: "from-slate-100 to-gray-200",
  },
  quiz: {
    src: "/images/kawaii/quiz-brain.webp",
    alt: "Mascotte Quiz Érudit Kawaii",
    emoji: "🧠",
    bg: "from-indigo-100 to-purple-200",
  },
  "quiz-brain": {
    src: "/images/kawaii/quiz-brain.webp",
    alt: "Mascotte Quiz Érudit Kawaii",
    emoji: "🧠",
    bg: "from-indigo-100 to-purple-200",
  },
  debate: {
    src: "/images/kawaii/debate-chat.webp",
    alt: "Mascottes Duo Débat Kawaii",
    emoji: "💬",
    bg: "from-rose-100 to-pink-200",
  },
  "debate-chat": {
    src: "/images/kawaii/debate-chat.webp",
    alt: "Mascottes Duo Débat Kawaii",
    emoji: "💬",
    bg: "from-rose-100 to-pink-200",
  },
  party: {
    src: "/images/kawaii/party-trophy.webp",
    alt: "Mascotte Victoire & Soirée Kawaii",
    emoji: "🏆",
    bg: "from-amber-100 to-yellow-200",
  },
  "party-trophy": {
    src: "/images/kawaii/party-trophy.webp",
    alt: "Mascotte Victoire & Soirée Kawaii",
    emoji: "🏆",
    bg: "from-amber-100 to-yellow-200",
  },
  speed: {
    src: "/images/kawaii/speed-buzzer.webp",
    alt: "Mascotte Rapidité & Buzzer Kawaii",
    emoji: "⚡",
    bg: "from-red-100 to-amber-200",
  },
  "speed-buzzer": {
    src: "/images/kawaii/speed-buzzer.webp",
    alt: "Mascotte Rapidité & Buzzer Kawaii",
    emoji: "⚡",
    bg: "from-red-100 to-amber-200",
  },
  "waiting-phone": {
    src: "/images/kawaii/waiting-phone.webp",
    alt: "Mascotte En Attente sur son smartphone Kawaii",
    emoji: "⏳",
    bg: "from-sky-100 to-blue-200",
  },
};

export function KawaiiMascot({
  theme,
  size = 72,
  className = "",
  alt,
  animation = "float",
}: KawaiiMascotProps) {
  const [imgError, setImgError] = useState(false);
  const info = MASCOT_SOURCES[theme] ?? MASCOT_SOURCES.quiz;

  const animClass =
    animation === "float"
      ? "animate-[kawaii-float_3s_ease-in-out_infinite]"
      : animation === "wobble"
        ? "animate-[kawaii-wobble_2.5s_ease-in-out_infinite]"
        : animation === "bounce"
          ? "animate-[kawaii-bounce_1.35s_ease-in-out_infinite]"
          : animation === "dance"
            ? "animate-[kawaii-dance_1.8s_ease-in-out_infinite]"
            : animation === "celebrate"
              ? "animate-[kawaii-celebrate_1.2s_ease-in-out_infinite]"
              : animation === "shake"
                ? "animate-[kawaii-shake_0.8s_ease-in-out_both]"
                : animation === "pop"
                  ? "animate-pop"
                  : "";

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-sm border border-black/[0.04] transition-transform duration-300 hover:scale-105 active:scale-95 ${animClass} ${className}`}
      style={{ width: size, height: size }}
    >
      {!imgError ? (
        <Image
          src={info.src}
          alt={alt ?? info.alt}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          unoptimized
          priority
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${info.bg}`}
          style={{ fontSize: Math.max(18, Math.round(size * 0.45)) }}
          title={info.alt}
        >
          <span>{info.emoji}</span>
        </div>
      )}
      {theme === "sweating" && (
        <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-xs text-[13px]" title="Ouf !">
          🥵
        </span>
      )}
    </div>
  );
}
