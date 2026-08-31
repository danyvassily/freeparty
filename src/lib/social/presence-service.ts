/**
 * Free Party — Presence Service
 * Gère l'état de connexion temps réel (ONLINE, IN_LOBBY, IN_GAME, OFFLINE) et heartbeat.
 */
import type { PresenceStatus, UserPresence, RealtimeEventPayload } from "./types";

type EventListener = (event: RealtimeEventPayload) => void;

class InMemoryPresenceStore {
  private presences = new Map<string, UserPresence>();
  private listeners = new Set<EventListener>();

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  broadcast(event: RealtimeEventPayload) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Safe dispatch
      }
    }
  }

  getPresence(profileId: string): UserPresence | undefined {
    return this.presences.get(profileId);
  }

  getAllPresences(): UserPresence[] {
    return Array.from(this.presences.values());
  }

  setPresence(presence: UserPresence) {
    this.presences.set(presence.profileId, { ...presence });
  }

  clear() {
    this.presences.clear();
    this.listeners.clear();
  }
}

export const presenceStore = new InMemoryPresenceStore();

/**
 * Met à jour la présence d'un utilisateur et notifie ses contacts.
 */
export async function updateUserPresence(params: {
  profileId: string;
  nickname: string;
  status: PresenceStatus;
  currentLobbyId?: string | null;
  currentGameSessionId?: string | null;
}): Promise<UserPresence> {
  const { profileId, nickname, status, currentLobbyId = null, currentGameSessionId = null } = params;
  const now = new Date().toISOString();

  const prev = presenceStore.getPresence(profileId);
  const wasOnline = prev && prev.status !== "OFFLINE";
  const isOnline = status !== "OFFLINE";

  const updated: UserPresence = {
    profileId,
    nickname,
    status,
    currentLobbyId,
    currentGameSessionId,
    lastSeenAt: now,
  };

  presenceStore.setPresence(updated);

  if (!wasOnline && isOnline) {
    presenceStore.broadcast({
      type: "FRIEND_ONLINE",
      profileId,
      timestamp: now,
      data: updated,
    });
  } else if (wasOnline && !isOnline) {
    presenceStore.broadcast({
      type: "FRIEND_OFFLINE",
      profileId,
      timestamp: now,
      data: updated,
    });
  }

  return updated;
}

/**
 * Envoie un signal de présence (heartbeat).
 */
export async function heartbeat(profileId: string): Promise<void> {
  const p = presenceStore.getPresence(profileId);
  if (p) {
    p.lastSeenAt = new Date().toISOString();
    presenceStore.setPresence(p);
  }
}

/**
 * Récupère la présence d'une liste d'utilisateurs avec vérification de délai d'expiration (timeout 60 s).
 */
export async function getPresences(profileIds: string[], timeoutMs = 60_000): Promise<Record<string, UserPresence>> {
  const res: Record<string, UserPresence> = {};
  const now = Date.now();

  for (const pid of profileIds) {
    const p = presenceStore.getPresence(pid);
    if (!p) {
      res[pid] = {
        profileId: pid,
        nickname: "Joueur",
        status: "OFFLINE",
        lastSeenAt: new Date(0).toISOString(),
      };
    } else {
      const lastSeen = new Date(p.lastSeenAt).getTime();
      const isExpired = now - lastSeen > timeoutMs;
      res[pid] = {
        ...p,
        status: isExpired ? "OFFLINE" : p.status,
      };
    }
  }

  return res;
}
