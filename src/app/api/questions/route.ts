import { NextResponse } from "next/server";
import { z } from "zod";
import { loadQuestions } from "@/lib/questions/load";
import { generateQuestionsWithDeepSeek, isDeepSeekEnabled } from "@/lib/questions/deepseek";
import { isKnowledgeDuplicate } from "@/lib/questions/dedupe";
import { getUnseenQuestions, type ParticipantHistory } from "@/lib/questions/question-selection-service";
import { consumeRateLimit, consumeAuthenticatedAiQuota, getRequestClientKey } from "@/lib/server/request-security";
import { getRequestSupabase } from "@/lib/supabase/request";
import type { Question, QuestionCategory, QuestionDifficulty } from "@/lib/questions/schema";

const HistoryEntrySchema = z.object({
  questionId: z.string(),
  familyId: z.string(),
  servedAt: z.number(),
  answeredCorrectly: z.boolean().nullable(),
});

const RequestSchema = z.object({
  count: z.number().int().min(1).max(60).default(10),
  category: z.string().optional(),
  difficulties: z.array(z.enum(["easy", "medium", "hard", "expert"])).optional(),
  ai: z.boolean().default(false),
  sessionId: z.string().uuid().optional(),
  onlineSessionId: z.string().uuid().optional(),
  participantTokens: z.array(z.string().min(12).max(200)).min(1).max(8).optional(),
  participantHistories: z.array(z.object({
    profileId: z.string().optional(),
    entries: z.array(HistoryEntrySchema).max(100_000),
  })).max(8).optional(),
  history: z.array(HistoryEntrySchema).max(100_000).default([]),
});

type RemoteSupabase = NonNullable<ReturnType<typeof getRequestSupabase>>;

function uniqueFamilies(questions: Question[]): Question[] {
  const seen = new Set<string>();
  return questions.filter((question) => {
    const family = question.familyId.toLowerCase();
    if (seen.has(family)) return false;
    seen.add(family);
    return true;
  });
}

async function reserveRemotely(options: {
  supabase: RemoteSupabase;
  sessionId: string;
  onlineSessionId?: string;
  participantTokens: string[];
  candidates: Question[];
  count: number;
  participantHistories: ParticipantHistory[];
}): Promise<Question[]> {
  if (options.count <= 0 || options.candidates.length === 0) return [];
  const { data, error } = await options.supabase.rpc("reserve_unseen_questions", {
    p_session_id: options.sessionId,
    p_device_tokens: options.participantTokens,
    p_online_session_id: options.onlineSessionId ?? null,
    p_candidates: options.candidates,
    p_count: options.count,
    p_local_history: options.participantHistories,
    p_ttl_seconds: 900,
  });
  if (error) throw error;
  return (data ?? []).map((row: { question?: Question } | Question) =>
    "question" in row && row.question ? row.question : row,
  ) as Question[];
}

function stagePools(
  pool: Question[],
  category: QuestionCategory | "mixed",
  difficulties?: QuestionDifficulty[],
): Question[][] {
  const categoryPool = category === "mixed" ? pool : pool.filter((question) => question.category === category);
  const exact = difficulties?.length
    ? categoryPool.filter((question) => difficulties.includes(question.difficulty))
    : categoryPool;
  const neighborRanks = new Set<number>();
  const order: QuestionDifficulty[] = ["easy", "medium", "hard", "expert"];
  for (const difficulty of difficulties ?? []) {
    const rank = order.indexOf(difficulty);
    neighborRanks.add(rank);
    if (rank > 0) neighborRanks.add(rank - 1);
    if (rank < order.length - 1) neighborRanks.add(rank + 1);
  }
  const neighbor = difficulties?.length
    ? categoryPool.filter((question) => neighborRanks.has(order.indexOf(question.difficulty)))
    : categoryPool;
  const compatible = difficulties?.length
    ? pool.filter((question) => neighborRanks.has(order.indexOf(question.difficulty)))
    : pool;
  return [exact, neighbor, compatible].map(uniqueFamilies);
}

