"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { ModeCard, SegmentControl } from "@/components/ui/primitives";
import { AppIcon } from "@/components/ui/icons";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useGameStore, type GameConfig, type Player } from "@/lib/store/game";
import { useSettingsStore } from "@/lib/store/settings";
import { CATEGORIES, type QuestionCategory } from "@/lib/questions/schema";
import { DEBATE_CATEGORIES } from "@/lib/debate/schema";
import { SPECIALTIES, getSpecialtyById, DEFAULT_USER_PROFILE } from "@/lib/game/profile-specialty";
import { getLeagueProgress, getCurrentSeason } from "@/lib/game/leagues";
import {
  Zap,
  Lock,
  Globe,
  Settings,
  User,
  Clock,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Layers,
  Copy,
  Check,
  X,
} from "lucide-react";

type Step = "home" | "config" | "specialty-modal" | "private-modal";

const THEMATIC_SALONS = [
  { id: "mixed", name: "Culture Générale Complète", icon: "globe", desc: "Toutes les disciplines confondues" },
  { id: "cinema", name: "Cinéma & Séries", icon: "cinema", desc: "Réalisateurs, plans cultes, chefs-d'œuvre" },
  { id: "philosophie", name: "Philosophie & Idées", icon: "philosophie", desc: "Concepts majeurs, éthique et métaphysique" },
  { id: "art", name: "Art & Grands Musées", icon: "art", desc: "Met, Rijksmuseum, Art Institute of Chicago" },
  { id: "litterature", name: "Littérature Universelle", icon: "litterature", desc: "Romans majeurs, poésie, classiques" },
  { id: "histoire", name: "Histoire & Tournants", icon: "histoire", desc: "Grandes batailles, traités et empires" },
  { id: "science", name: "Sciences & Astrophysique", icon: "science", desc: "Physique quantique, mathématiques, tech" },
  { id: "geographie", name: "Géographie & Territoires", icon: "geographie", desc: "Capitales du monde, monnaies et frontières" },
];

const MODE_GROUPS: Array<{
  title: string;
  icon: string;
  modes: Array<{
    id: GameConfig["mode"];
    title: string;
    subtitle: string;
    icon: string;
    featured?: boolean;
  }>;
}> = [
  {
    title: "Expériences Compétitives",
    icon: "zap",
    modes: [
      { id: "prism", title: "PRISM", subtitle: "Tour par tour, Buzzer, Le Cut et finale La Ligne", icon: "prism", featured: true },
      { id: "classic", title: "Classic Quiz", subtitle: "Questions directes, 4 propositions, chrono standard", icon: "classic" },
      { id: "rapidfire", title: "Rapid Fire", subtitle: "20 questions avec 6 secondes de réaction", icon: "rapidfire" },
      { id: "timeline", title: "Timeline", subtitle: "Remets les événements historiques dans l'ordre chronologique", icon: "timeline" },
    ],
  },
  {
    title: "Débat & Réflexion",
    icon: "debate",
    modes: [
      { id: "debate", title: "Débat Structuré", subtitle: "Philosophie, éthique et politique avec temps de parole équitable", icon: "debate" },
      { id: "wyr", title: "Dilemmes & Choix", subtitle: "Les dilemmes radicaux qui forcent l'argumentation", icon: "wyr" },
      { id: "guess", title: "Indices & Déduction", subtitle: "Devine les concepts avec des indices progressifs", icon: "guess" },
    ],
  },
];

