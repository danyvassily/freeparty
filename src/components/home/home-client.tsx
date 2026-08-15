"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { ModeCard } from "@/components/ui/primitives";
import { useGameStore, newPlayer, PLAYER_COLORS, type GameConfig, type Player } from "@/lib/store/game";
import { CATEGORIES, type QuestionCategory } from "@/lib/questions/schema";
import { DEBATE_CATEGORIES, DEBATE_DURATIONS, DEBATE_MODES } from "@/lib/debate/schema";

type Step = "home" | "config";

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
    title: "Quiz",
    emoji: "🎯",
    modes: [
      { id: "classic", title: "Classic Quiz", subtitle: "10 questions, 4 choix, tout le monde joue", emoji: "🎯", gradient: "bg-gradient-to-br from-fp-primary to-fp-primary-2" },
      { id: "truefalse", title: "Vrai / Faux", subtitle: "Rapide et sans pitié", emoji: "⚡", gradient: "bg-gradient-to-br from-fp-primary-2 to-fp-accent-2" },
      { id: "rapidfire", title: "Rapid Fire", subtitle: "20 questions en 6 secondes chacune", emoji: "🔥", gradient: "bg-gradient-to-br from-fp-accent to-fp-danger" },
      { id: "timeline", title: "Timeline", subtitle: "Replace les événements dans l’ordre", emoji: "🕰️", gradient: "bg-gradient-to-br from-fp-accent-2 to-fp-success" },
      { id: "teambattle", title: "Team Battle", subtitle: "Deux équipes s’affrontent", emoji: "⚔️", gradient: "bg-gradient-to-br from-fp-danger to-fp-primary-2" },
    ],
  },
  {
    title: "Social",
    emoji: "🎉",
    modes: [
      { id: "wyr", title: "Would You Rather", subtitle: "Les choix impossibles qui fâchent", emoji: "🤔", gradient: "bg-gradient-to-br from-fp-warning to-fp-accent" },
      { id: "guess", title: "Guess", subtitle: "Devine avec des indices progressifs", emoji: "🕵️", gradient: "bg-gradient-to-br from-fp-success to-fp-accent-2" },
    ],
  },
  {
    title: "Débat",
    emoji: "💬",
    modes: [
      { id: "debate", title: "Debate Mode", subtitle: "Philosophie, politique, éthique — on argumente, personne ne gagne", emoji: "💬", gradient: "bg-gradient-to-br from-fp-primary to-fp-accent" },
    ],
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  "culture-generale": "Culture générale",
  geographie: "Géographie",
  histoire: "Histoire & guerres",
  cinema: "Cinéma",
  series: "Séries",
  musique: "Musique",
  "manga-anime": "Manga & Anime",
  gaming: "Jeux vidéo",
  science: "Science",
  technologie: "Technologie",
  internet: "Internet",
  "mythologie-grecque": "Mythologie grecque",
  "mythologie-egyptienne": "Mythologie égyptienne",
  philosophie: "Philosophie",
  sport: "Sport",
  football: "Football",
  food: "Cuisine",
  litterature: "Littérature",
  insolite: "Insolite",
};

const DEBATE_CATEGORY_LABELS: Record<string, string> = {
  politics: "Politique",
  philosophy: "Philosophie",
  history: "Histoire",
  ethics: "Éthique",
  "current-issues": "Actualité",
};

const DEBATE_MODE_LABELS: Record<string, string> = {
  standard: "Débat classique",
  "change-my-mind": "Change My Mind",
  "devils-advocate": "Avocat du diable",
  "ethical-dilemma": "Dilemme éthique",
};

