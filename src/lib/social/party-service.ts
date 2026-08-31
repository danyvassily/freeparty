/**
 * Free Party — Party / Social Group Service
 * Gère le groupe permanent d'amis (Party) qui naviguent ensemble entre les salons et modes.
 */
import { randomUUID } from "node:crypto";
import type { Party, PartyMember } from "./types";
import { presenceStore } from "./presence-service";

class InMemoryPartyStore {
  parties = new Map<string, Party>();
  // key: `${partyId}:${profileId}`
  members = new Map<string, PartyMember>();

  clear() {
    this.parties.clear();
    this.members.clear();
  }
}

export const partyStore = new InMemoryPartyStore();

/**
 * Crée une nouvelle Party avec le leader.
 */
export async function createParty(leaderProfileId: string): Promise<Party> {
  const partyId = `party_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const now = new Date().toISOString();

  const party: Party = {
    id: partyId,
    leaderProfileId,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };

  partyStore.parties.set(partyId, party);

  const leaderMember: PartyMember = {
    partyId,
    profileId: leaderProfileId,
    role: "LEADER",
    status: "ACTIVE",
    joinedAt: now,
  };

  partyStore.members.set(`${partyId}:${leaderProfileId}`, leaderMember);
  return party;
}

/**
 * Ajoute un membre à la Party.
 */
export async function joinParty(partyId: string, profileId: string): Promise<PartyMember> {
  const party = partyStore.parties.get(partyId);
  if (!party || party.status !== "ACTIVE") throw new Error("Party not active");

  const key = `${partyId}:${profileId}`;
  const existing = partyStore.members.get(key);
  if (existing && existing.status === "ACTIVE") return existing;

  const now = new Date().toISOString();
  const member: PartyMember = {
    partyId,
    profileId,
    role: "MEMBER",
    status: "ACTIVE",
    joinedAt: now,
  };

  partyStore.members.set(key, member);

  presenceStore.broadcast({
    type: "PARTY_MEMBER_JOINED",
    profileId,
    timestamp: now,
    data: { partyId, member },
  });

  return member;
}

/**
 * Quitte la Party. Si le leader quitte et qu'il reste des membres, désigne le nouveau leader.
 */
export async function leaveParty(partyId: string, profileId: string): Promise<void> {
  const key = `${partyId}:${profileId}`;
  const member = partyStore.members.get(key);
  if (!member) return;

  member.status = "LEFT";
  member.leftAt = new Date().toISOString();
  partyStore.members.set(key, member);

  const party = partyStore.parties.get(partyId);
  if (!party) return;

  const activeMembers = Array.from(partyStore.members.values()).filter(
    (m) => m.partyId === partyId && m.status === "ACTIVE",
  );

  if (activeMembers.length === 0) {
    party.status = "DISBANDED";
    party.updatedAt = new Date().toISOString();
    partyStore.parties.set(partyId, party);
    return;
  }

  if (party.leaderProfileId === profileId) {
    const nextLeader = activeMembers[0];
    nextLeader.role = "LEADER";
    party.leaderProfileId = nextLeader.profileId;
    party.updatedAt = new Date().toISOString();
    partyStore.parties.set(partyId, party);
    partyStore.members.set(`${partyId}:${nextLeader.profileId}`, nextLeader);
  }

  presenceStore.broadcast({
    type: "PARTY_MEMBER_LEFT",
    profileId,
    timestamp: new Date().toISOString(),
    data: { partyId },
  });
}

/**
 * Récupère tous les membres actifs de la Party.
 */
export async function getActivePartyMembers(partyId: string): Promise<PartyMember[]> {
  return Array.from(partyStore.members.values()).filter(
    (m) => m.partyId === partyId && m.status === "ACTIVE",
  );
}
