/**
 * Adaptateur local du moteur central. Les routes de production utilisent la
 * réservation SQL ; cet adaptateur conserve les simulations sociales hors-ligne
 * sans dupliquer l'algorithme de sélection.
 */
import { loadQuestions } from "@/lib/questions/load";
import { getUnseenQuestions } from "@/lib/questions/question-selection-service";
import type { Question, QuestionDifficulty } from "@/lib/questions/schema";
import type { GetQuestionsParams, QuestionSelectionResponse, SelectionLog } from "./types";
import { getQuestionUsage, getSeenFamilyIds } from "./history-service";
import { getReservedFamilyIds, reserveQuestions } from "./reservation-service";
import { generateAndDeduplicateAiQuestions } from "./generation-service";

function requestedDifficulties(params: GetQuestionsParams): QuestionDifficulty[] | undefined {
  if (params.difficulties?.length) return params.difficulties;
  if (params.difficulty && params.difficulty !== "mixed") return [params.difficulty];
  return undefined;
}

export async function getQuestions(
  params: GetQuestionsParams,
  datasetOverride?: Question[],
): Promise<QuestionSelectionResponse> {
  if (!params.playerProfileIds?.length) throw new Error("No player profile provided");

  const language = params.language ?? "fr";
  const sessionId = params.sessionId ?? `session_${Date.now()}`;
  const allQuestions = (datasetOverride ?? loadQuestions(language).questions).map((question) => ({
    ...question,
    usageCount: question.usageCount ?? getQuestionUsage(question.id),
  }));
  const seenFamilies = await getSeenFamilyIds(params.playerProfileIds);
  const reservedFamilies = await getReservedFamilyIds(params.playerProfileIds);
  const syntheticHistory = [...seenFamilies].map((familyId) => ({
    questionId: `seen:${familyId}`,
    familyId,
    servedAt: 0,
    answeredCorrectly: null,
  }));

  const selection = getUnseenQuestions({
    pool: allQuestions,
    participantHistories: [{ entries: syntheticHistory }],
    count: params.count,
    categories: params.categories,
    difficulties: requestedDifficulties(params),
    reservedFamilyIds: reservedFamilies,
    seed: params.seed,
    progressiveFallback: true,
  });

  let questions = selection.questions;
  let reason: QuestionSelectionResponse["reason"] =
    selection.fallbackStage === "exact" ? "SUCCESS" : "FALLBACK_CASCADE";

  if (questions.length < params.count && params.allowAiFallback !== false) {
    const existingKnowledgeKeys = new Set([
      ...allQuestions.map((question) => question.knowledgeKey ?? question.familyId),
      ...seenFamilies,
      ...reservedFamilies,
    ]);
    const generated = await generateAndDeduplicateAiQuestions({
      count: params.count - questions.length,
      category: params.categories?.length === 1 ? params.categories[0] : "mixed",
      existingQuestions: [...allQuestions, ...questions],
      existingKnowledgeKeys,
    }).catch(() => []);
    if (generated.length) {
      questions = [...questions, ...generated].slice(0, params.count);
      reason = "AI_GENERATED";
    }
  }

  const poolExhausted = questions.length < params.count;
  if (poolExhausted) reason = "INSUFFICIENT_UNSEEN_QUESTIONS";

  if (questions.length) {
    await reserveQuestions({
      sessionId,
      playerProfileIds: params.playerProfileIds,
      questions: questions.map((question) => ({ id: question.id, familyId: question.familyId })),
    });
  }

  const logs: SelectionLog = {
    requestedCount: params.count,
    playerCount: params.playerProfileIds.length,
    candidatesInitial: allQuestions.length,
    excludedSeen: selection.excludedSeen,
    excludedReserved: selection.excludedReserved,
    excludedFilters: Math.max(0, allQuestions.length - selection.available),
    availableAfterExclusion: selection.available,
    selectedCount: questions.length,
    poolExhausted,
    reason,
    details: poolExhausted
      ? `Requested ${params.count} questions but only ${questions.length} unseen questions are available.`
      : undefined,
  };

  return {
    requested: params.count,
    available: selection.available,
    returned: questions.length,
    poolExhausted,
    reason,
    questions,
    logs,
  };
}