export async function POST(request: Request) {
  const clientKey = getRequestClientKey(request);
  const publicLimit = consumeRateLimit(`questions:${clientKey}`, 60, 60_000);
  if (!publicLimit.allowed) {
    return NextResponse.json(
      { error: "Trop de requêtes, réessaie dans un instant" },
      { status: 429, headers: { "Retry-After": String(publicLimit.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide", details: parsed.error.issues }, { status: 400 });
  }

  const { count, category, difficulties, ai, onlineSessionId, participantTokens, participantHistories, history } = parsed.data;
  const sessionId = parsed.data.sessionId ?? crypto.randomUUID();
  const cat = (category ?? "mixed") as QuestionCategory | "mixed";
  const histories: ParticipantHistory[] = participantHistories?.length ? participantHistories : [{ entries: history }];
  const localPool = loadQuestions("fr").questions;
  const supabase = participantTokens?.length ? getRequestSupabase(request) : null;
  const stages = stagePools(localPool, cat, difficulties);

  let questions: Question[] = [];
  let fallbackStage = "exact";
  let remoteEnabled = Boolean(supabase && participantTokens?.length);
  if (remoteEnabled && supabase && participantTokens) {
    try {
      const labels = ["exact", "neighbor_difficulty", "compatible_categories"];
      for (let index = 0; index < stages.length && questions.length < count; index++) {
        const selected = await reserveRemotely({
          supabase, sessionId, onlineSessionId, participantTokens,
          candidates: stages[index], count: count - questions.length, participantHistories: histories,
        });
        questions.push(...selected.filter((candidate) => !questions.some((q) => q.familyId === candidate.familyId)));
        if (selected.length > 0) fallbackStage = labels[index];
      }
    } catch (error) {
      remoteEnabled = false;
      console.error("[QUESTION_SELECTION] réservation distante indisponible:", error);
    }
  }

  if (!remoteEnabled) {
    const result = getUnseenQuestions({
      pool: localPool,
      participantHistories: histories,
      count,
      categories: cat === "mixed" ? undefined : [cat],
      difficulties,
      progressiveFallback: true,
    });
    questions = result.questions;
    fallbackStage = result.fallbackStage;
  }

  let aiGenerated = false;
  let aiSkipped: "authentication_required" | "rate_limited" | "unavailable" | undefined;
  if (questions.length < count && ai) {
    if (!isDeepSeekEnabled()) aiSkipped = "unavailable";
    else {
      const quota = await consumeAuthenticatedAiQuota(request);
      if (!quota.authenticated) aiSkipped = "authentication_required";
      else if (!quota.allowed) aiSkipped = "rate_limited";
      else {
        const aiLimit = consumeRateLimit(`questions-ai-client:${clientKey}`, 6, 10 * 60_000);
        if (!aiLimit.allowed) aiSkipped = "rate_limited";
        else {
          try {
            const generated = await generateQuestionsWithDeepSeek(Math.min((count - questions.length) * 2, 12), cat);
            const deduplicated = generated.filter((candidate, index, all) =>
              !isKnowledgeDuplicate(candidate, localPool) &&
              !isKnowledgeDuplicate(candidate, questions) &&
              !isKnowledgeDuplicate(candidate, all.slice(0, index)),
            );
            const additions = remoteEnabled && supabase && participantTokens
              ? await reserveRemotely({
                  supabase, sessionId, onlineSessionId, participantTokens,
                  candidates: deduplicated, count: count - questions.length, participantHistories: histories,
                })
              : getUnseenQuestions({
                  pool: deduplicated,
                  participantHistories: histories,
                  count: count - questions.length,
                  progressiveFallback: false,
                }).questions;
            questions.push(...additions);
            aiGenerated = additions.length > 0;
          } catch (error) {
            aiSkipped = "unavailable";
            console.error("[QUESTION_SELECTION] génération IA indisponible:", error);
          }
        }
      }
    }
  }

  const poolExhausted = questions.length < count;
  console.info("[QUESTION_SELECTION]", {
    players: participantTokens?.length ?? histories.length,
    requested: count,
    candidatesInitial: localPool.length,
    selected: questions.length,
    fallbackStage,
    poolExhausted,
    remoteEnabled,
    aiGenerated,
  });

  return NextResponse.json({
    questions,
    requested: count,
    available: questions.length,
    returned: questions.length,
    poolExhausted,
    reason: poolExhausted ? "INSUFFICIENT_UNSEEN_QUESTIONS" : undefined,
    fallbackStage,
    aiGenerated,
    aiSkipped,
  });
}
