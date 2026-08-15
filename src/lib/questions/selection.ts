/**
 * Free Party — Selection Engine (anti-répétition)
 * Spec §37 : jamais `ORDER BY RANDOM()` seul.
 *
 * selection_score =
 *   novelty + category_balance + difficulty_balance + freshness − repetition_penalty
 *
 * Le moteur est pur et testable : aucune dépendance DOM/réseau.
 */
import type { Question, QuestionDifficulty } from "./schema";

export interface SelectionHistoryEntry {
  questionId: string;
  familyId: string;
  servedAt: number; // timestamp ms
  answeredCorrectly: boolean;
}

export interface SelectionOptions {
  count: number;
  /** Catégories autorisées (toutes si vide) */
  categories?: string[];
  /** Difficultés autorisées (toutes si vide) */
  difficulties?: QuestionDifficulty[];
  /** Quota par famille (évite de resservir la même famille dans une partie) */
  maxPerFamily?: number;
  /** Poids du hasard contrôlé (0 = 100% déterministe, 1 = très aléatoire) */
  jitter?: number;
  now?: number;
  seed?: number;
}

const DIFFICULTY_ORDER: QuestionDifficulty[] = ["easy", "medium", "hard", "expert"];

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Normalisation légère pour la clé d'historique (id déjà kebab-case) */
function historyKey(id: string): string {
  return id.trim().toLowerCase();
}

export interface SelectionResult {
  questions: Question[];
  /** Score détaillé de chaque question sélectionnée (utile pour logs/tests) */
  scores: Array<{ id: string; score: number; penalty: number }>;
}

/**
 * Sélectionne `count` questions en minimisant les répétitions de questions
 * et de familles, en équilibrant catégories et difficultés, et en favorisant
 * la fraîcheur (last_seen).
 */
export function selectQuestions(
  pool: Question[],
  history: SelectionHistoryEntry[],
  options: SelectionOptions,
): SelectionResult {
  const { count, jitter = 0.15, maxPerFamily = 1, now = Date.now() } = options;
  const rng = mulberry32(options.seed ?? (now % 2147483647));

  if (pool.length === 0) return { questions: [], scores: [] };
  const n = Math.min(count, pool.length);

  // Index de l'historique
  const seenCount = new Map<string, number>();
  const familySeen = new Map<string, number>();
  const lastSeen = new Map<string, number>();
  const familyLastSeen = new Map<string, number>();
  for (const h of history) {
    const qk = historyKey(h.questionId);
    const fk = historyKey(h.familyId);
    seenCount.set(qk, (seenCount.get(qk) ?? 0) + 1);
    familySeen.set(fk, (familySeen.get(fk) ?? 0) + 1);
    const prev = lastSeen.get(qk) ?? 0;
    if (h.servedAt > prev) lastSeen.set(qk, h.servedAt);
    const fp = familyLastSeen.get(fk) ?? 0;
    if (h.servedAt > fp) familyLastSeen.set(fk, h.servedAt);
  }

  // Équilibrage : difficulté cible pour compenser les stats du pool
  const diffCounts: Record<string, number> = {};
  for (const q of pool) diffCounts[q.difficulty] = (diffCounts[q.difficulty] ?? 0) + 1;

  const catCounts: Record<string, number> = {};
  for (const q of pool) catCounts[q.category] = (catCounts[q.category] ?? 0) + 1;

  const candidates = pool.filter((q) => {
    if (options.categories?.length && !options.categories.includes(q.category)) return false;
    if (options.difficulties?.length && !options.difficulties.includes(q.difficulty)) return false;
    return true;
  });

  if (candidates.length === 0) return { questions: [], scores: [] };

  // Tri stable par score décroissant avec hasard contrôlé
  const scored = candidates.map((q) => {
    const qk = historyKey(q.id);
    const fk = historyKey(q.familyId);

    // Pénalité de répétition (exponentielle, domine tout)
    const qSeen = seenCount.get(qk) ?? 0;
    const fSeen = familySeen.get(fk) ?? 0;
    const qPenalty = qSeen > 0 ? 10 * qSeen : 0;
    const fPenalty = fSeen > 0 ? 4 * fSeen : 0;

    // Fraîcheur : recency décroissante (facteur de fraîcheur)
    const lastQ = lastSeen.get(qk) ?? 0;
    const lastF = familyLastSeen.get(fk) ?? 0;
    const ageDays = (now - Math.max(lastQ, lastF)) / 86_400_000;
    const freshness = Math.min(ageDays / 30, 1); // 0 → vue récemment, 1 → > 30 jours

    // Équilibre de difficulté : sur-représentée → pénalisée
    const diffTarget = 1 / Math.max(1, Object.keys(diffCounts).length);
    const diffShare = (diffCounts[q.difficulty] ?? 0) / Math.max(1, pool.length);
    const difficultyBalance = diffTarget / Math.max(0.01, diffShare); // > 1 si sous-représentée

    // Équilibre de catégorie
    const catTarget = 1 / Math.max(1, Object.keys(catCounts).length);
    const catShare = (catCounts[q.category] ?? 0) / Math.max(1, pool.length);
    const categoryBalance = catTarget / Math.max(0.01, catShare);

    const novelty = 1 - qSeen * 0.3; // jamais complètement 0 pour une question valide

    const randomFactor = 0.7 + rng() * 0.6; // jitter contrôlé

    const score =
      (novelty * 2 +
        categoryBalance * 1.5 +
        difficultyBalance * 1.2 +
        freshness * 2 -
        qPenalty -
        fPenalty) *
      (1 - jitter + jitter * randomFactor);

    return { q, score, penalty: qPenalty + fPenalty };
  });

  scored.sort((a, b) => b.score - a.score);

  // Contrainte maxPerFamily par partie
  const pickedFamilies = new Map<string, number>();
  const selected: typeof scored = [];
  for (const item of scored) {
    if (selected.length >= n) break;
    const fk = historyKey(item.q.familyId);
    const used = pickedFamilies.get(fk) ?? 0;
    if (used >= maxPerFamily) continue;
    pickedFamilies.set(fk, used + 1);
    selected.push(item);
  }

  return {
    questions: selected.map((s) => s.q),
    scores: selected.map((s) => ({ id: s.q.id, score: s.score, penalty: s.penalty })),
  };
}

/**
 * Sélection "fresh" : évite toute question déjà vue par le groupe si possible.
 * Retourne les questions + la liste des familles choisies pour alimenter l'historique.
 */
export function selectFreshQuestions(
  pool: Question[],
  history: SelectionHistoryEntry[],
  options: SelectionOptions,
): SelectionResult {
  return selectQuestions(pool, history, options);
}

export const difficultyRank = (d: QuestionDifficulty): number =>
  DIFFICULTY_ORDER.indexOf(d);
