/**
 * QA Engineer — Question Schema tests (spec §30, §90)
 * Une question invalide est INTERDITE en production.
 */
import { describe, expect, it } from "vitest";
import { QuestionSchema, parseQuestionBatch } from "@/lib/questions/schema";

const validQuestion = {
  id: "capital-espagne-001",
  conceptId: "fact-capitale-espagne",
  familyId: "capital-spain",
  type: "mcq",
  question: "Quelle est la capitale de l'Espagne ?",
  answers: ["Madrid", "Lisbonne", "Rome", "Athènes"],
  correctAnswer: 0,
  category: "geographie",
  subcategory: "capitales",
  difficulty: "easy",
  language: "fr",
  tags: ["espagne"],
  source: { provider: "wikidata", sourceId: "Q29", url: "https://www.wikidata.org/wiki/Q29", license: "CC0" },
  verification: { status: "verified", verifiedAt: "2026-08-15", sources: ["wikidata"] },
  confidence: 0.98,
  qualityScore: 0.95,
  version: 1,
};

describe("QuestionSchema", () => {
  it("accepte une question valide", () => {
    expect(QuestionSchema.safeParse(validQuestion).success).toBe(true);
  });

  it("rejette une question sans 4 réponses", () => {
    const bad = { ...validQuestion, answers: ["A", "B", "C"] };
    expect(QuestionSchema.safeParse(bad).success).toBe(false);
  });

  it("rejette une question avec réponses dupliquées", () => {
    const bad = { ...validQuestion, answers: ["Madrid", "Madrid", "Rome", "Athènes"] };
    expect(QuestionSchema.safeParse(bad).success).toBe(false);
  });

  it("rejette une question qui contient la bonne réponse", () => {
    const bad = { ...validQuestion, question: "Quelle est la capitale de l'Espagne, Madrid ?" };
    expect(QuestionSchema.safeParse(bad).success).toBe(false);
  });

  it("rejette un id non kebab-case", () => {
    const bad = { ...validQuestion, id: "Capital Espagne!" };
    expect(QuestionSchema.safeParse(bad).success).toBe(false);
  });

  it("rejette une catégorie inconnue", () => {
    const bad = { ...validQuestion, category: "astrophysique" };
    expect(QuestionSchema.safeParse(bad).success).toBe(false);
  });

  it("rejette un correctAnswer hors bornes", () => {
    const bad = { ...validQuestion, correctAnswer: 7 };
    expect(QuestionSchema.safeParse(bad).success).toBe(false);
  });

  it("rejette une question trop courte", () => {
    const bad = { ...validQuestion, question: "Oui ?" };
    expect(QuestionSchema.safeParse(bad).success).toBe(false);
  });

  it("accepte une URL de source vide (questions générées)", () => {
    const ok = { ...validQuestion, source: { provider: "wikidata", url: "" } };
    expect(QuestionSchema.safeParse(ok).success).toBe(true);
  });

  it("parseQuestionBatch rejette le lot entier si une question est invalide", () => {
    const batch = [validQuestion, { ...validQuestion, id: "BAD ID" }];
    const result = parseQuestionBatch(batch);
    expect(result.ok).toBe(false);
    expect(result.questions.length).toBe(1);
    expect(result.errors.length).toBe(1);
  });

  it("parseQuestionBatch accepte un lot 100% valide", () => {
    const batch = [validQuestion, { ...validQuestion, id: "capital-france-001", familyId: "capital-france" }];
    const result = parseQuestionBatch(batch);
    expect(result.ok).toBe(true);
    expect(result.questions.length).toBe(2);
  });
});
