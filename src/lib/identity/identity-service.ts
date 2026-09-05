"use client";

import type { Player } from "@/lib/store/game";
import { getSupabaseBrowser } from "@/lib/supabase/client";

const DATABASE_NAME = "jouxta-identity";
const STORE_NAME = "identity";
const DEVICE_KEY = "device-token";
const FALLBACK_KEY = "jouxta-device-token";
const LEGACY_DEVICE_KEY = "freeparty_device_token";
const PROFILE_ID_KEY = "freeparty_profile_id";
let cachedDeviceToken: Promise<string> | null = null;

function createToken(): string {
  return crypto.randomUUID();
}

function readIndexedDb(): Promise<string | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onerror = () => resolve(null);
    request.onsuccess = () => {
      const transaction = request.result.transaction(STORE_NAME, "readonly");
      const get = transaction.objectStore(STORE_NAME).get(DEVICE_KEY);
      get.onerror = () => resolve(null);
      get.onsuccess = () => resolve(typeof get.result === "string" ? get.result : null);
    };
  });
}

function writeIndexedDb(token: string): Promise<void> {
  if (typeof indexedDB === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onerror = () => resolve();
    request.onsuccess = () => {
      const transaction = request.result.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(token, DEVICE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    };
  });
}

/** Identifiant aléatoire persistant. L'adresse IP n'intervient jamais. */
export function getOrCreateDeviceToken(): Promise<string> {
  if (cachedDeviceToken) return cachedDeviceToken;
  cachedDeviceToken = (async () => {
    const indexed = await readIndexedDb();
    if (indexed) return indexed;
    const legacy = localStorage.getItem(FALLBACK_KEY) || localStorage.getItem(LEGACY_DEVICE_KEY);
    const token = legacy || createToken();
    localStorage.setItem(FALLBACK_KEY, token);
    localStorage.removeItem(LEGACY_DEVICE_KEY);
    await writeIndexedDb(token);
    return token;
  })();
  return cachedDeviceToken;
}

export function getCachedProfileId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(PROFILE_ID_KEY);
  } catch {
    return null;
  }
}

export function setCachedProfileId(profileId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROFILE_ID_KEY, profileId);
  } catch {
    // Le profil distant reste l'autorité si le stockage local est indisponible.
  }
}

/** Le premier joueur représente l'utilisateur de l'appareil; les autres
 * joueurs tour-par-tour conservent une identité logique distincte. */
export async function getParticipantTokens(players: Player[]): Promise<string[]> {
  const deviceToken = await getOrCreateDeviceToken();
  if (players.length === 0) return [deviceToken];
  return players.map((player, index) =>
    index === 0 ? deviceToken : player.profileToken || `${deviceToken}:${player.id}`,
  );
}

export interface ResolvedProfile {
  device_token: string;
  profile_id: string;
  elo_rating?: number;
}

/** Crée les profils anonymes et fusionne automatiquement le profil du premier
 * appareil avec le compte courant après inscription ou connexion. */
export async function resolvePlayerProfiles(tokens: string[]): Promise<ResolvedProfile[]> {
  const sb = getSupabaseBrowser();
  if (!sb || tokens.length === 0) return [];
  const { data: current } = await sb.auth.getSession();
  if (!current.session) {
    const { error } = await sb.auth.signInAnonymously();
    if (error) return [];
  }
  const { data, error } = await sb.rpc("resolve_player_profiles", { p_device_tokens: tokens });
  if (error) {
    console.warn("[identity] résolution distante indisponible:", error.message);
    return [];
  }
  const profiles = (data ?? []) as ResolvedProfile[];
  if (profiles[0]?.profile_id) setCachedProfileId(profiles[0].profile_id);
  return profiles;
}

export async function getAccessToken(): Promise<string | null> {
  const sb = getSupabaseBrowser();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}
