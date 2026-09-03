import { describe, expect, it } from "vitest";
import {
  PSYCHO_ARCHETYPES,
  PSYCHO_QUESTIONS,
  type PsychoArchetypeId,
} from "@/lib/game/psycho-data";
import {
  calculatePsychoProfile,
  generatePsychoShareText,
} from "@/lib/game/psycho-engine";

describe("Psycho Mode — Datasets & Schemas", () => {
  it("contient exactement 18 questions scénarisées", () => {
    expect(PSYCHO_QUESTIONS.length).toBe(18);
  });

  it("chaque question a 4 options avec archétypes et 4 axes définis", () => {
    for (const q of PSYCHO_QUESTIONS) {
      expect(q.situation.length).toBeGreaterThan(10);
      expect(q.options.length).toBe(4);
      for (const opt of q.options) {
        expect(opt.text.length).toBeGreaterThan(5);
        expect(opt.axes).toHaveProperty("audace");
        expect(opt.axes).toHaveProperty("empathie");
        expect(opt.axes).toHaveProperty("ordre");
        expect(opt.axes).toHaveProperty("idealisme");
        expect(Object.keys(opt.archetypes).length).toBeGreaterThan(0);
      }
    }
  });

  it("les 8 archétypes possèdent toutes leurs métadonnées nécessaires", () => {
    const expectedIds: PsychoArchetypeId[] = [
      "stratege",
      "chaos",
      "diplomate",
      "protecteur",
      "cameleon",
      "franc_tireur",
      "analyste",
      "roi_soleil",
    ];

    for (const id of expectedIds) {
      const arch = PSYCHO_ARCHETYPES[id];
      expect(arch).toBeDefined();
      expect(arch.id).toBe(id);
      expect(arch.name.length).toBeGreaterThan(3);
      expect(arch.quote.length).toBeGreaterThan(5);
      expect(arch.superpower.length).toBeGreaterThan(10);
      expect(arch.blindSpot.length).toBeGreaterThan(10);
      expect(arch.partySurvival.length).toBeGreaterThan(10);
      expect(arch.idealPair.id).not.toBe(id);
      expect(arch.nemesisPair.id).not.toBe(id);
    }
  });
});

describe("Psycho Mode — Moteur de Calcul (Engine)", () => {
  it("calcule un profil valide avec une série de réponses fixes (option 0 partout)", () => {
    const answers = new Array(18).fill(0);
    const profile = calculatePsychoProfile(answers);

    expect(profile.completedQuestions).toBe(18);
    expect(profile.primaryArchetype).toBeDefined();
    expect(profile.secondaryArchetype).toBeDefined();
    expect(profile.primaryPercentage).toBeGreaterThanOrEqual(50);
    expect(profile.secondaryPercentage).toBeLessThanOrEqual(50);
    expect(profile.primaryPercentage + profile.secondaryPercentage).toBe(100);

    // Vérifie que les 4 axes sont normalisés (entre 5% et 95%)
    expect(profile.axes.audace).toBeGreaterThanOrEqual(5);
    expect(profile.axes.audace).toBeLessThanOrEqual(95);
    expect(profile.axes.empathie).toBeGreaterThanOrEqual(5);
    expect(profile.axes.empathie).toBeLessThanOrEqual(95);
    expect(profile.axes.ordre).toBeGreaterThanOrEqual(5);
    expect(profile.axes.ordre).toBeLessThanOrEqual(95);
    expect(profile.axes.idealisme).toBeGreaterThanOrEqual(5);
    expect(profile.axes.idealisme).toBeLessThanOrEqual(95);
  });

  it("détecte l'archétype Chaos lorsque des choix hautement chaotiques sont sélectionnés", () => {
    // Dans nos questions, les options 3 de q1, q2, q6, q13, q15, q17 favorisent massivement 'chaos'
    const answers = [3, 3, 0, 3, 3, 2, 2, 0, 1, 1, 2, 0, 2, 2, 2, 0, 3, 0];
    const profile = calculatePsychoProfile(answers);

    expect(["chaos", "franc_tireur", "roi_soleil"]).toContain(profile.primaryArchetype.id);
    expect(profile.axes.audace).toBeGreaterThan(50);
  });

  it("détecte l'archétype Analyste lorsque la logique et les chiffres priment", () => {
    // Les options privilégiant l'analyste
    const answers = [1, 1, 3, 2, 0, 3, 1, 3, 0, 3, 0, 3, 0, 1, 0, 1, 1, 3];
    const profile = calculatePsychoProfile(answers);

    expect(["analyste", "stratege"]).toContain(profile.primaryArchetype.id);
    expect(profile.axes.ordre).toBeGreaterThan(50);
  });

  it("génère un texte de partage complet avec emojis et paires relationnelles", () => {
    const answers = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1];
    const profile = calculatePsychoProfile(answers);
    const text = generatePsychoShareText(profile, "Alex");

    expect(text).toContain("Profil Psycho (Alex) sur JOUXTA");
    expect(text).toContain(profile.primaryArchetype.name);
    expect(text).toContain(profile.secondaryArchetype.name);
    expect(text).toContain("Super-Pouvoir :");
    expect(text).toContain("Talon d'Achille :");
    expect(text).toContain("Binôme Idéal :");
    expect(text).toContain("Némésis Toxique :");
  });

  it("chaque archétype psycho utilise un thème kawaii valide et existant", () => {
    const validThemes = [
      "quiz",
      "debate",
      "party",
      "speed",
      "referee",
      "thinking",
      "waiting",
      "happy",
      "sad",
      "conference",
      "sweating",
    ];
    for (const arch of Object.values(PSYCHO_ARCHETYPES)) {
      expect(validThemes).toContain(arch.kawaiiTheme);
    }
  });
});
