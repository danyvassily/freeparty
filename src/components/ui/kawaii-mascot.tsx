"use client";

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
  | "sweating";

interface KawaiiMascotProps {
  theme: KawaiiTheme;
  size?: number;
  className?: string;
  alt?: string;
  animation?: "float" | "wobble" | "pop" | "none";
}

const MASCOT_SOURCES: Record<KawaiiTheme, { src: string; alt: string }> = {
  conference: {
    src: "/images/kawaii/conference.webp",
    alt: "Mascotte Débat Conférence à l'Assemblée Kawaii",
  },
  sweating: {
    src: "/images/kawaii/sad.webp", // fallback image with sweating badge
    alt: "Mascotte Débat Éprouvant - Ouf c'était chaud !",
  },
  referee: {
    src: "/images/kawaii/referee.webp",
    alt: "Mascotte Arbitre Kawaii - Prêt pour le départ !",
  },
  thinking: {
    src: "/images/kawaii/thinking.webp",
    alt: "Mascotte Qui Réfléchit Kawaii",
  },
  waiting: {
    src: "/images/kawaii/waiting-phone.webp",
    alt: "Mascotte En Attente sur son smartphone Kawaii",
  },
  happy: {
    src: "/images/kawaii/happy.webp",
    alt: "Mascotte Joyeuse - Bonne Réponse !",
  },
  sad: {
    src: "/images/kawaii/sad.webp",
    alt: "Mascotte Triste - Mauvaise Réponse",
  },
  quiz: {
    src: "/images/kawaii/quiz-brain.webp",
    alt: "Mascotte Quiz Érudit Kawaii",
  },
  debate: {
    src: "/images/kawaii/debate-chat.webp",
    alt: "Mascottes Duo Débat Kawaii",
  },
  party: {
    src: "/images/kawaii/party-trophy.webp",
    alt: "Mascotte Victoire & Soirée Kawaii",
  },
  speed: {
    src: "/images/kawaii/speed-buzzer.webp",
    alt: "Mascotte Rapidité & Buzzer Kawaii",
  },
};

export function KawaiiMascot({
  theme,
  size = 72,
  className = "",
  alt,
  animation = "float",
}: KawaiiMascotProps) {
  const info = MASCOT_SOURCES[theme] ?? MASCOT_SOURCES.quiz;

  const animClass =
    animation === "float"
      ? "animate-[kawaii-float_3s_ease-in-out_infinite]"
      : animation === "wobble"
        ? "animate-[kawaii-wobble_2.5s_ease-in-out_infinite]"
        : animation === "pop"
          ? "animate-pop"
          : "";

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-sm border border-black/[0.04] transition-transform duration-300 hover:scale-105 active:scale-95 ${animClass} ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={info.src}
        alt={alt ?? info.alt}
        width={size}
        height={size}
        className="h-full w-full object-cover"
        priority
      />
      {theme === "sweating" && (
        <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-xs text-[13px]" title="Ouf !">
          🥵
        </span>
      )}
    </div>
  );
}
