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
import { canonicalKey, canonicalizeKnowledgeKey } from "./dedupe";

export interface SelectionHistoryEntry {
  questionId: string;
  familyId: string;
  servedAt: number; // timestamp ms
  answeredCorrectly: boolean | null;
}

export interface SelectionOptions {
  count: number;
  /** Catégories autorisées (toutes si vide) */
  categories?: string[];
  /** Difficultés autorisées (toutes si vide) */
  difficulties?: QuestionDifficulty[];
  /** Spécialité du joueur actif (promut les questions de sa spécialité en Niveau 4 — Expert) */
  playerSpecialty?: string;
  /** Thématique de salon (ex: cinema, art, etc.) */
  thematicTag?: string;
  /** Quota par famille (évite de resservir la même famille dans une partie) */
  maxPerFamily?: number;
  /** Poids du hasard contrôlé (0 = 100% déterministe, 1 = très aléatoire) */
  jitter?: number;
  now?: number;
  seed?: number;
  /** Familles déjà réservées par une requête concurrente. */
  reservedFamilyIds?: Iterable<string>;
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
  requested: number;
  available: number;
  poolExhausted: boolean;
  reason?: "INSUFFICIENT_UNSEEN_QUESTIONS";
}

/**
 * Sélectionne `count` questions inédites. Une famille déjà vue est interdite,
 * même si une autre formulation de cette connaissance existe dans le pool.
 */
export function selectQuestions(
  pool: Question[],
  history: SelectionHistoryEntry[],
  options: SelectionOptions,
): SelectionResult {
  const { count, jitter = 0.45, maxPerFamily = 1, now = Date.now() } = options;
  const rng = mulberry32(options.seed ?? (now % 2147483647));

  if (pool.length === 0) {
    return { questions: [], scores: [], requested: count, available: 0, poolExhausted: count > 0, reason: count > 0 ? "INSUFFICIENT_UNSEEN_QUESTIONS" : undefined };
  }

  // Index de l'historique
  const seenQuestions = new Set<string>();
  const seenFamilies = new Set<string>();
  for (const h of history) {
    const qk = historyKey(h.questionId);
    const fk = historyKey(h.familyId);
    seenQuestions.add(qk);
    seenFamilies.add(fk);
  }
  const reservedFamilies = new Set(
    Array.from(options.reservedFamilyIds ?? [], (familyId) => historyKey(familyId)),
  );
  const seenContent = new Set<string>();
  const seenKnowledge = new Set<string>();
  for (const question of pool) {
    if (!seenQuestions.has(historyKey(question.id)) && !seenFamilies.has(historyKey(question.familyId))) continue;
    seenContent.add(question.contentHash ?? canonicalKey(question));
    seenKnowledge.add(canonicalizeKnowledgeKey(question.knowledgeKey ?? question.familyId));
  }

  // Équilibrage : difficulté cible pour compenser les stats du pool
  const diffCounts: Record<string, number> = {};
  for (const q of pool) diffCounts[q.difficulty] = (diffCounts[q.difficulty] ?? 0) + 1;

  const catCounts: Record<string, number> = {};
  for (const q of pool) catCounts[q.category] = (catCounts[q.category] ?? 0) + 1;

  const candidateContent = new Set<string>();
  const candidateKnowledge = new Set<string>();
  const candidates = pool.filter((q) => {
    if (options.categories?.length && !options.categories.includes(q.category)) return false;
    if (options.difficulties?.length && !options.difficulties.includes(q.difficulty)) return false;
    if (seenQuestions.has(historyKey(q.id))) return false;
    if (seenFamilies.has(historyKey(q.familyId))) return false;
    const content = q.contentHash ?? canonicalKey(q);
    const knowledge = canonicalizeKnowledgeKey(q.knowledgeKey ?? q.familyId);
    if (seenContent.has(content) || candidateContent.has(content)) return false;
    if (seenKnowledge.has(knowledge) || candidateKnowledge.has(knowledge)) return false;
    if (reservedFamilies.has(historyKey(q.familyId))) return false;
    candidateContent.add(content);
    candidateKnowledge.add(knowledge);
    return true;
  });

  if (candidates.length === 0) {
    return {
      questions: [],
      scores: [],
      requested: count,
      available: 0,
      poolExhausted: count > 0,
      reason: count > 0 ? "INSUFFICIENT_UNSEEN_QUESTIONS" : undefined,
    };
  }

  const uniqueAvailableFamilies = new Set(candidates.map((q) => historyKey(q.familyId))).size;
  const n = Math.min(count, uniqueAvailableFamilies * maxPerFamily);

  // Tri stable par score décroissant avec hasard contrôlé
  const scored = candidates.map((q) => {
    const qk = historyKey(q.id);
    const fk = historyKey(q.familyId);

    // Équilibre de difficulté : sur-représentée → pénalisée
    const diffTarget = 1 / Math.max(1, Object.keys(diffCounts).length);
    const diffShare = (diffCounts[q.difficulty] ?? 0) / Math.max(1, pool.length);
    const difficultyBalance = diffTarget / Math.max(0.01, diffShare); // > 1 si sous-représentée

    // Équilibre de catégorie
    const catTarget = 1 / Math.max(1, Object.keys(catCounts).length);
    const catShare = (catCounts[q.category] ?? 0) / Math.max(1, pool.length);
    const categoryBalance = catTarget / Math.max(0.01, catShare);

    const randomFactor = 0.3 + rng() * 1.4; // jitter large : ±40% autour de la moyenne
    const usagePenalty = Math.log2(1 + (q.usageCount ?? 0));

    const score =
      (4 +
        categoryBalance * 1.5 +
        difficultyBalance * 1.2 +
        1.5 - usagePenalty) *
      (1 - jitter + jitter * randomFactor);

    return { q, score, penalty: usagePenalty, qk, fk };
  });

  scored.sort((a, b) => b.score - a.score);

  // Contrainte maxPerFamily par partie
  const pickedFamilies = new Map<string, number>();
  const selected: typeof scored = [];
  const selectedCategories = new Map<string, number>();
  const selectedTopics = new Map<string, number>();
  while (selected.length < n) {
    let bestIndex = -1;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < scored.length; i++) {
      const item = scored[i];
      if (selected.includes(item)) continue;
      const used = pickedFamilies.get(item.fk) ?? 0;
      if (used >= maxPerFamily) continue;
      const topic = item.q.subcategory || item.q.category;
      const diversityPenalty =
        (selectedCategories.get(item.q.category) ?? 0) * 0.8 +
        (selectedTopics.get(topic) ?? 0) * 1.25;
      const dynamicScore = item.score - diversityPenalty;
      if (dynamicScore > bestScore) {
        bestIndex = i;
        bestScore = dynamicScore;
      }
    }
    if (bestIndex < 0) break;
    const picked = scored[bestIndex];
    pickedFamilies.set(picked.fk, (pickedFamilies.get(picked.fk) ?? 0) + 1);
    selectedCategories.set(picked.q.category, (selectedCategories.get(picked.q.category) ?? 0) + 1);
    const topic = picked.q.subcategory || picked.q.category;
    selectedTopics.set(topic, (selectedTopics.get(topic) ?? 0) + 1);
    selected.push(picked);
  }

  const poolExhausted = selected.length < count;
  return {
    questions: selected.map((s) => s.q),
    scores: selected.map((s) => ({ id: s.q.id, score: s.score, penalty: s.penalty })),
    requested: count,
    available: uniqueAvailableFamilies,
    poolExhausted,
    reason: poolExhausted ? "INSUFFICIENT_UNSEEN_QUESTIONS" : undefined,
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
