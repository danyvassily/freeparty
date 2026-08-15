/**
 * Free Party — Debate Engine (spec §56–§79)
 * Machine à états pure et testable : aucune dépendance DOM.
 *
 * Flow (spec §58) : QUESTION → 30s REFLECTION → PLAYER A → PLAYER B →
 * OPEN DISCUSSION → FOLLOW-UP → END
 */
import {
  type DebateMode,
  type DebatePhase,
  type DebatePrompt,
  type DebateResult,
  type DebateTurn,
  type DebateVote,
} from "./schema";

export interface DebatePlayer {
  id: string;
  name: string;
}

export interface DebateState {
  prompt: DebatePrompt;
  mode: DebateMode;
  players: DebatePlayer[];
  phase: DebatePhase;
  /** Index du joueur dont c'est le tour */
  currentPlayerIndex: number;
  /** Durée totale choisie (secondes) */
  durationSeconds: number;
  preparationSeconds: number;
  /** Temps de parole restant par joueur (ms) */
  speakingBudgetMs: Record<string, number>;
  /** Temps réellement parlé par joueur (ms) */
  speakingTimeMs: Record<string, number>;
  turns: DebateTurn[];
  /** Index de la relance en cours */
  followUpIndex: number;
  followUpsRevealed: number;
  votesBefore: DebateVote[];
  votesAfter: DebateVote[];
  /** Nombre de "points discutés" comptabilisés par les joueurs */
  pointsDiscussed: number;
  argumentsExplored: number;
  openQuestions: number;
  positionChanges: number;
  playersChanged: string[];
  /** Monotone : empêche les transitions illégales (chaos tester friendly) */
  phaseHistory: DebatePhase[];
  startedAt: number;
  endedAt?: number;
}

export interface CreateDebateOptions {
  mode?: DebateMode;
  durationSeconds?: number;
  preparationSeconds?: number;
  startNow?: boolean;
}

export function createDebate(
  prompt: DebatePrompt,
  players: DebatePlayer[],
  options: CreateDebateOptions = {},
): DebateState {
  const durationSeconds = options.durationSeconds ?? 300;
  const preparationSeconds = options.preparationSeconds ?? 30;
  const n = Math.max(2, players.length);
  const budgetPerPlayer = (durationSeconds * 1000) / n;

  const state: DebateState = {
    prompt,
    mode: options.mode ?? "standard",
    players: players.slice(0, n),
    phase: "presentation",
    currentPlayerIndex: 0,
    durationSeconds,
    preparationSeconds,
    speakingBudgetMs: Object.fromEntries(players.slice(0, n).map((p) => [p.id, budgetPerPlayer])),
    speakingTimeMs: Object.fromEntries(players.slice(0, n).map((p) => [p.id, 0])),
    turns: [],
    followUpIndex: 0,
    followUpsRevealed: 0,
    votesBefore: [],
    votesAfter: [],
    pointsDiscussed: 0,
    argumentsExplored: 0,
    openQuestions: 0,
    positionChanges: 0,
    playersChanged: [],
    phaseHistory: ["presentation"],
    startedAt: Date.now(),
  };
  return state;
}

/** Transitions légales entre phases */
const TRANSITIONS: Record<DebatePhase, DebatePhase[]> = {
  setup: ["presentation"],
  presentation: ["reflection", "results"],
  reflection: ["player-turn", "results"],
  "player-turn": ["player-turn", "open-discussion", "follow-up", "results"],
  "open-discussion": ["follow-up", "results"],
  "follow-up": ["player-turn", "open-discussion", "voting", "results"],
  voting: ["results"],
  results: [],
};

export function canTransition(state: DebateState, next: DebatePhase): boolean {
  return TRANSITIONS[state.phase]?.includes(next) ?? false;
}

export interface TransitionResult {
  ok: boolean;
  state: DebateState;
  error?: string;
}

export function transition(state: DebateState, next: DebatePhase): TransitionResult {
  if (!canTransition(state, next)) {
    return { ok: false, state, error: `Transition illégale: ${state.phase} → ${next}` };
  }
  const newState: DebateState = {
    ...state,
    phase: next,
    phaseHistory: [...state.phaseHistory, next],
  };
  if (next === "player-turn") {
    newState.currentPlayerIndex = 0;
  }
  if (next === "results") {
    newState.endedAt = Date.now();
  }
  return { ok: true, state: newState };
}

