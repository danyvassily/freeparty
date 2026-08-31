"use client";

/**
 * Free Party — Accueil Premium Apple HIG avec Mascottes Kawaii
 * Navigation segmentée (Local vs En Ligne), Spotlight Bento, Grille de modes responsive.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Globe, Smartphone, Sparkles, Users, ArrowRight, Play, Plus, Minus, User } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { GameSetup } from "@/components/home/game-setup";
import { MODE_META, MODE_SECTIONS } from "@/lib/game/modes";
import { useGameStore, resizePlayers, MAX_PLAYERS, type GameMode } from "@/lib/store/game";
import { useLanguageStore } from "@/lib/store/language";
import { useAuth } from "@/lib/auth/use-auth";
import { PlayerDot } from "@/components/ui/primitives";
import { AppIcon } from "@/components/ui/icons";
import { KawaiiMascot, type KawaiiTheme } from "@/components/ui/kawaii-mascot";

const MODE_MASCOTS: Record<GameMode, KawaiiTheme> = {
  prism: "quiz",
  classic: "quiz",
  truefalse: "quiz",
  rapidfire: "speed",
  timeline: "quiz",
  teambattle: "party",
  wyr: "debate",
  guess: "quiz",
  debate: "debate",
};

export function HomeClient() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const setConfig = useGameStore((s) => s.setConfig);
  const players = useGameStore((s) => s.players);
  const setPlayers = useGameStore((s) => s.setPlayers);
  const lang = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const [activeTab, setActiveTab] = useState<"local" | "online">("local");
  const [setupMode, setSetupMode] = useState<GameMode | null>(null);
  const [quickJoinCode, setQuickJoinCode] = useState("");

  const effectivePlayers = players.length >= 1 ? players : [{ id: "p1", name: "Joueur 1", color: 0, score: 0, correct: 0, wrong: 0 }];

  function handlePlayerCount(delta: number) {
    const nextCount = Math.max(1, Math.min(MAX_PLAYERS, effectivePlayers.length + delta));
    setPlayers(resizePlayers(effectivePlayers, nextCount));
  }

  function launchQuickGame() {
    setConfig({
      mode: "classic",
      category: "mixed",
      difficulty: "mixed",
      players: effectivePlayers.map((p, i) => ({ ...p, name: p.name.trim() || `Joueur ${i + 1}` })),
      questionCount: 10,
      timePerQuestion: 15,
      debateMinutes: 5,
      debateMode: "standard",
    });
    router.push("/play");
  }

  if (setupMode) {
    return (
      <main className="mx-auto w-full max-w-xl sm:max-w-2xl px-4 sm:px-6 pb-16 pt-4">
        <GameSetup
          mode={setupMode}
          onBack={() => setSetupMode(null)}
          onLaunch={(cfg) => {
            setConfig(cfg);
            router.push("/play");
          }}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl sm:max-w-3xl px-4 sm:px-6 pb-20 pt-3">
      {/* Header Apple épuré */}
      <header className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-fp-text text-white font-bold text-[15px] tracking-tight shadow-sm">
            JX
          </div>
          <div>
            <h1 className="text-[17px] font-bold tracking-tight text-fp-text leading-none">{BRAND.name}</h1>
            <p className="text-[11px] font-medium uppercase tracking-wider text-fp-text-dim">Party Game</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton Compte / Connexion */}
          <button
            type="button"
            onClick={() => router.push("/auth")}
            className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition active:scale-95 ${
              isLoggedIn
                ? "bg-fp-primary/10 text-fp-primary hover:bg-fp-primary/20"
                : "bg-fp-primary text-white shadow-xs hover:bg-fp-primary-dark"
            }`}
            aria-label="Profil et compte"
          >
            <User className="h-4 w-4" />
            <span className="max-w-[100px] truncate">{isLoggedIn && user ? user.name : "Mon compte"}</span>
          </button>

          {/* Sélecteur de langue rapide */}
          <button
            type="button"
            onClick={() => setLanguage(lang === "fr" ? "en" : "fr")}
            className="flex h-9 items-center gap-1 rounded-full bg-black/[0.04] px-3 text-[13px] font-semibold text-fp-text transition hover:bg-black/[0.07] active:scale-95"
            aria-label="Changer de langue"
          >
            <span>{lang === "fr" ? "🇫🇷 FR" : "🇬🇧 EN"}</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/settings")}
            aria-label="Réglages"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.04] text-fp-text-dim transition hover:bg-black/[0.07] hover:text-fp-text active:scale-95"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      {/* Grand Titre & Slogan avec mascotte joyeuse */}
      <section className="px-1 pt-5 pb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[30px] sm:text-[38px] font-bold leading-tight tracking-tight text-fp-text">
            Soirée Quiz & Débats
          </h2>
          <p className="mt-1 text-[14px] sm:text-[15px] text-fp-text-dim max-w-md">
            Jouez ensemble sur un seul appareil ou rejoignez un salon connecté sur mobile et tablette.
          </p>
        </div>
        <KawaiiMascot theme="party" size={76} className="hidden sm:inline-flex border border-black/[0.04] shrink-0" />
      </section>

      {/* Contrôle segmenté Apple : Local vs En Ligne */}
      <div className="mt-2 rounded-2xl bg-black/[0.06] p-1 flex items-center">
        <button
          type="button"
          onClick={() => setActiveTab("local")}
          className={`flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition-all active:scale-[0.98] ${
            activeTab === "local"
              ? "bg-white text-fp-text shadow-sm"
              : "text-fp-text-dim hover:text-fp-text"
          }`}
        >
          <Smartphone className="h-4 w-4 text-fp-primary" />
          <span>Sur 1 appareil</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("online")}
          className={`flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition-all active:scale-[0.98] ${
            activeTab === "online"
              ? "bg-white text-fp-text shadow-sm"
              : "text-fp-text-dim hover:text-fp-text"
          }`}
        >
          <Globe className="h-4 w-4 text-[#34c759]" />
          <span>Salons en ligne</span>
        </button>
      </div>

      {/* Bento Spotlight Card */}
      {activeTab === "local" ? (
        <section className="mt-5 fp-card p-5 sm:p-6 border border-black/[0.04] relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between pb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-fp-primary/10 px-3 py-1 text-[12px] font-semibold text-fp-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Lancement Rapide
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlayerCount(-1)}
                    disabled={effectivePlayers.length <= 1}
                    aria-label="Moins de joueurs"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/[0.05] text-fp-text transition active:scale-95 disabled:opacity-30"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[13px] font-semibold tabular-nums text-fp-text">
                    {effectivePlayers.length} joueur{effectivePlayers.length > 1 ? "s" : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePlayerCount(1)}
                    disabled={effectivePlayers.length >= MAX_PLAYERS}
                    aria-label="Plus de joueurs"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/[0.05] text-fp-text transition active:scale-95 disabled:opacity-30"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="mt-1 text-[20px] sm:text-[24px] font-bold text-fp-text">
                Quiz Express Tour par Tour
              </h3>
              <p className="mt-1 text-[14px] text-fp-text-dim">
                10 questions sélectionnées au hasard. Passez l&apos;appareil à chaque tour !
              </p>

              {/* Roster de joueurs */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {effectivePlayers.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-2 rounded-full bg-black/[0.03] px-3 py-1.5 text-[13px] font-medium text-fp-text"
                  >
                    <PlayerDot name={p.name} colorIndex={p.color} size={20} />
                    <span>{p.name}</span>
                  </span>
                ))}
              </div>
            </div>

            <KawaiiMascot theme="quiz" size={84} className="hidden sm:inline-flex border border-black/[0.04] shrink-0" />
          </div>

          <button
            type="button"
            onClick={launchQuickGame}
            className="fp-btn-primary mt-6 flex w-full items-center justify-center gap-2 py-4 text-[16px]"
          >
            <Play className="h-4.5 w-4.5 fill-white" />
            <span>Lancer la partie ({effectivePlayers.length}j)</span>
          </button>
        </section>
      ) : (
        <section className="mt-5 fp-card p-5 sm:p-6 border border-black/[0.04]">
          <div className="flex items-center justify-between pb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#34c759]/10 px-3 py-1 text-[12px] font-semibold text-[#34c759]">
              <Globe className="h-3.5 w-3.5" />
              Multijoueur Connecté
            </span>
            <span className="text-[12px] text-fp-text-dim">Sans inscription</span>
          </div>

          <h3 className="mt-2 text-[20px] sm:text-[24px] font-bold text-fp-text">
            Rejoindre ou Créer un Salon
          </h3>
          <p className="mt-1 text-[14px] text-fp-text-dim">
            Chaque ami joue sur son iPhone, iPad ou ordinateur en temps réel.
          </p>

          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => router.push("/play/online")}
              className="fp-btn-primary flex w-full items-center justify-center gap-2 py-4 text-[16px]"
            >
              <Plus className="h-5 w-5" />
              <span>Créer un salon</span>
            </button>

            <div className="relative my-3 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/[0.06]" />
              </div>
              <span className="relative bg-white px-3 text-[12px] font-semibold uppercase tracking-wider text-fp-text-dim">
                ou rejoindre un ami
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={quickJoinCode}
                onChange={(e) => setQuickJoinCode(e.target.value.toUpperCase())}
                placeholder="ENTREZ LE CODE PIN"
                maxLength={6}
                className="fp-input flex-1 px-4 py-3.5 text-center font-mono text-[16px] font-bold uppercase tracking-widest"
                aria-label="Code salon"
              />
              <button
                type="button"
                onClick={() => router.push(`/play/online?room=${quickJoinCode}`)}
                disabled={quickJoinCode.trim().length < 4}
                className="fp-btn-secondary flex items-center justify-center py-3.5 px-6 text-[15px] shrink-0"
              >
                Rejoindre le salon
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Grille Bento des Modes de Jeu avec mascottes de section */}
      {MODE_SECTIONS.map((section) => {
        const isQuizSection = section.title.toLowerCase().includes("quiz");
        const mascotTheme: KawaiiTheme = isQuizSection ? "quiz" : "debate";

        return (
          <section key={section.title} className="mt-8">
            <div className="fp-card mb-3 p-4 sm:p-5 flex items-center justify-between gap-4 border border-black/[0.04]">
              <div className="flex items-center gap-3.5">
                <KawaiiMascot theme={mascotTheme} size={54} className="border border-black/[0.04]" />
                <div>
                  <h3 className="text-[16px] sm:text-[18px] font-bold text-fp-text leading-tight">
                    {section.title}
                  </h3>
                  <p className="text-[13px] text-fp-text-dim">
                    {isQuizSection ? "Testez votre culture et vos réflexes" : "Débats d'idées et dilemmes amusants"}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-black/[0.04] px-3 py-1 text-[12px] font-semibold text-fp-text-dim shrink-0">
                {section.modes.length} modes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {section.modes.map((modeId) => {
                const meta = MODE_META[modeId];
                const modeMascot = MODE_MASCOTS[modeId] ?? "quiz";

                return (
                  <button
                    key={modeId}
                    type="button"
                    onClick={() => setSetupMode(modeId)}
                    className="fp-card group flex flex-col justify-between p-4 sm:p-5 text-left border border-black/[0.04] transition-all hover:border-black/[0.12] active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${meta.iconBg} shadow-xs`}>
                          <AppIcon name={meta.icon} className="h-5.5 w-5.5" />
                        </div>
                        <KawaiiMascot theme={modeMascot} size={36} className="border border-black/[0.04]" />
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-fp-text-dim">
                        <Users className="h-3 w-3" />
                        {meta.minPlayers === 1 ? "1-8j" : `${meta.minPlayers}+`}
                      </span>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-[16px] font-bold text-fp-text leading-snug group-hover:text-fp-primary transition-colors">
                        {meta.name}
                      </h4>
                      <p className="mt-1 text-[13px] text-fp-text-dim line-clamp-2 leading-relaxed">
                        {meta.subtitle}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-2 border-t border-black/[0.04] text-[12px] font-medium text-fp-primary">
                      <span>Configurer & jouer</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <footer className="mt-14 text-center text-[13px] font-medium text-fp-text-dim">
        <p>{BRAND.footerCredits}</p>
      </footer>
    </main>
  );
}
