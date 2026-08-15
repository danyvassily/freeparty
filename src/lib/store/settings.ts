/**
 * Free Party — Settings store (réglages globaux, persistés)
 * Tous les paramètres de temps de jeu, réglables dans /settings.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GameSettings {
  /** Temps par question Classic (s) */
  classicTime: number;
  /** Temps par question Rapid Fire (s) */
  rapidFireTime: number;
  /** Temps par question Vrai/Faux (s) */
  trueFalseTime: number;
  /** Nombre de questions par défaut */
  defaultQuestionCount: number;
  /** Durée du débat (min) */
  debateMinutes: number;
  /** Temps de réflexion du débat (s) */
  debatePreparation: number;
  /** Manches de Timeline */
  timelineRounds: number;
  /** Devinettes de Guess */
  guessRounds: number;
  /** Rounds de Would You Rather */
  wyrRounds: number;
}

export const DEFAULT_SETTINGS: GameSettings = {
  classicTime: 15,
  rapidFireTime: 6,
  trueFalseTime: 10,
  defaultQuestionCount: 10,
  debateMinutes: 5,
  debatePreparation: 30,
  timelineRounds: 3,
  guessRounds: 5,
  wyrRounds: 4,
};

export const TIME_OPTIONS = {
  classic: [10, 15, 20, 30],
  rapidFire: [5, 6, 8, 10],
  trueFalse: [8, 10, 15, 20],
  debateMinutes: [1, 3, 5, 10, 15],
  debatePrep: [15, 30, 60],
} as const;

interface SettingsState extends GameSettings {
  set: (partial: Partial<GameSettings>) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      set: (partial) => set(partial),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    { name: "freeparty-settings" },
  ),
);
