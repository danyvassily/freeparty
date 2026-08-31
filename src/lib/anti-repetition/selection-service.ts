/**
 * Free Party — Central Question Selection Service
 * Moteur central anti-répétition : UNION des historiques multijoueurs, exclusions
 * de QuestionFamily, sélection pondérée (usage_count + diversité), cascade de fallback
 * et réservation transactionnelle.
 */
import { loadQuestions } from "@/lib/questions/load";
import type { Question, QuestionCategory, QuestionDifficulty, QuestionType } from "@/lib/questions/schema";
import type { GetQuestionsParams, QuestionSelectionResponse, SelectionLog } from "./types";
import { getSeenFamilyIds, getQuestionUsage } from "./history-service";
import { getReservedFamilyIds, reserveQuestions } from "./reservation-service";
import { generateAndDeduplicateAiQuestions } from "./generation-service";

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

function getAdjacentDifficulties(diff: QuestionDifficulty): QuestionDifficulty[] {
  const idx = DIFFICULTY_ORDER.indexOf(diff);
  const res: QuestionDifficulty[] = [diff];
  if (idx > 0) res.push(DIFFICULTY_ORDER[idx - 1]);
  if (idx < DIFFICULTY_ORDER.length - 1) res.push(DIFFICULTY_ORDER[idx + 1]);
  return res;
}

/**
 * Filtre les questions disponibles selon les filtres et les familles exclues.
 */
function filterCandidates(
  pool: Question[],
  excludedFamilyIds: Set<string>,
  categories?: QuestionCategory[],
  difficulties?: QuestionDifficulty[],
  language = "fr",
  types?: QuestionType[],
): Question[] {
  return pool.filter((q) => {
    if (q.language !== language) return false;
    if (excludedFamilyIds.has(q.familyId)) return false;
    if (categories?.length && !categories.includes(q.category)) return false;
    if (difficulties?.length && !difficulties.includes(q.difficulty)) return false;
    if (types?.length && !types.includes(q.type)) return false;
    return true;
  });
}

/**
 * Score et trie les candidats pour favoriser les questions les moins utilisées (usage_count)
 * et assurer une variété optimale au sein de la partie.
 */
function rankAndDiversify(
  candidates: Question[],
  count: number,
  rng: () => number,
  maxPerFamily = 1,
): Question[] {
  if (candidates.length === 0) return [];

  // 1. Calcul des scores de chaque question
  const scored = candidates.map((q) => {
    const usage = getQuestionUsage(q.id);
    // Score inversement proportionnel à l'utilisation + composante aléatoire contrôlée
    const usagePenalty = usage * 2.5;
    const randomJitter = (rng() - 0.5) * 1.2;
    const score = 100 - usagePenalty + randomJitter;
    return { q, score };
  });

  // 2. Tri décroissant par score
  scored.sort((a, b) => b.score - a.score);

  // 3. Sélection avec diversification de catégorie et limite par famille
  const selected: Question[] = [];
  const familyCount = new Map<string, number>();
  const categoryCount = new Map<string, number>();

  // Passe 1 : Sélection équilibrée
  for (const item of scored) {
    if (selected.length >= count) break;
    const fam = item.q.familyId;
    const usedFam = familyCount.get(fam) ?? 0;
    if (usedFam >= maxPerFamily) continue;

    const cat = item.q.category;
    const usedCat = categoryCount.get(cat) ?? 0;
    const maxCatAllowed = Math.max(1, Math.ceil(count / 3));

    // Favorise la diversité des catégories si possible
    if (usedCat >= maxCatAllowed && scored.length >= count * 1.5) {
      continue;
    }

    selected.push(item.q);
    familyCount.set(fam, usedFam + 1);
    categoryCount.set(cat, usedCat + 1);
  }

  // Passe 2 : Si pas encore assez de questions, complète sans la contrainte stricte de catégorie
  if (selected.length < count) {
    const selectedIds = new Set(selected.map((s) => s.id));
    for (const item of scored) {
      if (selected.length >= count) break;
      if (selectedIds.has(item.q.id)) continue;
      const fam = item.q.familyId;
      const usedFam = familyCount.get(fam) ?? 0;
      if (usedFam >= maxPerFamily) continue;

      selected.push(item.q);
      selectedIds.add(item.q.id);
      familyCount.set(fam, usedFam + 1);
    }
  }

  return selected;
}

/**
 * Service central de sélection de questions.
 * Garantit qu'aucun participant ne reçoit une question appartenant à une famille déjà vue
 * par lui-même ou l'un des autres participants de la session.
 */
