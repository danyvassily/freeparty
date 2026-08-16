/**
 * PRISM / Free Party — Master Game Engine (spec §2–§8, §28, Decisions 1–6)
 *
 * Moteur pur et déterministe pour le jeu de culture compétitif :
 * - Tour par tour (15s, +100, bonus vitesse +50, vol/steal 5s +50)
 * - Choix de l'adversaire & arme diplomatique de catégorie
 * - Buzzer électrique (-50 pts sur erreur, lockout, indices progressifs 1000/750/500 pts)
 * - Le Cut & Question de Sauvetage (Élimination Hybride C)
 * - La Ligne (Finale signature 9 positions, DOUBLE tous les 3 tours, chrono 90s)
 */
import type { Question, QuestionCategory } from "@/lib/questions/schema";

export type PrismDuration = "express" | "classic"; // express = 3 manches + cut + ligne, classic = 5 manches + cut + ligne

export type PrismPhase =
  | "lobby"
  | "round-intro"
  | "turn-active"
  | "turn-steal"
  | "category-duel-select"
  | "buzzer-wait"
  | "buzzer-answering"
  | "progressive-clues"
  | "explanation-reveal"
  | "le-cut"
  | "sauvetage"
  | "la-ligne"
  | "champion";

export interface PrismPlayer {
  id: string;
  name: string;
  avatarColor: number;
  specialtyId: string;
  score: number;
  isHost: boolean;
  isSpectator: boolean;
  isFinalist: boolean;
  isEliminated: boolean;
  correctAnswers: number;
  wrongAnswers: number;
  stealsCount: number;
  fastBonusTotal: number;
}

export interface LaLigneState {
  /** 9 positions : 1..9 (départ au centre = 5) */
  cursorPosition: number;
  finalist1Id: string;
  finalist2Id: string;
  turnCount: number;
  isDouble: boolean;
  secondsRemaining: number;
  winnerId: string | null;
  history: Array<{
    turn: number;
    playerAnsweredId: string;
    correct: boolean;
    stepChange: number;
    newPosition: number;
    isDouble: boolean;
  }>;
}

export interface PrismGameState {
  duration: PrismDuration;
  thematicCategory: QuestionCategory | "mixed";
  phase: PrismPhase;
  currentRound: number;
  totalRounds: number;
  roundTitle: string;
  roundType: "turn-based" | "category-duel" | "buzzer" | "progressive-clues" | "artworks" | "la-ligne";
  players: PrismPlayer[];
  activePlayerIndex: number;
  duelTargetPlayerId: string | null;
  duelChosenCategory: QuestionCategory | null;
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  questionTimeLeft: number;
  stealTimeLeft: number;
  buzzerLockedById: string | null;
  buzzerLockouts: string[]; // joueurs temporairement éliminés de la question en cours
  progressiveClueIndex: number; // 0 (1000 pts), 1 (750 pts), 2 (500 pts)
  currentPointsValue: number;
  laLigne: LaLigneState | null;
  rematchVotes: string[];
}

export const LALIGNE_TOTAL_POSITIONS = 9; // Positions 1 à 9 (Centre = 5)
export const LALIGNE_INITIAL_POSITION = 5;
export const LALIGNE_TIMER_SECONDS = 90;

export function createInitialPrismState(options: {
  duration?: PrismDuration;
  thematicCategory?: QuestionCategory | "mixed";
  players: Array<{ id: string; name: string; specialtyId?: string; avatarColor?: number; isHost?: boolean }>;
}): PrismGameState {
  const duration = options.duration ?? "express";
  const totalRounds = duration === "express" ? 3 : 5;

  const players: PrismPlayer[] = options.players.map((p, i) => ({
    id: p.id,
    name: p.name,
    avatarColor: p.avatarColor ?? i,
    specialtyId: p.specialtyId ?? "cinema",
    score: 0,
    isHost: p.isHost ?? i === 0,
    isSpectator: false,
    isFinalist: false,
    isEliminated: false,
    correctAnswers: 0,
    wrongAnswers: 0,
    stealsCount: 0,
    fastBonusTotal: 0,
  }));

  return {
    duration,
    thematicCategory: options.thematicCategory ?? "mixed",
    phase: "lobby",
    currentRound: 1,
    totalRounds,
    roundTitle: "Manche 1 — Tour par tour",
    roundType: "turn-based",
    players,
    activePlayerIndex: 0,
    duelTargetPlayerId: null,
    duelChosenCategory: null,
    currentQuestion: null,
    currentQuestionIndex: 0,
    questionTimeLeft: 15,
    stealTimeLeft: 5,
    buzzerLockedById: null,
    buzzerLockouts: [],
    progressiveClueIndex: 0,
    currentPointsValue: 100,
    laLigne: null,
    rematchVotes: [],
  };
}

