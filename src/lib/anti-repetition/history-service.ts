/**
 * Free Party — Question History Service
 * Enregistre les connaissances vues (QuestionSeen) par profil et fournit
 * l'UNION des historiques pour les sélections solo et multijoueur.
 */
import { randomUUID } from "node:crypto";
import type { QuestionSeen } from "./types";

class InMemoryQuestionHistoryStore {
  // key: `${profileId}:${familyId}`
  private seenByProfileFamily = new Map<string, QuestionSeen>();
  // key: profileId -> Set of familyIds
  private familyIndexByProfile = new Map<string, Set<string>>();
  // key: questionId -> total times served
  private questionUsageCount = new Map<string, number>();
  // key: familyId -> total times served
  private familyUsageCount = new Map<string, number>();

  getExposure(profileId: string, familyId: string): QuestionSeen | undefined {
    return this.seenByProfileFamily.get(`${profileId}:${familyId}`);
  }

  getExposuresByProfile(profileId: string): QuestionSeen[] {
    const list: QuestionSeen[] = [];
    for (const [key, item] of this.seenByProfileFamily.entries()) {
      if (key.startsWith(`${profileId}:`)) list.push(item);
    }
    return list;
  }

  addExposure(exposure: Omit<QuestionSeen, "id"> & { id?: string }): QuestionSeen {
    const key = `${exposure.profileId}:${exposure.familyId}`;
    const existing = this.seenByProfileFamily.get(key);
    if (existing) {
      if (exposure.answeredAt) existing.answeredAt = exposure.answeredAt;
      if (exposure.correct !== undefined && exposure.correct !== null) existing.correct = exposure.correct;
      return existing;
    }

    const item: QuestionSeen = {
      id: exposure.id || `seen_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
      profileId: exposure.profileId,
      familyId: exposure.familyId,
      questionId: exposure.questionId,
      sessionId: exposure.sessionId ?? null,
      firstSeenAt: exposure.firstSeenAt || new Date().toISOString(),
      answeredAt: exposure.answeredAt ?? null,
      correct: exposure.correct ?? null,
    };

    this.seenByProfileFamily.set(key, item);

    let profileFamilies = this.familyIndexByProfile.get(exposure.profileId);
    if (!profileFamilies) {
      profileFamilies = new Set();
      this.familyIndexByProfile.set(exposure.profileId, profileFamilies);
    }
    profileFamilies.add(exposure.familyId);

    // Incrémente les compteurs d'utilisation
    this.questionUsageCount.set(exposure.questionId, (this.questionUsageCount.get(exposure.questionId) ?? 0) + 1);
    this.familyUsageCount.set(exposure.familyId, (this.familyUsageCount.get(exposure.familyId) ?? 0) + 1);

    return item;
  }

  getSeenFamiliesForProfiles(profileIds: string[]): Set<string> {
    const union = new Set<string>();
    for (const pid of profileIds) {
      const fams = this.familyIndexByProfile.get(pid);
      if (fams) {
        for (const f of fams) union.add(f);
      }
    }
    return union;
  }

  getQuestionUsageCount(questionId: string): number {
    return this.questionUsageCount.get(questionId) ?? 0;
  }

  getFamilyUsageCount(familyId: string): number {
    return this.familyUsageCount.get(familyId) ?? 0;
  }

  clear() {
    this.seenByProfileFamily.clear();
    this.familyIndexByProfile.clear();
    this.questionUsageCount.clear();
    this.familyUsageCount.clear();
  }
}

export const questionHistoryStore = new InMemoryQuestionHistoryStore();

/**
 * Enregistre une question comme VUE pour tous les profils de joueurs indiqués dès qu'elle est affichée.
 */
export async function markQuestionSeen(params: {
  profileIds: string[];
  questionId: string;
  familyId: string;
  sessionId?: string;
}): Promise<void> {
  const { profileIds, questionId, familyId, sessionId } = params;
  const now = new Date().toISOString();

  for (const profileId of profileIds) {
    questionHistoryStore.addExposure({
      profileId,
      familyId,
      questionId,
      sessionId,
      firstSeenAt: now,
    });
  }
}

/**
 * Met à jour le résultat (correct / incorrect) d'un joueur suite à sa réponse.
 */
export async function recordAnswerResult(params: {
  profileId: string;
  familyId: string;
  questionId: string;
  correct: boolean;
  answeredAt?: string;
}): Promise<void> {
  const { profileId, familyId, questionId, correct, answeredAt = new Date().toISOString() } = params;
  questionHistoryStore.addExposure({
    profileId,
    familyId,
    questionId,
    answeredAt,
    correct,
    firstSeenAt: answeredAt,
  });
}

/**
 * Récupère l'UNION des QuestionFamily IDs déjà vues par la liste de profils.
 */
export async function getSeenFamilyIds(profileIds: string[]): Promise<Set<string>> {
  return questionHistoryStore.getSeenFamiliesForProfiles(profileIds);
}

/**
 * Récupère le compteur d'utilisation d'une question.
 */
export function getQuestionUsage(questionId: string): number {
  return questionHistoryStore.getQuestionUsageCount(questionId);
}
