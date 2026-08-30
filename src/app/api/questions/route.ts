/**
 * POST /api/questions — sélection de questions (spec §37)
 * Si DEEPSEEK_API_KEY est configurée : génération IA (vérifiée) en priorité,
 * avec complément/bascule sur le catalogue local si le lot est insuffisant.
 * Sinon : Selection Engine (anti-répétition) sur les datasets versionnés.
 */
import { NextResponse } from "next/server";
import { loadQuestions } from "@/lib/questions/load";
import { selectQuestions, type SelectionHistoryEntry } from "@/lib/questions/selection";
import { generateQuestionsWithDeepSeek, isDeepSeekEnabled } from "@/lib/questions/deepseek";
import type { Question, QuestionCategory } from "@/lib/questions/schema";
import { z } from "zod";

const RequestSchema = z.object({
  count: z.number().int().min(1).max(60).default(10),
  category: z.string().optional(),
  difficulties: z.array(z.enum(["easy", "medium", "hard", "expert"])).optional(),
  ai: z.boolean().default(true),
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
  const { count, category, difficulties, ai, history } = parsed.data;
  const cat = (category ?? "mixed") as QuestionCategory | "mixed";

  let questions: Question[] = [];
  let aiGenerated = false;

  // 1. Génération IA (vérifiée) si configurée
  if (ai && isDeepSeekEnabled()) {
    try {
      const generated = await generateQuestionsWithDeepSeek(Math.min(count, 30), cat);
      questions = generated.slice(0, count);
      aiGenerated = questions.length > 0;
    } catch (e) {
      console.error("[api/questions] DeepSeek a échoué, bascule catalogue:", e);
    }
  }

  // 2. Complément ou bascule sur le catalogue local (anti-répétition)
  if (questions.length < count) {
    const dataset = loadQuestions("fr");
    const pool =
      cat !== "mixed" ? dataset.questions.filter((q) => q.category === cat) : dataset.questions;
    const result = selectQuestions(pool, history as SelectionHistoryEntry[], {
      count: count - questions.length,
      categories: cat !== "mixed" ? [cat] : undefined,
      difficulties,
      maxPerFamily: 1,
      jitter: 0.15,
    });
    questions = [...questions, ...result.questions];
  }

  // On ne renvoie jamais la bonne réponse à l'avance : le client la déchiffre au moment de répondre.
  return NextResponse.json({ questions, aiGenerated });
}
