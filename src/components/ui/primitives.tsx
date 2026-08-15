"use client";

import { useEffect, useRef, useState } from "react";

/** Minuteur circulaire avec dégradé (spec §87 : timer animations) */
export function ProgressRing({
  seconds,
  total,
  size = 64,
  stroke = 5,
  danger = false,
}: {
  seconds: number;
  total: number;
  size?: number;
  stroke?: number;
  danger?: boolean;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, seconds / total));
  const offset = circumference * (1 - ratio);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={danger ? "#fb7185" : "url(#fp-ring-gradient)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.4s linear, stroke 0.3s ease" }}
        />
        <defs>
          <linearGradient id="fp-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className={`absolute font-bold tabular-nums ${danger ? "text-fp-danger" : "text-white"}`}
        style={{ fontSize: size * 0.28 }}
      >
        {Math.max(0, Math.ceil(seconds))}
      </span>
    </div>
  );
}

/** Timer linéaire (barre de progression du temps) */
export function TimerBar({ seconds, total }: { seconds: number; total: number }) {
  const ratio = Math.max(0, Math.min(1, seconds / total));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full transition-[width] duration-300 ease-linear ${
          ratio < 0.25 ? "bg-fp-danger" : ratio < 0.5 ? "bg-fp-warning" : "bg-gradient-to-r from-fp-primary to-fp-primary-2"
        }`}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}

/** Confettis de victoire (spec §87) */
export function Confetti({ count = 80 }: { count?: number }) {
  const [pieces, setPieces] = useState<Array<{ id: number; left: number; delay: number; duration: number; color: string; rotate: number }>>([]);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const colors = ["#8b5cf6", "#d946ef", "#f59e0b", "#22d3ee", "#34d399", "#fb7185", "#f4f2ff"];
    setPieces(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotate: Math.random() * 360,
      })),
    );
  }, [count]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="fp-confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Carte de mode de jeu */
export function ModeCard({
  title,
  subtitle,
  emoji,
  gradient,
  onClick,
  disabled,
}: {
  title: string;
  subtitle: string;
  emoji: string;
  gradient: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="fp-card group relative w-full overflow-hidden p-5 text-left disabled:opacity-40"
    >
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-50 ${gradient}`}
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-3xl" aria-hidden="true">{emoji}</div>
          <h3 className="mt-3 font-display text-lg font-bold tracking-tight text-white">{title}</h3>
          <p className="mt-1 text-sm leading-snug text-fp-text-dim">{subtitle}</p>
        </div>
        <span className="mt-1 text-fp-text-dim transition-transform group-hover:translate-x-1">→</span>
      </div>
    </button>
  );
}
