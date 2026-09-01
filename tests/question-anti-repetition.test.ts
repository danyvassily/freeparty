import { describe, expect, it } from "vitest";
import type { Question, QuestionHistory } from "@/lib/questions/schema";
import { getUnseenQuestions } from "@/lib/questions/question-selection-service";
import { appendSeenEntries, mergeProfileHistoryEntries } from "@/lib/store/history";
import { canonicalizeKnowledgeKey } from "@/lib/questions/dedupe";

function question(id: string, familyId = id, language: Question["language"] = "fr"): Question {
  return {
    id,
    conceptId: familyId,
    familyId,
    knowledgeKey: familyId,
    type: "mcq",
    inputMode: "mcq",
    question: `Quelle est la réponse associée à ${id} ?`,
    answers: ["A", "B", "C", "D"],
    correctAnswer: 0,
    category: "culture-generale",
    subcategory: id.startsWith("geo") ? "geographie" : "general",
    difficulty: "medium",
    language,
    tags: [],
    source: { provider: "test", license: "CC0" },
    verification: { status: "verified", sources: [] },
    confidence: 0.95,
    qualityScore: 0.95,
    version: 1,
  };
}

function seen(questionId: string, familyId: string, profileId = "p1"): QuestionHistory {
  return {
    questionId,
    familyId,
    profileId,
    servedAt: "2026-01-01T00:00:00.000Z",
    answeredCorrectly: null,
  };
}

function select(pool: Question[], participants: QuestionHistory[][], count = pool.length) {
  return getUnseenQuestions({
    pool,
    participantHistories: participants.map((entries, index) => ({ profileId: `p${index}`, entries: entries.map((entry) => ({
      questionId: entry.questionId,
      familyId: entry.familyId,
      servedAt: new Date(entry.servedAt).getTime(),
      answeredCorrectly: entry.answeredCorrectly,
    })) })),
    count,
    progressiveFallback: false,
    seed: 1,
  });
}

describe("système anti-répétition complet", () => {
  it("sert un joueur nouveau", () => {
    expect(select([question("a"), question("b")], [], 2).questions).toHaveLength(2);
  });

  it("interdit toutes les familles déjà vues", () => {
    const pool = ["a", "b", "c", "d"].map((id) => question(id));
    expect(select(pool, [[seen("a", "a"), seen("b", "b"), seen("c", "c")]], 4).questions.map((q) => q.familyId)).toEqual(["d"]);
  });

  it("exclut une variante non vue lorsque sa famille a été vue", () => {
    const result = select([question("q1", "capital-japan"), question("q2", "capital-japan"), question("q3", "water")], [[seen("q1", "capital-japan")]], 3);
    expect(result.questions.map((q) => q.id)).toEqual(["q3"]);
  });

  it("utilise l'union des historiques de deux joueurs", () => {
    const pool = ["a", "b", "c", "d", "e"].map((id) => question(id));
    const result = select(pool, [[seen("a", "a"), seen("b", "b")], [seen("c", "c"), seen("d", "d")]], 5);
    expect(result.questions.map((q) => q.familyId)).toEqual(["e"]);
  });

  it("prend automatiquement en compte les anciennes parties ensemble", () => {
    const pool = ["past-a", "past-b", "fresh"].map((id) => question(id));
    expect(select(pool, [[seen("past-a", "past-a")], [seen("past-b", "past-b")]], 3).questions.map((q) => q.id)).toEqual(["fresh"]);
  });

  it("ajoute l'historique d'un troisième joueur à l'union", () => {
    const pool = ["a", "b", "c", "d", "e", "f", "g"].map((id) => question(id));
    const result = select(pool, [
      [seen("a", "a"), seen("b", "b")],
      [seen("c", "c"), seen("d", "d")],
      [seen("e", "e"), seen("f", "f")],
    ], 7);
    expect(result.questions.map((q) => q.id)).toEqual(["g"]);
  });

  it("conserve l'historique anonyme à la création d'un compte", () => {
    const merged = mergeProfileHistoryEntries([seen("a", "a"), seen("b", "b"), seen("c", "c")], [], "account");
    expect(merged.map((entry) => entry.familyId).sort()).toEqual(["a", "b", "c"]);
  });

  it("fusionne l'historique de l'appareil et celui du compte", () => {
    const anonymous = [seen("a", "a"), seen("b", "b"), seen("c", "c")];
    const account = [seen("d", "d"), seen("e", "e"), seen("f", "f")];
    expect(mergeProfileHistoryEntries(anonymous, account, "account").map((entry) => entry.familyId).sort()).toEqual(["a", "b", "c", "d", "e", "f"]);
  });

  it("marque la connaissance au moment de l'affichage, sans réponse", () => {
    const entries = appendSeenEntries([], "q1", "family-a", ["p1"], "00000000-0000-4000-8000-000000000001", "2026-01-01T00:00:00.000Z");
    expect(entries[0]).toMatchObject({ familyId: "family-a", answeredCorrectly: null });
    expect(select([question("q2", "family-a")], [entries], 1).questions).toEqual([]);
  });

  it("fonctionne sans IA uniquement avec le catalogue inédit", () => {
    const result = select([question("old"), question("fresh")], [[seen("old", "old")]], 2);
    expect(result.questions.map((q) => q.id)).toEqual(["fresh"]);
  });

  it("signale un pool insuffisant sans recycler", () => {
    const result = select([question("a"), question("b")], [[seen("a", "a")]], 20);
    expect(result).toMatchObject({ poolExhausted: true, reason: "INSUFFICIENT_UNSEEN_QUESTIONS" });
    expect(result.questions.map((q) => q.id)).toEqual(["b"]);
  });

  it("partage la famille entre deux langues", () => {
    const result = select(
      [question("japan-fr", "geo.country.jp.capital", "fr"), question("japan-en", "geo.country.jp.capital", "en")],
      [[seen("japan-fr", "geo.country.jp.capital")]],
      2,
    );
    expect(result.questions).toEqual([]);
  });

  it("enregistre l'affichage pour tous les joueurs exposés", () => {
    const entries = appendSeenEntries([], "q1", "family-a", ["p1", "p2", "p3"]);
    expect(entries.map((entry) => entry.profileId)).toEqual(["p1", "p2", "p3"]);
  });

  it("canonise les knowledge keys IA équivalentes", () => {
    expect(canonicalizeKnowledgeKey("geo.japan.capital")).toBe("geo.country.jp.capital");
    expect(canonicalizeKnowledgeKey("geography.country.japan.capital")).toBe("geo.country.jp.capital");
    expect(canonicalizeKnowledgeKey("capital-japan")).toBe("geo.country.jp.capital");
  });

  it("bloque un doublon textuel même si sa famille historique est erronée", () => {
    const original = question("duplicate-a", "legacy-family-a");
    const duplicate = { ...original, id: "duplicate-b", conceptId: "legacy-b", familyId: "legacy-family-b", knowledgeKey: "legacy-family-b" };
    const result = select([original, duplicate, question("fresh")], [[seen(original.id, original.familyId)]], 3);
    expect(result.questions.map((item) => item.id)).toEqual(["fresh"]);
  });
});
