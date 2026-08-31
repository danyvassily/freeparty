/**
 * Free Party — Question Reservation Service
 * Évite les collisions de sélection simultanées entre plusieurs sessions
 * avant que les questions n'aient été effectivement affichées et enregistrées dans QuestionSeen.
 */
import { randomUUID } from "node:crypto";
import type { QuestionReservation } from "./types";

class InMemoryReservationStore {
  private reservations = new Map<string, QuestionReservation>(); // key: id

  addReservation(res: QuestionReservation) {
    this.reservations.set(res.id, res);
  }

  getReservedFamilies(profileIds?: string[], now = Date.now()): Set<string> {
    this.cleanExpired(now);
    const set = new Set<string>();
    const profileSet = profileIds ? new Set(profileIds) : null;

    for (const r of this.reservations.values()) {
      if (r.expiresAt > now) {
        if (!profileSet || profileSet.has(r.profileId)) {
          set.add(r.familyId);
        }
      }
    }
    return set;
  }

  releaseSession(sessionId: string) {
    for (const [id, r] of this.reservations.entries()) {
      if (r.sessionId === sessionId) {
        this.reservations.delete(id);
      }
    }
  }

  cleanExpired(now = Date.now()) {
    for (const [id, r] of this.reservations.entries()) {
      if (r.expiresAt <= now) {
        this.reservations.delete(id);
      }
    }
  }

  clear() {
    this.reservations.clear();
  }
}

export const reservationStore = new InMemoryReservationStore();

/**
 * Réserve temporairement une liste de questions/familles pour une session de jeu.
 * Durée par défaut : 5 minutes (300 000 ms).
 */
export async function reserveQuestions(params: {
  sessionId: string;
  playerProfileIds: string[];
  questions: Array<{ id: string; familyId: string }>;
  ttlMs?: number;
}): Promise<void> {
  const { sessionId, playerProfileIds, questions, ttlMs = 300_000 } = params;
  const expiresAt = Date.now() + ttlMs;

  for (const q of questions) {
    for (const profileId of playerProfileIds) {
      const id = `res_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
      reservationStore.addReservation({
        id,
        sessionId,
        profileId,
        familyId: q.familyId,
        questionId: q.id,
        expiresAt,
      });
    }
  }
}

/**
 * Récupère l'ensemble des familyIds actuellement réservées pour les profils donnés.
 */
export async function getReservedFamilyIds(playerProfileIds?: string[]): Promise<Set<string>> {
  return reservationStore.getReservedFamilies(playerProfileIds);
}

/**
 * Libère les réservations d'une session (ex: abandon, fin ou après affichage).
 */
export async function releaseReservations(sessionId: string): Promise<void> {
  reservationStore.releaseSession(sessionId);
}
