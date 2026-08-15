/**
 * QA Engineer — Selection Engine tests (spec §37, §90)
 * JAMAIS de sélection purement aléatoire ; preuve de non-répétition.
 */
import { describe, expect, it } from "vitest";
import { selectQuestions, type SelectionHistoryEntry } from "@/lib/questions/selection";
import type { Question } from "@/lib/questions/schema";

function makeQuestion(id: string, familyId: string, category = "geographie", difficulty: Question["difficulty"] = "medium"): Question {
  return {
    id,
    conceptId: `fact-${id}`,
    familyId,
    type: "mcq",
    question: `Question unique numéro ${id} ?`,
    answers: ["Réponse A", "Réponse B", "Réponse C", "Réponse D"],
    correctAnswer: 0,
    category: category as Question["category"],
    subcategory: "test",
    difficulty,
    language: "fr",
    tags: [],
    source: { provider: "test", license: "CC0" },
    verification: { status: "verified", verifiedAt: "2026-08-15", sources: [] },
    confidence: 0.95,
    qualityScore: 0.9,
    version: 1,
  };
}

describe("Selection Engine — anti-répétition", () => {
  it("ne sélectionne jamais deux questions de la même famille dans une partie", () => {
    const pool = Array.from({ length: 50 }, (_, i) => makeQuestion(`q${i}`, `family-${Math.floor(i / 2)}`));
    const result = selectQuestions(pool, [], { count: 10, seed: 42 });
    const families = result.questions.map((q) => q.familyId);
    expect(new Set(families).size).toBe(families.length);
  });

  it("ne resert pas une question déjà vue quand le pool le permet (200 tirages)", () => {
    const pool = Array.from({ length: 100 }, (_, i) => makeQuestion(`q${i}`, `f${i}`));
    let history: SelectionHistoryEntry[] = [];
    const seen = new Set<string>();

    for (let round = 0; round < 200; round++) {
      const result = selectQuestions(pool, history, { count: 10, seed: round });
      for (const q of result.questions) {
        // Avec 100 familles et 10 par tirage, aucune question ne doit revenir avant épuisement
        expect(seen.has(q.id)).toBe(false);
        seen.add(q.id);
        history.push({ questionId: q.id, familyId: q.familyId, servedAt: Date.now() + round, answeredCorrectly: true });
      }
      // Après 10 tirages (100 questions), le pool est épuisé — le moteur retombe sur les moins vues
      if (seen.size >= 100) break;
    }
    expect(seen.size).toBeGreaterThanOrEqual(100);
  });

  it("pénalise fortement les questions déjà vues (choisit les fraîches d'abord)", () => {
    const pool = Array.from({ length: 20 }, (_, i) => makeQuestion(`q${i}`, `f${i}`));
    const history: SelectionHistoryEntry[] = Array.from({ length: 15 }, (_, i) => ({
      questionId: `q${i}`,
      familyId: `f${i}`,
      servedAt: Date.now() - 1000,
      answeredCorrectly: true,
    }));
    const result = selectQuestions(pool, history, { count: 5, seed: 1 });
    // Les 5 questions les plus fraîches (q15-q19) doivent être choisies
    const ids = result.questions.map((q) => q.id);
    expect(ids.every((id) => id.startsWith("q1") && Number(id.slice(1)) >= 15)).toBe(true);
  });

  it("respecte les filtres de difficulté", () => {
    const pool = [
      makeQuestion("e1", "fe1", "geographie", "easy"),
      makeQuestion("e2", "fe2", "geographie", "easy"),
      makeQuestion("h1", "fh1", "geographie", "hard"),
      makeQuestion("x1", "fx1", "geographie", "expert"),
    ];
    const result = selectQuestions(pool, [], { count: 4, difficulties: ["easy"], seed: 1 });
    expect(result.questions.length).toBe(2);
    expect(result.questions.every((q) => q.difficulty === "easy")).toBe(true);
  });

  it("retourne un lot vide sur pool vide", () => {
    const result = selectQuestions([], [], { count: 5 });
    expect(result.questions).toEqual([]);
  });

  it("équilibre les catégories quand demandé", () => {
    const pool = [
      ...Array.from({ length: 10 }, (_, i) => makeQuestion(`geo${i}`, `g${i}`, "geographie")),
      ...Array.from({ length: 10 }, (_, i) => makeQuestion(`his${i}`, `h${i}`, "histoire")),
    ];
    const result = selectQuestions(pool, [], { count: 10, categories: ["geographie", "histoire"], seed: 7 });
    const cats = result.questions.map((q) => q.category);
    expect(cats.includes("geographie")).toBe(true);
    expect(cats.includes("histoire")).toBe(true);
  });
});
