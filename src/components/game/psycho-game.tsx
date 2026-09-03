"use client";

/**
 * JOUXTA — Mode Profil Psycho (Analyse Psychologique)
 * Test introspectif et décalé de 18 scénarios pour révéler son archétype de soirée.
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PSYCHO_QUESTIONS,
} from "@/lib/game/psycho-data";
import {
  calculatePsychoProfile,
  generatePsychoShareText,
  type PsychoProfileResult,
} from "@/lib/game/psycho-engine";
import { sound } from "@/lib/audio/sound-engine";
import { PillBadge, Confetti } from "@/components/ui/primitives";
import { KawaiiMascot } from "@/components/ui/kawaii-mascot";
import {
  ChevronLeft,
  Share2,
  Check,
  RotateCcw,
  Sparkles,
  Zap,
  ShieldAlert,
  GlassWater,
  Heart,
  Flame,
  ArrowRight,
} from "lucide-react";

type Phase = "intro" | "playing" | "analyzing" | "report";

const ANALYZING_STEPS = [
  "Analyse de vos réflexes sociaux et de vos dilemmes…",
  "Détection de vos contradictions inavouées…",
  "Calcul de votre potentiel chaotique en soirée…",
  "Révélation de votre archétype psychologique…",
];

export function PsychoGame() {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const currentQuestion = PSYCHO_QUESTIONS[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / PSYCHO_QUESTIONS.length) * 100);

  // Résultat calculé dès que les 18 questions sont répondues
  const profileResult: PsychoProfileResult | null = useMemo(() => {
    if (answers.length < PSYCHO_QUESTIONS.length) return null;
    return calculatePsychoProfile(answers);
  }, [answers]);

  // Phase d'analyse animée
  useEffect(() => {
    if (phase !== "analyzing") return;
    const interval = setInterval(() => {
      setAnalyzingStep((s) => {
        if (s >= ANALYZING_STEPS.length - 1) {
          clearInterval(interval);
          setPhase("report");
          setShowConfetti(true);
          sound.playVictory();
          return s;
        }
        sound.playTick();
        return s + 1;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [phase]);

  function handleSelectOption(optionIndex: number) {
    sound.playBuzzerPress();
    const nextAnswers = [...answers];
    nextAnswers[currentIndex] = optionIndex;
    setAnswers(nextAnswers);

    if (currentIndex < PSYCHO_QUESTIONS.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setPhase("analyzing");
      setAnalyzingStep(0);
    }
  }

  function handlePrevious() {
    if (currentIndex > 0) {
      sound.playTick();
      setCurrentIndex((i) => i - 1);
    }
  }

  function handleRestart() {
    sound.playLineMove();
    setAnswers([]);
    setCurrentIndex(0);
    setPhase("playing");
    setShowConfetti(false);
  }

  async function handleCopyShare() {
    if (!profileResult) return;
    const text = generatePsychoShareText(profileResult);
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        sound.playCorrect();
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {
      // Fallback
    }
  }

  // ==========================================
  // ÉCRAN 1 : INTRO
  // ==========================================
  if (phase === "intro") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center px-4 sm:px-6 py-10 animate-rise">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/play/local")}
            className="fp-btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Tous les modes</span>
          </button>
          <PillBadge>Psychologie Sociale</PillBadge>
        </div>

        <section className="mt-8 rounded-[2rem] border border-fp-border bg-white p-6 sm:p-10 shadow-xl text-center">
          <div className="flex justify-center">
            <KawaiiMascot theme="thinking" size={110} animation="wobble" />
          </div>

          <span className="mt-6 inline-block text-xs font-black uppercase tracking-[0.2em] text-fp-primary">
            Test Introspectif & Piquant
          </span>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-fp-text">
            Quel est votre véritable profil psychologique ?
          </h1>
          <p className="mt-4 text-base leading-relaxed text-fp-text-dim max-w-lg mx-auto">
            18 scénarios réels et dilemmes sociaux sans langue de bois. Zéro bonne réponse, zéro filtre : découvrez votre archétype dominant, vos jauges de tempérament et votre face cachée en soirée.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div className="rounded-xl bg-black/[0.03] p-3">
              <span className="block text-xl font-black text-fp-primary">18</span>
              <span className="text-xs font-bold text-fp-text-dim">Dilemmes</span>
            </div>
            <div className="rounded-xl bg-black/[0.03] p-3">
              <span className="block text-xl font-black text-emerald-600">8</span>
              <span className="text-xs font-bold text-fp-text-dim">Archétypes</span>
            </div>
            <div className="rounded-xl bg-black/[0.03] p-3">
              <span className="block text-xl font-black text-purple-600">100%</span>
              <span className="text-xs font-bold text-fp-text-dim">Personnel</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playCorrect();
              setPhase("playing");
            }}
            className="fp-btn-primary mt-8 w-full py-4 text-lg font-bold shadow-lg gap-2"
          >
            <span>Démarrer l&apos;Analyse</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </section>
      </main>
    );
  }

  // ==========================================
  // ÉCRAN 2 : QUESTIONNAIRE EN COURS
  // ==========================================
  if (phase === "playing") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 sm:px-6 py-6 animate-rise">
        {/* En-tête et barre de progression */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/play/local")}
            className="fp-btn-ghost -ml-2 inline-flex items-center gap-1 text-sm text-fp-text-dim"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Quitter</span>
          </button>
          <span className="text-sm font-bold text-fp-text-dim tabular-nums">
            Question {currentIndex + 1} sur {PSYCHO_QUESTIONS.length}
          </span>
          <PillBadge>{currentQuestion.theme}</PillBadge>
        </div>

        {/* Barre de progression */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-fp-border/60">
          <div
            className="h-full bg-gradient-to-r from-fp-primary to-purple-600 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Scénario & Question */}
        <section className="mt-6 flex-1 flex flex-col justify-center">
          <div className="rounded-3xl border border-fp-border bg-white p-6 sm:p-8 shadow-sm">
            <span className="text-xs font-black uppercase tracking-wider text-fp-primary">
              Scénario #{currentIndex + 1}
            </span>
            <h2 className="mt-2 text-xl sm:text-2xl font-bold leading-snug text-fp-text">
              {currentQuestion.situation}
            </h2>

            {/* Options */}
            <div className="mt-6 space-y-3">
              {currentQuestion.options.map((opt, i) => {
                const isSelected = answers[currentIndex] === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectOption(i)}
                    className={`group flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
                      isSelected
                        ? "border-fp-primary bg-fp-primary/10 text-fp-text shadow-sm"
                        : "border-black/[0.06] bg-white hover:border-fp-primary/40 hover:bg-black/[0.02] text-fp-text"
                    } active:scale-[0.99]`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors ${
                        isSelected
                          ? "bg-fp-primary text-white"
                          : "bg-black/[0.05] text-fp-text-dim group-hover:bg-fp-primary/20 group-hover:text-fp-primary"
                      }`}
                    >
                      {["A", "B", "C", "D"][i]}
                    </span>
                    <span className="flex-1 text-[15px] sm:text-[16px] font-medium leading-relaxed">
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bouton Précédent */}
          {currentIndex > 0 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handlePrevious}
                className="fp-btn-ghost text-xs text-fp-text-dim inline-flex items-center gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Question précédente</span>
              </button>
            </div>
          )}
        </section>
      </main>
    );
  }

  // ==========================================
  // ÉCRAN 3 : ANALYSE EN COURS (TRANSITION)
  // ==========================================
  if (phase === "analyzing") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center animate-rise">
        <KawaiiMascot theme="thinking" size={130} animation="float" />
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-fp-border border-t-fp-primary" />
          <span className="text-sm font-bold uppercase tracking-widest text-fp-primary">
            Analyse Psychologique
          </span>
        </div>
        <p className="mt-3 text-lg font-bold text-fp-text min-h-[3.5rem] flex items-center justify-center">
          {ANALYZING_STEPS[analyzingStep]}
        </p>
      </main>
    );
  }

  // ==========================================
  // ÉCRAN 4 : RAPPORT ANALYTIQUE COMPLET
  // ==========================================
  if (phase === "report" && profileResult) {
    const { primaryArchetype, secondaryArchetype, primaryPercentage, secondaryPercentage, axes } =
      profileResult;

    return (
      <main className="mx-auto min-h-dvh w-full max-w-3xl px-4 sm:px-6 py-8 animate-rise">
        {showConfetti && <Confetti />}

        {/* Barre supérieure */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/play/local")}
            className="fp-btn-ghost inline-flex items-center gap-1.5 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Tous les modes</span>
          </button>
          <PillBadge>Bilan Psychologique</PillBadge>
        </div>

        {/* CARTE MAJEURE : ARCHÉTYPE DOMINANT */}
        <section className="mt-6 overflow-hidden rounded-[2.5rem] border border-fp-border bg-white shadow-2xl">
          <div className="bg-gradient-to-br from-[#f8f7ff] via-white to-[#f0edff] p-6 sm:p-10 text-center relative">
            <div className="flex justify-center">
              <KawaiiMascot theme={primaryArchetype.kawaiiTheme} size={110} animation="pop" />
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-fp-primary/10 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-fp-primary">
              <span>{primaryArchetype.emoji}</span>
              <span>{primaryArchetype.badge}</span>
            </div>

            <h1 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-fp-text">
              {primaryArchetype.name}
            </h1>

            {/* Pourcentages hybrides */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-fp-primary text-white text-xs font-extrabold px-3 py-1">
                Dominant : {primaryPercentage}%
              </span>
              <span className="rounded-full bg-black/[0.05] text-fp-text-dim text-xs font-bold px-3 py-1">
                Nuance : {secondaryArchetype.name} ({secondaryPercentage}%)
              </span>
            </div>

            <blockquote className="mt-6 text-base sm:text-lg font-medium italic text-fp-text max-w-xl mx-auto border-l-4 border-fp-primary/40 pl-4 text-left">
              {primaryArchetype.quote}
            </blockquote>

            <p className="mt-6 text-sm sm:text-base leading-relaxed text-fp-text-dim text-left max-w-2xl mx-auto">
              {primaryArchetype.description}
            </p>
          </div>
        </section>

        {/* RADIOGRAPHIE COMPORTEMENTALE (3 BLOCS) */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <Zap className="h-4 w-4 shrink-0" />
              <span>Super-Pouvoir</span>
            </div>
            <p className="mt-2 text-sm text-fp-text leading-snug">
              {primaryArchetype.superpower}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-xs">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>Talon d&apos;Achille</span>
            </div>
            <p className="mt-2 text-sm text-fp-text leading-snug">
              {primaryArchetype.blindSpot}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-xs">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
              <GlassWater className="h-4 w-4 shrink-0" />
              <span>Survie en Soirée</span>
            </div>
            <p className="mt-2 text-sm text-fp-text leading-snug">
              {primaryArchetype.partySurvival}
            </p>
          </div>
        </section>

        {/* JAUGES DE TEMPÉRAMENT (4 AXES) */}
        <section className="mt-6 rounded-3xl border border-fp-border bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-base text-fp-text">
            <Sparkles className="h-5 w-5 text-fp-primary" />
            <span>Vos Jauges de Tempérament</span>
          </div>
          <p className="mt-1 text-xs text-fp-text-dim">
            Mesure normalisée de vos réflexes décisionnels sur 18 situations clés.
          </p>

          <div className="mt-6 space-y-5">
            {/* Audace */}
            <div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-fp-text-dim">Prudence ({100 - axes.audace}%)</span>
                <span className="text-fp-text font-black">Audace ({axes.audace}%)</span>
              </div>
              <div className="mt-1.5 h-3 w-full rounded-full bg-black/[0.06] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${axes.audace}%` }}
                />
              </div>
            </div>

            {/* Empathie */}
            <div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-fp-text-dim">Calcul ({100 - axes.empathie}%)</span>
                <span className="text-fp-text font-black">Empathie ({axes.empathie}%)</span>
              </div>
              <div className="mt-1.5 h-3 w-full rounded-full bg-black/[0.06] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-slate-400 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${axes.empathie}%` }}
                />
              </div>
            </div>

            {/* Ordre */}
            <div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-fp-text-dim">Chaos ({100 - axes.ordre}%)</span>
                <span className="text-fp-text font-black">Ordre & Méthode ({axes.ordre}%)</span>
              </div>
              <div className="mt-1.5 h-3 w-full rounded-full bg-black/[0.06] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${axes.ordre}%` }}
                />
              </div>
            </div>

            {/* Idéalisme */}
            <div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-fp-text-dim">Réalisme Cynique ({100 - axes.idealisme}%)</span>
                <span className="text-fp-text font-black">Idéalisme ({axes.idealisme}%)</span>
              </div>
              <div className="mt-1.5 h-3 w-full rounded-full bg-black/[0.06] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-400 to-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${axes.idealisme}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* DYNAMIQUES RELATIONNELLES (BINÔME & NÉMÉSIS) */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
              <Heart className="h-4.5 w-4.5 fill-current" />
              <span>Binôme Idéal</span>
            </div>
            <h3 className="mt-2 text-lg font-black text-fp-text">
              {primaryArchetype.idealPair.name}
            </h3>
            <p className="mt-2 text-sm text-fp-text-dim leading-relaxed">
              {primaryArchetype.idealPair.reason}
            </p>
          </div>

          <div className="rounded-3xl border border-rose-200 bg-rose-50/40 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm">
              <Flame className="h-4.5 w-4.5 fill-current" />
              <span>Némésis Toxique</span>
            </div>
            <h3 className="mt-2 text-lg font-black text-fp-text">
              {primaryArchetype.nemesisPair.name}
            </h3>
            <p className="mt-2 text-sm text-fp-text-dim leading-relaxed">
              {primaryArchetype.nemesisPair.reason}
            </p>
          </div>
        </section>

        {/* ACTIONS & PARTAGE */}
        <section className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleCopyShare}
            className={`fp-btn-primary flex-1 py-4 text-base font-bold shadow-lg gap-2 transition-all ${
              copied ? "bg-emerald-600 border-emerald-600" : ""
            }`}
          >
            {copied ? (
              <>
                <Check className="h-5 w-5" />
                <span>Profil copié dans le presse-papier !</span>
              </>
            ) : (
              <>
                <Share2 className="h-5 w-5" />
                <span>Copier ma fiche de profil</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="fp-btn-secondary py-4 px-6 text-base font-bold gap-2"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Recommencer</span>
          </button>
        </section>
      </main>
    );
  }

  return null;
}
