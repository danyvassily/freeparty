"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AppIcon, type IconName } from "./icons";
import { ChevronRight } from "lucide-react";

/** Minuteur circulaire sobre (style iOS) */
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
          stroke="rgba(0,0,0,0.07)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={danger ? "#ff3b30" : "#007aff"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.3s linear, stroke 0.2s ease" }}
        />
      </svg>
      <span
        className={`absolute font-mono font-semibold tabular-nums tracking-tight ${danger ? "text-fp-danger" : "text-fp-text"}`}
        style={{ fontSize: size * 0.32 }}
      >
        {Math.max(0, Math.ceil(seconds))}
      </span>
    </div>
  );
}

/** Barre de timer linéaire sobre */
export function TimerBar({ seconds, total }: { seconds: number; total: number }) {
  const ratio = Math.max(0, Math.min(1, seconds / total));
  const isDanger = ratio < 0.25;
  const isWarning = ratio < 0.5;

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
      <div
        className={`h-full rounded-full transition-[width] duration-300 ease-linear ${
          isDanger ? "bg-fp-danger" : isWarning ? "bg-fp-warning" : "bg-fp-primary"
        }`}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}

/** Contrôle segmenté iOS */
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
    <div className="flex w-full items-center gap-0.5 rounded-[10px] bg-black/[0.06] p-0.5">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[13px] font-medium transition-all ${
              selected
                ? "bg-white text-fp-text shadow-sm"
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

/** Confettis sobres */
export function Confetti({ count = 60 }: { count?: number }) {
  const [pieces, setPieces] = useState<Array<{ id: number; left: number; delay: number; duration: number; color: string; rotate: number }>>([]);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const colors = ["#007aff", "#34c759", "#ff9500", "#ff2d55", "#af52de", "#5ac8fa"];
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

/** Ligne de liste iOS : icône carrée colorée + titre + sous-titre + chevron */
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
      className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-black/[0.02] active:bg-black/[0.05] disabled:opacity-40"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-white ${iconBg}`}>
        <AppIcon name={icon} className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-medium text-fp-text leading-tight">{title}</h3>
        <p className="mt-0.5 truncate text-[13px] text-fp-text-dim">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-fp-text-dim/60" />
    </button>
  );
}

/** Titre de section style Réglages (petites capitales grises) */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="px-4 pb-1.5 text-[13px] font-normal uppercase tracking-wide text-fp-text-dim">
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
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${colorClass}`}>
      {children}
    </span>
  );
}

/** Pastille couleur joueur (initiale) */
export function PlayerDot({ name, colorIndex, size = 36 }: { name: string; colorIndex: number; size?: number }) {
  const COLORS = ["#007aff", "#34c759", "#ff9500", "#ff2d55", "#af52de", "#5ac8fa", "#ffcc00", "#5856d6"];
  const bg = COLORS[((colorIndex % COLORS.length) + COLORS.length) % COLORS.length];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
