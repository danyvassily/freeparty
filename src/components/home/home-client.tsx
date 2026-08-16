"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { ModeCard } from "@/components/ui/primitives";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useGameStore, type GameConfig, type Player } from "@/lib/store/game";
import { useSettingsStore } from "@/lib/store/settings";
import { CATEGORIES, type QuestionCategory } from "@/lib/questions/schema";
import { DEBATE_CATEGORIES } from "@/lib/debate/schema";
import { SPECIALTIES, getSpecialtyById, DEFAULT_USER_PROFILE } from "@/lib/game/profile-specialty";
import { getLeagueProgress, getCurrentSeason } from "@/lib/game/leagues";

type Step = "home" | "config" | "specialty-modal" | "private-modal";

const THEMATIC_SALONS = [
  { id: "mixed", name: "Culture Générale Complète", emoji: "🌐", desc: "Toutes les disciplines confondues" },
  { id: "cinema", name: "Cinéma & Séries uniquement", emoji: "🎬", desc: "Réalisateurs, plans cultes, chefs-d'œuvre" },
  { id: "philosophie", name: "Philosophie & Sciences Humaines", emoji: "🏛️", desc: "Concepts majeurs, Bourdieu, Deleuze, éthique" },
  { id: "art", name: "Art & Grands Musées", emoji: "🎨", desc: "Met, Rijksmuseum, Art Institute of Chicago" },
  { id: "litterature", name: "Littérature Universelle", emoji: "📚", desc: "Romans majeurs, poésie, auteurs classiques" },
  { id: "histoire", name: "Histoire & Guerres mondiales", emoji: "⚔️", desc: "Grandes batailles, traités et tournants" },
  { id: "science", name: "Sciences & Astrophysique", emoji: "🔬", desc: "Physique quantique, mathématiques, découvertes" },
  { id: "geographie", name: "Géographie & Capitales", emoji: "🌍", desc: "Capitales du monde, monnaies et territoires" },
];

