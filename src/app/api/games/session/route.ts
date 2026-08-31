/**
 * /api/games/session — Lancement, déroulement et fin de parties multijoueurs
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  startGameFromLobby,
  pushGameQuestion,
  addParticipantScore,
  finishGameSession,
  returnToLobby,
  getGameSessionParticipants,
} from "@/lib/social";
import { GAME_MODES } from "@/lib/store/game";

const GameModeEnum = z.enum(GAME_MODES);

const RequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start"),
    lobbyId: z.string(),
    requestedByProfileId: z.string(),
    gameMode: GameModeEnum.optional(),
  }),
  z.object({
    action: z.literal("push_question"),
    sessionId: z.string(),
    questionIndex: z.number().int(),
    revealed: z.boolean(),
  }),
  z.object({
    action: z.literal("submit_score"),
    sessionId: z.string(),
    profileId: z.string(),
    points: z.number().int(),
  }),
  z.object({
    action: z.literal("finish"),
    sessionId: z.string(),
  }),
  z.object({
    action: z.literal("return_to_lobby"),
    lobbyId: z.string(),
  }),
  z.object({
    action: z.literal("get_participants"),
    sessionId: z.string(),
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
      case "start": {
        const res = await startGameFromLobby({
          lobbyId: data.lobbyId,
          requestedByProfileId: data.requestedByProfileId,
          gameMode: data.gameMode,
        });
        return NextResponse.json(res);
      }
      case "push_question": {
        const session = await pushGameQuestion(data);
        return NextResponse.json({ session });
      }
      case "submit_score": {
        const participant = await addParticipantScore(data.sessionId, data.profileId, data.points);
        return NextResponse.json({ participant });
      }
      case "finish": {
        const res = await finishGameSession(data.sessionId);
        return NextResponse.json(res);
      }
      case "return_to_lobby": {
        const lobby = await returnToLobby(data.lobbyId);
        return NextResponse.json({ lobby });
      }
      case "get_participants": {
        const participants = await getGameSessionParticipants(data.sessionId);
        return NextResponse.json({ participants });
      }
    }
  } catch (error) {
    console.error("[api/games/session] Erreur:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
