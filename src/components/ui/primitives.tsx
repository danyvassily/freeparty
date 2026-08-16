"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AppIcon, type IconName } from "./icons";
import { ChevronRight } from "lucide-react";

/** Minuteur circulaire avec dégradé Apple (spec §87 : timer animations) */
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
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={danger ? "#f43f5e" : "url(#prism-ring-gradient)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.3s linear, stroke 0.2s ease" }}
        />
        <defs>
          <linearGradient id="prism-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className={`absolute font-mono font-bold tabular-nums tracking-tight ${danger ? "text-rose-400" : "text-white"}`}
        style={{ fontSize: size * 0.32 }}
      >
        {Math.max(0, Math.ceil(seconds))}
      </span>
    </div>
  );
}

/** Timer linéaire Apple (barre de progression millimétrée) */
export function TimerBar({ seconds, total }: { seconds: number; total: number }) {
  const ratio = Math.max(0, Math.min(1, seconds / total));
  const isDanger = ratio < 0.25;
  const isWarning = ratio < 0.5;

  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className={`h-full rounded-full transition-[width] duration-300 ease-linear ${
          isDanger
            ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
            : isWarning
              ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
              : "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400"
        }`}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}

/** Contrôle segmenté style Apple iOS */
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
    <div className="flex w-full items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 backdrop-blur-md">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold tracking-wide transition-all ${
              selected
                ? "bg-white/[0.12] text-white shadow-sm shadow-black/40 border border-white/[0.12]"
                : "text-neutral-400 hover:text-neutral-200"
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

/** Confettis de victoire discrets et nobles */
export function Confetti({ count = 60 }: { count?: number }) {
  const [pieces, setPieces] = useState<Array<{ id: number; left: number; delay: number; duration: number; color: string; rotate: number }>>([]);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const colors = ["#7c3aed", "#a855f7", "#06b6d4", "#f59e0b", "#10b981", "#f5f5f7"];
    setPieces(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 2.2 + Math.random() * 1.5,
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

/** Carte de mode de jeu Apple Pro */
export function ModeCard({
  title,
  subtitle,
  icon,
  onClick,
  disabled,
  featured,
}: {
  title: string;
  subtitle: string;
  icon: IconName | string;
  onClick?: () => void;
  disabled?: boolean;
  featured?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative w-full overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 disabled:opacity-40 active:scale-[0.98] ${
        featured
          ? "glass-panel border-violet-500/30 hover:border-violet-500/60 shadow-[0_8px_32px_-8px_rgba(124,58,237,0.3)]"
          : "glass-panel-subtle hover:bg-white/[0.06] hover:border-white/[0.14]"
      }`}
    >
      {featured && (
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-600/15 blur-2xl transition-all group-hover:bg-violet-600/25" />
      )}

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all ${
              featured
                ? "bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30"
                : "border border-white/[0.08] bg-white/[0.04] text-neutral-300 group-hover:border-white/[0.15] group-hover:text-white"
            }`}
          >
            <AppIcon name={icon} className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-sans text-sm font-semibold tracking-tight text-white">{title}</h3>
              {featured && (
                <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                  Majeur
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-neutral-400 leading-relaxed line-clamp-1">{subtitle}</p>
          </div>
        </div>

        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-white">
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </button>
  );
}

/** Badge de statut ou de ligue */
export function PillBadge({
  children,
  icon,
  colorClass = "border-white/[0.1] bg-white/[0.05] text-neutral-300",
}: {
  children: ReactNode;
  icon?: IconName;
  colorClass?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${colorClass}`}>
      {icon && <AppIcon name={icon} className="h-3 w-3" />}
      <span>{children}</span>
    </span>
  );
}
