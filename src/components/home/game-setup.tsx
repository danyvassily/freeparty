"use client";

/**
 * Free Party — Écran de configuration d'une partie (style Réglages Apple)
 * Mode choisi → joueurs (1 à 8, noms éditables) → catégorie → questions → jouer.
 */
import { useMemo, useState } from "react";
import { Minus, Plus, Play, ChevronLeft } from "lucide-react";
import {
  useGameStore,
  resizePlayers,
  MAX_PLAYERS,
  type GameConfig,
  type GameMode,
  newGameSessionId,
} from "@/lib/store/game";
import { useSettingsStore } from "@/lib/store/settings";
import { CATEGORIES, type QuestionCategory } from "@/lib/questions/schema";
import { CATEGORY_LABELS, MODE_META, QUESTION_COUNT_OPTIONS } from "@/lib/game/modes";
import { SegmentControl, SectionTitle, PlayerDot } from "@/components/ui/primitives";

interface GameSetupProps {
  mode: GameMode;
  onBack: () => void;
  onLaunch: (config: GameConfig) => void;
}

export function GameSetup({ mode, onBack, onLaunch }: GameSetupProps) {
  const meta = MODE_META[mode];
  const settings = useSettingsStore();
  const players = useGameStore((s) => s.players);
  const setPlayers = useGameStore((s) => s.setPlayers);

  const [category, setCategory] = useState<QuestionCategory | "mixed">("mixed");
  const [questionCount, setQuestionCount] = useState<number>(settings.defaultQuestionCount);

  const minPlayers = meta.minPlayers;
  const effective = useMemo(
    () => (players.length < minPlayers ? resizePlayers(players, minPlayers) : players),
    [players, minPlayers],
  );
  const count = effective.length;

  function setCount(next: number) {
    setPlayers(resizePlayers(effective, Math.max(minPlayers, Math.min(MAX_PLAYERS, next))));
  }

  function renamePlayer(index: number, name: string) {
    const next = effective.map((p, i) => (i === index ? { ...p, name } : p));
    setPlayers(next);
  }

  function launch() {
    const finalPlayers = effective.map((p, i) => ({
      ...p,
      name: p.name.trim() || `Joueur ${i + 1}`,
    }));
    setPlayers(finalPlayers);

    const cfg: GameConfig = {
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
    };
    onLaunch(cfg);
  }

  return (
    <div className="animate-rise">
      {/* Navigation */}
      <div className="flex items-center justify-between px-1 py-2">
        <button
          type="button"
          onClick={onBack}
          className="fp-btn-ghost inline-flex items-center gap-1 px-2 py-1 text-[16px]"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Retour</span>
        </button>
        <h1 className="text-[17px] font-semibold text-fp-text">{meta.name}</h1>
        <span className="w-16" aria-hidden="true" />
      </div>

      {/* Joueurs */}
      <div className="mt-4">
        <SectionTitle>Joueurs</SectionTitle>
        <div className="fp-list">
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-[15px] font-medium text-fp-text">Nombre de joueurs</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCount(count - 1)}
                disabled={count <= minPlayers}
                aria-label="Retirer un joueur"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.05] text-fp-text transition active:scale-95 disabled:opacity-30"
              >
                <Minus className="h-4.5 w-4.5" />
              </button>
              <span className="w-7 text-center text-[17px] font-semibold tabular-nums text-fp-text">{count}</span>
              <button
                type="button"
                onClick={() => setCount(count + 1)}
                disabled={count >= MAX_PLAYERS}
                aria-label="Ajouter un joueur"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.05] text-fp-text transition active:scale-95 disabled:opacity-30"
              >
                <Plus className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
          {effective.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
              <PlayerDot name={p.name} colorIndex={p.color} size={32} />
              <input
                value={p.name}
                onChange={(e) => renamePlayer(i, e.target.value)}
                maxLength={20}
                placeholder={`Joueur ${i + 1}`}
                aria-label={`Nom du joueur ${i + 1}`}
                className="min-w-0 flex-1 bg-transparent py-2 text-[15px] font-medium text-fp-text outline-none placeholder:text-fp-text-dim"
              />
            </div>
          ))}
        </div>
        {count === 1 && meta.passAndPlay && (
          <p className="px-4 pt-2 text-[13px] text-fp-text-dim">
            Ajoute des joueurs pour jouer à tour de rôle sur cet appareil.
          </p>
        )}
        {minPlayers > 1 && (
          <p className="px-4 pt-2 text-[13px] text-fp-text-dim">
            {meta.name} se joue à {minPlayers} joueurs minimum.
          </p>
        )}
      </div>

      {/* Catégorie */}
      {meta.usesQuestionCatalog && (
        <div className="mt-6">
          <SectionTitle>Catégorie</SectionTitle>
          <div className="fp-card p-3">
            <div className="flex flex-wrap gap-2">
              {(["mixed", ...CATEGORIES] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-full px-3.5 py-2 text-[13px] font-medium transition active:scale-95 ${
                    category === c
                      ? "bg-fp-primary text-white shadow-xs"
                      : "bg-black/[0.04] text-fp-text hover:bg-black/[0.08]"
                  }`}
                >
                  {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Nombre de questions */}
      {meta.usesQuestionCatalog && mode !== "prism" && mode !== "rapidfire" && mode !== "truefalse" && (
        <div className="mt-6">
          <SectionTitle>Nombre de questions</SectionTitle>
          <div className="px-1">
            <SegmentControl
              options={QUESTION_COUNT_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
              value={String(questionCount)}
              onChange={(v) => setQuestionCount(Number(v))}
            />
          </div>
        </div>
      )}

      {/* Bouton Jouer */}
      <button
        type="button"
        onClick={launch}
        className="fp-btn-primary mt-8 flex w-full items-center justify-center gap-2 py-4 text-[17px]"
      >
        <Play className="h-5 w-5 fill-white" />
        <span>Jouer</span>
      </button>
    </div>
  );
}
