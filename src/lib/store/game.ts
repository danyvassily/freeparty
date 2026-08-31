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

export const MIN_PLAYERS = 1;
export const MAX_PLAYERS = 8;

export interface Player {
  id: string;
  name: string;
  /** 0..7 : couleur d'avatar (index palette) */
  color: number;
  score: number;
  correct: number;
  wrong: number;
  avatarUrl?: string;
  /** Team A/B pour Team Battle */
  team?: "A" | "B";
}

export interface GameConfig {
  mode: GameMode;
  category: QuestionCategory | "mixed";
  difficulty: string; // "mixed" | easy | medium | hard | expert
  players: Player[];
  questionCount: number;
  /** secondes par question (classic) */
  timePerQuestion: number;
  debateMinutes: number;
  debateMode: string;
}

export interface GameState {
  /** Joueurs mémorisés entre les parties (noms éditables) */
  players: Player[];
  setPlayers: (players: Player[]) => void;
  config: GameConfig | null;
  setConfig: (config: GameConfig) => void;
  reset: () => void;
  addScore: (playerId: string, points: number) => void;
  resetScores: () => void;
}

export const PLAYER_COLORS = [
  "#007aff", "#34c759", "#ff9500", "#ff2d55",
  "#af52de", "#5ac8fa", "#ffcc00", "#5856d6",
];

/** Crée un joueur avec un nom et une couleur par défaut. */
export function makePlayer(index: number, name?: string): Player {
  return {
    id: `p-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    name: name?.trim() || `Joueur ${index + 1}`,
    color: index % PLAYER_COLORS.length,
    score: 0,
    correct: 0,
    wrong: 0,
  };
}

/** Construit une liste de `count` joueurs en préservant les noms existants. */
export function resizePlayers(current: Player[], count: number): Player[] {
  const target = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, count));
  const out: Player[] = [];
  for (let i = 0; i < target; i++) {
    if (current[i]) {
      out.push({ ...current[i], color: i % PLAYER_COLORS.length, score: 0, correct: 0, wrong: 0 });
    } else {
      out.push(makePlayer(i));
    }
  }
  return out;
}

export const DEFAULT_CONFIG: GameConfig = {
  mode: "classic",
  category: "mixed",
  difficulty: "mixed",
  players: [makePlayer(0)],
  questionCount: 10,
  timePerQuestion: 15,
  debateMinutes: 5,
  debateMode: "standard",
};

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      players: [makePlayer(0, "Joueur 1"), makePlayer(1, "Joueur 2")],
      setPlayers: (players) => set({ players }),
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
