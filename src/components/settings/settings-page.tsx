"use client";

import { useRouter } from "next/navigation";
import { useSettingsStore, TIME_OPTIONS } from "@/lib/store/settings";
import { useLanguageStore } from "@/lib/store/language";
import { translate } from "@/lib/i18n";

function TimePill({
  label,
  options,
  value,
  unit,
  onChange,
}: {
  label: string;
  options: readonly number[];
  value: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-fp-border bg-fp-surface p-4">
      <h3 className="font-display text-sm font-bold text-white">{label}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              value === opt
                ? "bg-gradient-to-r from-fp-primary to-fp-primary-2 text-white shadow-lg shadow-fp-primary/30"
                : "border border-fp-border bg-fp-surface-2 text-fp-text-dim hover:text-white"
            }`}
          >
            {opt} {unit}
          </button>
        ))}
      </div>
    </div>
  );
}

function NumberStepper({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-fp-border bg-fp-surface p-4">
      <h3 className="font-display text-sm font-bold text-white">{label}</h3>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-fp-border bg-fp-surface-2 text-lg font-bold text-white transition-colors hover:border-fp-primary"
          aria-label="−"
        >
          −
        </button>
        <span className="w-12 text-center font-display text-2xl font-bold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-fp-border bg-fp-surface-2 text-lg font-bold text-white transition-colors hover:border-fp-primary"
          aria-label="+"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const router = useRouter();
  const lang = useLanguageStore((s) => s.language);
  const s = useSettingsStore();
  const t = (k: string) => translate(lang, k);

  const isFR = lang === "fr";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-10 pt-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.push("/")} className="text-sm text-fp-text-dim transition-colors hover:text-white">
          ← {t("config.back")}
        </button>
        <h1 className="font-display text-xl font-bold">⚙️ {isFR ? "Réglages" : "Settings"}</h1>
        <span className="w-10" aria-hidden="true" />
      </div>

      {/* Quiz */}
      <section className="mt-6">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-fp-primary">
          🎯 {isFR ? "Quiz" : "Quiz"}
        </h2>
        <div className="mt-3 grid gap-3">
          <TimePill
            label={isFR ? "Classic Quiz — temps par question" : "Classic Quiz — time per question"}
            options={TIME_OPTIONS.classic}
            value={s.classicTime}
            unit={isFR ? "s" : "s"}
            onChange={(v) => s.set({ classicTime: v })}
          />
          <TimePill
            label={isFR ? "Vrai / Faux — temps par question" : "True / False — time per question"}
            options={TIME_OPTIONS.trueFalse}
            value={s.trueFalseTime}
            unit={isFR ? "s" : "s"}
            onChange={(v) => s.set({ trueFalseTime: v })}
          />
          <TimePill
            label={isFR ? "Rapid Fire — temps par question" : "Rapid Fire — time per question"}
            options={TIME_OPTIONS.rapidFire}
            value={s.rapidFireTime}
            unit={isFR ? "s" : "s"}
            onChange={(v) => s.set({ rapidFireTime: v })}
          />
          <NumberStepper
            label={isFR ? "Nombre de questions par défaut" : "Default question count"}
            value={s.defaultQuestionCount}
            min={5}
            max={30}
            step={5}
            onChange={(v) => s.set({ defaultQuestionCount: v })}
          />
        </div>
      </section>

      {/* Débat */}
      <section className="mt-8">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-fp-primary-2">
          💬 {isFR ? "Débat" : "Debate"}
        </h2>
        <div className="mt-3 grid gap-3">
          <TimePill
            label={isFR ? "Durée du débat" : "Debate duration"}
            options={TIME_OPTIONS.debateMinutes}
            value={s.debateMinutes}
            unit={isFR ? "min" : "min"}
            onChange={(v) => s.set({ debateMinutes: v })}
          />
          <TimePill
            label={isFR ? "Temps de réflexion avant le débat" : "Reflection time before debate"}
            options={TIME_OPTIONS.debatePrep}
            value={s.debatePreparation}
            unit={isFR ? "s" : "s"}
            onChange={(v) => s.set({ debatePreparation: v })}
          />
        </div>
      </section>

      {/* Modes sociaux */}
      <section className="mt-8">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-fp-accent">
          🎉 {isFR ? "Modes sociaux" : "Social modes"}
        </h2>
        <div className="mt-3 grid gap-3">
          <NumberStepper
            label={isFR ? "Timeline — nombre de manches" : "Timeline — rounds"}
            value={s.timelineRounds}
            min={1}
            max={5}
            onChange={(v) => s.set({ timelineRounds: v })}
          />
          <NumberStepper
            label={isFR ? "Guess — nombre de devinettes" : "Guess — riddles"}
            value={s.guessRounds}
            min={3}
            max={10}
            onChange={(v) => s.set({ guessRounds: v })}
          />
          <NumberStepper
            label={isFR ? "Would You Rather — rounds" : "Would You Rather — rounds"}
            value={s.wyrRounds}
            min={4}
            max={12}
            onChange={(v) => s.set({ wyrRounds: v })}
          />
        </div>
      </section>

      <button
        type="button"
        onClick={() => s.reset()}
        className="fp-btn-ghost mt-8 w-full"
      >
        ↺ {isFR ? "Rétablir les valeurs par défaut" : "Reset to defaults"}
      </button>

      <button type="button" onClick={() => router.push("/")} className="fp-btn-primary mt-4 w-full text-lg">
        ✓ {t("profile.save")}
      </button>
    </main>
  );
}
