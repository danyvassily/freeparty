"use client";

import type { Player } from "@/lib/store/game";
import type { QuestionHistory } from "./schema";
import type { Question } from "./schema";
import { getAccessToken, getParticipantTokens, resolvePlayerProfiles } from "@/lib/identity/identity-service";
import { toParticipantHistories, useHistoryStore } from "@/lib/store/history";

interface LoadQuestionsOptions {
  count: number;
  category?: string;
  difficulties?: string[];
  players: Player[];
  history: QuestionHistory[];
  sessionId: string;
  onlineSessionId?: string;
  ai?: boolean;
}

export interface QuestionPoolResponse {
  questions: Question[];
  requested: number;
  available: number;
  returned: number;
  poolExhausted: boolean;
  reason?: "INSUFFICIENT_UNSEEN_QUESTIONS";
  aiGenerated?: boolean;
  aiSkipped?: string;
}

async function authenticatedHeaders(): Promise<Record<string, string>> {
  const accessToken = await getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

export async function loadGameQuestions(options: LoadQuestionsOptions): Promise<QuestionPoolResponse> {
  const participantTokens = await getParticipantTokens(options.players);
  await resolvePlayerProfiles(participantTokens);
  const response = await fetch("/api/questions", {
    method: "POST",
    headers: await authenticatedHeaders(),
    body: JSON.stringify({
      count: options.count,
      category: options.category,
      difficulties: options.difficulties,
      ai: options.ai ?? false,
      sessionId: options.sessionId,
      onlineSessionId: options.onlineSessionId,
      participantTokens,
      participantHistories: toParticipantHistories(options.history, participantTokens),
    }),
  });
  if (!response.ok) throw new Error(`Impossible de charger les questions (${response.status})`);
  return response.json() as Promise<QuestionPoolResponse>;
}

/** Appelée dès que la question devient visible, avant toute réponse. */
export async function markQuestionDisplayed(options: {
  question: Pick<Question, "id" | "familyId">;
  players: Player[];
  sessionId: string;
  onlineSessionId?: string;
}): Promise<void> {
  const participantTokens = await getParticipantTokens(options.players);
  useHistoryStore.getState().markSeen(
    options.question.id,
    options.question.familyId,
    participantTokens,
    options.sessionId,
  );
  try {
    await resolvePlayerProfiles(participantTokens);
    await fetch("/api/questions/seen", {
      method: "POST",
      headers: await authenticatedHeaders(),
      body: JSON.stringify({
        sessionId: options.sessionId,
        onlineSessionId: options.onlineSessionId,
        participantTokens,
        questionId: options.question.id,
        familyId: options.question.familyId,
      }),
    });
  } catch (error) {
    console.warn("[question-history] synchronisation différée:", error);
  }
}

export async function markQuestionAnswered(options: {
  question: Question;
  player: Player;
  sessionId: string;
  correct: boolean;
  responseTimeMs?: number;
}): Promise<void> {
  const participantTokens = await getParticipantTokens([options.player]);
  useHistoryStore.getState().addEntry({
    questionId: options.question.id,
    familyId: options.question.familyId,
    profileId: participantTokens[0],
    sessionId: options.sessionId,
    answeredCorrectly: options.correct,
    responseTimeMs: options.responseTimeMs,
  });
  try {
    await fetch("/api/questions/answer", {
      method: "POST",
      headers: await authenticatedHeaders(),
      body: JSON.stringify({
        sessionId: options.sessionId,
        participantToken: participantTokens[0],
        familyId: options.question.familyId,
        correct: options.correct,
      }),
    });
  } catch {
    // L'historique local reste l'autorité hors ligne et sera fusionné plus tard.
  }
}
