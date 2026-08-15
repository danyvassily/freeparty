/**
 * QA Engineer — Debate Engine tests (spec §56–§79, §90)
 * Machine à états, fair speaking timer, votes, résultats non-compétitifs.
 */
import { describe, expect, it } from "vitest";
import {
  createDebate,
  transition,
  nextPlayer,
  startTurn,
  endTurn,
  revealFollowUp,
  castVote,
  computePositionChanges,
  buildResult,
  canTransition,
  addDiscussionMetric,
} from "@/lib/debate/engine";
import type { DebatePrompt } from "@/lib/debate/schema";

const prompt: DebatePrompt = {
  id: "test-01",
  category: "philosophy",
  topic: "Liberté",
  prompt: "La liberté individuelle doit-elle avoir des limites lorsque nos choix affectent indirectement les autres ?",
  context: "Contexte factuel de test pour vérifier la machine à états du moteur de débat.",
  perspectives: ["Perspective un : défendre la liberté absolue.", "Perspective deux : défendre les limites collectives."],
  followUps: ["Qui devrait définir ces limites ?", "Ces limites changent-elles sur Internet ?"],
  sources: [],
  difficulty: "deep",
  sensitivity: "medium",
  language: "fr",
  version: 1,
};

const players = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
];

describe("Debate Engine — machine à états", () => {
  it("crée un débat avec budget de parole équitable", () => {
    const d = createDebate(prompt, players, { durationSeconds: 300 });
    expect(d.players.length).toBe(2);
    // 5 min / 2 joueurs = 150 s chacun
    expect(d.speakingBudgetMs.p1).toBe(150_000);
    expect(d.speakingBudgetMs.p2).toBe(150_000);
    expect(d.phase).toBe("presentation");
  });

  it("refuse les transitions illégales (chaos tester)", () => {
    let d = createDebate(prompt, players);
    // results → presentation : illégal
    d = { ...d, phase: "results" };
    const res = transition(d, "presentation");
    expect(res.ok).toBe(false);
    expect(res.error).toContain("Transition illégale");
  });

  it("accepte presentation → reflection → player-turn", () => {
    let d = createDebate(prompt, players);
    d = transition(d, "reflection").state;
    d = transition(d, "player-turn").state;
    expect(d.phase).toBe("player-turn");
    expect(d.phaseHistory).toEqual(["presentation", "reflection", "player-turn"]);
  });

  it("applique le fair speaking timer : budget épuisé = tour refusé", () => {
    let d = createDebate(prompt, players, { durationSeconds: 60 });
    d = { ...d, speakingBudgetMs: { p1: 0, p2: 60_000 } };
    const res = startTurn(d, "p1", "speech");
    expect(res.ok).toBe(false);
    expect(res.error).toContain("épuisé");
  });

  it("comptabilise le temps de parole réel et décrémente le budget", () => {
    let d = createDebate(prompt, players, { durationSeconds: 300 });
    const start = startTurn(d, "p1", "speech").state;
    const ended = endTurn(start, "p1").state;
    expect(ended.speakingTimeMs.p1).toBeGreaterThanOrEqual(0);
    expect(ended.speakingBudgetMs.p1).toBeLessThanOrEqual(150_000);
  });

  it("alterne les joueurs avec nextPlayer (round-robin)", () => {
    let d = createDebate(prompt, players);
    expect(d.currentPlayerIndex).toBe(0);
    d = nextPlayer(d);
    expect(d.currentPlayerIndex).toBe(1);
    d = nextPlayer(d);
    expect(d.currentPlayerIndex).toBe(0);
  });

  it("révèle les relances une par une puis refuse au-delà", () => {
    let d = createDebate(prompt, players);
    d = revealFollowUp(d).state;
    expect(d.followUpsRevealed).toBe(1);
    d = revealFollowUp(d).state;
    expect(d.followUpsRevealed).toBe(2);
    const res = revealFollowUp(d);
    expect(res.ok).toBe(false);
  });

  it("vote before/after et compte les changements de position", () => {
    let d = createDebate(prompt, players);
    d = castVote(d, "p1", "pour", "before").state;
    d = castVote(d, "p1", "contre", "after").state;
    const changes = computePositionChanges(d);
    expect(changes.count).toBe(1);
    expect(changes.players).toEqual(["p1"]);
  });

  it("le résultat est non-compétitif : pas de winner/loser, bilan de discussion", () => {
    let d = createDebate(prompt, players);
    d = addDiscussionMetric(d, "pointsDiscussed", 3);
    d = addDiscussionMetric(d, "argumentsExplored", 5);
    d = addDiscussionMetric(d, "openQuestions", 2);
    const result = buildResult(d);
    expect(result.pointsDiscussed).toBe(3);
    expect(result.argumentsExplored).toBe(5);
    expect(result.openQuestions).toBe(2);
    expect(result).not.toHaveProperty("winner");
    expect(result).not.toHaveProperty("loser");
    expect(result.speakingTimeMs).toBeDefined();
  });

  it("canTransition valide les chemins autorisés", () => {
    const d = createDebate(prompt, players);
    expect(canTransition(d, "reflection")).toBe(true);
    expect(canTransition(d, "voting")).toBe(false);
  });
});
