/**
 * Free Party — Debate Schema (spec §56–§80)
 * Pas de réponse correcte obligatoire : prompt + contexte + relances + sources.
 * Neutralité stricte : aucune orientation politique stockée (spec §80).
 */
import { z } from "zod";

export const DEBATE_CATEGORIES = [
  "politics",
  "philosophy",
  "history",
  "ethics",
  "current-issues",
] as const;
export type DebateCategory = (typeof DEBATE_CATEGORIES)[number];

export const DEBATE_DIFFICULTIES = ["accessible", "intermediate", "deep", "expert"] as const;
export type DebateDifficulty = (typeof DEBATE_DIFFICULTIES)[number];

export const DEBATE_DURATIONS = [60, 180, 300, 600, 900] as const; // 1, 3, 5, 10, 15 min
export const DEFAULT_DEBATE_DURATION = 300; // spec §57 : 5 minutes par défaut
export const DEBATE_PREPARATION_SECONDS = 30; // spec §58 : 30 s de réflexion

export const SENSITIVITY_LEVELS = ["low", "medium", "high"] as const;

export const DebateSourceSchema = z.object({
  label: z.string().min(1),
  url: z.string().url().optional(),
  type: z.enum(["fact", "article", "data", "document"]).default("fact"),
});

export const DebatePromptSchema = z.object({
  id: z.string().min(3),
  category: z.enum(DEBATE_CATEGORIES),
  /** Thème court (ex: "Liberté") */
  topic: z.string().min(2).max(60),
  /** Question de débat, ouverte, équilibrée */
  prompt: z.string().min(20, "Prompt trop court").max(400),
  /** Carte de contexte factuel — SÉPARÉE des opinions (spec §65) */
  context: z.string().min(10).max(1000),
  /** Perspectives sérieuses à présenter (multi-perspective, spec §66) */
  perspectives: z.array(z.string().min(10).max(300)).min(2).max(5),
  /** Relances (spec §74) */
  followUps: z.array(z.string().min(10).max(300)).min(1).max(6).default([]),
  /** Sources factuelles */
  sources: z.array(DebateSourceSchema).default([]),
  difficulty: z.enum(DEBATE_DIFFICULTIES).default("intermediate"),
  sensitivity: z.enum(SENSITIVITY_LEVELS).default("medium"),
  /** Pour Change My Mind (spec §72) : positions assignables */
  assignedPositions: z.array(z.string().min(10).max(200)).optional(),
  /** Date de vérification — indispensable pour la politique actuelle (spec §63) */
  lastVerifiedAt: z.string().optional(),
  validUntil: z.string().optional(),
  jurisdiction: z.string().optional(),
  language: z.enum(["fr", "en", "es", "de", "it", "pt"]).default("fr"),
  version: z.number().int().min(1).default(1),
});

export type DebatePrompt = z.infer<typeof DebatePromptSchema>;

/** Phases du déroulement (spec §58) */
export const DEBATE_PHASES = [
  "setup", // choix des paramètres
  "presentation", // question + contexte affichés
  "reflection", // 30 s de réflexion silencieuse
  "player-turn", // tour d'un joueur
  "open-discussion", // discussion libre (optionnelle)
  "follow-up", // relance affichée
  "voting", // vote before/after optionnel (spec §79)
  "results", // résultats non-compétitifs (spec §78)
] as const;
export type DebatePhase = (typeof DEBATE_PHASES)[number];

export const DEBATE_MODES = ["standard", "change-my-mind", "devils-advocate", "ethical-dilemma"] as const;
export type DebateMode = (typeof DEBATE_MODES)[number];

export interface DebateVote {
  playerId: string;
  position: "pour" | "contre" | "nuance" | "indecis";
  before?: boolean;
  after?: boolean;
}

export interface DebateTurn {
  playerId: string;
  phase: "reflection" | "speech" | "rebuttal";
  startedAt: number;
  endedAt?: number;
  durationMs?: number;
}

/** Résultat d'un débat — non-compétitif (spec §78) */
export interface DebateResult {
  promptId: string;
  pointsDiscussed: number;
  argumentsExplored: number;
  openQuestions: number;
  speakingTimeMs: Record<string, number>;
  votesBefore: DebateVote[];
  votesAfter: DebateVote[];
  positionChanges: number;
  playersChanged: string[];
}
