/**
 * Free Party — Persistent Lobby, Social & Multiplayer Types
 * Spec: Découplage strict Lobby (groupe persistant) et GameSession (match temporaire).
 * Fin de partie -> Lobby.status = POST_GAME -> WAITING sans détruire le salon.
 */
import type { GameMode } from "@/lib/store/game";

export type LobbyStatus =
  | "WAITING"
  | "CONFIGURING"
  | "STARTING"
  | "IN_GAME"
  | "POST_GAME"
  | "CLOSED";

export type LobbyMemberRole = "OWNER" | "MEMBER" | "MODERATOR";

export type LobbyMemberStatus = "CONNECTED" | "DISCONNECTED" | "LEFT" | "KICKED";

export type ParticipationStatus = "PLAYING" | "SPECTATING" | "SITTING_OUT";

export type PresenceStatus = "ONLINE" | "IN_LOBBY" | "IN_GAME" | "AWAY" | "OFFLINE";

export type FriendshipStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "BLOCKED";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED";

export type JoinRequestStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";

export interface Lobby {
  id: string;
  code: string;
  ownerProfileId: string;
  status: LobbyStatus;
  currentGameSessionId?: string | null;
  selectedGameMode?: GameMode | null;
  visibility: "public" | "friends" | "private";
  category?: string | null;
  questionCount?: number;
  maxPlayers: number;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
}

export interface LobbyMember {
  id: string;
  lobbyId: string;
  profileId: string;
  role: LobbyMemberRole;
  status: LobbyMemberStatus;
  participationStatus: ParticipationStatus;
  ready: boolean;
  nickname: string;
  avatarColor: number;
  joinedAt: string;
  leftAt?: string | null;
  lastSeenAt: string;
}

export interface GameSession {
  id: string;
  lobbyId: string;
  gameMode: GameMode;
  status: "SETUP" | "PLAYING" | "FINISHED" | "ABORTED";
  createdBy: string;
  questionIndex: number;
  currentQuestion?: Record<string, unknown> | null;
  answersRevealed: boolean;
  stateVersion: number;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export interface GameSessionParticipant {
  gameSessionId: string;
  profileId: string;
  status: "ACTIVE" | "DISCONNECTED" | "LEFT";
  score: number;
  nickname?: string;
  joinedAt: string;
  finishedAt?: string | null;
}

export interface UserPresence {
  profileId: string;
  nickname: string;
  status: PresenceStatus;
  currentLobbyId?: string | null;
  currentGameSessionId?: string | null;
  lastSeenAt: string;
}

export interface Friendship {
  id: string;
  requesterProfileId: string;
  receiverProfileId: string;
  status: FriendshipStatus;
  createdAt: string;
  acceptedAt?: string | null;
}

export interface LobbyInvitation {
  id: string;
  lobbyId: string;
  senderProfileId: string;
  receiverProfileId: string;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string | null;
}

export interface LobbyJoinRequest {
  id: string;
  lobbyId: string;
  requesterProfileId: string;
  status: JoinRequestStatus;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface Party {
  id: string;
  leaderProfileId: string;
  status: "ACTIVE" | "DISBANDED";
  createdAt: string;
  updatedAt: string;
}

export interface PartyMember {
  partyId: string;
  profileId: string;
  role: "LEADER" | "MEMBER";
  status: "ACTIVE" | "LEFT";
  joinedAt: string;
  leftAt?: string | null;
}

export type RealtimeEventType =
  | "FRIEND_ONLINE"
  | "FRIEND_OFFLINE"
  | "FRIEND_REQUEST_RECEIVED"
  | "FRIEND_REQUEST_ACCEPTED"
  | "LOBBY_INVITATION_RECEIVED"
  | "LOBBY_INVITATION_ACCEPTED"
  | "LOBBY_JOIN_REQUEST"
  | "LOBBY_MEMBER_JOINED"
  | "LOBBY_MEMBER_LEFT"
  | "LOBBY_MEMBER_RECONNECTED"
  | "LOBBY_OWNER_CHANGED"
  | "LOBBY_MODE_CHANGED"
  | "LOBBY_READY_CHANGED"
  | "GAME_STARTING"
  | "GAME_STARTED"
  | "GAME_FINISHED"
  | "LOBBY_RETURN"
  | "PARTY_MEMBER_JOINED"
  | "PARTY_MEMBER_LEFT";

export interface RealtimeEventPayload {
  type: RealtimeEventType;
  lobbyId?: string;
  gameSessionId?: string;
  profileId?: string;
  ownerProfileId?: string;
  gameMode?: GameMode;
  data?: unknown;
  timestamp: string;
}