export async function getQuestions(
  params: GetQuestionsParams,
  datasetOverride?: Question[],
): Promise<QuestionSelectionResponse> {
  const {
    playerProfileIds,
    language = "fr",
    categories,
    difficulty,
    difficulties: explicitDifficulties,
    types,
    count,
    sessionId = `session_${Date.now()}`,
    seed = Date.now(),
    allowAiFallback = true,
  } = params;

  // 1. Vérification des participants
  if (!playerProfileIds || playerProfileIds.length === 0) {
    throw new Error("No player profile provided");
  }

  const rng = mulberry32(seed);

  // 2. Chargement du catalogue
  const allQuestions = datasetOverride ?? loadQuestions(language).questions;
  const initialPoolSize = allQuestions.length;

  // 3. Récupération des familles déjà vues (UNION des historiques de tous les profils)
  const seenFamilyIds = await getSeenFamilyIds(playerProfileIds);

  // 4. Récupération des familles actuellement réservées
  const reservedFamilyIds = await getReservedFamilyIds(playerProfileIds);

  // 5. Fusion des exclusions
  const excludedFamilyIds = new Set<string>([...seenFamilyIds, ...reservedFamilyIds]);

  const targetDifficulties: QuestionDifficulty[] | undefined = explicitDifficulties
    ? explicitDifficulties
    : difficulty && difficulty !== "mixed"
      ? [difficulty]
      : undefined;

  const logs: SelectionLog = {
    requestedCount: count,
    playerCount: playerProfileIds.length,
    candidatesInitial: initialPoolSize,
    excludedSeen: seenFamilyIds.size,
    excludedReserved: reservedFamilyIds.size,
    excludedFilters: 0,
    availableAfterExclusion: 0,
    selectedCount: 0,
    poolExhausted: false,
    reason: "SUCCESS",
  };

  // --- ÉTAPE 1 : Catégorie exacte + Difficulté exacte ---
  let availableCandidates = filterCandidates(
    allQuestions,
    excludedFamilyIds,
    categories,
    targetDifficulties,
    language,
    types,
  );

  logs.availableAfterExclusion = availableCandidates.length;

  // --- ÉTAPE 2 : Si insuffisant, tente les difficultés adjacentes ---
  if (availableCandidates.length < count && targetDifficulties && targetDifficulties.length === 1) {
    const adjacentDiffs = getAdjacentDifficulties(targetDifficulties[0]);
    const expandedDiffCandidates = filterCandidates(
      allQuestions,
      excludedFamilyIds,
      categories,
      adjacentDiffs,
      language,
      types,
    );
    if (expandedDiffCandidates.length > availableCandidates.length) {
      availableCandidates = expandedDiffCandidates;
      logs.reason = "FALLBACK_CASCADE";
    }
  }

  // --- ÉTAPE 3 : Si toujours insuffisant, élargit les catégories compatibles ---
  if (availableCandidates.length < count && categories && categories.length > 0) {
    const allCatCandidates = filterCandidates(
      allQuestions,
      excludedFamilyIds,
      undefined, // toutes catégories
      targetDifficulties,
      language,
      types,
    );
    if (allCatCandidates.length > availableCandidates.length) {
      availableCandidates = allCatCandidates;
      logs.reason = "FALLBACK_CASCADE";
    }
  }

  // --- Sélection initiale parmi les candidats disponibles ---
  let selected = rankAndDiversify(availableCandidates, count, rng);

  // --- ÉTAPE 4 : Si toujours insuffisant, appel à l'IA si activé ---
  if (selected.length < count && allowAiFallback) {
    const missing = count - selected.length;
    const cat = categories && categories.length === 1 ? categories[0] : "mixed";

    try {
      const existingKeys = new Set(allQuestions.map((q) => q.familyId));
      const aiQuestions = await generateAndDeduplicateAiQuestions({
        count: missing,
        category: cat,
        existingQuestions: [...allQuestions, ...selected],
        existingKnowledgeKeys: existingKeys,
      });

      if (aiQuestions.length > 0) {
        selected = [...selected, ...aiQuestions].slice(0, count);
        logs.reason = "AI_GENERATED";
      }
    } catch {
      // Fallback silencieux si l'IA échoue
    }
  }

  // --- ÉTAPE 5 : Si toujours insuffisant après tous les fallbacks ---
  const poolExhausted = selected.length < count;
  if (poolExhausted) {
    logs.poolExhausted = true;
    logs.reason = "INSUFFICIENT_UNSEEN_QUESTIONS";
    logs.details = `Requested ${count} questions but only ${selected.length} unseen available for this player group.`;
  }

  logs.selectedCount = selected.length;

  // 6. Réservation des questions sélectionnées pour éviter les courses concurrentes
  if (selected.length > 0) {
    await reserveQuestions({
      sessionId,
      playerProfileIds,
      questions: selected.map((q) => ({ id: q.id, familyId: q.familyId })),
    });
  }

  return {
    requested: count,
    available: availableCandidates.length,
    returned: selected.length,
    poolExhausted,
    reason: logs.reason,
    questions: selected,
    logs,
  };
}
