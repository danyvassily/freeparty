import { describe, expect, it } from "vitest";
import verdicts from "../questions/.audit-verdicts.json";
import { loadQuestions } from "@/lib/questions/load";
import { GUESS_ITEMS } from "@/lib/game/guess-data";

// Contrôle de cohérence avec les verdicts du dépôt, pas une preuve factuelle
// indépendante : une source doit toujours être relue lors d'une nouvelle correction.
describe("Non-régression des corrections de la banque", () => {
  const dataset = loadQuestions();
  const byId = new Map(dataset.questions.map((q) => [q.id, q]));

  it("charge tous les fichiers sans erreurs et sans identifiants dupliqués", () => {
    expect(dataset.errors).toEqual([]);
    expect(dataset.questions.length).toBeGreaterThan(2000);
    expect(byId.size).toBe(dataset.questions.length);
  });

  it("préserve chaque verdict d'index enregistré", () => {
    expect(verdicts.length).toBeGreaterThan(500);
    expect(new Set(verdicts.map((v) => v.id)).size).toBe(verdicts.length);
    for (const verdict of verdicts) {
      const question = byId.get(verdict.id);
      expect(question, verdict.id).toBeDefined();
      expect(question!.correctAnswer, verdict.id).toBe(verdict.correct_idx);
      expect(Number.isInteger(verdict.correct_idx)).toBe(true);
      expect(question!.answers[verdict.correct_idx], verdict.id).toBeTruthy();
    }
  });

  it("contrôle les textes des réponses emblématiques, indépendamment de leur position", () => {
    const answers = {
      "sci-gravity-newton": "Isaac Newton",
      "sci-light-speed": "300 000 km/s",
      "cg-inv-dynamite": "Alfred Nobel",
      "tv-breaking-bad-actor": "Bryan Cranston",
      "foot-wc-1930-winner": "L'Uruguay",
    };
    for (const [id, expected] of Object.entries(answers)) {
      const q = byId.get(id)!;
      expect(q.answers[q.correctAnswer], id).toBe(expected);
    }
  });

  it("ne confond plus le manchot avec le pingouin", () => {
    expect(GUESS_ITEMS.find((q) => q.id === "g12")?.answer).toBe("Le manchot");
  });
});
