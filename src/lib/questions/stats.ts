/**
 * Free Party — Question stats (spec §31, §41)
 * Statistiques de dataset : total, par catégorie, difficulté, langue, type, source, état.
 */
import type { Question } from "./schema";

export interface QuestionStats {
  total: number;
  byCategory: Record<string, number>;
  byDifficulty: Record<string, number>;
  byLanguage: Record<string, number>;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  bySubcategory: Record<string, number>;
  confidence: { min: number; max: number; avg: number };
  qualityScore: { min: number; max: number; avg: number };
  byState: Record<string, number>;
}

export function computeStats(questions: Question[]): QuestionStats {
  const byCategory: Record<string, number> = {};
  const byDifficulty: Record<string, number> = {};
  const byLanguage: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const bySubcategory: Record<string, number> = {};
  const byState: Record<string, number> = {};

  let confMin = 1;
  let confMax = 0;
  let confSum = 0;
  let qMin = 1;
  let qMax = 0;
  let qSum = 0;

  for (const q of questions) {
    byCategory[q.category] = (byCategory[q.category] ?? 0) + 1;
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] ?? 0) + 1;
    byLanguage[q.language] = (byLanguage[q.language] ?? 0) + 1;
    byType[q.type] = (byType[q.type] ?? 0) + 1;
    bySource[q.source.provider] = (bySource[q.source.provider] ?? 0) + 1;
    bySubcategory[q.subcategory] = (bySubcategory[q.subcategory] ?? 0) + 1;
    const state = q.verification.status === "verified" ? "verified" : q.verification.status;
    byState[state] = (byState[state] ?? 0) + 1;

    confMin = Math.min(confMin, q.confidence);
    confMax = Math.max(confMax, q.confidence);
    confSum += q.confidence;
    qMin = Math.min(qMin, q.qualityScore);
    qMax = Math.max(qMax, q.qualityScore);
    qSum += q.qualityScore;
  }

  const total = questions.length;
  return {
    total,
    byCategory,
    byDifficulty,
    byLanguage,
    byType,
    bySource,
    bySubcategory,
    confidence: {
      min: confMin,
      max: confMax,
      avg: total ? confSum / total : 0,
    },
    qualityScore: {
      min: qMin,
      max: qMax,
      avg: total ? qSum / total : 0,
    },
    byState,
  };
}

/** Score de qualité composite (spec §34) : factual_confidence, clarity, distracteur, difficulté, source, fraîcheur */
export function computeQualityScore(q: Question): number {
  const scores: number[] = [];

  // Factual confidence (par construction : confidence du schéma)
  scores.push(q.confidence);

  // Clarté : question bien formée, pas de double négation lourde
  const clarity = q.question.length >= 15 && q.question.length <= 200 ? 1 : 0.7;
  scores.push(clarity);

  // Qualité des distracteurs : mêmes type sémantique supposé par construction ;
  // on vérifie au moins qu'ils ne sont pas des sous-chaînes les uns des autres
  const answers = q.answers.map((a) => a.trim().toLowerCase());
  let distractorQuality = 1;
  for (let i = 0; i < answers.length; i++) {
    for (let j = 0; j < answers.length; j++) {
      if (i !== j && answers[j].includes(answers[i]) && answers[i].length > 3) {
        distractorQuality = Math.min(distractorQuality, 0.5);
      }
    }
  }
  scores.push(distractorQuality);

  // Confiance en la difficulté : cohérence longueur des réponses (similaire = plausible)
  const lens = answers.map((a) => a.length);
  const avgLen = lens.reduce((s, l) => s + l, 0) / lens.length;
  const variance = lens.reduce((s, l) => s + (l - avgLen) ** 2, 0) / lens.length;
  const difficultyConfidence = variance > 100 ? 0.6 : 1; // trop hétérogène = suspect
  scores.push(difficultyConfidence);

  // Source
  const sourceQuality = q.source.provider ? 1 : 0.5;
  scores.push(sourceQuality);

  // Fraîcheur : les questions vérifiées récemment sont plus fraîches
  const freshness = q.verification.status === "verified" ? 1 : 0.6;
  scores.push(freshness);

  const avg = scores.reduce((s, x) => s + x, 0) / scores.length;
  return Math.round(avg * 100) / 100;
}