export function HomeClient() {
  const router = useRouter();
  const { config, setConfig } = useGameStore();
  const [step, setStep] = useState<Step>("home");
  const [selectedMode, setSelectedMode] = useState<GameConfig["mode"]>("classic");
  const [category, setCategory] = useState<QuestionCategory | "mixed">("mixed");
  const [difficulty, setDifficulty] = useState("mixed");
  const [players, setPlayers] = useState<Player[]>(() => [
    { id: "p1", name: "Joueur 1", color: 0, score: 0, correct: 0, wrong: 0 },
  ]);
  const [questionCount, setQuestionCount] = useState(10);
  const [debateMinutes, setDebateMinutes] = useState(5);
  const [debateMode, setDebateMode] = useState("standard");

  const isDebate = selectedMode === "debate";

  function pickMode(mode: GameConfig["mode"]) {
    setSelectedMode(mode);
    setStep("config");
  }

  function start() {
    const cfg: GameConfig = {
      mode: selectedMode,
      category,
      difficulty,
      players,
      questionCount,
      timePerQuestion: selectedMode === "rapidfire" ? 6 : 15,
      debateMinutes,
      debateMode,
    };
    setConfig(cfg);
    router.push("/play");
  }

  function addPlayer() {
    setPlayers((prev) => [...prev, newPlayer()]);
  }

  function removePlayer(id: string) {
    setPlayers((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));
  }

  function updatePlayer(id: string, name: string) {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }

  const categories = useMemo(() => {
    if (isDebate) return DEBATE_CATEGORIES;
    return ["mixed", ...CATEGORIES];
  }, [isDebate]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-5 pb-28 pt-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fp-primary to-fp-primary-2 text-xl shadow-lg shadow-fp-primary/30">
            🎉
          </div>
          <span className="font-display text-xl font-bold tracking-tight">{BRAND.name}</span>
        </div>
        <span className="rounded-full border border-fp-border bg-fp-surface px-3 py-1 text-xs text-fp-text-dim">
          {BRAND.tagline}
        </span>
      </header>

      {step === "home" ? (
        <>
          {/* Hero */}
          <section className="mt-10 text-center">
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              <span className="fp-gradient-text">Joue.</span>
              <br />
              <span className="text-white">Connais.</span>{" "}
              <span className="fp-gradient-text">Débats.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-md text-fp-text-dim">
              Quiz, culture générale, mythologies, débats profonds. Le jeu social qui rend les soirées
              inoubliables — sans inscription, prêt en 5 secondes.
            </p>
            <button
              type="button"
              onClick={() => pickMode("classic")}
              className="fp-btn-primary mt-8 text-lg"
            >
              🎲 Lancer une partie
            </button>
          </section>

          {/* Modes */}
          {MODE_GROUPS.map((group) => (
            <section key={group.title} className="mt-10">
              <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-fp-text-dim">
                <span aria-hidden="true">{group.emoji}</span> {group.title}
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
      ) : (
        <>
          {/* Config */}
          <section className="mt-8">
            <button
              type="button"
              onClick={() => setStep("home")}
              className="mb-6 text-sm text-fp-text-dim transition-colors hover:text-white"
            >
              ← Retour
            </button>
            <h2 className="font-display text-3xl font-bold">
              {isDebate ? "Lancer un débat" : "Configurer la partie"}
            </h2>

            {/* Catégorie */}
            <div className="mt-6">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-fp-text-dim">
                {isDebate ? "Thème du débat" : "Catégorie"}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat as QuestionCategory | "mixed")}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                      category === cat
                        ? "bg-gradient-to-r from-fp-primary to-fp-primary-2 text-white shadow-lg shadow-fp-primary/30"
                        : "border border-fp-border bg-fp-surface text-fp-text-dim hover:text-white"
                    }`}
                  >
                    {cat === "mixed"
                      ? "Mixte"
                      : (isDebate ? DEBATE_CATEGORY_LABELS[cat] : CATEGORY_LABELS[cat]) ?? cat}
                  </button>
                ))}
              </div>
            </div>

            {isDebate ? (
              <>
                {/* Mode débat */}
                <div className="mt-6">
                  <h3 className="font-display text-sm font-bold uppercase tracking-widest text-fp-text-dim">Format</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {DEBATE_MODES.map((dm) => (
                      <button
                        key={dm}
                        type="button"
                        onClick={() => setDebateMode(dm)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                          debateMode === dm
                            ? "bg-gradient-to-r from-fp-primary to-fp-accent text-white shadow-lg shadow-fp-primary/30"
                            : "border border-fp-border bg-fp-surface text-fp-text-dim hover:text-white"
                        }`}
                      >
                        {DEBATE_MODE_LABELS[dm]}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Durée */}
                <div className="mt-6">
                  <h3 className="font-display text-sm font-bold uppercase tracking-widest text-fp-text-dim">Durée</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {DEBATE_DURATIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDebateMinutes(d / 60)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                          debateMinutes === d / 60
                            ? "bg-gradient-to-r from-fp-primary to-fp-accent text-white"
                            : "border border-fp-border bg-fp-surface text-fp-text-dim hover:text-white"
                        }`}
                      >
                        {d === 60 ? "1 min" : d === 180 ? "3 min" : d === 300 ? "5 min" : d === 600 ? "10 min" : "15 min"}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Difficulté */}
                <div className="mt-6">
                  <h3 className="font-display text-sm font-bold uppercase tracking-widest text-fp-text-dim">Difficulté</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["mixed", "easy", "medium", "hard", "expert"].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                          difficulty === d
                            ? "bg-gradient-to-r from-fp-primary to-fp-primary-2 text-white"
                            : "border border-fp-border bg-fp-surface text-fp-text-dim hover:text-white"
                        }`}
                      >
                        {d === "mixed" ? "Mixte" : d === "easy" ? "Facile" : d === "medium" ? "Moyen" : d === "hard" ? "Difficile" : "Expert"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nombre de questions */}
                <div className="mt-6">
                  <h3 className="font-display text-sm font-bold uppercase tracking-widest text-fp-text-dim">
                    Questions : {questionCount}
                  </h3>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    step={5}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="mt-3 w-full accent-fp-primary"
                    aria-label="Nombre de questions"
                  />
                </div>
              </>
            )}

            {/* Joueurs */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold uppercase tracking-widest text-fp-text-dim">Joueurs</h3>
                <button
                  type="button"
                  onClick={addPlayer}
                  disabled={players.length >= 8}
                  className="rounded-full border border-fp-border bg-fp-surface px-3 py-1 text-xs font-semibold text-fp-text-dim transition-colors hover:text-white disabled:opacity-40"
                >
                  + Ajouter
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {players.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-fp-border bg-fp-surface px-4 py-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: PLAYER_COLORS[p.color % PLAYER_COLORS.length] }}
                      aria-hidden="true"
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                    <input
                      value={p.name}
                      onChange={(e) => updatePlayer(p.id, e.target.value)}
                      maxLength={16}
                      aria-label={`Nom du joueur ${i + 1}`}
                      className="w-full bg-transparent font-semibold text-white outline-none placeholder:text-fp-text-dim"
                      placeholder={`Joueur ${i + 1}`}
                    />
                    {players.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePlayer(p.id)}
                        aria-label={`Retirer ${p.name}`}
                        className="text-fp-text-dim transition-colors hover:text-fp-danger"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button type="button" onClick={start} className="fp-btn-primary mt-8 w-full text-lg">
              {isDebate ? "💬 Lancer le débat" : "🚀 Jouer"}
            </button>
          </section>
        </>
      )}

      <footer className="mt-16 text-center text-xs text-fp-text-dim/60">
        {BRAND.name} — {BRAND.tagline} · Jeu 100% local · {config ? "Partie configurée" : "Prêt à jouer"}
      </footer>
    </main>
  );
}
