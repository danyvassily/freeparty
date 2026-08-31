/**
 * Free Party — Anti-Repetition Engine Types
 * Spec: Découplage Question / QuestionFamily, profils anonymes & connectés,
 * réservations temporaires, exclusions multijoueurs (UNION des historiques).
 */
import type { Question, QuestionCategory, QuestionDifficulty, QuestionType } from "@/lib/questions/schema";

export interface PlayerProfile {
  id: string;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
  isAnonymous: boolean;
  nickname?: string;
  avatarColor?: number;
}

export interface PlayerDevice {
  id: string;
  profileId: string;
  deviceToken: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface QuestionFamily {
  id: string;
  knowledgeKey: string;
  category: string;
  topic: string;
  subcategory?: string | null;
  usageCount: number;
  createdAt: string;
}

export interface QuestionSeen {
  id: string;
  profileId: string;
  familyId: string;
  questionId: string;
  sessionId?: string | null;
  firstSeenAt: string;
  answeredAt?: string | null;
  correct?: boolean | null;
}

export interface QuestionReservation {
  id: string;
  sessionId: string;
  profileId: string;
  familyId: string;
  questionId: string;
  expiresAt: number; // timestamp in ms
}

export interface SelectionLog {
  requestedCount: number;
  playerCount: number;
  candidatesInitial: number;
  excludedSeen: number;
  excludedReserved: number;
  excludedFilters: number;
  availableAfterExclusion: number;
  selectedCount: number;
  poolExhausted: boolean;
  reason?: "SUCCESS" | "INSUFFICIENT_UNSEEN_QUESTIONS" | "AI_GENERATED" | "FALLBACK_CASCADE";
  details?: string;
}

export interface GetQuestionsParams {
  playerProfileIds: string[];
  language?: string;
  categories?: QuestionCategory[];
  difficulty?: QuestionDifficulty | "mixed";
  difficulties?: QuestionDifficulty[];
  types?: QuestionType[];
  count: number;
  sessionId?: string;
  seed?: number;
  allowAiFallback?: boolean;
}

export interface QuestionSelectionResponse {
  requested: number;
  available: number;
  returned: number;
  poolExhausted: boolean;
  reason?: "SUCCESS" | "INSUFFICIENT_UNSEEN_QUESTIONS" | "AI_GENERATED" | "FALLBACK_CASCADE";
  questions: Question[];
  logs: SelectionLog;
}
