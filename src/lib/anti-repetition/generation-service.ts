/**
 * Free Party — AI Question Generation with KnowledgeKey & Deduplication
 * Spec: L'IA doit obligatoirement fournir une knowledgeKey et passer par
 * le moteur de déduplication à 3 niveaux (hash, family, similarity) et validation Zod.
 */
import { generateQuestionsWithDeepSeek, isDeepSeekEnabled } from "@/lib/questions/deepseek";
import { QuestionSchema, type Question, type QuestionCategory } from "@/lib/questions/schema";
import {
  canonicalKey,
  canonicalizeKnowledgeKey,
  isKnowledgeDuplicate,
  levenshtein,
  normalizeText,
} from "@/lib/questions/dedupe";

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
  const existingHashes = new Set(existingQuestions.map((question) => question.contentHash ?? canonicalKey(question)));
  const canonicalExistingKeys = new Set(
    [...existingKnowledgeKeys].map(canonicalizeKnowledgeKey),
  );

  // 1. Appel du générateur IA
  const rawGenerated = await generateQuestionsWithDeepSeek(Math.min(count * 2, 30), category);
  if (!rawGenerated || rawGenerated.length === 0) return [];

  const validatedAndDeduplicated: Question[] = [];

  for (const candidate of rawGenerated) {
    if (validatedAndDeduplicated.length >= count) break;

    // Normalise knowledge_key
    const kKey = canonicalizeKnowledgeKey(candidate.knowledgeKey ?? candidate.familyId);
    const cHash = candidate.contentHash ?? canonicalKey(candidate);

    // LEVEL 1 : Content hash match (doublon quasi-exact)
    if (existingHashes.has(cHash)) continue;

    // LEVEL 2 : Knowledge key match (même fait/famille déjà existant)
    if (canonicalExistingKeys.has(kKey)) continue;

    // LEVEL 3 : Fuzzy similarity (Levenshtein > 85% avec une question existante)
    let isTooSimilar = false;
    for (const existing of [...existingQuestions, ...validatedAndDeduplicated]) {
      const candidateText = normalizeText(candidate.question);
      const existingText = normalizeText(existing.question);
      const maxLength = Math.max(candidateText.length, existingText.length);
      const similarity = maxLength === 0 ? 1 : 1 - levenshtein(candidateText, existingText) / maxLength;
      if (similarity >= 0.85 || isKnowledgeDuplicate(candidate, [existing])) {
        isTooSimilar = true;
        break;
      }
    }
    if (isTooSimilar) continue;

    // Mise à jour de la question avec la famille et le concept normalisés
    const enriched: Question = {
      ...candidate,
      familyId: kKey,
      conceptId: kKey,
      knowledgeKey: kKey,
      contentHash: candidate.contentHash,
    };

    const valid = QuestionSchema.safeParse(enriched);
    if (valid.success) {
      validatedAndDeduplicated.push(valid.data);
      existingHashes.add(cHash);
      canonicalExistingKeys.add(kKey);
    }
  }

  return validatedAndDeduplicated;
}
