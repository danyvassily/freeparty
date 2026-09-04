import { describe, expect, it } from "vitest";
import { buildRoundRoasts } from "../src/lib/game/round-roast";
import { ROAST_GIFS, type RoastGifContext } from "../src/lib/game/roast-gifs";

describe("round roast engine", () => {
  const players = [
    { id: "a", name: "Anna", score: 80, correct: 8, total: 10 },
    { id: "b", name: "Ben", score: 70, correct: 7, total: 10 },
    { id: "c", name: "Cam", score: 0, correct: 0, total: 10 },
  ];

  it("produit un commentaire stable pour chaque joueur", () => {
    expect(buildRoundRoasts(players, "session-1")).toEqual(buildRoundRoasts(players, "session-1"));
    expect(buildRoundRoasts(players, "session-1")).toHaveLength(3);
  });

  it("réserve la vanne la plus forte au dernier sans point", () => {
    const roasts = buildRoundRoasts(players, "session-1");
    expect(roasts[0].context).toBe("champion");
    expect(roasts[2].context).toBe("zero_score");
    expect(roasts.every((roast) => roast.gif.sourceUrl.startsWith("https://giphy.com/"))).toBe(true);
  });

  it("utilise un ton solo quand il n'y a aucun adversaire", () => {
    expect(buildRoundRoasts([players[0]], "solo")[0].context).toBe("solo");
  });

  it("garde une vraie variété de GIFs légers pour chaque contexte", () => {
    const contexts: RoastGifContext[] = [
      "champion", "on_fire", "close_call", "tie", "middle", "confused", "last_place", "zero_score", "solo",
    ];
    for (const context of contexts) {
      expect(ROAST_GIFS.filter((gif) => gif.context === context).length).toBeGreaterThanOrEqual(2);
    }
    expect(ROAST_GIFS.length).toBeGreaterThanOrEqual(30);
    expect(ROAST_GIFS.every((gif) => gif.imageUrl.endsWith("/200w.gif"))).toBe(true);
  });
});
