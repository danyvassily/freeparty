/**
 * Free Party — AI Question Generation with KnowledgeKey & Deduplication
 * Spec: L'IA doit obligatoirement fournir une knowledgeKey et passer par
 * le moteur de déduplication à 3 niveaux (hash, family, similarity) et validation Zod.
 */
import { generateQuestionsWithDeepSeek, isDeepSeekEnabled } from "@/lib/questions/deepseek";
import { QuestionSchema, type Question, type QuestionCategory } from "@/lib/questions/schema";
import { computeContentHash, normalizeKnowledgeKey, computeTextSimilarity } from "./hash";

export interface GeneratedAiQuestion {
  question: Question;
  knowledgeKey: string;
  contentHash: string;
}

/**
 * Génère des questions via l'IA avec validation, calcul du hash et déduplication contre le catalogue existant.
 */
export async function generateAndDeduplicateAiQuestions(params: {
  count: number;
  category: QuestionCategory | "mixed";
  existingQuestions: Question[];
  existingKnowledgeKeys?: Set<string>;
}): Promise<Question[]> {
  const { count, category, existingQuestions, existingKnowledgeKeys = new Set<string>() } = params;

  if (!isDeepSeekEnabled()) return [];

  // Prépare les index d'exclusion des doublons existants
  const existingHashes = new Set<string>();
  for (const q of existingQuestions) {
    existingHashes.add(computeContentHash(q.question));
  }

  // 1. Appel du générateur IA
  const rawGenerated = await generateQuestionsWithDeepSeek(Math.min(count * 2, 30), category);
  if (!rawGenerated || rawGenerated.length === 0) return [];

  const validatedAndDeduplicated: Question[] = [];

  for (const candidate of rawGenerated) {
    if (validatedAndDeduplicated.length >= count) break;

    // Normalise knowledge_key
    const kKey = normalizeKnowledgeKey(candidate.familyId || candidate.conceptId || candidate.id);
    const cHash = computeContentHash(candidate.question);

    // LEVEL 1 : Content hash match (doublon quasi-exact)
    if (existingHashes.has(cHash)) continue;

    // LEVEL 2 : Knowledge key match (même fait/famille déjà existant)
    if (existingKnowledgeKeys.has(kKey)) continue;

    // LEVEL 3 : Fuzzy similarity (Levenshtein > 85% avec une question existante)
    let isTooSimilar = false;
    for (const eq of existingQuestions) {
      if (computeTextSimilarity(candidate.question, eq.question) >= 0.85) {
        isTooSimilar = true;
        break;
      }
    }
    if (isTooSimilar) continue;

    // Mise à jour de la question avec la famille et le concept normalisés
    const enriched: Question = {
      ...candidate,
      familyId: kKey,
      conceptId: `concept.${kKey}`,
    };

    const valid = QuestionSchema.safeParse(enriched);
    if (valid.success) {
      validatedAndDeduplicated.push(valid.data);
      existingHashes.add(cHash);
      existingKnowledgeKeys.add(kKey);
    }
  }

  return validatedAndDeduplicated;
}
