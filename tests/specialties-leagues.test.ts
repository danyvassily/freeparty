import { describe, it, expect } from "vitest";
import { SPECIALTIES, isQuestionInSpecialty } from "@/lib/game/profile-specialty";
import {
  LEAGUE_TIERS,
  getLeagueForPoints,
  getLeagueProgress,
  getCurrentSeason,
  calculateSeasonPointsAwarded,
} from "@/lib/game/leagues";

describe("Specialties System", () => {
  it("contient exactement les 10 univers de spécialités", () => {
    expect(SPECIALTIES).toHaveLength(10);
    const ids = SPECIALTIES.map((s) => s.id);
    expect(ids).toContain("cinema");
    expect(ids).toContain("art");
    expect(ids).toContain("philosophie");
    expect(ids).toContain("litterature");
    expect(ids).toContain("sciences-humaines");
    expect(ids).toContain("science");
    expect(ids).toContain("geographie");
    expect(ids).toContain("histoire");
    expect(ids).toContain("sport");
    expect(ids).toContain("musique");
  });

  it("associe correctement les catégories aux spécialités", () => {
    expect(isQuestionInSpecialty("cinema", "cinema")).toBe(true);
    expect(isQuestionInSpecialty("series", "cinema")).toBe(true);
    expect(isQuestionInSpecialty("art", "art")).toBe(true);
    expect(isQuestionInSpecialty("sport", "art")).toBe(false);
  });
});

describe("Visible Leagues & 2-Month Seasons", () => {
  it("définit les 6 ligues visibles de Bronze à Élite", () => {
    expect(LEAGUE_TIERS).toHaveLength(6);
    expect(getLeagueForPoints(500).id).toBe("bronze");
    expect(getLeagueForPoints(1500).id).toBe("argent");
    expect(getLeagueForPoints(3500).id).toBe("or");
    expect(getLeagueForPoints(6000).id).toBe("platine");
    expect(getLeagueForPoints(9000).id).toBe("diamant");
    expect(getLeagueForPoints(15000).id).toBe("elite");
  });

  it("calcule la progression et les points restants pour le rang suivant", () => {
    // 3500 pts dans la ligue Or (2500 à 4999, palier = 2500, next = Platine 5000)
    const prog = getLeagueProgress(3500);
    expect(prog.currentTier.id).toBe("or");
    expect(prog.nextTier?.id).toBe("platine");
    expect(prog.progressPercent).toBe(40);
    expect(prog.pointsToNext).toBe(1500);
  });

  it("calcule la saison en cours (cycle de 2 mois)", () => {
    const season = getCurrentSeason();
    expect(season.seasonNumber).toBeGreaterThanOrEqual(1);
    expect(season.daysRemaining).toBeGreaterThan(0);
    expect(season.daysRemaining).toBeLessThanOrEqual(62);
  });

  it("attribue les points de saison équitables", () => {
    const victoryPts = calculateSeasonPointsAwarded({
      placement: 1,
      isVictory: true,
      isFinalist: true,
      correctAnswersCount: 8,
      streak: 4,
    });
    expect(victoryPts).toBe(150 + 40 + 45); // 235 pts
  });
});
