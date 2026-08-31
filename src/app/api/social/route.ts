/**
 * /api/social — Amis, invitations, demandes de salon, présence et groupe Party
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  sendFriendRequest,
  respondToFriendRequest,
  getFriendsWithPresence,
  sendLobbyInvitation,
  respondToLobbyInvitation,
  sendJoinRequest,
  respondToJoinRequest,
  updateUserPresence,
  heartbeat,
  createParty,
  joinParty,
  leaveParty,
  getActivePartyMembers,
} from "@/lib/social";

const RequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("send_friend_request"),
    requesterProfileId: z.string(),
    receiverProfileId: z.string(),
  }),
  z.object({
    action: z.literal("respond_friend_request"),
    friendshipId: z.string(),
    receiverProfileId: z.string(),
    accept: z.boolean(),
  }),
  z.object({
    action: z.literal("get_friends"),
    profileId: z.string(),
  }),
  z.object({
    action: z.literal("send_invite"),
    lobbyId: z.string(),
    senderProfileId: z.string(),
    receiverProfileId: z.string(),
  }),
  z.object({
    action: z.literal("respond_invite"),
    invitationId: z.string(),
    receiverProfileId: z.string(),
    accept: z.boolean(),
  }),
  z.object({
    action: z.literal("send_join_request"),
    lobbyId: z.string(),
    requesterProfileId: z.string(),
  }),
  z.object({
    action: z.literal("respond_join_request"),
    requestId: z.string(),
    accept: z.boolean(),
  }),
  z.object({
    action: z.literal("update_presence"),
    profileId: z.string(),
    nickname: z.string(),
    status: z.enum(["ONLINE", "IN_LOBBY", "IN_GAME", "AWAY", "OFFLINE"]),
    currentLobbyId: z.string().optional().nullable(),
    currentGameSessionId: z.string().optional().nullable(),
  }),
  z.object({
    action: z.literal("heartbeat"),
    profileId: z.string(),
  }),
  z.object({
    action: z.literal("create_party"),
    leaderProfileId: z.string(),
  }),
  z.object({
    action: z.literal("join_party"),
    partyId: z.string(),
    profileId: z.string(),
  }),
  z.object({
    action: z.literal("leave_party"),
    partyId: z.string(),
    profileId: z.string(),
  }),
  z.object({
    action: z.literal("get_party_members"),
    partyId: z.string(),
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
      case "send_friend_request": {
        const friendship = await sendFriendRequest(data.requesterProfileId, data.receiverProfileId);
        return NextResponse.json({ friendship });
      }
      case "respond_friend_request": {
        const friendship = await respondToFriendRequest(data.friendshipId, data.receiverProfileId, data.accept);
        return NextResponse.json({ friendship });
      }
      case "get_friends": {
        const friends = await getFriendsWithPresence(data.profileId);
        return NextResponse.json({ friends });
      }
      case "send_invite": {
        const invitation = await sendLobbyInvitation(data);
        return NextResponse.json({ invitation });
      }
      case "respond_invite": {
        const invitation = await respondToLobbyInvitation(data.invitationId, data.receiverProfileId, data.accept);
        return NextResponse.json({ invitation });
      }
      case "send_join_request": {
        const request = await sendJoinRequest(data);
        return NextResponse.json({ request });
      }
      case "respond_join_request": {
        const request = await respondToJoinRequest(data.requestId, data.accept);
        return NextResponse.json({ request });
      }
      case "update_presence": {
        const presence = await updateUserPresence(data);
        return NextResponse.json({ presence });
      }
      case "heartbeat": {
        await heartbeat(data.profileId);
        return NextResponse.json({ ok: true });
      }
      case "create_party": {
        const party = await createParty(data.leaderProfileId);
        return NextResponse.json({ party });
      }
      case "join_party": {
        const member = await joinParty(data.partyId, data.profileId);
        return NextResponse.json({ member });
      }
      case "leave_party": {
        await leaveParty(data.partyId, data.profileId);
        return NextResponse.json({ ok: true });
      }
      case "get_party_members": {
        const members = await getActivePartyMembers(data.partyId);
        return NextResponse.json({ members });
      }
    }
  } catch (error) {
    console.error("[api/social] Erreur:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
