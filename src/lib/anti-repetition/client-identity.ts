/**
 * Free Party — Client Identity Helper
 * Stocke et récupère le deviceToken et profileId dans le stockage local persistant du navigateur.
 */

const DEVICE_TOKEN_KEY = "freeparty_device_token";
const PROFILE_ID_KEY = "freeparty_profile_id";

/**
 * Génère ou récupère le device_token unique persistant de cet appareil.
 */
export function getOrCreateClientDeviceToken(): string {
  if (typeof window === "undefined") return "server_device_token";
  try {
    let token = localStorage.getItem(DEVICE_TOKEN_KEY);
    if (!token) {
      token = `dev_${crypto.randomUUID().replace(/-/g, "")}`;
      localStorage.setItem(DEVICE_TOKEN_KEY, token);
    }
    return token;
  } catch {
    return `fallback_dev_${Math.random().toString(36).slice(2, 12)}`;
  }
}

/**
 * Récupère le profileId mis en cache localement s'il existe.
 */
export function getCachedProfileId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(PROFILE_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Enregistre le profileId dans le stockage local.
 */
export function setCachedProfileId(profileId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROFILE_ID_KEY, profileId);
  } catch {
    // Non bloquant
  }
}
