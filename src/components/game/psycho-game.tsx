"use client";

/**
 * JOUXTA — Mode Profil Psycho (Analyse Psychologique)
 * Test introspectif et décalé de 18 scénarios pour révéler son archétype de soirée.
 * Supporte le jeu en Solo et le Pass-and-Play multi-joueurs avec bilan comparatif.
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore, makePlayer, type Player } from "@/lib/store/game";
import { PSYCHO_QUESTIONS } from "@/lib/game/psycho-data";
import {
  calculatePsychoProfile,
  calculatePsychoCompatibility,
  calculatePsychoGroup,
  generatePsychoShareText,
  type PsychoProfileResult,
} from "@/lib/game/psycho-engine";
import { sound } from "@/lib/audio/sound-engine";
import { useLanguageStore } from "@/lib/store/language";
import { PillBadge, Confetti, PlayerDot } from "@/components/ui/primitives";
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
  Users,
} from "lucide-react";

type Phase = "intro" | "playing" | "analyzing" | "report";
type PsychoExperience = "individual" | "duo" | "group" | "quick";

const EXPERIENCE_META: Record<PsychoExperience, { name: string; description: string; minPlayers: number; emoji: string; nameEn: string; descriptionEn: string }> = {
  individual: { name: "Portrait individuel", description: "Découvre ton archétype, tes forces et tes contrastes.", nameEn: "Individual portrait", descriptionEn: "Discover your archetype, strengths and contrasts.", minPlayers: 1, emoji: "🪞" },
  duo: { name: "Affinité duo", description: "Compare deux profils et leurs points d'accord ou de friction.", nameEn: "Duo affinity", descriptionEn: "Compare two profiles and their points of agreement or friction.", minPlayers: 2, emoji: "💞" },
  group: { name: "Dynamique de groupe", description: "Observe l'énergie moyenne et la diversité de toute l'équipe.", nameEn: "Group dynamics", descriptionEn: "See your team's shared energy and diversity.", minPlayers: 3, emoji: "🫶" },
  quick: { name: "Dilemmes express", description: "6 choix rapides pour révéler ton style de soirée en 2 minutes.", nameEn: "Quick dilemmas", descriptionEn: "Six rapid choices to reveal your party style in two minutes.", minPlayers: 1, emoji: "⚡" },
};

const ANALYZING_STEPS = [
  "Analyse de vos réflexes sociaux et de vos dilemmes…",
  "Détection de vos contradictions inavouées…",
  "Calcul de votre potentiel chaotique en soirée…",
  "Révélation de votre archétype psychologique…",
];

export function PsychoGame() {
  const router = useRouter();
  const config = useGameStore((s) => s.config);
  const language = useLanguageStore((s) => s.language);

  const players: Player[] = useMemo(() => {
    if (config?.players && config.players.length > 0) {
      return config.players;
    }
    return [makePlayer(0, "Joueur 1")];
  }, [config?.players]);

  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [completedProfiles, setCompletedProfiles] = useState<Record<string, PsychoProfileResult>>({});
  const [phase, setPhase] = useState<Phase>("intro");
  const [experience, setExperience] = useState<PsychoExperience>("individual");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const activeQuestions = experience === "quick" ? PSYCHO_QUESTIONS.slice(0, 6) : PSYCHO_QUESTIONS;
  const questionCount = activeQuestions.length;

  const currentPlayer = players[activePlayerIndex] ?? players[0];
  const nextPlayer = players[activePlayerIndex + 1];
  const isLastPlayer = activePlayerIndex >= players.length - 1;

  const currentQuestion = activeQuestions[currentIndex] ?? activeQuestions[0];
  const progressPercent = Math.round(((currentIndex + 1) / activeQuestions.length) * 100);

  // Profil du joueur actif calculé
  const profileResult: PsychoProfileResult | null = useMemo(() => {
    if (completedProfiles[currentPlayer.id]) {
      return completedProfiles[currentPlayer.id];
    }
    if (answers.length >= questionCount) {
      return calculatePsychoProfile(answers);
    }
    return null;
  }, [completedProfiles, currentPlayer.id, answers, questionCount]);

  // Phase d'analyse animée
  useEffect(() => {
    if (phase !== "analyzing") return;
    let step = 0;
    const interval = setInterval(() => {
      if (step >= ANALYZING_STEPS.length - 1) {
        clearInterval(interval);
        setPhase("report");
        setShowConfetti(true);
        sound.playVictory();
        return;
      }
      step += 1;
      setAnalyzingStep(step);
      sound.playTick();
    }, 550);

    return () => clearInterval(interval);
  }, [phase]);

  function handleSelectOption(optionIndex: number) {
    sound.playBuzzerPress();
    const nextAnswers = [...answers];
    nextAnswers[currentIndex] = optionIndex;
    setAnswers(nextAnswers);

    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      const res = calculatePsychoProfile(nextAnswers);
      setCompletedProfiles((prev) => ({ ...prev, [currentPlayer.id]: res }));
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

  function handleNextPlayerTurn() {
    if (!nextPlayer) return;
    sound.playLineMove();
    setActivePlayerIndex((i) => i + 1);
    setAnswers([]);
    setCurrentIndex(0);
    setPhase("playing");
    setShowConfetti(false);
    setCopied(false);
  }

  function handleRestartCurrent() {
    sound.playLineMove();
    setAnswers([]);
    setCurrentIndex(0);
    setPhase("playing");
    setShowConfetti(false);
    setCopied(false);
    setCompletedProfiles((previous) => {
      const next = { ...previous };
      delete next[currentPlayer.id];
      return next;
    });
  }

  function handleRestartAll() {
    sound.playLineMove();
    setActivePlayerIndex(0);
    setCompletedProfiles({});
    setAnswers([]);
    setCurrentIndex(0);
    setPhase("playing");
    setShowConfetti(false);
    setCopied(false);
  }

  async function handleCopyShare() {
    if (!profileResult) return;
    const text = generatePsychoShareText(profileResult, currentPlayer.name);
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

  if (phase === "intro") {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-3xl px-4 py-8 sm:px-6 animate-rise">
        <button type="button" onClick={() => router.push("/play/local")} className="fp-btn-ghost inline-flex items-center gap-1.5 text-sm">
          <ChevronLeft className="h-4 w-4" /> Tous les modes
        </button>
        <div className="mt-7 text-center">
          <KawaiiMascot theme="thinking" size={105} animation="float" />
            <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-fp-primary">{language === "en" ? "Party psychology" : "Profil Psycho"}</p>
          <h1 className="mt-2 text-3xl font-black text-fp-text sm:text-4xl">{language === "en" ? "Choose your experience" : "Quelle expérience voulez-vous vivre ?"}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-fp-text-dim">{language === "en" ? "Playful personality games for your group. No result is a psychological diagnosis." : "Des jeux de personnalité ludiques pour votre groupe. Aucun résultat n&apos;est un diagnostic psychologique."}</p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {(Object.entries(EXPERIENCE_META) as Array<[PsychoExperience, (typeof EXPERIENCE_META)[PsychoExperience]]>).map(([id, meta]) => {
            const available = players.length >= meta.minPlayers;
            return (
              <button
                key={id}
                type="button"
                disabled={!available}
                onClick={() => { setExperience(id); setPhase("playing"); }}
                className="fp-card min-h-48 p-5 text-left transition hover:-translate-y-0.5 hover:border-fp-primary/35 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span className="text-3xl" aria-hidden="true">{meta.emoji}</span>
                <span className="mt-5 block text-lg font-black text-fp-text">{language === "en" ? meta.nameEn : meta.name}</span>
                <span className="mt-2 block text-sm leading-relaxed text-fp-text-dim">{language === "en" ? meta.descriptionEn : meta.description}</span>
                <span className="mt-4 block text-xs font-bold text-fp-primary">{available ? `${players.length} ${language === "en" ? `player${players.length > 1 ? "s" : ""} ready` : `joueur${players.length > 1 ? "s" : ""} prêt${players.length > 1 ? "s" : ""}`}` : `${language === "en" ? "Minimum" : "Minimum"} ${meta.minPlayers} ${language === "en" ? "players" : "joueurs"}`}</span>
              </button>
            );
          })}
        </div>
      </main>
    );
  }

  // ==========================================
  // ÉCRAN 1 : QUESTIONNAIRE EN COURS
  // ==========================================
  if (phase === "playing") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 sm:px-6 py-6 animate-rise">
        {/* En-tête et joueur actif */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push("/play/local")}
            className="fp-btn-ghost -ml-2 inline-flex items-center gap-1 text-sm text-fp-text-dim"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Quitter</span>
          </button>

          <div className="flex items-center gap-2 rounded-full border border-fp-border bg-white px-3 py-1 shadow-xs">
            <PlayerDot name={currentPlayer.name} colorIndex={currentPlayer.color} size={22} />
            <span className="text-xs font-black text-fp-text truncate max-w-[130px]">
              {currentPlayer.name}
            </span>
          </div>

          <PillBadge>{currentQuestion.theme}</PillBadge>
        </div>

        <p className="mt-4 text-xs text-fp-text-dim">Un jeu de soirée, pas un test psychologique validé ni un diagnostic.</p>

        {/* Barre de progression */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-extrabold text-fp-text-dim mb-1.5">
            <span>
              {language === "en" ? `Question ${currentIndex + 1} of ${activeQuestions.length}` : `Question ${currentIndex + 1} sur ${activeQuestions.length}`}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-fp-border/60">
            <div
              className="h-full bg-gradient-to-r from-fp-primary to-purple-600 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Scénario & Question */}
        <section className="mt-6 flex-1 flex flex-col justify-center">
          <div className="rounded-3xl border border-fp-border bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-fp-primary">
                Dilemme #{currentIndex + 1}
              </span>
              <span className="text-xs font-bold text-fp-text-dim">
                Choix personnel
              </span>
            </div>

            <h2 className="mt-3 text-xl sm:text-2xl font-bold leading-snug text-fp-text">
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
  // ÉCRAN 2 : ANALYSE EN COURS (TRANSITION)
  // ==========================================
  if (phase === "analyzing") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center animate-rise">
        <KawaiiMascot theme="thinking" size={130} animation="float" />
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-fp-border border-t-fp-primary" />
          <span className="text-sm font-bold uppercase tracking-widest text-fp-primary">
            Analyse de {currentPlayer.name}
          </span>
        </div>
        <p className="mt-3 text-lg font-bold text-fp-text min-h-[3.5rem] flex items-center justify-center">
          {ANALYZING_STEPS[analyzingStep]}
        </p>
      </main>
    );
  }

  // ==========================================
  // ÉCRAN 3 : RAPPORT ANALYTIQUE COMPLET
  // ==========================================
  if (phase === "report" && profileResult) {
    const { primaryArchetype, secondaryArchetype, primaryPercentage, secondaryPercentage, axes } =
      profileResult;

    const completedEntries = Object.entries(completedProfiles);
    const completedResults = players.map((player) => completedProfiles[player.id]).filter(Boolean);
    const compatibility = experience === "duo" && completedResults.length >= 2
      ? calculatePsychoCompatibility(completedResults[0], completedResults[1])
      : null;
    const groupResult = experience === "group" && completedResults.length >= 3
      ? calculatePsychoGroup(completedResults)
      : null;
    const axisLabels: Record<string, string> = { audace: "audace", empathie: "empathie", ordre: "organisation", idealisme: "idéalisme" };

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
          <div className="flex items-center gap-2">
            <PlayerDot name={currentPlayer.name} colorIndex={currentPlayer.color} size={20} />
            <PillBadge>Bilan de {currentPlayer.name}</PillBadge>
          </div>
        </div>

        {/* CARTE MAJEURE : ARCHÉTYPE DOMINANT */}
        <section className="mt-6 overflow-hidden rounded-[2.5rem] border border-fp-border bg-white shadow-2xl">
          <div className="bg-gradient-to-br from-[#f8f7ff] via-white to-[#f0edff] p-6 sm:p-10 text-center relative">
            <div className="flex justify-center">
              <KawaiiMascot theme={primaryArchetype.kawaiiTheme} size={110} animation="dance" />
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

        {/* GRILLE D'ANALYSE COMPORTEMENTALE */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
              <Zap className="h-4 w-4 fill-current" />
              <span>Superpouvoir</span>
            </div>
            <p className="mt-2 text-sm text-emerald-950 font-semibold leading-relaxed">
              {primaryArchetype.superpower}
            </p>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
            <div className="flex items-center gap-2 text-amber-800 font-extrabold text-sm">
              <ShieldAlert className="h-4 w-4 fill-current" />
              <span>Angle Mort</span>
            </div>
            <p className="mt-2 text-sm text-amber-950 font-semibold leading-relaxed">
              {primaryArchetype.blindSpot}
            </p>
          </div>

          <div className="rounded-3xl border border-blue-200 bg-blue-50/50 p-5 shadow-xs">
            <div className="flex items-center gap-2 text-blue-800 font-extrabold text-sm">
              <GlassWater className="h-4 w-4" />
              <span>Règle de Survie</span>
            </div>
            <p className="mt-2 text-sm text-blue-950 font-semibold leading-relaxed">
              {primaryArchetype.partySurvival}
            </p>
          </div>
        </section>

        {/* SECTION DES 4 JAUGES DE TEMPÉRAMENT */}
        <section className="mt-6 rounded-3xl border border-fp-border bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-fp-text">Vos Jauges de Tempérament</h2>
              <p className="text-xs text-fp-text-dim mt-0.5">
                Calcul précis basé sur vos 18 choix réels
              </p>
            </div>
            <Sparkles className="h-5 w-5 text-fp-primary" />
          </div>

          <div className="mt-6 space-y-5">
            {/* Axe Audace */}
            <div>
              <div className="flex justify-between text-xs font-bold text-fp-text mb-1.5">
                <span className="text-fp-text-dim">Prudence ({100 - axes.audace}%)</span>
                <span className="text-fp-primary font-black">Audace ({axes.audace}%)</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-fp-border/50">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700"
                  style={{ width: `${axes.audace}%` }}
                />
              </div>
            </div>

            {/* Axe Empathie */}
            <div>
              <div className="flex justify-between text-xs font-bold text-fp-text mb-1.5">
                <span className="text-fp-text-dim">Calcul ({100 - axes.empathie}%)</span>
                <span className="text-emerald-600 font-black">Empathie ({axes.empathie}%)</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-fp-border/50">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-600 rounded-full transition-all duration-700"
                  style={{ width: `${axes.empathie}%` }}
                />
              </div>
            </div>

            {/* Axe Ordre */}
            <div>
              <div className="flex justify-between text-xs font-bold text-fp-text mb-1.5">
                <span className="text-fp-text-dim">Chaos ({100 - axes.ordre}%)</span>
                <span className="text-amber-600 font-black">Ordre & Méthode ({axes.ordre}%)</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-fp-border/50">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full transition-all duration-700"
                  style={{ width: `${axes.ordre}%` }}
                />
              </div>
            </div>

            {/* Axe Idéalisme */}
            <div>
              <div className="flex justify-between text-xs font-bold text-fp-text mb-1.5">
                <span className="text-fp-text-dim">Réalisme Cynique ({100 - axes.idealisme}%)</span>
                <span className="text-purple-600 font-black">Idéalisme ({axes.idealisme}%)</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-fp-border/50">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-700"
                  style={{ width: `${axes.idealisme}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* RELATIONS SOCIALES : ALLIÉ & NÉMÉSIS */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
              <Heart className="h-4.5 w-4.5 fill-current" />
              <span>Allié Idéal en Soirée</span>
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

        {/* SI PLUSIEURS JOUEURS ONT FINI : SYNTHÈSE DU GROUPE */}
        {completedEntries.length > 1 && (
          <section className="mt-6 rounded-3xl border border-fp-border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-fp-primary" />
              <h2 className="text-lg font-black text-fp-text">Profils du groupe ({completedEntries.length})</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {completedEntries.map(([playerId, pResult]) => {
                const pl = players.find((p) => p.id === playerId);
                return (
                  <div
                    key={playerId}
                    className="flex items-center justify-between rounded-2xl border border-fp-border bg-fp-bg/40 p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <PlayerDot name={pl?.name ?? "Joueur"} colorIndex={pl?.color ?? 0} size={28} />
                      <div>
                        <p className="text-sm font-black text-fp-text">{pl?.name ?? "Joueur"}</p>
                        <p className="text-xs text-fp-primary font-extrabold">
                          {pResult.primaryArchetype.emoji} {pResult.primaryArchetype.name}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-fp-text-dim">
                      {pResult.primaryPercentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {isLastPlayer && compatibility && (
          <section className="mt-6 rounded-3xl border border-pink-200 bg-pink-50/60 p-6 text-center shadow-sm">
            <p className="text-sm font-black uppercase tracking-wider text-pink-700">Affinité ludique du duo</p>
            <p className="mt-2 text-5xl font-black text-fp-text">{compatibility.affinity}%</p>
          <p className="mt-3 text-sm text-fp-text-dim">Votre terrain commun : <strong>{axisLabels[compatibility.strongestSharedAxis]}</strong>. Votre contraste le plus marqué : <strong>{axisLabels[compatibility.biggestDifferenceAxis]}</strong>.</p>
          </section>
        )}

        {isLastPlayer && groupResult && (
          <section className="mt-6 rounded-3xl border border-violet-200 bg-violet-50/60 p-6 shadow-sm">
            <div className="flex items-center gap-2"><Users className="h-5 w-5 text-violet-700" /><h2 className="text-lg font-black text-fp-text">Dynamique du groupe</h2></div>
            <p className="mt-3 text-sm text-fp-text-dim">Énergie dominante : <strong>{axisLabels[groupResult.dominantAxis]}</strong> · indice de diversité : <strong>{groupResult.diversity}/100</strong>.</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(groupResult.averages).map(([axis, value]) => <div key={axis} className="rounded-2xl bg-white p-3"><p className="text-xs font-bold capitalize text-fp-text-dim">{axisLabels[axis]}</p><p className="mt-1 text-xl font-black text-fp-text">{value}%</p></div>)}
            </div>
          </section>
        )}

        {/* ACTIONS & PASS-AND-PLAY */}
        <section className="mt-8 flex flex-col sm:flex-row gap-3">
          {/* Passer au joueur suivant si multi-joueurs */}
          {!isLastPlayer && nextPlayer && (
            <button
              type="button"
              onClick={handleNextPlayerTurn}
              className="fp-btn-primary flex-1 py-4 text-base font-bold shadow-lg gap-2"
            >
              <span>Au tour de {nextPlayer.name}</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          )}

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
                <span>Bilan de {currentPlayer.name} copié !</span>
              </>
            ) : (
              <>
                <Share2 className="h-5 w-5" />
                <span>Partager mon bilan</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={isLastPlayer && completedEntries.length > 1 ? handleRestartAll : handleRestartCurrent}
            className="fp-btn-secondary py-4 px-6 text-base font-bold gap-2"
          >
            <RotateCcw className="h-5 w-5" />
            <span>{isLastPlayer && completedEntries.length > 1 ? "Recommencer tout" : "Recommencer"}</span>
          </button>
        </section>
      </main>
    );
  }

  // Fallback sûr : ne jamais laisser un écran blanc
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center animate-rise">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-fp-border border-t-fp-primary" />
      <p className="mt-4 text-sm text-fp-text-dim">Initialisation du test psychologique…</p>
    </main>
  );
}