export function HomeClient() {
  const router = useRouter();
  const setConfig = useGameStore((s) => s.setConfig);
  const settings = useSettingsStore();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("home");
  const [selectedMode, setSelectedMode] = useState<GameConfig["mode"]>("prism");
  const [selectedDuration, setSelectedDuration] = useState<"express" | "classic">("express");
  const [thematicSalon, setThematicSalon] = useState<string>("mixed");
  const [category, setCategory] = useState<QuestionCategory | "mixed">("mixed");
  const [userSpecialty, setUserSpecialty] = useState<string>(DEFAULT_USER_PROFILE.specialtyId);
  const [userPoints] = useState<number>(DEFAULT_USER_PROFILE.seasonPoints);
  const [privateCode, setPrivateCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [players] = useState<Player[]>(() => [
    { id: "p1", name: "Dany", color: 0, specialtyId: DEFAULT_USER_PROFILE.specialtyId, score: 0, correct: 0, wrong: 0 },
    { id: "p2", name: "Anna", color: 1, specialtyId: "litterature", score: 0, correct: 0, wrong: 0 },
    { id: "p3", name: "Marc", color: 2, specialtyId: "histoire", score: 0, correct: 0, wrong: 0 },
    { id: "p4", name: "Lucy", color: 3, specialtyId: "art", score: 0, correct: 0, wrong: 0 },
  ]);

  const isDebate = selectedMode === "debate";
  const specialtyObj = getSpecialtyById(userSpecialty);
  const leagueProg = getLeagueProgress(userPoints);
  const season = getCurrentSeason();

  // Session persistée
  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email ?? "?");
        const metaSpec = data.user.user_metadata?.specialtyId as string | undefined;
        if (metaSpec) setUserSpecialty(metaSpec);
      }
    });
  }, []);

  function pickMode(mode: GameConfig["mode"]) {
    setSelectedMode(mode);
    setStep("config");
  }

  function launchQuickGame(dur: "express" | "classic" = selectedDuration) {
    const cfg: GameConfig = {
      mode: "prism",
      duration: dur,
      category: thematicSalon === "mixed" ? "mixed" : (thematicSalon as QuestionCategory),
      difficulty: "mixed",
      players: players.map((p, idx) => ({
        ...p,
        specialtyId: idx === 0 ? userSpecialty : p.specialtyId,
      })),
      questionCount: dur === "express" ? 10 : 20,
      timePerQuestion: 15,
      debateMinutes: 5,
      debateMode: "standard",
    };
    setConfig(cfg);
    router.push("/play");
  }

  function startCustomGame() {
    const cfg: GameConfig = {
      mode: selectedMode,
      duration: selectedDuration,
      category,
      difficulty: "mixed",
      players,
      questionCount: selectedDuration === "express" ? 10 : 20,
      timePerQuestion:
        selectedMode === "rapidfire"
          ? settings.rapidFireTime
          : selectedMode === "truefalse"
            ? settings.trueFalseTime
            : settings.classicTime,
      debateMinutes: 5,
      debateMode: "standard",
    };
    setConfig(cfg);
    router.push("/play");
  }

  function createPrivateSalon() {
    const code = "PR" + Math.floor(1000 + Math.random() * 9000).toString();
    setPrivateCode(code);
    setStep("private-modal");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-28 pt-6">
      {/* Navigation Header Apple Pro */}
      <header className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-amber-400 text-white shadow-md shadow-violet-600/20">
            <Zap className="h-4 w-4 fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-base font-bold tracking-tight text-white leading-none">
              {BRAND.name}
            </span>
            <span className="text-[11px] font-medium text-neutral-400 mt-0.5 tracking-wide">
              {BRAND.tagline}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge Ligue avec icône vectorielle */}
          <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs backdrop-blur-md">
            <AppIcon name={leagueProg.currentTier.icon} className={`h-3.5 w-3.5 ${leagueProg.currentTier.textColor}`} />
            <span className={`font-semibold ${leagueProg.currentTier.textColor}`}>
              {leagueProg.currentTier.name}
            </span>
            <span className="font-mono text-neutral-400 text-[11px] font-normal">{userPoints} pts</span>
          </div>

          <button
            type="button"
            onClick={() => router.push("/auth")}
            aria-label="Profil"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-neutral-300 transition-all hover:bg-white/[0.08] hover:text-white"
          >
            {userEmail ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                {userEmail.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User className="h-3.5 w-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => router.push("/settings")}
            aria-label="Paramètres"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-neutral-300 transition-all hover:bg-white/[0.08] hover:text-white"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Dashboard : Spécialité Déclarée & Progression Saisonnière */}
      <section className="my-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Carte Spécialité */}
        <div
          onClick={() => setStep("specialty-modal")}
          className="glass-panel group relative flex cursor-pointer items-center justify-between rounded-2xl p-4 transition-all duration-200 hover:border-violet-500/40 hover:bg-white/[0.05]"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300">
              <AppIcon name={specialtyObj.icon} className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-400">
                  SPÉCIALITÉ DÉCLARÉE
                </span>
                <span className="rounded-sm bg-violet-500/20 px-1 py-0.2 text-[9px] font-mono font-bold text-violet-300">
                  NIV. 4
                </span>
              </div>
              <span className="font-sans text-sm font-bold text-white mt-0.5">
                {specialtyObj.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-medium text-neutral-400 group-hover:text-violet-300 transition-colors">
            <span>Modifier</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Carte Saison & Ligue */}
        <div className="glass-panel flex flex-col justify-between rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-sans font-semibold text-white/90">{season.name}</span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-neutral-400">
              <Clock className="h-3 w-3" />
              <span>{season.daysRemaining} jours restants</span>
            </span>
          </div>

          <div className="my-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-200 transition-all duration-500"
              style={{ width: `${leagueProg.progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-neutral-400">
            <span>{leagueProg.currentTier.name}</span>
            <span>
              {leagueProg.pointsToNext > 0 ? `+${leagueProg.pointsToNext} pts pour ${leagueProg.nextTier?.name}` : "Rang Maître"}
            </span>
          </div>
        </div>
      </section>

      {step === "home" ? (
        <>
          {/* Main Hero Card : Lancement Rapide PRISM */}
          <section className="my-3">
            <div className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8 text-center border-white/[0.12] shadow-2xl">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-72 rounded-full bg-violet-600/15 blur-3xl" />

              <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-widest text-violet-300 mb-4">
                <Sparkles className="h-3 w-3" />
                <span>EXPÉRIENCE COMPÉTITIVE MAJEURE</span>
              </div>

              <h1 className="font-sans text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Culture compétitive pour adultes
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed">
                Tour par tour tactique, Buzzer électrique avec indices progressifs, Le Cut et la finale signature La Ligne.
              </p>

              {/* Sélection Format & Durée */}
              <div className="mt-6 max-w-md mx-auto flex flex-col gap-3">
                <SegmentControl
                  options={[
                    { value: "express", label: "Express (~10 min)", icon: "zap" },
                    { value: "classic", label: "Classique (~20 min)", icon: "clock" },
                  ]}
                  value={selectedDuration}
                  onChange={(val) => setSelectedDuration(val)}
                />

                {/* Sélecteur de Salon Thématique */}
                <div className="text-left">
                  <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
                    Discipline du match
                  </label>
                  <select
                    value={thematicSalon}
                    onChange={(e) => setThematicSalon(e.target.value)}
                    aria-label="Discipline du match"
                    className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2.5 text-xs font-semibold text-white outline-none transition-colors focus:border-violet-400"
                  >
                    {THEMATIC_SALONS.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#0e0e14] text-white">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bouton de Lancement Principal */}
              <div className="mt-6 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => launchQuickGame(selectedDuration)}
                  className="glass-primary flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition-all hover:shadow-violet-600/50 active:scale-[0.98]"
                >
                  <span>LANCER LE MATCH PRISM</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Actions Secondaires */}
              <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                <button
                  type="button"
                  onClick={createPrivateSalon}
                  className="glass-button inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white"
                >
                  <Lock className="h-3 w-3 text-neutral-400" />
                  <span>Créer un salon privé</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/play/online")}
                  className="glass-button inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white"
                >
                  <Globe className="h-3 w-3 text-neutral-400" />
                  <span>Matchmaking en ligne</span>
                </button>
              </div>
            </div>
          </section>

          {/* Catalogue des Modes de Jeu */}
          {MODE_GROUPS.map((group) => (
            <section key={group.title} className="mt-8">
              <div className="flex items-center gap-2 mb-3">
                <AppIcon name={group.icon} className="h-4 w-4 text-neutral-400" />
                <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-neutral-400">
                  {group.title}
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {group.modes.map((m) => (
                  <ModeCard
                    key={m.id}
                    title={m.title}
                    subtitle={m.subtitle}
                    icon={m.icon}
                    featured={m.featured}
                    onClick={() => pickMode(m.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      ) : step === "config" ? (
        /* Configuration de Mode Spécifique */
        <section className="glass-panel mt-6 rounded-3xl p-6 border-white/[0.1]">
          <button
            type="button"
            onClick={() => setStep("home")}
            className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            <span>← Retour au menu principal</span>
          </button>

          <h2 className="font-sans text-xl font-bold text-white">
            {isDebate ? "Configuration du Débat" : "Configuration de la Partie"}
          </h2>

          <div className="mt-5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
              Sélection de la discipline
            </h3>
            <div className="flex flex-wrap gap-2">
              {(isDebate ? DEBATE_CATEGORIES : ["mixed", ...CATEGORIES]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c as QuestionCategory | "mixed")}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                    category === c
                      ? "glass-primary text-white"
                      : "border border-white/[0.08] bg-white/[0.03] text-neutral-400 hover:text-white hover:border-white/[0.15]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={startCustomGame}
            className="glass-primary mt-8 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/30"
          >
            <span>Lancer la session</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      ) : step === "specialty-modal" ? (
        /* Modal Sélection de Spécialité Apple Pro */
        <section className="glass-panel mt-6 rounded-3xl p-6 border-white/[0.15] animate-pop">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-violet-400" />
                <h2 className="font-sans text-lg font-bold text-white">Choisir sa Spécialité</h2>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Toutes les questions tirées dans ta spécialité passeront en Niveau 4 (Expert).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep("home")}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {SPECIALTIES.map((spec) => {
              const selected = userSpecialty === spec.id;
              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => {
                    setUserSpecialty(spec.id);
                    setStep("home");
                  }}
                  className={`group relative flex items-start gap-3.5 rounded-2xl p-4 text-left transition-all duration-200 ${
                    selected
                      ? "border border-violet-500/60 bg-violet-600/15 shadow-md shadow-violet-600/20 text-white"
                      : "border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.14] text-neutral-300"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      selected
                        ? "bg-violet-600 text-white"
                        : "border border-white/[0.08] bg-white/[0.04] text-neutral-400 group-hover:text-white"
                    }`}
                  >
                    <AppIcon name={spec.icon} className="h-5 w-5" />
                  </div>

                  <div className="flex flex-col">
                    <span className="font-sans text-sm font-bold text-white leading-tight">
                      {spec.name}
                    </span>
                    <span className="text-xs text-neutral-400 mt-1 leading-snug line-clamp-2">
                      {spec.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : step === "private-modal" ? (
        /* Modal Salon Privé */
        <section className="glass-panel mt-6 rounded-3xl p-8 border-white/[0.15] text-center animate-pop">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
            <Lock className="h-3 w-3" />
            <span>SALON PRIVÉ PRÊT</span>
          </div>

          <h2 className="font-sans text-2xl font-extrabold text-white mt-3">Code de Connexion</h2>

          <div className="my-6 inline-flex items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.04] px-8 py-4 backdrop-blur-xl">
            <span className="font-mono text-3xl font-extrabold tracking-[0.25em] text-white">
              {privateCode}
            </span>
          </div>

          <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-6 leading-relaxed">
            Transmets ce code à tes invités. Ils peuvent rejoindre instantanément sans téléchargement ni mot de passe.
          </p>

          <div className="flex gap-3 max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.origin + `?room=${privateCode}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="glass-button flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold text-white"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copié !" : "Copier le lien"}</span>
            </button>
            <button
              type="button"
              onClick={() => launchQuickGame("express")}
              className="glass-primary flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white shadow-lg shadow-violet-600/30"
            >
              <span>Lancer le match</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      ) : null}

      <footer className="mt-16 text-center text-xs text-neutral-400">
        <p className="font-medium">{BRAND.fullName} · {BRAND.tagline}</p>
        <p className="mt-1 text-[11px] text-neutral-400">PWA Installable · Moteur Déterministe · Zero ELO Caché</p>
      </footer>
    </main>
  );
}