const MODE_GROUPS: Array<{
  title: string;
  emoji: string;
  modes: Array<{
    id: GameConfig["mode"];
    title: string;
    subtitle: string;
    emoji: string;
    gradient: string;
  }>;
}> = [
  {
    title: "Modes Compétitifs",
    emoji: "⚡",
    modes: [
      { id: "prism", title: "PRISM (Mode Majeur)", subtitle: "Tour par tour, Buzzer, Le Cut et finale La Ligne", emoji: "🔴", gradient: "bg-gradient-to-br from-violet-600 via-fuchsia-600 to-amber-500" },
      { id: "classic", title: "Classic Quiz", subtitle: "Questions directes, 4 choix, tout le monde joue", emoji: "🎯", gradient: "bg-gradient-to-br from-fp-primary to-fp-primary-2" },
      { id: "rapidfire", title: "Rapid Fire", subtitle: "20 questions en 6 secondes chacune", emoji: "🔥", gradient: "bg-gradient-to-br from-fp-accent to-fp-danger" },
      { id: "timeline", title: "Timeline", subtitle: "Replace les événements dans l’ordre", emoji: "🕰️", gradient: "bg-gradient-to-br from-fp-accent-2 to-fp-success" },
    ],
  },
  {
    title: "Débat & Réflexion",
    emoji: "💬",
    modes: [
      { id: "debate", title: "Debate Mode", subtitle: "Philosophie, politique, éthique — avec temps de parole équitable", emoji: "💬", gradient: "bg-gradient-to-br from-fp-primary to-fp-accent" },
      { id: "wyr", title: "Would You Rather", subtitle: "Les choix impossibles qui font débattre", emoji: "🤔", gradient: "bg-gradient-to-br from-fp-warning to-fp-accent" },
      { id: "guess", title: "Guess & Indices", subtitle: "Devine avec des indices progressifs", emoji: "🕵️", gradient: "bg-gradient-to-br from-fp-success to-fp-accent-2" },
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
  const [selectedDuration] = useState<"express" | "classic">("express");
  const [thematicSalon, setThematicSalon] = useState<string>("mixed");
  const [category, setCategory] = useState<QuestionCategory | "mixed">("mixed");
  const [difficulty] = useState("mixed");
  const [userSpecialty, setUserSpecialty] = useState<string>(DEFAULT_USER_PROFILE.specialtyId);
  const [userPoints] = useState<number>(DEFAULT_USER_PROFILE.seasonPoints);
  const [privateCode, setPrivateCode] = useState<string>("");
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

  function launchQuickGame(dur: "express" | "classic" = "express") {
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
      difficulty,
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
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-24 pt-6">
      {/* Header : Logo PRISM, Badge Ligue, Profil */}
      <header className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-amber-400 text-base font-black text-white shadow-lg shadow-violet-500/20">
            ⚡
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-black tracking-tight text-white leading-none">
              {BRAND.name}
            </span>
            <span className="text-[11px] font-medium text-fp-text-dim mt-0.5">
              {BRAND.tagline}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge Ligue du joueur */}
          <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs">
            <span>{leagueProg.currentTier.emoji}</span>
            <span className={`font-mono font-bold ${leagueProg.currentTier.textColor}`}>
              {leagueProg.currentTier.name}
            </span>
            <span className="font-mono text-white/50 text-[11px]">{userPoints} pts</span>
          </div>

          <button
            type="button"
            onClick={() => router.push("/auth")}
            aria-label="Profil"
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-fp-text-dim hover:text-white"
          >
            {userEmail ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                {userEmail.charAt(0).toUpperCase()}
              </span>
            ) : (
              "👤"
            )}
          </button>

          <button
            type="button"
            onClick={() => router.push("/settings")}
            aria-label="Paramètres"
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-fp-text-dim hover:text-white"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Bannière Saison & Spécialité Déclarée */}
      <section className="my-5 flex flex-col sm:flex-row items-stretch gap-3">
        {/* Carte Spécialité Publique */}
        <div
          onClick={() => setStep("specialty-modal")}
          className="flex-1 fp-card p-4 border border-violet-500/30 bg-gradient-to-r from-violet-950/40 to-white/[0.02] cursor-pointer hover:border-violet-400 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{specialtyObj.emoji}</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-violet-300 font-bold">
                MA SPÉCIALITÉ (NIVEAU 4)
              </span>
              <span className="font-display text-base font-bold text-white">
                {specialtyObj.name}
              </span>
            </div>
          </div>
          <span className="text-xs text-violet-400 font-semibold underline underline-offset-2">
            Modifier
          </span>
        </div>

        {/* Carte Saison & Ligue */}
        <div className="flex-1 fp-card p-4 border border-white/10 bg-white/[0.02] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-display font-bold text-white/80">{season.name}</span>
            <span className="font-mono text-[11px] text-fp-text-dim">
              ⏳ {season.daysRemaining}j restants
            </span>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full rounded-full transition-all"
              style={{ width: `${leagueProg.progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-white/40 mt-1.5">
            <span>{leagueProg.currentTier.name}</span>
            <span>
              {leagueProg.pointsToNext > 0 ? `+${leagueProg.pointsToNext} pts pour ${leagueProg.nextTier?.name}` : "Rang Maximum"}
            </span>
          </div>
        </div>
      </section>

      {step === "home" ? (
        <>
          {/* Action Principale : Bouton JOUER & Choix de Durée */}
          <section className="my-4 text-center">
            <div className="fp-card p-6 border border-white/15 bg-gradient-to-b from-white/[0.06] to-transparent shadow-2xl">
              <span className="inline-block rounded-full bg-amber-400/10 border border-amber-400/30 px-3 py-1 text-[11px] font-mono font-extrabold uppercase tracking-widest text-amber-300 mb-3">
                🔴 EXPÉRIENCE COMPÉTITIVE PRISM
              </span>

              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Le grand jeu de culture pour adultes
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-fp-text-dim max-w-md mx-auto">
                Tour par tour tactique, Buzzer électrique avec indices, Le Cut et la finale signature La Ligne.
              </p>

              {/* Sélection du Salon Thématique */}
              <div className="my-5 text-left max-w-md mx-auto">
                <label className="text-xs font-mono font-bold text-white/60 uppercase block mb-1.5">
                  Salon Thématique
                </label>
                <select
                  value={thematicSalon}
                  onChange={(e) => setThematicSalon(e.target.value)}
                  className="w-full rounded-2xl border border-white/15 bg-fp-bg px-3.5 py-3 text-sm font-semibold text-white outline-none focus:border-violet-400"
                >
                  {THEMATIC_SALONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.emoji} {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Choix Durée Express vs Classique */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-4">
                <button
                  type="button"
                  onClick={() => launchQuickGame("express")}
                  className="flex-1 fp-btn-primary flex flex-col items-center py-3.5"
                >
                  <span className="text-base font-black">⚡ EXPRESS (~10 min)</span>
                  <span className="text-[11px] opacity-80 font-normal">3 manches + Cut + La Ligne</span>
                </button>

                <button
                  type="button"
                  onClick={() => launchQuickGame("classic")}
                  className="flex-1 fp-btn-ghost flex flex-col items-center py-3.5 hover:border-violet-400"
                >
                  <span className="text-base font-bold text-white">🏛️ CLASSIQUE (~20 min)</span>
                  <span className="text-[11px] text-fp-text-dim">5 manches + Cut + La Ligne</span>
                </button>
              </div>

              {/* Actions Rapides Secondaires */}
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={createPrivateSalon}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                >
                  🔒 Créer une partie privée
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/play/online")}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                >
                  🌍 Matchmaking en ligne
                </button>
              </div>
            </div>
          </section>

          {/* Autres Modes de Jeu */}
          {MODE_GROUPS.map((group) => (
            <section key={group.title} className="mt-8">
              <h2 className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest text-fp-text-dim">
                <span>{group.emoji}</span> {group.title}
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {group.modes.map((m) => (
                  <ModeCard
                    key={m.id}
                    title={m.title}
                    subtitle={m.subtitle}
                    emoji={m.emoji}
                    gradient={m.gradient}
                    onClick={() => pickMode(m.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      ) : step === "config" ? (
        /* Configuration d'une partie spécifique */
        <section className="mt-6">
          <button
            type="button"
            onClick={() => setStep("home")}
            className="mb-4 text-xs font-semibold text-fp-text-dim hover:text-white"
          >
            ← Retour au menu
          </button>

          <h2 className="font-display text-2xl font-bold text-white">
            {isDebate ? "Configurer le Débat" : "Configurer la Partie"}
          </h2>

          {/* Catégories */}
          <div className="mt-5">
            <h3 className="font-display text-xs font-bold uppercase tracking-widest text-fp-text-dim mb-2">
              Discipline
            </h3>
            <div className="flex flex-wrap gap-2">
              {(isDebate ? DEBATE_CATEGORIES : ["mixed", ...CATEGORIES]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c as QuestionCategory | "mixed")}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    category === c
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                      : "border border-white/10 bg-white/5 text-fp-text-dim hover:text-white"
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
            className="fp-btn-primary mt-8 w-full text-base font-bold"
          >
            Lancer la partie
          </button>
        </section>
      ) : step === "specialty-modal" ? (
        /* Modal Sélection Spécialité */
        <section className="mt-6 fp-card p-6 border border-white/20 animate-pop">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="font-display text-xl font-bold text-white">Choisis ta Spécialité</h2>
              <p className="text-xs text-fp-text-dim mt-0.5">
                Les questions de ta spécialité passeront en Niveau 4 (Expert) pour tester ton domaine !
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep("home")}
              className="text-xs font-semibold text-fp-text-dim hover:text-white"
            >
              ✕ Fermer
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SPECIALTIES.map((spec) => (
              <button
                key={spec.id}
                type="button"
                onClick={() => {
                  setUserSpecialty(spec.id);
                  setStep("home");
                }}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                  userSpecialty === spec.id
                    ? "border-violet-500 bg-violet-950/40 text-white shadow-lg shadow-violet-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/25 text-white/80"
                }`}
              >
                <span className="text-2xl shrink-0 mt-0.5">{spec.emoji}</span>
                <div className="flex flex-col">
                  <span className="font-display text-sm font-bold">{spec.name}</span>
                  <span className="text-[11px] text-fp-text-dim leading-snug mt-1">
                    {spec.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : step === "private-modal" ? (
        /* Modal Salon Privé Créé */
        <section className="mt-6 fp-card p-6 border border-white/20 text-center animate-pop">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-300">
            SALON PRIVÉ PRÊT
          </span>
          <h2 className="font-display text-3xl font-extrabold text-white mt-2">Code d&apos;invitation</h2>

          <div className="my-6 inline-flex items-center justify-center rounded-2xl border-2 border-amber-400/60 bg-amber-400/10 px-8 py-4">
            <span className="font-mono text-4xl font-black tracking-[0.3em] text-white">
              {privateCode}
            </span>
          </div>

          <p className="text-xs text-fp-text-dim max-w-sm mx-auto mb-6">
            Partage ce code à tes amis. Ils peuvent rejoindre instantanément depuis l&apos;accueil sans création de compte.
          </p>

          <div className="flex gap-3 max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.origin + `?room=${privateCode}`);
                alert("Lien d'invitation copié !");
              }}
              className="fp-btn-ghost flex-1 text-xs"
            >
              📋 Copier le lien
            </button>
            <button
              type="button"
              onClick={() => launchQuickGame("express")}
              className="fp-btn-primary flex-1 text-sm font-bold"
            >
              🚀 Lancer
            </button>
          </div>
        </section>
      ) : null}

      <footer className="mt-16 text-center text-xs text-fp-text-dim/60">
        {BRAND.fullName} · {BRAND.tagline} · PWA Installable · Zéro API externe en jeu
      </footer>
    </main>
  );
}
