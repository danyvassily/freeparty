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
  addReport: (questionId: string, reason: (typeof REPORT_REASONS)[number], details?: string) => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      reports: [],
      addEntry: (entry) =>
        set((s) => ({
          entries: [
            ...s.entries,
            { ...entry, servedAt: new Date().toISOString() },
          ].slice(-1000), // garde les 1000 dernières entrées
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
