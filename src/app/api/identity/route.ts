/**
 * /api/identity — Gestion des identités joueur, profils et fusion d'historique
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOrCreateDeviceProfile,
  linkUserToProfile,
  mergeProfiles,
  markQuestionSeen,
  recordAnswerResult,
} from "@/lib/anti-repetition";

const RequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("get_or_create"),
    deviceToken: z.string(),
    nickname: z.string().optional(),
    avatarColor: z.number().optional(),
  }),
  z.object({
    action: z.literal("link_user"),
    userId: z.string(),
    currentAnonymousProfileId: z.string().optional(),
    nickname: z.string().optional(),
  }),
  z.object({
    action: z.literal("merge"),
    anonymousProfileId: z.string(),
    accountProfileId: z.string(),
  }),
  z.object({
    action: z.literal("mark_seen"),
    profileIds: z.array(z.string()),
    questionId: z.string(),
    familyId: z.string(),
    sessionId: z.string().optional(),
  }),
  z.object({
    action: z.literal("record_answer"),
    profileId: z.string(),
    familyId: z.string(),
    questionId: z.string(),
    correct: z.boolean(),
  }),
]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Requête invalide", details: parsed.error.issues }, { status: 400 });
    }

    const data = parsed.data;

    switch (data.action) {
      case "get_or_create": {
        const res = await getOrCreateDeviceProfile(data.deviceToken, data.nickname, data.avatarColor);
        return NextResponse.json(res);
      }
      case "link_user": {
        const profile = await linkUserToProfile(data.userId, data.currentAnonymousProfileId, data.nickname);
        return NextResponse.json({ profile });
      }
      case "merge": {
        const res = await mergeProfiles(data.anonymousProfileId, data.accountProfileId);
        return NextResponse.json(res);
      }
      case "mark_seen": {
        await markQuestionSeen({
          profileIds: data.profileIds,
          questionId: data.questionId,
          familyId: data.familyId,
          sessionId: data.sessionId,
        });
        return NextResponse.json({ ok: true });
      }
      case "record_answer": {
        await recordAnswerResult({
          profileId: data.profileId,
          familyId: data.familyId,
          questionId: data.questionId,
          correct: data.correct,
        });
        return NextResponse.json({ ok: true });
      }
    }
  } catch (error) {
    console.error("[api/identity] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur", details: String(error) }, { status: 500 });
  }
}