/**
 * Calcule le bonus de vitesse (jusqu'à +50 pts) sur une bonne réponse
 */
export function calculateSpeedBonus(timeLeft: number, totalTime = 15): number {
  if (timeLeft <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, timeLeft / totalTime));
  return Math.round(50 * ratio);
}

/**
 * Vérifie si la réponse texte tapée correspond aux réponses acceptées
 */
export function checkTypedAnswer(typedInput: string, acceptedAnswers: string[] = [], officialAnswer?: string): boolean {
  if (!typedInput.trim()) return false;
  const cleanInput = normalizeString(typedInput);
  const targets = [...acceptedAnswers];
  if (officialAnswer) targets.push(officialAnswer);

  return targets.some((target) => {
    const cleanTarget = normalizeString(target);
    if (cleanInput === cleanTarget) return true;
    // Tolérance d'inclusion pour les noms de personnalités (ex: "Scott" pour "Ridley Scott")
    if (cleanTarget.includes(" ") && cleanInput.length >= 4 && cleanTarget.includes(cleanInput)) {
      return true;
    }
    return false;
  });
}

function normalizeString(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Met à jour La Ligne suite à une réponse d'un des deux finalistes
 */
export function processLaLigneAnswer(
  state: LaLigneState,
  finalistId: string,
  correct: boolean,
): { nextState: LaLigneState; winnerId: string | null } {
  const isP1 = finalistId === state.finalist1Id;
  const newTurn = state.turnCount + 1;
  const isDouble = state.isDouble;

  // DOUBLE tous les 3 tours (tour 3, tour 6, tour 9...)
  const nextIsDouble = (newTurn + 1) % 3 === 0;

  let stepChange = 0;
  if (correct) {
    const magnitude = isDouble ? 2 : 1;
    stepChange = isP1 ? magnitude : -magnitude;
  }

  let newPos = state.cursorPosition + stepChange;
  newPos = Math.max(0, Math.min(10, newPos)); // clamp entre 0 et 10

  let winnerId: string | null = null;
  // Victoire P1 : a poussé le curseur hors du camp de P2 (position >= 9 ou 10)
  if (newPos >= 9 && isP1 && correct) {
    winnerId = state.finalist1Id;
  }
  // Victoire P2 : a poussé le curseur hors du camp de P1 (position <= 1 ou 0)
  else if (newPos <= 1 && !isP1 && correct) {
    winnerId = state.finalist2Id;
  }

  const nextState: LaLigneState = {
    ...state,
    cursorPosition: newPos,
    turnCount: newTurn,
    isDouble: nextIsDouble,
    winnerId,
    history: [
      ...state.history,
      {
        turn: state.turnCount,
        playerAnsweredId: finalistId,
        correct,
        stepChange,
        newPosition: newPos,
        isDouble,
      },
    ],
  };

  return { nextState, winnerId };
}

/**
 * Calcule le classement et sélectionne les finalistes pour Le Cut (spec §28 C)
 */
export function processLeCutLeaderboard(players: PrismPlayer[]): {
  sortedPlayers: PrismPlayer[];
  topTwo: [PrismPlayer, PrismPlayer];
  challengers: [PrismPlayer, PrismPlayer] | null;
} {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const topTwo: [PrismPlayer, PrismPlayer] = [sorted[0], sorted[1]];
  const challengers: [PrismPlayer, PrismPlayer] | null = sorted.length >= 4 ? [sorted[2], sorted[3]] : null;

  return { sortedPlayers: sorted, topTwo, challengers };
}