/** Passe au joueur suivant (round-robin) */
export function nextPlayer(state: DebateState): DebateState {
  const nextIdx = (state.currentPlayerIndex + 1) % Math.max(1, state.players.length);
  return { ...state, currentPlayerIndex: nextIdx };
}

/** Démarre un tour de parole : vérifie le budget restant (fair speaking timer, spec §59) */
export function startTurn(state: DebateState, playerId: string, phase: "speech" | "rebuttal"): TransitionResult {
  const budget = state.speakingBudgetMs[playerId] ?? 0;
  if (budget <= 0) {
    return { ok: false, state, error: `Temps de parole épuisé pour ${playerId}` };
  }
  const turn: DebateTurn = { playerId, phase, startedAt: Date.now() };
  return {
    ok: true,
    state: {
      ...state,
      turns: [...state.turns, turn],
    },
  };
}

/** Clôt le tour de parole en cours pour un joueur et met à jour le temps parlé */
export function endTurn(state: DebateState, playerId: string): TransitionResult {
  const turns = [...state.turns];
  const idx = turns.findIndex((t) => t.playerId === playerId && t.endedAt === undefined);
  if (idx === -1) {
    return { ok: false, state, error: `Aucun tour ouvert pour ${playerId}` };
  }
  const now = Date.now();
  const durationMs = now - turns[idx].startedAt;
  turns[idx] = { ...turns[idx], endedAt: now, durationMs };

  const spoke = (state.speakingTimeMs[playerId] ?? 0) + durationMs;
  const budget = Math.max(0, (state.speakingBudgetMs[playerId] ?? 0) - durationMs);

  return {
    ok: true,
    state: {
      ...state,
      turns,
      speakingTimeMs: { ...state.speakingTimeMs, [playerId]: spoke },
      speakingBudgetMs: { ...state.speakingBudgetMs, [playerId]: budget },
    },
  };
}

/** Révèle la relance suivante (spec §74) */
export function revealFollowUp(state: DebateState): TransitionResult {
  if (state.followUpsRevealed >= state.prompt.followUps.length) {
    return { ok: false, state, error: "Plus de relances disponibles" };
  }
  return {
    ok: true,
    state: {
      ...state,
      followUpsRevealed: state.followUpsRevealed + 1,
      followUpIndex: state.followUpsRevealed,
    },
  };
}

/** Vote before/after (spec §79) */
export function castVote(
  state: DebateState,
  playerId: string,
  position: DebateVote["position"],
  when: "before" | "after",
): TransitionResult {
  const target = when === "before" ? state.votesBefore : state.votesAfter;
  const without = target.filter((v) => v.playerId !== playerId);
  const next = [...without, { playerId, position, [when]: true }];
  const base = {
    ...state,
    votesBefore: when === "before" ? next : state.votesBefore,
    votesAfter: when === "after" ? next : state.votesAfter,
  };
  return { ok: true, state: base };
}

/** Calcule les changements de position entre avant/après (spec §79) */
export function computePositionChanges(state: DebateState): { count: number; players: string[] } {
  const byId = new Map(state.votesAfter.map((v) => [v.playerId, v]));
  const changed: string[] = [];
  for (const before of state.votesBefore) {
    const after = byId.get(before.playerId);
    if (after && after.position !== before.position) changed.push(before.playerId);
  }
  return { count: changed.length, players: changed };
}

/** Résultat final — jamais WINNER/LOSER (spec §78) */
export function buildResult(state: DebateState): DebateResult {
  const changes = computePositionChanges(state);
  return {
    promptId: state.prompt.id,
    pointsDiscussed: state.pointsDiscussed,
    argumentsExplored: state.argumentsExplored,
    openQuestions: state.openQuestions,
    speakingTimeMs: state.speakingTimeMs,
    votesBefore: state.votesBefore,
    votesAfter: state.votesAfter,
    positionChanges: changes.count,
    playersChanged: changes.players,
  };
}

/** Helpers pour les compteurs de discussion */
export function addDiscussionMetric(
  state: DebateState,
  metric: "pointsDiscussed" | "argumentsExplored" | "openQuestions",
  amount = 1,
): DebateState {
  return { ...state, [metric]: (state[metric] ?? 0) + amount };
}
