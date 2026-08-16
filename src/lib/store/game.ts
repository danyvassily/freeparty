/**
 * Free Party — Game store (spec §54–§55, §84)
 * Configuration de partie locale : pas d'inscription, on joue en quelques secondes.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuestionCategory } from "@/lib/questions/schema";

export const GAME_MODES = [
  "prism",
  "classic",
  "truefalse",
  "rapidfire",
  "timeline",
  "teambattle",
  "wyr",
  "guess",
  "debate",
] as const;
export type GameMode = (typeof GAME_MODES)[number];

export interface Player {
  id: string;
  name: string;
  /** 0..5 : couleur d'avatar (index palette) */
  color: number;
  specialtyId?: string;
  score: number;
  correct: number;
  wrong: number;
  /** Team A/B pour Team Battle */
  team?: "A" | "B";
}

export interface GameConfig {
  mode: GameMode;
  category: QuestionCategory | "mixed";
  thematicTheme?: string;
  duration?: "express" | "classic"; // express = 10 min, classic = 20 min
  difficulty: string; // "mixed" | easy | medium | hard | expert
  players: Player[];
  questionCount: number;
  /** secondes par question (classic) */
  timePerQuestion: number;
  debateMinutes: number;
  debateMode: string;
  spectatorsAllowed?: boolean;
}

export interface GameState {
  config: GameConfig | null;
  setConfig: (config: GameConfig) => void;
  reset: () => void;
  addScore: (playerId: string, points: number) => void;
  resetScores: () => void;
}

export const PLAYER_COLORS = [
  "#8b5cf6", "#22d3ee", "#f59e0b", "#34d399", "#fb7185", "#d946ef",
];

export const DEFAULT_CONFIG: GameConfig = {
  mode: "prism",
  category: "mixed",
  duration: "express",
  difficulty: "mixed",
  players: [{ id: "p1", name: "Dany", color: 0, specialtyId: "cinema", score: 0, correct: 0, wrong: 0 }],
  questionCount: 10,
  timePerQuestion: 15,
  debateMinutes: 5,
  debateMode: "standard",
};

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      config: null,
      setConfig: (config) => set({ config }),
      reset: () => set({ config: null }),
      addScore: (playerId, points) =>
        set((s) => ({
          config: s.config
            ? {
                ...s.config,
                players: s.config.players.map((p) =>
                  p.id === playerId ? { ...p, score: p.score + points } : p,
                ),
              }
            : null,
        })),
      resetScores: () =>
        set((s) => ({
          config: s.config
            ? {
                ...s.config,
                players: s.config.players.map((p) => ({
                  ...p,
                  score: 0,
                  correct: 0,
                  wrong: 0,
                })),
              }
            : null,
        })),
    }),
    { name: "freeparty-game" },
  ),
);

let playerCounter = 2;
export function newPlayer(name?: string): Player {
  const id = `p${Date.now().toString(36)}`;
  return {
    id,
    name: name || `Joueur ${playerCounter++}`,
    color: (playerCounter - 2) % PLAYER_COLORS.length,
    score: 0,
    correct: 0,
    wrong: 0,
  };
}
