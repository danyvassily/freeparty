/**
 * Free Party — Persistent Lobby Service
 * Gère le cycle de vie du salon indépendant des parties : création, code PIN,
 * adhésion idempotente, changement de mode en direct, ready check, sitting-out,
 * déconnexion temporaire & reconnexion, et migration d'hôte.
 */
import { randomUUID } from "node:crypto";
import type {
  Lobby,
  LobbyMember,
  ParticipationStatus,
} from "./types";
import type { GameMode } from "@/lib/store/game";
import { generateRoomCode } from "@/lib/online/room";
import { presenceStore } from "./presence-service";

class InMemoryLobbyStore {
  lobbies = new Map<string, Lobby>(); // key: lobbyId
  lobbiesByCode = new Map<string, string>(); // key: uppercase code -> lobbyId
  members = new Map<string, LobbyMember>(); // key: `${lobbyId}:${profileId}`

  clear() {
    this.lobbies.clear();
    this.lobbiesByCode.clear();
    this.members.clear();
  }
}

export const lobbyStore = new InMemoryLobbyStore();

/**
 * Crée un nouveau Lobby persistant avec le propriétaire comme premier membre connecté.
 */
export async function createLobby(params: {
  ownerProfileId: string;
  nickname: string;
  avatarColor?: number;
  mode?: GameMode;
  category?: string;
  questionCount?: number;
  maxPlayers?: number;
  visibility?: "public" | "friends" | "private";
}): Promise<{ lobby: Lobby; member: LobbyMember }> {
  const {
    ownerProfileId,
    nickname,
    avatarColor = 0,
    mode = "classic",
    category = "mixed",
    questionCount = 10,
    maxPlayers = 8,
    visibility = "friends",
  } = params;

  let code = "";
  for (let i = 0; i < 10; i++) {
    code = generateRoomCode();
    if (!lobbyStore.lobbiesByCode.has(code)) break;
  }

  const lobbyId = `lobby_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const now = new Date().toISOString();

  const lobby: Lobby = {
    id: lobbyId,
    code,
    ownerProfileId,
    status: "WAITING",
    selectedGameMode: mode,
    category,
    questionCount,
    maxPlayers,
    visibility,
    createdAt: now,
    updatedAt: now,
  };

  lobbyStore.lobbies.set(lobbyId, lobby);
  lobbyStore.lobbiesByCode.set(code, lobbyId);

  const member: LobbyMember = {
    id: `mem_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
    lobbyId,
    profileId: ownerProfileId,
    role: "OWNER",
    status: "CONNECTED",
    participationStatus: "PLAYING",
    ready: true,
    nickname,
    avatarColor,
    joinedAt: now,
    lastSeenAt: now,
  };

  lobbyStore.members.set(`${lobbyId}:${ownerProfileId}`, member);

  presenceStore.broadcast({
    type: "LOBBY_MEMBER_JOINED",
    lobbyId,
    profileId: ownerProfileId,
    timestamp: now,
    data: { lobby, member },
  });

  return { lobby, member };
}

/**
 * Rejoint un salon existant par son code (idempotent, réutilise le membre existant si déjà inscrit).
 */
