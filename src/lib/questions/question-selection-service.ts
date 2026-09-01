import type { Question, QuestionDifficulty } from "./schema";
import {
  difficultyRank,
  selectQuestions,
  type SelectionHistoryEntry,
  type SelectionResult,
} from "./selection";

export interface ParticipantHistory {
  profileId?: string;
  entries: SelectionHistoryEntry[];
}

export interface QuestionSelectionRequest {
  pool: Question[];
  participantHistories: ParticipantHistory[];
  count: number;
  categories?: string[];
  difficulties?: QuestionDifficulty[];
  reservedFamilyIds?: Iterable<string>;
  seed?: number;
  /** Autorise l'élargissement des filtres, jamais celui de l'historique. */
  progressiveFallback?: boolean;
}

export interface QuestionSelectionResponse extends SelectionResult {
  fallbackStage: "exact" | "neighbor_difficulty" | "compatible_categories";
  excludedSeen: number;
  excludedReserved: number;
}

function unionHistories(histories: ParticipantHistory[]): SelectionHistoryEntry[] {
  const union = new Map<string, SelectionHistoryEntry>();
  for (const participant of histories) {
    for (const entry of participant.entries) {
      const key = entry.familyId.trim().toLowerCase();
      const previous = union.get(key);
      if (!previous || entry.servedAt < previous.servedAt) union.set(key, entry);
    }
  }
  return [...union.values()];
}

function neighboringDifficulties(requested: QuestionDifficulty[]): QuestionDifficulty[] {
  const result = new Set<QuestionDifficulty>(requested);
  for (const difficulty of requested) {
    const rank = difficultyRank(difficulty);
    const values: QuestionDifficulty[] = ["easy", "medium", "hard", "expert"];
    if (values[rank - 1]) result.add(values[rank - 1]);
    if (values[rank + 1]) result.add(values[rank + 1]);
  }
  return [...result];
}

/**
 * Porte d'entrée pure du moteur. Elle construit l'union des historiques de
 * tous les participants et n'autorise aucun fallback vers une famille vue.
 */
export function getUnseenQuestions(request: QuestionSelectionRequest): QuestionSelectionResponse {
  const history = unionHistories(request.participantHistories);
  const seenFamilies = new Set(history.map((entry) => entry.familyId.trim().toLowerCase()));
  const reservedFamilies = new Set(
    Array.from(request.reservedFamilyIds ?? [], (familyId) => familyId.trim().toLowerCase()),
  );
  const baseOptions = {
    count: request.count,
    maxPerFamily: 1,
    jitter: 0.15,
    seed: request.seed,
    reservedFamilyIds: reservedFamilies,
  } as const;

  let fallbackStage: QuestionSelectionResponse["fallbackStage"] = "exact";
  let result = selectQuestions(request.pool, history, {
    ...baseOptions,
    categories: request.categories,
    difficulties: request.difficulties,
  });

  if (request.progressiveFallback !== false && result.questions.length < request.count && request.difficulties?.length) {
    fallbackStage = "neighbor_difficulty";
    result = selectQuestions(request.pool, history, {
      ...baseOptions,
      categories: request.categories,
      difficulties: neighboringDifficulties(request.difficulties),
    });
  }

  if (request.progressiveFallback !== false && result.questions.length < request.count && request.categories?.length) {
    fallbackStage = "compatible_categories";
    result = selectQuestions(request.pool, history, {
      ...baseOptions,
      difficulties: request.difficulties?.length
        ? neighboringDifficulties(request.difficulties)
        : undefined,
    });
  }

  return {
    ...result,
    fallbackStage,
    excludedSeen: new Set(
      request.pool
        .filter((question) => seenFamilies.has(question.familyId.trim().toLowerCase()))
        .map((question) => question.familyId),
    ).size,
    excludedReserved: new Set(
      request.pool
        .filter((question) => reservedFamilies.has(question.familyId.trim().toLowerCase()))
        .map((question) => question.familyId),
    ).size,
  };
}
