/**
 * POST /api/questions — Sélection de questions avec moteur anti-répétition avancé
 * Supporte :
 *   - L'exclusion des QuestionFamily déjà vues par n'importe lequel des participants (UNION multijoueur)
 *   - L'identification par playerProfileIds ou deviceToken
 *   - La réservation anti-collision concurrentielle
 *   - La cascade de fallback et la génération IA avec déduplication stricte
 *   - La rétro-compatibilité avec l'ancien format d'historique localStorage
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getQuestions,
  getOrCreateDeviceProfile,
  markQuestionSeen,
  type GetQuestionsParams,
} from "@/lib/anti-repetition";
import type { QuestionCategory, QuestionDifficulty } from "@/lib/questions/schema";

const RequestSchema = z.object({
  count: z.number().int().min(1).max(60).default(10),
  category: z.string().optional(),
  difficulties: z.array(z.enum(["easy", "medium", "hard", "expert"])).optional(),
  difficulty: z.enum(["easy", "medium", "hard", "expert", "mixed"]).optional(),
  ai: z.boolean().default(true),
  sessionId: z.string().optional(),
  language: z.string().default("fr"),
  deviceToken: z.string().optional(),
  playerProfileIds: z.array(z.string()).optional(),
  // Rétro-compatibilité historique direct
  history: z
    .array(
      z.object({
        questionId: z.string(),
        familyId: z.string(),
        servedAt: z.number().optional(),
        answeredCorrectly: z.boolean().optional(),
      }),
    )
    .optional(),
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

  const {
    count,
    category,
    difficulties,
    difficulty,
    ai,
    sessionId = `sess_${Date.now()}`,
    language,
    deviceToken,
    playerProfileIds: explicitProfileIds,
    history,
  } = parsed.data;

  // Résolution des profile IDs
  let profileIds: string[] = explicitProfileIds ?? [];

  if (profileIds.length === 0) {
    if (deviceToken) {
      const { profile } = await getOrCreateDeviceProfile(deviceToken);
      profileIds = [profile.id];
    } else {
      const { profile } = await getOrCreateDeviceProfile(`anon_${Date.now()}`);
      profileIds = [profile.id];
    }
  }

  // Si un historique rétro-compatible est fourni dans la requête, on enregistre ces vues
  if (history && history.length > 0) {
    for (const h of history) {
      if (h.familyId) {
        await markQuestionSeen({
          profileIds,
          questionId: h.questionId,
          familyId: h.familyId,
        });
      }
    }
  }

  const cat = category && category !== "mixed" ? (category as QuestionCategory) : undefined;
  const targetDiff = difficulty && difficulty !== "mixed" ? (difficulty as QuestionDifficulty) : undefined;

  const selectionParams: GetQuestionsParams = {
    playerProfileIds: profileIds,
    count,
    language,
    categories: cat ? [cat] : undefined,
    difficulties,
    difficulty: targetDiff,
    sessionId,
    allowAiFallback: ai,
  };

  try {
    const result = await getQuestions(selectionParams);

    return NextResponse.json({
      questions: result.questions,
      requested: result.requested,
      available: result.available,
      returned: result.returned,
      poolExhausted: result.poolExhausted,
      reason: result.reason,
      aiGenerated: result.reason === "AI_GENERATED",
      logs: result.logs,
    });
  } catch (error) {
    console.error("[api/questions] Erreur de sélection:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sélection des questions", details: String(error) },
      { status: 500 },
    );
  }
}
