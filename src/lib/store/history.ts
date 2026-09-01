/**
 * Free Party — Question history & reports (spec §37–§38, §41, §43)
 * Historique persistant local (anti-répétition inter-parties) + rapports.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuestionHistory, QuestionReport, REPORT_REASONS } from "@/lib/questions/schema";

interface HistoryState {
  entries: QuestionHistory[];
  reports: QuestionReport[];
  addEntry: (entry: Omit<QuestionHistory, "servedAt">) => void;
  markSeen: (questionId: string, familyId: string, profileIds: string[], sessionId?: string) => void;
  addReport: (questionId: string, reason: (typeof REPORT_REASONS)[number], details?: string) => void;
  clear: () => void;
}

export function appendSeenEntries(
  current: QuestionHistory[],
  questionId: string,
  familyId: string,
  profileIds: string[],
  sessionId?: string,
  now = new Date().toISOString(),
): QuestionHistory[] {
  const entries = [...current];
  const ids = profileIds.length > 0 ? profileIds : ["legacy"];
  for (const profileId of ids) {
    const exists = entries.some(
      (item) =>
        (item.profileId ?? "legacy") === profileId &&
        item.familyId.toLowerCase() === familyId.toLowerCase(),
    );
    if (exists) continue;
    entries.push({
      questionId,
      familyId,
      profileId,
      sessionId,
      servedAt: now,
      answeredCorrectly: null,
    });
  }
  return entries;
}

export function mergeProfileHistoryEntries(
  anonymousEntries: QuestionHistory[],
  accountEntries: QuestionHistory[],
  accountProfileId: string,
): QuestionHistory[] {
  const merged = new Map<string, QuestionHistory>();
  for (const entry of [...accountEntries, ...anonymousEntries]) {
    const key = entry.familyId.toLowerCase();
    const candidate = { ...entry, profileId: accountProfileId };
    const previous = merged.get(key);
    if (!previous || candidate.servedAt < previous.servedAt) merged.set(key, candidate);
  }
  return [...merged.values()];
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      reports: [],
      addEntry: (entry) =>
        set((state) => {
          const key = `${entry.profileId ?? "legacy"}:${entry.familyId.toLowerCase()}`;
          const index = state.entries.findIndex(
            (item) => `${item.profileId ?? "legacy"}:${item.familyId.toLowerCase()}` === key,
          );
          const servedAt = index >= 0 ? state.entries[index].servedAt : new Date().toISOString();
          const next = {
            ...(index >= 0 ? state.entries[index] : {}),
            ...entry,
            servedAt,
            answeredAt:
              entry.answeredCorrectly === null
                ? state.entries[index]?.answeredAt
                : entry.answeredAt ?? new Date().toISOString(),
          } as QuestionHistory;
          if (index < 0) return { entries: [...state.entries, next] };
          return { entries: state.entries.map((item, itemIndex) => (itemIndex === index ? next : item)) };
        }),
      markSeen: (questionId, familyId, profileIds, sessionId) =>
        set((state) => ({
          entries: appendSeenEntries(state.entries, questionId, familyId, profileIds, sessionId),
        })),
      addReport: (questionId, reason, details) =>
        set((s) => ({
          reports: [
            ...s.reports,
            { questionId, reason, details, createdAt: new Date().toISOString() },
          ].slice(-500),
        })),
      clear: () => set({ entries: [], reports: [] }),
    }),
    { name: "freeparty-history" },
  ),
);

/** Convertit l'historique local en entrées de sélection (spec §37) */
export function toSelectionHistory(entries: QuestionHistory[]) {
  return entries.map((e) => ({
    questionId: e.questionId,
    familyId: e.familyId,
    servedAt: new Date(e.servedAt).getTime(),
    answeredCorrectly: e.answeredCorrectly,
  }));
}

/** Historique individuel utilisé pour construire l'union d'une partie. */
export function toParticipantHistories(entries: QuestionHistory[], profileIds: string[]) {
  return profileIds.map((profileId) => ({
    profileId,
    entries: toSelectionHistory(
      entries.filter((entry) => !entry.profileId || entry.profileId === profileId),
    ),
  }));
}
