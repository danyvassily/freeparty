/**
 * POST /api/questions — sélection de questions (spec §37)
 * Le serveur applique le Selection Engine (anti-répétition) sur les datasets
 * versionnés, avec l'historique du groupe envoyé par le client.
 * Aucune API externe n'est appelée pendant une partie (spec §27).
 */
import { NextResponse } from "next/server";
import { loadQuestions } from "@/lib/questions/load";
import { selectQuestions, type SelectionHistoryEntry } from "@/lib/questions/selection";
import { z } from "zod";

const RequestSchema = z.object({
  count: z.number().int().min(1).max(60).default(10),
  category: z.string().optional(),
  difficulties: z.array(z.enum(["easy", "medium", "hard", "expert"])).optional(),
  history: z
    .array(
      z.object({
        questionId: z.string(),
        familyId: z.string(),
        servedAt: z.number(),
        answeredCorrectly: z.boolean(),
      }),
    )
    .default([]),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Requête invalide", details: parsed.error.issues },
      { status: 400 },
    );
  }
  const { count, category, difficulties, history } = parsed.data;

  const dataset = loadQuestions("fr");
  const pool =
    category && category !== "mixed"
      ? dataset.questions.filter((q) => q.category === category)
      : dataset.questions;

  const result = selectQuestions(pool, history as SelectionHistoryEntry[], {
    count,
    categories: category && category !== "mixed" ? [category] : undefined,
    difficulties,
    maxPerFamily: 1,
    jitter: 0.15,
  });

  // On ne renvoie jamais la bonne réponse à l'avance : le client la déchiffre au moment de répondre.
  return NextResponse.json({
    questions: result.questions,
    scores: result.scores,
    poolSize: pool.length,
  });
}
