/**
 * Free Party — Deduplication Agent (spec §22)
 * Détection : doublons exacts, normalisés, quasi-doublons (Levenshtein), mêmes faits.
 */
import type { Question } from "./schema";

/** Normalisation : minuscules, accents retirés, ponctuation/parenthèses nettoyées, espaces collés */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const KNOWLEDGE_ALIASES: Record<string, string> = {
  geography: "geo",
  geographie: "geo",
  countries: "country",
  pays: "country",
  capitales: "capital",
};

const COUNTRY_CODES: Record<string, string> = {
  france: "fr",
  japan: "jp",
  japon: "jp",
  spain: "es",
  espagne: "es",
  germany: "de",
  allemagne: "de",
  italy: "it",
  italie: "it",
  portugal: "pt",
  china: "cn",
  chine: "cn",
  canada: "ca",
  australia: "au",
  australie: "au",
  brazil: "br",
  bresil: "br",
};

/** Normalise les variations de forme d'une knowledge key sans dépendre de la langue. */
export function canonicalizeKnowledgeKey(input: string): string {
  const parts = normalizeText(input)
    .split(" ")
    .filter(Boolean)
    .map((part) => KNOWLEDGE_ALIASES[part] ?? part);
  if (parts.includes("capital")) {
    const entity = parts.find((part) => !["geo", "country", "capital"].includes(part));
    if (entity) return `geo.country.${COUNTRY_CODES[entity] ?? entity}.capital`;
  }
  return parts.join(".");
}

/** Signature sémantique légère prête à être remplacée par des embeddings. */
export function semanticKnowledgeSignature(
  q: Pick<Question, "category" | "subcategory" | "answers" | "correctAnswer">,
): string {
  return [
    canonicalizeKnowledgeKey(q.category),
    canonicalizeKnowledgeKey(q.subcategory),
    normalizeText(q.answers[q.correctAnswer] ?? ""),
  ].join("|");
}

export function isKnowledgeDuplicate(candidate: Question, existing: Question[]): boolean {
  const candidateKey = canonicalizeKnowledgeKey(candidate.knowledgeKey ?? candidate.familyId);
  const candidateSignature = semanticKnowledgeSignature(candidate);
  return existing.some((question) =>
    canonicalizeKnowledgeKey(question.knowledgeKey ?? question.familyId) === candidateKey ||
    semanticKnowledgeSignature(question) === candidateSignature,
  );
}

/** Clé canonique d'une question (question + bonne réponse normalisées) */
export function canonicalKey(q: Pick<Question, "question" | "correctAnswer" | "answers">): string {
  return `${normalizeText(q.question)}|${normalizeText(q.answers[q.correctAnswer])}`;
}

/** Distance de Levenshtein (DP) */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

export interface DuplicateReport {
  exactDuplicates: Array<{ keep: string; duplicate: string; key: string }>;
  nearDuplicates: Array<{ a: string; b: string; distance: number; normalizedA: string }>;
  uniqueQuestions: Question[];
  removedCount: number;
}

/**
 * Déduplique un lot :
 * 1. doublons exacts via clé canonique (hash map)
 * 2. quasi-doublons via Levenshtein sur la question normalisée (seuil relatif)
 */
export function dedupeQuestions(questions: Question[], threshold = 0.15): DuplicateReport {
  const exact = new Map<string, Question>();
  const exactDuplicates: DuplicateReport["exactDuplicates"] = [];
  for (const q of questions) {
    const key = canonicalKey(q);
    if (exact.has(key)) {
      exactDuplicates.push({ keep: exact.get(key)!.id, duplicate: q.id, key });
    } else {
      exact.set(key, q);
    }
  }

  const unique = [...exact.values()];
  const nearDuplicates: DuplicateReport["nearDuplicates"] = [];
  const toRemove = new Set<string>();

  // Comparaison par paires sur les questions normalisées — O(n²) mais n modéré (lots)
  const normalized = unique.map((q) => ({
    q,
    norm: normalizeText(q.question),
  }));
  for (let i = 0; i < normalized.length; i++) {
    for (let j = i + 1; j < normalized.length; j++) {
      const a = normalized[i];
      const b = normalized[j];
      const maxLen = Math.max(a.norm.length, b.norm.length);
      if (maxLen < 12) continue;
      const dist = levenshtein(a.norm, b.norm);
      const ratio = dist / maxLen;
      if (ratio <= threshold) {
        nearDuplicates.push({
          a: a.q.id,
          b: b.q.id,
          distance: dist,
          normalizedA: a.norm,
        });
        // garde le premier (plus ancien dans le lot), retire le second
        toRemove.add(b.q.id);
      }
    }
  }

  const final = unique.filter((q) => !toRemove.has(q.id));
  return {
    exactDuplicates,
    nearDuplicates,
    uniqueQuestions: final,
    removedCount: exactDuplicates.length + toRemove.size,
  };
}
