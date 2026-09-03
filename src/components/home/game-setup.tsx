"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, Minus, Play, Plus, UsersRound } from "lucide-react";
import {
  MAX_PLAYERS,
  newGameSessionId,
  resizePlayers,
  type GameConfig,
  type GameMode,
  useGameStore,
} from "@/lib/store/game";
import { useSettingsStore } from "@/lib/store/settings";
import { CATEGORIES, type QuestionCategory } from "@/lib/questions/schema";
import { CATEGORY_LABELS, MODE_META, QUESTION_COUNT_OPTIONS } from "@/lib/game/modes";
import { PlayerDot, SegmentControl } from "@/components/ui/primitives";
import { AppIcon } from "@/components/ui/icons";
import { KawaiiMascot } from "@/components/ui/kawaii-mascot";

interface GameSetupProps {
  mode: GameMode;
  onBack: () => void;
  onLaunch: (config: GameConfig) => void;
}

export function GameSetup({ mode, onBack, onLaunch }: GameSetupProps) {
  const meta = MODE_META[mode];
  const settings = useSettingsStore();
  const players = useGameStore((state) => state.players);
  const setPlayers = useGameStore((state) => state.setPlayers);
  const [category, setCategory] = useState<QuestionCategory | "mixed">("mixed");
  const [questionCount, setQuestionCount] = useState(settings.defaultQuestionCount);

  const effectivePlayers = useMemo(
    () => (players.length < meta.minPlayers ? resizePlayers(players, meta.minPlayers) : players),
    [players, meta.minPlayers],
  );

  function setPlayerCount(next: number) {
    setPlayers(resizePlayers(effectivePlayers, Math.max(meta.minPlayers, Math.min(MAX_PLAYERS, next))));
  }

  function renamePlayer(index: number, name: string) {
    setPlayers(effectivePlayers.map((player, playerIndex) => (playerIndex === index ? { ...player, name } : player)));
  }

  function launch() {
    const finalPlayers = effectivePlayers.map((player, index) => ({
      ...player,
      name: player.name.trim() || `Joueur ${index + 1}`,
    }));
    setPlayers(finalPlayers);
    onLaunch({
      sessionId: newGameSessionId(),
      mode,
      category,
      difficulty: "mixed",
      players: finalPlayers,
      questionCount,
      timePerQuestion:
        mode === "rapidfire"
          ? settings.rapidFireTime
          : mode === "truefalse"
            ? settings.trueFalseTime
            : settings.classicTime,
      debateMinutes: settings.debateMinutes,
      debateMode: "standard",
    });
  }

  const showQuestionCount = meta.usesQuestionCatalog && !["prism", "rapidfire", "truefalse"].includes(mode);

  return (
    <div className="animate-rise">
      <button type="button" onClick={onBack} className="fp-btn-ghost -ml-2 gap-1">
        <ChevronLeft className="h-5 w-5" />Tous les modes
      </button>

      <header className="mt-5 flex items-center gap-4">
        <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white ${meta.iconBg}`}>
          <AppIcon name={meta.icon} className="h-6 w-6" />
        </span>
        <div>
          <p className="fp-eyebrow">Configurer la partie</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-fp-text">{meta.name}</h1>
          <p className="mt-1 text-sm text-fp-text-dim">{meta.subtitle}</p>
        </div>
      </header>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_17rem]">
        <div className="space-y-5">
          <section className="fp-card p-5 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-fp-border pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-fp-text">1. Ajoutez les joueurs</h2>
                <p className="mt-1 text-sm text-fp-text-dim">Ils joueront à tour de rôle sur cet appareil.</p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button type="button" onClick={() => setPlayerCount(effectivePlayers.length - 1)} disabled={effectivePlayers.length <= meta.minPlayers} className="grid h-11 w-11 place-items-center rounded-xl border border-fp-border bg-white disabled:opacity-35" aria-label="Retirer un joueur"><Minus className="h-4 w-4" /></button>
                <span className="w-10 text-center text-xl font-black tabular-nums">{effectivePlayers.length}</span>
                <button type="button" onClick={() => setPlayerCount(effectivePlayers.length + 1)} disabled={effectivePlayers.length >= MAX_PLAYERS} className="grid h-11 w-11 place-items-center rounded-xl border border-fp-border bg-white disabled:opacity-35" aria-label="Ajouter un joueur"><Plus className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {effectivePlayers.map((player, index) => (
                <label key={player.id} className="flex items-center gap-3 rounded-xl border border-fp-border bg-fp-bg/55 p-2.5">
                  <PlayerDot name={player.name} colorIndex={player.color} size={34} />
                  <span className="sr-only">Nom du joueur {index + 1}</span>
                  <input value={player.name} onChange={(event) => renamePlayer(index, event.target.value)} maxLength={20} placeholder={`Joueur ${index + 1}`} className="min-w-0 flex-1 bg-transparent py-2 text-sm font-semibold text-fp-text outline-none" />
                </label>
              ))}
            </div>
          </section>

          {meta.usesQuestionCatalog && (
            <section className="fp-card p-5 sm:p-6">
              <h2 className="text-lg font-extrabold text-fp-text">2. Choisissez les questions</h2>
              <p className="mt-1 text-sm text-fp-text-dim">Mélangez tout ou sélectionnez un thème précis.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {(["mixed", ...CATEGORIES] as const).map((value) => (
                  <button key={value} type="button" onClick={() => setCategory(value)} className={`min-h-10 rounded-full px-3.5 text-sm font-semibold transition ${category === value ? "bg-fp-primary text-white shadow-sm" : "border border-fp-border bg-white text-fp-text hover:border-fp-primary/40"}`}>
                    {CATEGORY_LABELS[value]}
                  </button>
                ))}
              </div>

              {showQuestionCount && (
                <div className="mt-6 border-t border-fp-border pt-5">
                  <label className="mb-3 block text-sm font-bold text-fp-text">Nombre de questions</label>
                  <SegmentControl options={QUESTION_COUNT_OPTIONS.map((count) => ({ value: String(count), label: `${count}` }))} value={String(questionCount)} onChange={(value) => setQuestionCount(Number(value))} />
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="fp-card p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-fp-text-dim">Votre partie</p>
              <p className="mt-1 text-lg font-extrabold text-fp-text">{meta.name}</p>
            </div>
            <KawaiiMascot theme={mode === "psycho" ? "thinking" : mode === "debate" || mode === "wyr" ? "debate" : mode === "rapidfire" ? "speed" : "quiz"} size={62} />
          </div>
          <dl className="mt-5 space-y-3 border-y border-fp-border py-4 text-sm">
            <div className="flex items-center justify-between gap-3"><dt className="inline-flex items-center gap-2 text-fp-text-dim"><UsersRound className="h-4 w-4" />Joueurs</dt><dd className="font-bold text-fp-text">{effectivePlayers.length}</dd></div>
            {meta.usesQuestionCatalog && <div className="flex items-center justify-between gap-3"><dt className="text-fp-text-dim">Catégorie</dt><dd className="max-w-32 truncate font-bold text-fp-text">{CATEGORY_LABELS[category]}</dd></div>}
            {showQuestionCount && <div className="flex items-center justify-between gap-3"><dt className="text-fp-text-dim">Questions</dt><dd className="font-bold text-fp-text">{questionCount}</dd></div>}
          </dl>
          <button type="button" onClick={launch} className="fp-btn-primary mt-5 w-full gap-2"><Play className="h-4.5 w-4.5 fill-current" />Lancer la partie</button>
          <p className="mt-3 text-center text-xs leading-5 text-fp-text-dim">Vous pourrez revenir à l’accueil à tout moment.</p>
        </aside>
      </div>
    </div>
  );
}
