import { describe, it, expect } from "vitest";
import {
  createInitialPrismState,
  calculateSpeedBonus,
  checkTypedAnswer,
  processLaLigneAnswer,
  processLeCutLeaderboard,
  LALIGNE_INITIAL_POSITION,
  type LaLigneState,
  type PrismPlayer,
} from "@/lib/game/prism-engine";

describe("PRISM Game Engine", () => {
  it("initialise l'état Express avec 3 manches et le joueur hôte", () => {
    const state = createInitialPrismState({
      duration: "express",
      players: [
        { id: "p1", name: "Dany", specialtyId: "cinema" },
        { id: "p2", name: "Anna", specialtyId: "art" },
      ],
    });

    expect(state.duration).toBe("express");
    expect(state.totalRounds).toBe(3);
    expect(state.players).toHaveLength(2);
    expect(state.players[0].name).toBe("Dany");
    expect(state.players[0].isHost).toBe(true);
    expect(state.phase).toBe("lobby");
  });

  it("calcule correctement le bonus de vitesse (max +50)", () => {
    expect(calculateSpeedBonus(15, 15)).toBe(50);
    expect(calculateSpeedBonus(7.5, 15)).toBe(25);
    expect(calculateSpeedBonus(0, 15)).toBe(0);
    expect(calculateSpeedBonus(-2, 15)).toBe(0);
  });

  it("valide les réponses tapées avec tolérance et synonymes", () => {
    const accepted = ["Ridley Scott", "Scott", "R. Scott"];
    expect(checkTypedAnswer("Ridley Scott", accepted)).toBe(true);
    expect(checkTypedAnswer("ridley scott", accepted)).toBe(true);
    expect(checkTypedAnswer("Scott", accepted)).toBe(true);
    expect(checkTypedAnswer("Kubrick", accepted)).toBe(false);
    expect(checkTypedAnswer("", accepted)).toBe(false);
  });

  it("calcule les finalistes du Cut (Élimination Hybride C)", () => {
    const players: PrismPlayer[] = [
      { id: "p1", name: "Dany", score: 1850, avatarColor: 0, specialtyId: "cinema", isHost: true, isSpectator: false, isFinalist: false, isEliminated: false, correctAnswers: 4, wrongAnswers: 0, stealsCount: 0, fastBonusTotal: 80 },
      { id: "p2", name: "Anna", score: 1720, avatarColor: 1, specialtyId: "art", isHost: false, isSpectator: false, isFinalist: false, isEliminated: false, correctAnswers: 3, wrongAnswers: 1, stealsCount: 0, fastBonusTotal: 50 },
      { id: "p3", name: "Lucy", score: 1460, avatarColor: 2, specialtyId: "litterature", isHost: false, isSpectator: false, isFinalist: false, isEliminated: false, correctAnswers: 2, wrongAnswers: 2, stealsCount: 0, fastBonusTotal: 20 },
      { id: "p4", name: "Marc", score: 1210, avatarColor: 3, specialtyId: "histoire", isHost: false, isSpectator: false, isFinalist: false, isEliminated: false, correctAnswers: 1, wrongAnswers: 3, stealsCount: 0, fastBonusTotal: 10 },
    ];

    const { topTwo, challengers } = processLeCutLeaderboard(players);
    expect(topTwo[0].name).toBe("Dany");
    expect(topTwo[1].name).toBe("Anna");
    expect(challengers?.[0].name).toBe("Lucy");
    expect(challengers?.[1].name).toBe("Marc");
  });

  it("gère le déplacement sur La Ligne (9 positions) et le déclenchement du DOUBLE", () => {
    const initialLaLigne: LaLigneState = {
      cursorPosition: LALIGNE_INITIAL_POSITION, // 5
      finalist1Id: "p1",
      finalist2Id: "p2",
      turnCount: 0,
      isDouble: false,
      secondsRemaining: 90,
      winnerId: null,
      history: [],
    };

    // Tour 1 : P1 répond juste -> avance de 1 vers la position 6
    const res1 = processLaLigneAnswer(initialLaLigne, "p1", true);
    expect(res1.nextState.cursorPosition).toBe(6);
    expect(res1.nextState.turnCount).toBe(1);
    expect(res1.nextState.isDouble).toBe(false);

    // Tour 2 : P2 répond juste -> recule de 1 vers la position 5
    const res2 = processLaLigneAnswer(res1.nextState, "p2", true);
    expect(res2.nextState.cursorPosition).toBe(5);
    expect(res2.nextState.turnCount).toBe(2);
    expect(res2.nextState.isDouble).toBe(true); // Tour 3 sera DOUBLE !

    // Tour 3 (DOUBLE) : P1 répond juste -> avance de 2 cases vers position 7 !
    const res3 = processLaLigneAnswer(res2.nextState, "p1", true);
    expect(res3.nextState.cursorPosition).toBe(7);
    expect(res3.nextState.isDouble).toBe(false);
  });

  it("détecte la victoire sur La Ligne lorsqu'un finaliste pousse le curseur hors du camp adverse", () => {
    const nearWinLaLigne: LaLigneState = {
      cursorPosition: 8,
      finalist1Id: "p1",
      finalist2Id: "p2",
      turnCount: 4,
      isDouble: false,
      secondsRemaining: 50,
      winnerId: null,
      history: [],
    };

    const res = processLaLigneAnswer(nearWinLaLigne, "p1", true);
    expect(res.nextState.cursorPosition).toBe(9);
    expect(res.winnerId).toBe("p1");
  });
});
