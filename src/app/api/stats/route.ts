/**
 * GET /api/stats — statistiques du dataset (spec §31, §41)
 * Route API interne : les données restent dans le repo, aucune API externe (spec §27).
 */
import { NextResponse } from "next/server";
import { loadQuestions } from "@/lib/questions/load";
import { computeStats } from "@/lib/questions/stats";
import { loadDebatePrompts } from "@/lib/debate/load";

export const dynamic = "force-static";

export async function GET() {
  const dataset = loadQuestions("fr");
  const stats = computeStats(dataset.questions);
  const debates = loadDebatePrompts("fr");
  const debateByCat: Record<string, number> = {};
  for (const d of debates.prompts) debateByCat[d.category] = (debateByCat[d.category] ?? 0) + 1;

  return NextResponse.json({
    questions: {
      total: stats.total,
      byCategory: stats.byCategory,
      byDifficulty: stats.byDifficulty,
      verified: stats.byState.verified ?? 0,
      qualityAvg: stats.qualityScore.avg,
      loadErrors: dataset.errors.length,
    },
    debates: { total: debates.prompts.length, byCategory: debateByCat },
    generatedAt: new Date().toISOString(),
  });
}
