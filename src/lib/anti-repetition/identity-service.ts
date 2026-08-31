/**
 * Free Party — Identity Service
 * Gère les profils joueurs (anonymes et connectés), l'identification des appareils
 * (deviceToken unique) et la fusion transparente des historiques lors de la connexion/inscription.
 */
import { randomUUID } from "node:crypto";
import type { PlayerProfile, PlayerDevice } from "./types";

// In-Memory store pour tests & mode local-first sans backend
class InMemoryIdentityStore {
  profiles = new Map<string, PlayerProfile>();
  devices = new Map<string, PlayerDevice>(); // key: deviceToken

  getProfile(id: string): PlayerProfile | undefined {
    return this.profiles.get(id);
  }

  getProfileByUserId(userId: string): PlayerProfile | undefined {
    for (const p of this.profiles.values()) {
      if (p.userId === userId) return p;
    }
    return undefined;
  }

  getDevice(token: string): PlayerDevice | undefined {
    return this.devices.get(token);
  }

  saveProfile(p: PlayerProfile) {
    this.profiles.set(p.id, { ...p });
  }

  saveDevice(d: PlayerDevice) {
    this.devices.set(d.deviceToken, { ...d });
  }

  clear() {
    this.profiles.clear();
    this.devices.clear();
  }
}

export const inMemoryIdentity = new InMemoryIdentityStore();

/**
 * Récupère ou crée un profil associé à un deviceToken (utilisateur anonyme ou connu).
 */
export async function getOrCreateDeviceProfile(
  deviceToken: string,
  nickname?: string,
  avatarColor?: number,
): Promise<{ profile: PlayerProfile; device: PlayerDevice }> {
  const token = deviceToken.trim() || randomUUID();
  const now = new Date().toISOString();

  // 1. Vérification in-memory d'abord
  const existingDevice = inMemoryIdentity.getDevice(token);
  if (existingDevice) {
    const profile = inMemoryIdentity.getProfile(existingDevice.profileId);
    if (profile) {
      existingDevice.lastSeenAt = now;
      if (nickname && !profile.nickname) profile.nickname = nickname;
      if (avatarColor !== undefined && profile.avatarColor === undefined) profile.avatarColor = avatarColor;
      profile.updatedAt = now;
      inMemoryIdentity.saveProfile(profile);
      inMemoryIdentity.saveDevice(existingDevice);
      return { profile, device: existingDevice };
    }
  }

  // 2. Création nouveau profil anonyme
  const profileId = `prof_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const deviceId = `dev_${randomUUID().replace(/-/g, "").slice(0, 16)}`;

  const newProfile: PlayerProfile = {
    id: profileId,
    userId: null,
    createdAt: now,
    updatedAt: now,
    isAnonymous: true,
    nickname: nickname?.trim() || "Joueur",
    avatarColor: avatarColor ?? 0,
  };

  const newDevice: PlayerDevice = {
    id: deviceId,
    profileId,
    deviceToken: token,
    createdAt: now,
    lastSeenAt: now,
  };

  inMemoryIdentity.saveProfile(newProfile);
  inMemoryIdentity.saveDevice(newDevice);

  return { profile: newProfile, device: newDevice };
}

/**
 * Associe un compte utilisateur (userId Supabase/Auth) à un profil.
 * Si le device possédait un profil anonyme avec de l'historique, déclenche la fusion.
 */
export async function linkUserToProfile(
  userId: string,
  currentAnonymousProfileId?: string,
  nickname?: string,
): Promise<PlayerProfile> {
  const now = new Date().toISOString();

  // Cherche si un profil existe déjà pour cet userId
  let accountProfile = inMemoryIdentity.getProfileByUserId(userId);

  if (!accountProfile) {
    // Si l'utilisateur avait un profil anonyme en cours, on le promeut en profil de compte
    if (currentAnonymousProfileId) {
      const anonProfile = inMemoryIdentity.getProfile(currentAnonymousProfileId);
      if (anonProfile && anonProfile.isAnonymous) {
        anonProfile.userId = userId;
        anonProfile.isAnonymous = false;
        anonProfile.updatedAt = now;
        if (nickname) anonProfile.nickname = nickname;
        inMemoryIdentity.saveProfile(anonProfile);
        return anonProfile;
      }
    }

    // Sinon crée un nouveau profil de compte
    accountProfile = {
      id: `prof_user_${userId.replace(/-/g, "").slice(0, 16)}`,
      userId,
      createdAt: now,
      updatedAt: now,
      isAnonymous: false,
      nickname: nickname || "Joueur",
    };
    inMemoryIdentity.saveProfile(accountProfile);
  }

  // Si on a un profil anonyme différent du profil de compte, on fusionne
  if (currentAnonymousProfileId && currentAnonymousProfileId !== accountProfile.id) {
    await mergeProfiles(currentAnonymousProfileId, accountProfile.id);
  }

  return accountProfile;
}

/**
 * Fusionne l'historique d'un profil anonyme dans un profil de compte.
 * Règles :
 * - Transfère tous les QuestionSeen (sans doublons sur UNIQUE(profile_id, family_id))
 * - Rallie tous les appareils du profil anonyme au profil du compte
 * - Ne supprime jamais silencieusement l'historique
 */
export async function mergeProfiles(
  anonymousProfileId: string,
  accountProfileId: string,
): Promise<{ mergedSeenCount: number }> {
  const { questionHistoryStore } = await import("./history-service");

  // 1. Récupération et transfert de l'historique des questions vues
  const anonExposures = questionHistoryStore.getExposuresByProfile(anonymousProfileId);
  let mergedSeenCount = 0;

  for (const exp of anonExposures) {
    const existing = questionHistoryStore.getExposure(accountProfileId, exp.familyId);
    if (!existing) {
      questionHistoryStore.addExposure({
        profileId: accountProfileId,
        familyId: exp.familyId,
        questionId: exp.questionId,
        sessionId: exp.sessionId,
        firstSeenAt: exp.firstSeenAt,
        answeredAt: exp.answeredAt,
        correct: exp.correct,
      });
      mergedSeenCount++;
    }
  }

  // 2. Rapatriement des devices vers le nouveau profil
  for (const device of inMemoryIdentity.devices.values()) {
    if (device.profileId === anonymousProfileId) {
      device.profileId = accountProfileId;
      inMemoryIdentity.saveDevice(device);
    }
  }

  // 3. Archivage du profil anonyme
  const anonProfile = inMemoryIdentity.getProfile(anonymousProfileId);
  if (anonProfile) {
    anonProfile.isAnonymous = false;
    anonProfile.updatedAt = new Date().toISOString();
    inMemoryIdentity.saveProfile(anonProfile);
  }

  return { mergedSeenCount };
}
