"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AppIcon, type IconName } from "./icons";
import { ChevronRight } from "lucide-react";

/** Minuteur circulaire lisible sur mobile comme sur grand écran. */
export function ProgressRing({
  seconds,
  total,
  size = 56,
  stroke = 4,
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
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(23,24,41,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={danger ? "#dc2626" : "#ee6055"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.3s linear, stroke 0.2s ease" }}
        />
      </svg>
      <span
        className={`absolute font-mono font-semibold tabular-nums tracking-tight ${
          danger ? "text-fp-danger" : "text-fp-text"
        }`}
        style={{ fontSize: size * 0.32 }}
      >
        {Math.max(0, Math.ceil(seconds))}
      </span>
    </div>
  );
}

/** Barre de progression du temps. */
export function TimerBar({ seconds, total }: { seconds: number; total: number }) {
  const ratio = Math.max(0, Math.min(1, seconds / total));
  const isDanger = ratio < 0.25;
  const isWarning = ratio < 0.5;

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-fp-fill">
      <div
        className={`h-full rounded-full transition-[width] duration-300 ease-linear ${
          isDanger ? "bg-fp-danger" : isWarning ? "bg-fp-warning" : "bg-fp-primary"
        }`}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}

/** Contrôle segmenté familier. */
export function SegmentControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string; icon?: IconName }>;
  value: T;
  onChange: (val: T) => void;
}) {
  return (
    <div className="flex w-full items-center gap-1 rounded-xl border border-fp-border bg-fp-fill p-1">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-bold transition-all active:scale-[0.98] ${
              selected
                ? "bg-white text-fp-primary shadow-sm"
                : "text-fp-text-dim hover:text-fp-text"
            }`}
          >
            {opt.icon && <AppIcon name={opt.icon} className="h-3.5 w-3.5" />}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Confettis sobres pour podium */
export function Confetti({ count = 50 }: { count?: number }) {
  const [pieces, setPieces] = useState<Array<{ id: number; left: number; delay: number; duration: number; color: string; rotate: number }>>([]);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const colors = ["#ee6055", "#118b78", "#f4d35e", "#d94d43", "#90f1ef", "#277f91"];
    setPieces(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 2.2 + Math.random() * 1.4,
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

/** Ligne de sélection standard. */
export function ModeCard({
  title,
  subtitle,
  icon,
  iconBg = "bg-fp-primary",
  onClick,
  disabled,
}: {
  title: string;
  subtitle: string;
  icon: IconName | string;
  iconBg?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex min-h-[64px] w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-fp-primary/[0.035] active:bg-fp-primary/[0.07] active:scale-[0.99] disabled:opacity-40"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${iconBg} shadow-xs`}>
        <AppIcon name={icon} className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-semibold text-fp-text leading-tight">{title}</h3>
        <p className="mt-0.5 truncate text-[13px] text-fp-text-dim">{subtitle}</p>
      </div>
      <ChevronRight className="h-4.5 w-4.5 shrink-0 text-fp-text-dim/50 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

/** Titre de groupe. */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="px-1 pb-2 pt-5 text-[12px] font-bold uppercase tracking-[0.09em] text-fp-text-dim first:pt-0">
      {children}
    </h2>
  );
}

/** Badge discret */
export function PillBadge({
  children,
  colorClass = "bg-black/[0.05] text-fp-text-dim",
}: {
  children: ReactNode;
  colorClass?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-medium ${colorClass}`}>
      {children}
    </span>
  );
}

/** Pastille / Photo de profil joueur */
export function PlayerDot({
  name,
  colorIndex = 0,
  size = 36,
  avatarUrl,
}: {
  name: string;
  colorIndex?: number;
  size?: number;
  avatarUrl?: string | null;
}) {
  if (avatarUrl) {
    return (
      <span
        className="relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden shadow-xs border border-black/10 bg-black/[0.04]"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </span>
    );
  }

  const COLORS = ["#ee6055", "#118b78", "#f4d35e", "#d94d43", "#90f1ef", "#277f91", "#e8a93a", "#5f6b73"];
  const bg = COLORS[((colorIndex % COLORS.length) + COLORS.length) % COLORS.length];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-xs"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
