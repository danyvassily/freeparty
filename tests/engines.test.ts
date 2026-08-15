/**
 * QA Engineer — Dedupe, stats, debate quality, timeline tests (spec §22, §34, §41, §48, §76, §90)
 */
import { describe, expect, it } from "vitest";
import { dedupeQuestions, normalizeText, canonicalKey, levenshtein } from "@/lib/questions/dedupe";
import { computeStats, computeQualityScore } from "@/lib/questions/stats";
import { auditDebatePrompt, filterPassingPrompts } from "@/lib/debate/quality";
import { pickTimelineSet } from "@/lib/game/timeline-data";
import { pickWyrPair } from "@/lib/game/wyr-data";
import { pickGuessItem } from "@/lib/game/guess-data";
import type { Question } from "@/lib/questions/schema";
import type { DebatePrompt } from "@/lib/debate/schema";

function q(id: string, question: string, answer = "Réponse A"): Question {
  return {
    id,
    conceptId: `fact-${id}`,
    familyId: `family-${id}`,
    type: "mcq",
    question,
    answers: [answer, "Distracteur 1", "Distracteur 2", "Distracteur 3"],
    correctAnswer: 0,
    category: "culture-generale",
    subcategory: "test",
    difficulty: "medium",
    language: "fr",
    tags: [],
    source: { provider: "test", license: "CC0" },
    verification: { status: "verified", verifiedAt: "2026-08-15", sources: [] },
    confidence: 0.95,
    qualityScore: 0.9,
    version: 1,
  };
}

describe("Dedupe Agent", () => {
  it("normalise accents, casse et ponctuation", () => {
    expect(normalizeText("Quelle est la capitale de l'Égypte ?")).toBe("quelle est la capitale de l egypte");
  });

  it("détecte les doublons exacts via clé canonique", () => {
    const a = q("a1", "Quelle est la capitale de l'Égypte ?", "Le Caire");
    const b = q("b1", "Quelle est la capitale de l'Égypte ?", "Le Caire");
    const report = dedupeQuestions([a, b]);
    expect(report.exactDuplicates.length).toBe(1);
    expect(report.uniqueQuestions.length).toBe(1);
  });

  it("détecte les quasi-doublons (paraphrase proche)", () => {
    const a = q("a1", "Quelle est la capitale de la France ?", "Paris");
    const b = q("b1", "Quelle est la capitale de France ?", "Paris");
    const report = dedupeQuestions([a, b], 0.15);
    expect(report.nearDuplicates.length).toBeGreaterThanOrEqual(1);
  });

  it("conserve les questions différentes", () => {
    const a = q("a1", "Quelle est la capitale de la France ?", "Paris");
    const b = q("b1", "Quel est le plus long fleuve du monde ?", "Le Nil");
    const report = dedupeQuestions([a, b]);
    expect(report.uniqueQuestions.length).toBe(2);
  });

  it("distance de Levenshtein correcte", () => {
    expect(levenshtein("chat", "chats")).toBe(1);
    expect(levenshtein("kitten", "sitting")).toBe(3);
  });

  it("clé canonique indépendante des accents", () => {
    expect(canonicalKey(q("a", "Égypte ?", "Le Caire"))).toBe(canonicalKey(q("b", "Egypte ?", "Le Caire")));
  });
});

describe("Stats & Quality", () => {
  it("computeStats agrège catégories, difficultés, sources", () => {
    const stats = computeStats([q("a", "Q1 ?", "A"), q("b", "Q2 ?", "B"), q("c", "Q3 ?", "C")]);
    expect(stats.total).toBe(3);
    expect(stats.byCategory["culture-generale"]).toBe(3);
    expect(stats.byDifficulty["medium"]).toBe(3);
    expect(stats.bySource["test"]).toBe(3);
    expect(stats.qualityScore.avg).toBeGreaterThan(0);
  });

  it("computeQualityScore produit un score 0..1", () => {
    const score = computeQualityScore(q("a", "Une question suffisamment longue pour être claire ?", "Réponse"));
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe("Debate Quality Agent", () => {
  const goodPrompt: DebatePrompt = {
    id: "good-1",
    category: "politics",
    topic: "Test",
    prompt: "Une démocratie peut-elle limiter la liberté d'expression pour protéger ses institutions ?",
    context: "Contexte factuel suffisamment long pour documenter le débat sans prendre parti sur la réponse.",
    perspectives: ["Perspective libérale : la liberté d'expression est le fondement de la démocratie.", "Perspective sécuritaire : la protection des institutions exige des limites."],
    followUps: ["Qui définit les limites ?"],
    sources: [],
    difficulty: "deep",
    sensitivity: "high",
    language: "fr",
    version: 1,
  };

  it("approuve un prompt équilibré", () => {
    const audit = auditDebatePrompt(goodPrompt);
    expect(audit.pass).toBe(true);
    expect(audit.overall).toBeGreaterThanOrEqual(0.75);
  });

  it("rejette un prompt tronqué (pas de contexte, pas de relances)", () => {
    const bad: DebatePrompt = {
      ...goodPrompt,
      id: "bad-1",
      context: "court",
      followUps: [],
      perspectives: ["Seule perspective."],
    };
    const audit = auditDebatePrompt(bad);
    expect(audit.pass).toBe(false);
    expect(audit.flags.length).toBeGreaterThan(0);
  });

  it("signale un current-issues sans date de vérification", () => {
    const ci: DebatePrompt = {
      ...goodPrompt,
      id: "ci-1",
      category: "current-issues",
    };
    const audit = auditDebatePrompt(ci);
    expect(audit.scores.timeliness).toBeLessThan(1);
  });

  it("filterPassingPrompts ne garde que les prompts sains", () => {
    const { passing, rejected } = filterPassingPrompts([goodPrompt]);
    expect(passing.length).toBe(1);
    expect(rejected.length).toBe(0);
  });
});

describe("Contenus sociaux (WYR / Guess / Timeline)", () => {
  it("WYR : chaque paire a deux options non vides, ids uniques en tirage sans remise", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 32; i++) {
      const p = pickWyrPair([...seen]);
      expect(p.optionA.length).toBeGreaterThan(3);
      expect(p.optionB.length).toBeGreaterThan(3);
      expect(seen.has(p.id)).toBe(false);
      seen.add(p.id);
    }
  });

  it("Guess : indices progressifs et réponse unique, sans remise", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const g = pickGuessItem([...seen]);
      expect(g.hints.length).toBeGreaterThanOrEqual(3);
      expect(g.answer.length).toBeGreaterThan(2);
      expect(seen.has(g.id)).toBe(false);
      seen.add(g.id);
    }
  });

  it("Timeline : même lot d'événements, ordre mélangé pour le challenge", () => {
    let mixed = 0;
    for (let i = 0; i < 20; i++) {
      const { events } = pickTimelineSet(null);
      const years = events.map((e) => e.year);
      // Le lot doit contenir des années variées (5+ événements par manche)
      expect(new Set(years).size).toBeGreaterThanOrEqual(4);
      // Le mélange doit être défié : au moins un tirage dans l'ordre aléatoire ≠ trié
      const sorted = [...events].sort((a, b) => a.year - b.year);
      const isSorted = events.every((e, idx) => e.id === sorted[idx].id);
      if (!isSorted) mixed++;
    }
    expect(mixed).toBeGreaterThan(0);
  });
});
