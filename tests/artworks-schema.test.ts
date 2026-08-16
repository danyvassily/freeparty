import { describe, it, expect } from "vitest";
import { QuestionSchema, parseQuestionBatch } from "@/lib/questions/schema";

describe("Artwork Metadata & Multilingual Question Schema", () => {
  it("valide une question avec œuvre d'art et musée (Domaine Public / CC0)", () => {
    const rawQuestion = {
      id: "art-test-starry-night",
      conceptId: "concept-starry-night",
      familyId: "art-vangogh",
      type: "mcq",
      inputMode: "mcq",
      question: "Qui a peint 'La Nuit étoilée' en 1889 à Saint-Rémy-de-Provence ?",
      answers: ["Vincent van Gogh", "Claude Monet", "Paul Gauguin", "Paul Cézanne"],
      correctAnswer: 0,
      category: "art",
      subcategory: "peinture",
      difficulty: "medium",
      language: "fr",
      tags: ["art", "peinture", "vangogh"],
      artwork: {
        title: "La Nuit étoilée",
        artist: "Vincent van Gogh",
        yearStart: 1889,
        yearEnd: 1889,
        movement: "Postimpressionnisme",
        country: "Pays-Bas",
        museum: "Museum of Modern Art (MoMA)",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night.jpg/1280px-Van_Gogh_-_Starry_Night.jpg",
        imageLicense: "Public Domain / CC0",
      },
      translations: {
        en: {
          question: "Who painted 'The Starry Night' in 1889 at Saint-Rémy-de-Provence?",
          answers: ["Vincent van Gogh", "Claude Monet", "Paul Gauguin", "Paul Cézanne"],
          explanation: "Vincent van Gogh painted this in June 1889.",
        },
      },
      explanation: "Vincent van Gogh a peint 'La Nuit étoilée' en juin 1889.",
      source: {
        provider: "MoMA Open Access",
        url: "https://www.moma.org",
        license: "CC0",
      },
    };

    const parsed = QuestionSchema.safeParse(rawQuestion);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.artwork?.museum).toBe("Museum of Modern Art (MoMA)");
      expect(parsed.data.translations?.en?.question).toContain("The Starry Night");
    }
  });

  it("valide une question à indices progressifs pour le mode Buzzer", () => {
    const rawClues = {
      id: "clues-test-ridley-scott",
      conceptId: "concept-ridley-scott",
      familyId: "cinema-scott",
      type: "mcq",
      inputMode: "typed",
      question: "Buzzer : quel réalisateur britannique né en 1937 est décrit par ces indices ?",
      answers: ["Ridley Scott", "Stanley Kubrick", "Christopher Nolan", "Danny Boyle"],
      acceptedTypedAnswers: ["Ridley Scott", "Scott", "R. Scott"],
      correctAnswer: 0,
      category: "cinema",
      subcategory: "realisateurs",
      difficulty: "hard",
      language: "fr",
      progressiveClues: [
        "Je suis un réalisateur britannique né en 1937.",
        "J'ai réalisé 'Alien' et 'Blade Runner'.",
        "J'ai également réalisé 'Gladiator'.",
      ],
      source: {
        provider: "BFI",
        url: "https://www.bfi.org.uk",
        license: "CC0",
      },
    };

    const parsed = QuestionSchema.safeParse(rawClues);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.progressiveClues).toHaveLength(3);
      expect(parsed.data.inputMode).toBe("typed");
      expect(parsed.data.acceptedTypedAnswers).toContain("Scott");
    }
  });

  it("rejette une question avec des réponses dupliquées ou moins de 4 choix", () => {
    const invalid = {
      id: "invalid-duplicate",
      conceptId: "c1",
      familyId: "f1",
      type: "mcq",
      question: "Quelle est la capitale de l'Espagne ?",
      answers: ["Madrid", "Madrid", "Barcelone", "Séville"],
      correctAnswer: 0,
      category: "geographie",
      subcategory: "capitales",
      source: { provider: "test", url: "https://test.com" },
    };

    const batch = parseQuestionBatch([invalid]);
    expect(batch.ok).toBe(false);
    expect(batch.errors).toHaveLength(1);
  });
});
