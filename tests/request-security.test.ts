import { beforeEach, describe, expect, it } from "vitest";
import {
  consumeRateLimit,
  resetRateLimitsForTests,
} from "@/lib/server/rate-limit";

describe("question request security", () => {
  beforeEach(() => resetRateLimitsForTests());

  it("bloque les appels au-delà de la limite et indique le délai", () => {
    expect(consumeRateLimit("player", 2, 10_000, 1_000).allowed).toBe(true);
    expect(consumeRateLimit("player", 2, 10_000, 1_001).allowed).toBe(true);
    const blocked = consumeRateLimit("player", 2, 10_000, 1_002);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBe(10);
  });

  it("ouvre une nouvelle fenêtre après expiration", () => {
    expect(consumeRateLimit("player", 1, 1_000, 5_000).allowed).toBe(true);
    expect(consumeRateLimit("player", 1, 1_000, 6_000).allowed).toBe(true);
  });
});
