/**
 * GET /api/debates — prompts de débat (spec §56)
 * Renvoie un prompt par catégorie (ou aléatoire), en évitant les déjà vus.
 */
import { NextResponse } from "next/server";
import { loadDebatePrompts } from "@/lib/debate/load";
import { filterPassingPrompts, selectDebatePrompt } from "@/lib/debate/quality";
import { DEBATE_CATEGORIES } from "@/lib/debate/schema";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? undefined;
  const excludedRaw = url.searchParams.get("exclude") ?? "";

  const { prompts, errors } = loadDebatePrompts("fr");
  const { passing, rejected } = filterPassingPrompts(prompts);

  const excluded = excludedRaw.split(",").filter(Boolean);
  const categories = category && category !== "all" ? [category] : [...DEBATE_CATEGORIES];

  const selected: typeof passing = [];
  for (const cat of categories) {
    const picked = selectDebatePrompt(passing, cat, excluded);
    if (picked) selected.push(picked);
  }

  return NextResponse.json({
    prompts: selected.length > 0 ? selected : passing.slice(0, 1),
    total: prompts.length,
    rejectedCount: rejected.length,
    loadErrors: errors.length,
  });
}
