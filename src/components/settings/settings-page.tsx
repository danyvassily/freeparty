"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, RotateCcw, ShieldCheck, ChevronRight, KeyRound, LogOut } from "lucide-react";
import { useSettingsStore, TIME_OPTIONS } from "@/lib/store/settings";
import { useLanguageStore } from "@/lib/store/language";
import { useAuth } from "@/lib/auth/use-auth";
import { PlayerDot } from "@/components/ui/primitives";

function TimeRow({
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
    <div className="px-4 py-3.5">
      <p className="text-[15px] font-medium text-fp-text">{label}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors active:scale-95 ${
              value === opt
                ? "bg-fp-primary text-white shadow-xs"
                : "bg-black/[0.04] text-fp-text hover:bg-black/[0.08]"
            }`}
          >
            {opt} {unit}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepperRow({
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
    <div className="flex items-center justify-between px-4 py-3.5">
      <p className="text-[15px] font-medium text-fp-text">{label}</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.05] text-lg font-semibold text-fp-primary transition active:scale-95 disabled:opacity-30"
          aria-label="−"
        >
          −
        </button>
        <span className="w-8 text-center text-[17px] font-semibold tabular-nums text-fp-text">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.05] text-lg font-semibold text-fp-primary transition active:scale-95 disabled:opacity-30"
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
  const { user, isLoggedIn, signOut } = useAuth();
  const isFR = lang === "fr";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl sm:max-w-2xl flex-col px-4 sm:px-6 pb-16 pt-4 animate-rise">
      {/* Barre de navigation style Apple */}
      <div className="relative flex h-11 items-center justify-center">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="absolute left-0 flex items-center gap-0.5 text-[17px] font-medium text-fp-primary active:opacity-70"
        >
          <ChevronLeft className="h-5 w-5" />
          {isFR ? "Accueil" : "Home"}
        </button>
        <h1 className="text-[17px] font-semibold text-fp-text">
          {isFR ? "Réglages" : "Settings"}
        </h1>
      </div>

      {/* Carte Profil / Compte */}
      <p className="fp-group-title">{isFR ? "Profil & Compte" : "Profile & Account"}</p>
      <div className="fp-list">
        <button
          type="button"
          onClick={() => router.push("/auth")}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-black/[0.02]"
        >
          <div className="flex items-center gap-3">
            <PlayerDot
              name={user?.name || "Joueur"}
              avatarUrl={user?.avatarUrl}
              colorIndex={0}
              size={38}
            />
            <div>
              <p className="text-[15px] font-semibold text-fp-text">
                {isLoggedIn && user ? user.name : isFR ? "Créer un compte / Se connecter" : "Create account / Sign in"}
              </p>
              <p className="text-[12px] text-fp-text-dim flex items-center gap-1">
                {isLoggedIn ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5 text-fp-success" />
                    <span>{user?.email || "Compte synchronisé"}</span>
                  </>
                ) : (
                  <span>{isFR ? "Sauvegardez vos parties et historique" : "Save your games & history"}</span>
                )}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-fp-text-dim" />
        </button>
        {isLoggedIn && (
          <>
            <button
              type="button"
              onClick={() => router.push("/auth")}
              className="flex w-full items-center justify-between border-t border-black/[0.05] px-4 py-3.5 text-left transition hover:bg-black/[0.02]"
            >
              <span className="flex items-center gap-3 text-[14px] font-medium text-fp-text">
                <KeyRound className="h-4.5 w-4.5 text-fp-primary" />
                {isFR ? "Modifier le mot de passe" : "Change password"}
              </span>
              <ChevronRight className="h-5 w-5 text-fp-text-dim" />
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await signOut();
                  router.push("/");
                } catch (error) {
                  console.error("[settings] Sign out failed", error);
                }
              }}
              className="flex w-full items-center gap-3 border-t border-black/[0.05] px-4 py-3.5 text-left text-[14px] font-semibold text-fp-danger transition hover:bg-black/[0.02]"
            >
              <LogOut className="h-4.5 w-4.5" />
              {isFR ? "Se déconnecter" : "Sign out"}
            </button>
          </>
        )}
      </div>

      {/* Quiz */}
      <p className="fp-group-title">{isFR ? "Quiz" : "Quiz"}</p>
      <div className="fp-list">
        <TimeRow
          label={isFR ? "Classic — temps par question" : "Classic — time per question"}
          options={TIME_OPTIONS.classic}
          value={s.classicTime}
          unit="s"
          onChange={(v) => s.set({ classicTime: v })}
        />
        <TimeRow
          label={isFR ? "Vrai / Faux — temps par question" : "True / False — time per question"}
          options={TIME_OPTIONS.trueFalse}
          value={s.trueFalseTime}
          unit="s"
          onChange={(v) => s.set({ trueFalseTime: v })}
        />
        <TimeRow
          label={isFR ? "Rapid Fire — temps par question" : "Rapid Fire — time per question"}
          options={TIME_OPTIONS.rapidFire}
          value={s.rapidFireTime}
          unit="s"
          onChange={(v) => s.set({ rapidFireTime: v })}
        />
        <StepperRow
          label={isFR ? "Questions par défaut" : "Default question count"}
          value={s.defaultQuestionCount}
          min={5}
          max={30}
          step={5}
          onChange={(v) => s.set({ defaultQuestionCount: v })}
        />
      </div>

      {/* Débat */}
      <p className="fp-group-title">{isFR ? "Débat" : "Debate"}</p>
      <div className="fp-list">
        <TimeRow
          label={isFR ? "Durée du débat" : "Debate duration"}
          options={TIME_OPTIONS.debateMinutes}
          value={s.debateMinutes}
          unit="min"
          onChange={(v) => s.set({ debateMinutes: v })}
        />
        <TimeRow
          label={isFR ? "Temps de réflexion" : "Reflection time"}
          options={TIME_OPTIONS.debatePrep}
          value={s.debatePreparation}
          unit="s"
          onChange={(v) => s.set({ debatePreparation: v })}
        />
      </div>

      {/* Autres modes */}
      <p className="fp-group-title">{isFR ? "Autres modes" : "Other modes"}</p>
      <div className="fp-list">
        <StepperRow
          label={isFR ? "Timeline — manches" : "Timeline — rounds"}
          value={s.timelineRounds}
          min={1}
          max={5}
          onChange={(v) => s.set({ timelineRounds: v })}
        />
        <StepperRow
          label={isFR ? "Indices — devinettes" : "Guess — riddles"}
          value={s.guessRounds}
          min={3}
          max={10}
          onChange={(v) => s.set({ guessRounds: v })}
        />
        <StepperRow
          label={isFR ? "Dilemmes — manches" : "Dilemmas — rounds"}
          value={s.wyrRounds}
          min={4}
          max={12}
          onChange={(v) => s.set({ wyrRounds: v })}
        />
      </div>

      <button
        type="button"
        onClick={() => s.reset()}
        className="fp-btn-secondary mt-8 flex w-full items-center justify-center gap-2 py-3.5 text-[15px]"
      >
        <RotateCcw className="h-4 w-4" />
        {isFR ? "Rétablir les valeurs par défaut" : "Reset to defaults"}
      </button>
    </main>
  );
}
