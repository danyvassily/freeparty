/**
 * /api/lobby — Gestion des salons persistants (création, adhésion, mode, statut)
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createLobby,
  joinLobbyByCode,
  updateLobbyMode,
  setMemberReady,
  setParticipationStatus,
  leaveLobby,
  reconnectPlayer,
  getConnectedLobbyMembers,
  getLobby,
} from "@/lib/social";
import { GAME_MODES } from "@/lib/store/game";

const GameModeEnum = z.enum(GAME_MODES);

const RequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    ownerProfileId: z.string(),
    nickname: z.string(),
    avatarColor: z.number().optional(),
    mode: GameModeEnum.optional(),
    category: z.string().optional(),
    questionCount: z.number().optional(),
    maxPlayers: z.number().optional(),
    visibility: z.enum(["public", "friends", "private"]).optional(),
  }),
  z.object({
    action: z.literal("join"),
    code: z.string(),
    profileId: z.string(),
    nickname: z.string(),
    avatarColor: z.number().optional(),
  }),
  z.object({
    action: z.literal("update_mode"),
    lobbyId: z.string(),
    requestedByProfileId: z.string(),
    gameMode: GameModeEnum,
  }),
  z.object({
    action: z.literal("ready"),
    lobbyId: z.string(),
    profileId: z.string(),
    ready: z.boolean(),
  }),
  z.object({
    action: z.literal("participation"),
    lobbyId: z.string(),
    profileId: z.string(),
    status: z.enum(["PLAYING", "SPECTATING", "SITTING_OUT"]),
  }),
  z.object({
    action: z.literal("leave"),
    lobbyId: z.string(),
    profileId: z.string(),
  }),
  z.object({
    action: z.literal("reconnect"),
    profileId: z.string(),
  }),
  z.object({
    action: z.literal("get_members"),
    lobbyId: z.string(),
  }),
  z.object({
    action: z.literal("get_lobby"),
    lobbyId: z.string(),
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
      case "create": {
        const res = await createLobby(data);
        return NextResponse.json(res);
      }
      case "join": {
        const res = await joinLobbyByCode(data);
        return NextResponse.json(res);
      }
      case "update_mode": {
        const lobby = await updateLobbyMode(data);
        return NextResponse.json({ lobby });
      }
      case "ready": {
        const member = await setMemberReady(data.lobbyId, data.profileId, data.ready);
        return NextResponse.json({ member });
      }
      case "participation": {
        const member = await setParticipationStatus(data.lobbyId, data.profileId, data.status);
        return NextResponse.json({ member });
      }
      case "leave": {
        await leaveLobby(data.lobbyId, data.profileId);
        return NextResponse.json({ ok: true });
      }
      case "reconnect": {
        const res = await reconnectPlayer(data.profileId);
        return NextResponse.json(res);
      }
      case "get_members": {
        const members = await getConnectedLobbyMembers(data.lobbyId);
        return NextResponse.json({ members });
      }
      case "get_lobby": {
        const lobby = await getLobby(data.lobbyId);
        return NextResponse.json({ lobby });
      }
    }
  } catch (error) {
    console.error("[api/lobby] Erreur:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
