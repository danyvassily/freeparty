/**
 * Tests du pipeline DeepSeek : génération → vérification → validation Zod.
 * fetch est mocké — aucun appel réseau réel.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const GOOD_Q = {
  question: "Quelle planète est la plus proche du Soleil ?",
  answers: ["Vénus", "Mercure", "Mars", "Terre"],
  correctIndex: 1,
  explanation: "Mercure orbite à ~58 Mkm du Soleil.",
  subcategory: "astronomie",
  difficulty: "easy",
  en: {
    question: "Which planet is closest to the Sun?",
    answers: ["Venus", "Mercury", "Mars", "Earth"],
    explanation: "Mercury orbits at ~58M km from the Sun.",
  },
};
const BAD_Q = {
  question: "Capitale de l'Australie ?",
  answers: ["Sydney", "Sydney", "Perth", "Darwin"],
  correctIndex: 0,
};

function mockDeepSeek(genPayload: unknown, verifyPayload: unknown) {
  return vi.fn(async (_url: unknown, init?: { body?: string }) => {
    const body = JSON.parse(init?.body ?? "{}") as { messages?: Array<{ role: string; content: string }> };
    const isVerify = body.messages?.[0]?.content.includes("vérificateur");
    const payload = isVerify ? verifyPayload : genPayload;
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(payload) } }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
}

describe("deepseek — génération de questions", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.DEEPSEEK_API_KEY = "test-key";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.DEEPSEEK_API_KEY;
  });

  it("désactivé sans clé API", async () => {
    delete process.env.DEEPSEEK_API_KEY;
    const { isDeepSeekEnabled, generateQuestionsWithDeepSeek } = await import("@/lib/questions/deepseek");
    expect(isDeepSeekEnabled()).toBe(false);
    expect(await generateQuestionsWithDeepSeek(5, "science")).toEqual([]);
  });

  it("mappe et valide les questions générées", async () => {
    vi.stubGlobal("fetch", mockDeepSeek({ questions: [GOOD_Q] }, { bad: [] }));
    const { generateQuestionsWithDeepSeek } = await import("@/lib/questions/deepseek");
    const qs = await generateQuestionsWithDeepSeek(1, "science");
    expect(qs).toHaveLength(1);
    expect(qs[0].question).toBe(GOOD_Q.question);
    expect(qs[0].answers[qs[0].correctAnswer]).toBe("Mercure");
    expect(qs[0].category).toBe("science");
    expect(qs[0].source.provider).toBe("deepseek");
    expect(qs[0].explanation).toContain("Mercure");
    // Traduction anglaise embarquée, même index de bonne réponse
    expect(qs[0].translations?.en?.question).toBe("Which planet is closest to the Sun?");
    expect(qs[0].translations?.en?.answers?.[qs[0].correctAnswer]).toBe("Mercury");
  });

  it("rejette les questions invalides (réponses dupliquées)", async () => {
    vi.stubGlobal("fetch", mockDeepSeek({ questions: [GOOD_Q, BAD_Q] }, { bad: [] }));
    const { generateQuestionsWithDeepSeek } = await import("@/lib/questions/deepseek");
    const qs = await generateQuestionsWithDeepSeek(2, "science");
    expect(qs).toHaveLength(1);
  });

  it("élimine les questions signalées par la vérification factuelle", async () => {
    vi.stubGlobal("fetch", mockDeepSeek({ questions: [GOOD_Q, GOOD_Q] }, { bad: [1] }));
    const { generateQuestionsWithDeepSeek } = await import("@/lib/questions/deepseek");
    const qs = await generateQuestionsWithDeepSeek(2, "science");
    expect(qs).toHaveLength(1);
  });

  it("retourne [] si l'API est en erreur (ex: solde insuffisant)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Insufficient Balance", { status: 402 })));
    const { generateQuestionsWithDeepSeek } = await import("@/lib/questions/deepseek");
    expect(await generateQuestionsWithDeepSeek(5, "histoire")).toEqual([]);
  });
});
