import { describe, expect, it } from "vitest";
import { clearQuestionsCache, loadQuestions } from "@/lib/questions/load";
import { localizeQuestion } from "@/lib/questions/localize";

describe("question language selection", () => {
  it("loads a real English catalogue", () => {
    clearQuestionsCache();
    const dataset = loadQuestions("en");
    expect(dataset.questions.length).toBeGreaterThan(0);
    expect(dataset.questions.every((question) => question.language === "en")).toBe(true);
    expect(dataset.questions.some((question) => question.question.includes("capital"))).toBe(true);
  });

  it("keeps the same answer index for bilingual questions", () => {
    const question = {
      question: "Quelle est la capitale de la France ?",
      answers: ["Paris", "Lyon", "Nice", "Lille"],
      correctAnswer: 0,
      translations: {
        en: { question: "What is the capital of France?", answers: ["Paris", "Lyon", "Nice", "Lille"] },
      },
    };
    const localized = localizeQuestion(question, "en-US");
    expect(localized.lang).toBe("en");
    expect(localized.question).toBe("What is the capital of France?");
    expect(localized.correctAnswer).toBe(0);
  });
});