export async function joinLobbyByCode(params: {
  code: string;
  profileId: string;
  nickname: string;
  avatarColor?: number;
}): Promise<{ lobby: Lobby; member: LobbyMember }> {
  const { code, profileId, nickname, avatarColor = 0 } = params;
  const upperCode = code.trim().toUpperCase();

  const lobbyId = lobbyStore.lobbiesByCode.get(upperCode);
  if (!lobbyId) throw new Error("LOBBY_NOT_FOUND");

  const lobby = lobbyStore.lobbies.get(lobbyId);
  if (!lobby || lobby.status === "CLOSED") throw new Error("LOBBY_CLOSED");

  const memberKey = `${lobbyId}:${profileId}`;
  const existing = lobbyStore.members.get(memberKey);

  const now = new Date().toISOString();

  if (existing) {
    existing.status = "CONNECTED";
    existing.nickname = nickname || existing.nickname;
    existing.avatarColor = avatarColor ?? existing.avatarColor;
    existing.lastSeenAt = now;
    existing.leftAt = null;
    lobbyStore.members.set(memberKey, existing);
    return { lobby, member: existing };
  }

  // Vérifie la capacité du salon
  const activeCount = Array.from(lobbyStore.members.values()).filter(
    (m) => m.lobbyId === lobbyId && m.status === "CONNECTED",
  ).length;

  if (activeCount >= lobby.maxPlayers) {
    throw new Error("LOBBY_FULL");
  }

  const member: LobbyMember = {
    id: `mem_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
    lobbyId,
    profileId,
    role: "MEMBER",
    status: "CONNECTED",
    participationStatus: "PLAYING",
    ready: false,
    nickname,
    avatarColor,
    joinedAt: now,
    lastSeenAt: now,
  };

  lobbyStore.members.set(memberKey, member);

  presenceStore.broadcast({
    type: "LOBBY_MEMBER_JOINED",
    lobbyId,
    profileId,
    timestamp: now,
    data: { member },
  });

  return { lobby, member };
}

/**
 * L'hôte change le mode de jeu sélectionné pour le salon.
 */
export async function updateLobbyMode(params: {
  lobbyId: string;
  requestedByProfileId: string;
  gameMode: GameMode;
}): Promise<Lobby> {
  const { lobbyId, requestedByProfileId, gameMode } = params;
  const lobby = lobbyStore.lobbies.get(lobbyId);
  if (!lobby) throw new Error("LOBBY_NOT_FOUND");
  if (lobby.ownerProfileId !== requestedByProfileId) throw new Error("NOT_LOBBY_OWNER");
  if (lobby.status === "IN_GAME" || lobby.status === "STARTING") {
    throw new Error("GAME_ALREADY_RUNNING");
  }

  lobby.selectedGameMode = gameMode;
  lobby.status = "CONFIGURING";
  lobby.updatedAt = new Date().toISOString();
  lobbyStore.lobbies.set(lobbyId, lobby);

  presenceStore.broadcast({
    type: "LOBBY_MODE_CHANGED",
    lobbyId,
    gameMode,
    timestamp: lobby.updatedAt,
    data: { selectedGameMode: gameMode, status: lobby.status },
  });

  return lobby;
}

/**
 * Modifie l'état 'Prêt' d'un joueur dans le salon.
 */
export async function setMemberReady(
  lobbyId: string,
  profileId: string,
  ready: boolean,
): Promise<LobbyMember> {
  const key = `${lobbyId}:${profileId}`;
  const member = lobbyStore.members.get(key);
  if (!member) throw new Error("MEMBER_NOT_FOUND");

  member.ready = ready;
  member.lastSeenAt = new Date().toISOString();
  lobbyStore.members.set(key, member);

  presenceStore.broadcast({
    type: "LOBBY_READY_CHANGED",
    lobbyId,
    profileId,
    timestamp: member.lastSeenAt,
    data: { ready },
  });

  return member;
}

/**
 * Définit le statut de participation (PLAYING, SPECTATING, SITTING_OUT).
 */
export async function setParticipationStatus(
  lobbyId: string,
  profileId: string,
  status: ParticipationStatus,
): Promise<LobbyMember> {
  const key = `${lobbyId}:${profileId}`;
  const member = lobbyStore.members.get(key);
  if (!member) throw new Error("MEMBER_NOT_FOUND");

  member.participationStatus = status;
  member.lastSeenAt = new Date().toISOString();
  lobbyStore.members.set(key, member);
  return member;
}

/**
 * Un joueur quitte volontairement le salon.
 * Si l'hôte quitte, une migration automatique de propriété désigne le joueur connecté le plus ancien.
 */
export async function leaveLobby(lobbyId: string, profileId: string): Promise<void> {
  const key = `${lobbyId}:${profileId}`;
  const member = lobbyStore.members.get(key);
  if (!member) return;

  const now = new Date().toISOString();
  member.status = "LEFT";
  member.leftAt = now;
  lobbyStore.members.set(key, member);

  presenceStore.broadcast({
    type: "LOBBY_MEMBER_LEFT",
    lobbyId,
    profileId,
    timestamp: now,
  });

  const lobby = lobbyStore.lobbies.get(lobbyId);
  if (!lobby) return;

  if (lobby.ownerProfileId === profileId) {
    await transferLobbyOwnership(lobbyId, profileId);
  }
}

/**
 * Migration d'hôte : transfère la propriété au membre connecté ayant rejoint le plus anciennement.
 * Si plus aucun membre connecté ne reste, le salon est fermé.
 */
export async function transferLobbyOwnership(
  lobbyId: string,
  leavingOwnerProfileId: string,
): Promise<string | null> {
  const lobby = lobbyStore.lobbies.get(lobbyId);
  if (!lobby) return null;

  const connectedMembers = Array.from(lobbyStore.members.values())
    .filter((m) => m.lobbyId === lobbyId && m.profileId !== leavingOwnerProfileId && m.status === "CONNECTED")
    .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());

  if (connectedMembers.length === 0) {
    lobby.status = "CLOSED";
    lobby.closedAt = new Date().toISOString();
    lobbyStore.lobbies.set(lobbyId, lobby);
    return null;
  }

  const nextOwner = connectedMembers[0];
  nextOwner.role = "OWNER";
  lobby.ownerProfileId = nextOwner.profileId;
  lobby.updatedAt = new Date().toISOString();

  lobbyStore.lobbies.set(lobbyId, lobby);
  lobbyStore.members.set(`${lobbyId}:${nextOwner.profileId}`, nextOwner);

  presenceStore.broadcast({
    type: "LOBBY_OWNER_CHANGED",
    lobbyId,
    ownerProfileId: nextOwner.profileId,
    timestamp: lobby.updatedAt,
    data: { newOwnerProfileId: nextOwner.profileId },
  });

  return nextOwner.profileId;
}

/**
 * Reconnecte un joueur à son salon actif ou sa partie en cours.
 */
export async function reconnectPlayer(profileId: string): Promise<{
  destination: "HOME" | "LOBBY" | "GAME";
  lobbyId?: string;
  gameSessionId?: string;
}> {
  // Cherche une membership active
  for (const member of lobbyStore.members.values()) {
    if (member.profileId === profileId && (member.status === "CONNECTED" || member.status === "DISCONNECTED")) {
      const lobby = lobbyStore.lobbies.get(member.lobbyId);
      if (!lobby || lobby.status === "CLOSED") continue;

      member.status = "CONNECTED";
      member.lastSeenAt = new Date().toISOString();
      lobbyStore.members.set(`${member.lobbyId}:${profileId}`, member);

      presenceStore.broadcast({
        type: "LOBBY_MEMBER_RECONNECTED",
        lobbyId: lobby.id,
        profileId,
        timestamp: member.lastSeenAt,
      });

      if (lobby.status === "IN_GAME" && lobby.currentGameSessionId) {
        return {
          destination: "GAME",
          lobbyId: lobby.id,
          gameSessionId: lobby.currentGameSessionId,
        };
      }

      return {
        destination: "LOBBY",
        lobbyId: lobby.id,
      };
    }
  }

  return { destination: "HOME" };
}

/**
 * Récupère tous les membres connectés d'un salon.
 */
export async function getConnectedLobbyMembers(lobbyId: string): Promise<LobbyMember[]> {
  return Array.from(lobbyStore.members.values()).filter(
    (m) => m.lobbyId === lobbyId && m.status === "CONNECTED",
  );
}

/**
 * Récupère un salon par son ID.
 */
export async function getLobby(lobbyId: string): Promise<Lobby | undefined> {
  return lobbyStore.lobbies.get(lobbyId);
}
