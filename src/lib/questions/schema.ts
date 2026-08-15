/**
 * Free Party — Question Schema
 * Spec §28, §30, §32–§35, §42 : schéma strict Zod, question invalide interdite en production.
 */
import { z } from "zod";

export const CATEGORIES = [
  "culture-generale",
  "geographie",
  "histoire",
  "cinema",
  "series",
  "musique",
  "manga-anime",
  "gaming",
  "science",
  "technologie",
  "internet",
  "mythologie-grecque",
  "mythologie-egyptienne",
  "philosophie",
  "sport",
  "football",
  "food",
  "voyage",
  "art",
  "litterature",
  "insolite",
  "politique",
] as const;
export type QuestionCategory = (typeof CATEGORIES)[number];

export const DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;
export type QuestionDifficulty = (typeof DIFFICULTIES)[number];

export const QUESTION_TYPES = ["mcq", "truefalse"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_STATES = [
  "draft",
  "review",
  "verified",
  "quarantined",
  "rejected",
  "expired",
] as const;
export type QuestionState = (typeof QUESTION_STATES)[number];

export const QUESTION_LANGUAGES = ["fr", "en", "es", "de", "it", "pt"] as const;
export type QuestionLanguage = (typeof QUESTION_LANGUAGES)[number];

export const SourceSchema = z.object({
  provider: z.string().min(1),
  sourceId: z.string().optional(),
  /** Accepte "" car les questions générées n'ont pas toujours d'URL Wikidata spécifique */
  url: z.union([z.string().url(), z.literal("")]).optional(),
  license: z.string().default("CC0"),
});

export const VerificationSchema = z.object({
  status: z.enum(["verified", "unverified", "disputed"]).default("unverified"),
  verifiedAt: z.string().optional(),
  sources: z.array(z.string()).default([]),
});

export const QuestionSchema = z
  .object({
    /** Identifiant stable unique (kebab-case) */
    id: z.string().min(3).regex(/^[a-z0-9][a-z0-9-]*$/, "id doit être kebab-case"),
    /** Fait unique partagé par toutes les variantes du même fait */
    conceptId: z.string().min(3),
    /** Famille anti-répétition (ex: capital-spain) */
    familyId: z.string().min(2),
    type: z.enum(QUESTION_TYPES).default("mcq"),
    question: z.string().min(10, "Question trop courte").max(500),
    answers: z
      .array(z.string().min(1).max(120))
      .length(4, "Exactement 4 réponses requises"),
    correctAnswer: z.number().int().min(0).max(3),
    category: z.enum(CATEGORIES),
    subcategory: z.string().min(1).max(60),
    difficulty: z.enum(DIFFICULTIES).default("medium"),
    language: z.enum(QUESTION_LANGUAGES).default("fr"),
    tags: z.array(z.string().min(1)).default([]),
    source: SourceSchema,
    verification: VerificationSchema.default({
      status: "unverified",
      sources: [],
    }),
    /** 0.75–0.89 → review, >= 0.90 → production candidate, < 0.75 → quarantine */
    confidence: z.number().min(0).max(1).default(0.9),
    /** Score composite qualité (0..1) */
    qualityScore: z.number().min(0).max(1).default(0.9),
    version: z.number().int().min(1).default(1),
    /** Explication courte optionnelle, affichée après réponse */
    explanation: z.string().max(300).optional(),
    /** Date de référence pour les données évolutives (population, etc.) */
    asOf: z.string().optional(),
  })
  .superRefine((q, ctx) => {
    // Les 4 réponses doivent être uniques
    const unique = new Set(q.answers.map((a) => a.trim().toLowerCase()));
    if (unique.size !== q.answers.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answers"],
        message: "Les réponses ne doivent pas être dupliquées",
      });
    }
    // La bonne réponse doit être non vide
    if (!q.answers[q.correctAnswer]?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["correctAnswer"],
        message: "La bonne réponse ne peut pas être vide",
      });
    }
    // La question ne doit pas contenir la réponse dans son texte
    const qLower = q.question.toLowerCase();
    const goodAnswer = q.answers[q.correctAnswer]?.toLowerCase();
    if (goodAnswer && goodAnswer.length > 2 && qLower.includes(goodAnswer)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["question"],
        message: "La question ne doit pas contenir la bonne réponse",
      });
    }
  });

export type Question = z.infer<typeof QuestionSchema>;

/** Schéma du module History (spec §38) */
export const QuestionHistorySchema = z.object({
  questionId: z.string(),
  familyId: z.string(),
  gameId: z.string().optional(),
  userId: z.string().optional(),
  groupId: z.string().optional(),
  servedAt: z.string(),
  answeredCorrectly: z.boolean(),
  responseTimeMs: z.number().int().min(0).optional(),
});
export type QuestionHistory = z.infer<typeof QuestionHistorySchema>;

/** Schéma du rapport (spec §43) */
export const REPORT_REASONS = [
  "reponse-incorrecte",
  "question-ambigue",
  "question-obsolete",
  "faute",
  "mauvaise-categorie",
  "contenu-inapproprie",
  "autre",
] as const;

export const QuestionReportSchema = z.object({
  questionId: z.string(),
  reason: z.enum(REPORT_REASONS),
  details: z.string().max(500).optional(),
  createdAt: z.string(),
});
export type QuestionReport = z.infer<typeof QuestionReportSchema>;

/** Schéma du registre des sources (spec §26) */
export const QuestionSourceRegistrySchema = z.object({
  provider: z.string(),
  url: z.string().url(),
  license: z.string(),
  commercialUse: z.boolean().default(false),
  attributionRequired: z.boolean().default(false),
  enabled: z.boolean().default(true),
  lastLicenseCheck: z.string().optional(),
  lastIngestion: z.string().optional(),
});
export type QuestionSourceRegistry = z.infer<typeof QuestionSourceRegistrySchema>;

/** Validation d'un lot de questions — rejette le lot si une seule question est invalide (spec §30) */
export function parseQuestionBatch(input: unknown): {
  ok: boolean;
  questions: Question[];
  errors: z.ZodError[];
} {
  if (!Array.isArray(input)) {
    return { ok: false, questions: [], errors: [] };
  }
  const questions: Question[] = [];
  const errors: z.ZodError[] = [];
  for (const item of input) {
    const result = QuestionSchema.safeParse(item);
    if (result.success) questions.push(result.data);
    else errors.push(result.error);
  }
  return { ok: errors.length === 0, questions, errors };
}
