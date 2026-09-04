import { afterEach, describe, expect, it, vi } from "vitest";
import { isQuizAnswerCorrect, playerQuestionCount, startQuestionCountdown } from "@/lib/game/quiz-round";

afterEach(() => vi.useRealTimers());

describe("Déroulement du quiz", () => {
  it("ne valide jamais un délai expiré, y compris sur une proposition fausse", () => {
    for (const assertion of [true, false, undefined]) {
      expect(isQuizAnswerCorrect(-1, 2, assertion)).toBe(false);
      expect(isQuizAnswerCorrect(null, 2, assertion)).toBe(false);
    }
  });

  it("distingue Vrai, Faux et réponses QCM", () => {
    expect(isQuizAnswerCorrect(0, 3, true)).toBe(true);
    expect(isQuizAnswerCorrect(1, 3, false)).toBe(true);
    expect(isQuizAnswerCorrect(0, 3, false)).toBe(false);
    expect(isQuizAnswerCorrect(2, 3, false)).toBe(false);
    expect(isQuizAnswerCorrect(3, 3)).toBe(true);
    expect(isQuizAnswerCorrect(1, 3)).toBe(false);
  });

  it("termine une seule fois à zéro et permet de démarrer le tour suivant", () => {
    vi.useFakeTimers();
    const tick = vi.fn();
    const expire = vi.fn();
    startQuestionCountdown(2, tick, expire);
    vi.advanceTimersByTime(5000);
    expect(tick.mock.calls).toEqual([[1], [0]]);
    expect(expire).toHaveBeenCalledTimes(1);
    startQuestionCountdown(2, tick, expire);
    vi.advanceTimersByTime(2000);
    expect(expire).toHaveBeenCalledTimes(2);
  });

  it("annule l'expiration lorsqu'on quitte ou répond", () => {
    vi.useFakeTimers();
    const expire = vi.fn();
    const stop = startQuestionCountdown(2, vi.fn(), expire);
    stop();
    vi.advanceTimersByTime(5000);
    expect(expire).not.toHaveBeenCalled();
  });

  it("compte les tours réels quand le lot n'est pas divisible par le nombre de joueurs", () => {
    expect([0, 1, 2].map((i) => playerQuestionCount(5, i, 3))).toEqual([2, 2, 1]);
    expect(playerQuestionCount(2, 3, 4)).toBe(0);
  });
});
