/**
 * Tests du helper de localisation des questions (FR/EN, repli FR).
 * Règle clé : l'index de la bonne réponse est identique dans toutes les langues.
 */
import { describe, it, expect } from "vitest";
import { localizeQuestion } from "@/lib/questions/localize";

const Q = {
  question: "Quelle est la capitale de l'Australie ?",
  answers: ["Sydney", "Canberra", "Melbourne", "Perth"],
  correctAnswer: 1,
  explanation: "Canberra est la capitale depuis 1913.",
  translations: {
    en: {
      question: "What is the capital of Australia?",
      answers: ["Sydney", "Canberra", "Melbourne", "Perth"],
      explanation: "Canberra has been the capital since 1913.",
    },
  },
};

describe("localizeQuestion", () => {
  it("affiche le français par défaut", () => {
    const l = localizeQuestion(Q, "fr");
    expect(l.question).toBe(Q.question);
    expect(l.answers[1]).toBe("Canberra");
    expect(l.lang).toBe("fr");
  });

  it("affiche l'anglais quand la traduction existe", () => {
    const l = localizeQuestion(Q, "en");
    expect(l.question).toBe("What is the capital of Australia?");
    expect(l.lang).toBe("en");
  });

  it("conserve le même index de bonne réponse dans toutes les langues", () => {
    expect(localizeQuestion(Q, "fr").correctAnswer).toBe(1);
    expect(localizeQuestion(Q, "en").correctAnswer).toBe(1);
  });

  it("retombe sur le français si la traduction est absente", () => {
    const sansTrad = { ...Q, translations: undefined };
    const l = localizeQuestion(sansTrad, "en");
    expect(l.question).toBe(Q.question);
    expect(l.lang).toBe("fr");
  });

  it("retombe sur le français si la traduction est incomplète", () => {
    const cassée = { ...Q, translations: { en: { question: "What?", answers: ["only", "two"] } } };
    const l = localizeQuestion(cassée, "en");
    expect(l.question).toBe(Q.question);
    expect(l.lang).toBe("fr");
  });

  it("retombe sur le français pour une langue non traduite (es, de…)", () => {
    const l = localizeQuestion(Q, "es");
    expect(l.question).toBe(Q.question);
    expect(l.lang).toBe("fr");
  });
});
