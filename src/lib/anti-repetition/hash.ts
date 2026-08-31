/**
 * Free Party — Multi-Level Question Deduplication & Normalization
 * LEVEL 1: Content Hash (SHA-256 sur texte normalisé sans diacritiques/ponctuation)
 * LEVEL 2: Knowledge Key (clé canonique standardisée)
 * LEVEL 3: Semantic / Fuzzy Similarity (Levenshtein)
 */
import { createHash } from "node:crypto";
import { levenshtein } from "@/lib/questions/dedupe";

/**
 * Normalise le texte d'une question pour le hash de déduplication exacte/quasi-exacte.
 * Retire les accents, diacritiques, ponctuation, et condense les espaces.
 */
export function normalizeQuestionText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calcule le content_hash (SHA-256) d'une question normalisée.
 */
export function computeContentHash(text: string): string {
  const normalized = normalizeQuestionText(text);
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

/**
 * Normalise une knowledge_key en minuscules, tirets/points canoniques.
 * Ex: "geo.country.FR.capital" -> "geo.country.fr.capital"
 */
export function normalizeKnowledgeKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");
}

/**
 * Compare la similarité de deux questions (Level 3 - Fuzzy similarity).
 * Renvoie un score entre 0 (totalement différent) et 1 (identique).
 */
export function computeTextSimilarity(textA: string, textB: string): number {
  const normA = normalizeQuestionText(textA);
  const normB = normalizeQuestionText(textB);
  if (normA === normB) return 1;
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(normA, normB);
  return 1 - dist / maxLen;
}
