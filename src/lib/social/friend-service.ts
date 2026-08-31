/**
 * Free Party — Friend & Social Invitations Service
 * Gère les amis, les invitations à un salon et les demandes pour rejoindre.
 */
import { randomUUID } from "node:crypto";
import type {
  Friendship,
  LobbyInvitation,
  LobbyJoinRequest,
  UserPresence,
} from "./types";
import { presenceStore, getPresences } from "./presence-service";

class InMemoryFriendStore {
  friendships = new Map<string, Friendship>(); // key: id
  invitations = new Map<string, LobbyInvitation>(); // key: id
  joinRequests = new Map<string, LobbyJoinRequest>(); // key: id

  clear() {
    this.friendships.clear();
    this.invitations.clear();
    this.joinRequests.clear();
  }
}

export const friendStore = new InMemoryFriendStore();

/**
 * Envoie une demande d'ami.
 */
export async function sendFriendRequest(
  requesterProfileId: string,
  receiverProfileId: string,
): Promise<Friendship> {
  if (requesterProfileId === receiverProfileId) {
    throw new Error("Cannot friend yourself");
  }

  // Vérifie si une relation existe déjà
  for (const f of friendStore.friendships.values()) {
    const isSamePair =
      (f.requesterProfileId === requesterProfileId && f.receiverProfileId === receiverProfileId) ||
      (f.requesterProfileId === receiverProfileId && f.receiverProfileId === requesterProfileId);

    if (isSamePair) {
      if (f.status === "ACCEPTED") return f;
      if (f.status === "PENDING") return f;
      // Réactivation si déclinée auparavant
      f.status = "PENDING";
      f.requesterProfileId = requesterProfileId;
      f.receiverProfileId = receiverProfileId;
      return f;
    }
  }

  const id = `fr_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const friendship: Friendship = {
    id,
    requesterProfileId,
    receiverProfileId,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };

  friendStore.friendships.set(id, friendship);

  presenceStore.broadcast({
    type: "FRIEND_REQUEST_RECEIVED",
    profileId: receiverProfileId,
    timestamp: new Date().toISOString(),
    data: friendship,
  });

  return friendship;
}

/**
 * Accepte ou refuse une demande d'ami.
 */
export async function respondToFriendRequest(
  friendshipId: string,
  receiverProfileId: string,
  accept: boolean,
): Promise<Friendship> {
  const f = friendStore.friendships.get(friendshipId);
  if (!f) throw new Error("Friendship request not found");
  if (f.receiverProfileId !== receiverProfileId) throw new Error("Not authorized");

  f.status = accept ? "ACCEPTED" : "DECLINED";
  if (accept) f.acceptedAt = new Date().toISOString();

  friendStore.friendships.set(friendshipId, f);

  if (accept) {
    presenceStore.broadcast({
      type: "FRIEND_REQUEST_ACCEPTED",
      profileId: f.requesterProfileId,
      timestamp: new Date().toISOString(),
      data: f,
    });
  }

  return f;
}

/**
 * Récupère la liste des amis acceptés d'un profil avec leur présence.
 */
export async function getFriendsWithPresence(profileId: string): Promise<
  Array<{
    profileId: string;
    presence: UserPresence;
    friendshipId: string;
  }>
> {
  const friendIds: Array<{ profileId: string; friendshipId: string }> = [];

  for (const f of friendStore.friendships.values()) {
    if (f.status === "ACCEPTED") {
      if (f.requesterProfileId === profileId) {
        friendIds.push({ profileId: f.receiverProfileId, friendshipId: f.id });
      } else if (f.receiverProfileId === profileId) {
        friendIds.push({ profileId: f.requesterProfileId, friendshipId: f.id });
      }
    }
  }

  const presences = await getPresences(friendIds.map((item) => item.profileId));

  return friendIds.map((item) => ({
    profileId: item.profileId,
    friendshipId: item.friendshipId,
    presence: presences[item.profileId] || {
      profileId: item.profileId,
      nickname: "Ami",
      status: "OFFLINE",
      lastSeenAt: new Date(0).toISOString(),
    },
  }));
}

/**
 * Envoie une invitation dans un salon à un ami.
 */
export async function sendLobbyInvitation(params: {
  lobbyId: string;
  senderProfileId: string;
  receiverProfileId: string;
  ttlMs?: number;
}): Promise<LobbyInvitation> {
  const { lobbyId, senderProfileId, receiverProfileId, ttlMs = 300_000 } = params;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs).toISOString();

  // Évite les doublons idempotence
  for (const inv of friendStore.invitations.values()) {
    if (
      inv.lobbyId === lobbyId &&
      inv.receiverProfileId === receiverProfileId &&
      inv.status === "PENDING" &&
      new Date(inv.expiresAt) > now
    ) {
      return inv;
    }
  }

  const id = `inv_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const invitation: LobbyInvitation = {
    id,
    lobbyId,
    senderProfileId,
    receiverProfileId,
    status: "PENDING",
    createdAt: now.toISOString(),
    expiresAt,
  };

  friendStore.invitations.set(id, invitation);

  presenceStore.broadcast({
    type: "LOBBY_INVITATION_RECEIVED",
    lobbyId,
    profileId: receiverProfileId,
    timestamp: now.toISOString(),
    data: invitation,
  });

  return invitation;
}

/**
 * Répond à une invitation de salon.
 */
export async function respondToLobbyInvitation(
  invitationId: string,
  receiverProfileId: string,
  accept: boolean,
): Promise<LobbyInvitation> {
  const inv = friendStore.invitations.get(invitationId);
  if (!inv) throw new Error("Invitation not found");
  if (inv.receiverProfileId !== receiverProfileId) throw new Error("Not authorized");

  inv.status = accept ? "ACCEPTED" : "DECLINED";
  if (accept) inv.acceptedAt = new Date().toISOString();

  friendStore.invitations.set(invitationId, inv);

  if (accept) {
    presenceStore.broadcast({
      type: "LOBBY_INVITATION_ACCEPTED",
      lobbyId: inv.lobbyId,
      profileId: receiverProfileId,
      timestamp: new Date().toISOString(),
      data: inv,
    });
  }

  return inv;
}

/**
 * Envoie une demande pour rejoindre le salon d'un ami.
 */
export async function sendJoinRequest(params: {
  lobbyId: string;
  requesterProfileId: string;
}): Promise<LobbyJoinRequest> {
  const { lobbyId, requesterProfileId } = params;
  const now = new Date().toISOString();

  for (const req of friendStore.joinRequests.values()) {
    if (req.lobbyId === lobbyId && req.requesterProfileId === requesterProfileId && req.status === "PENDING") {
      return req;
    }
  }

  const id = `joinreq_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const joinReq: LobbyJoinRequest = {
    id,
    lobbyId,
    requesterProfileId,
    status: "PENDING",
    createdAt: now,
  };

  friendStore.joinRequests.set(id, joinReq);

  presenceStore.broadcast({
    type: "LOBBY_JOIN_REQUEST",
    lobbyId,
    profileId: requesterProfileId,
    timestamp: now,
    data: joinReq,
  });

  return joinReq;
}

/**
 * Répond à une demande pour rejoindre le salon (par l'hôte).
 */
export async function respondToJoinRequest(
  requestId: string,
  accept: boolean,
): Promise<LobbyJoinRequest> {
  const req = friendStore.joinRequests.get(requestId);
  if (!req) throw new Error("Join request not found");

  req.status = accept ? "ACCEPTED" : "DECLINED";
  req.resolvedAt = new Date().toISOString();

  friendStore.joinRequests.set(requestId, req);
  return req;
}
