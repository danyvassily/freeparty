import type { Player } from "@/lib/store/game";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { getParticipantTokens, resolvePlayerProfiles } from "@/lib/identity/identity-service";
import { eloResults, DEFAULT_ELO } from "./elo";

/** Enregistre une partie ELO pour les profils de comptes connectés. */
export async function recordEloResults(sessionId: string, players: Player[], scores: Record<string, number>): Promise<void> {
  const sb = getSupabaseBrowser();
  if (!sb || players.length < 2) return;
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user || auth.user.is_anonymous) return;
  const tokens = await getParticipantTokens(players);
  const profiles = await resolvePlayerProfiles(tokens);
  const rows = profiles.map((profile, index) => ({
    id: profile.profile_id,
    score: scores[players[index]?.id] ?? 0,
    rating: profile.elo_rating ?? DEFAULT_ELO,
  })).filter((row): row is { id: string; score: number; rating: number } => Boolean(row.id));
  if (rows.length < 2) return;
  const ratingsAfter = eloResults(rows.map((r) => r.score), rows.map((r) => r.rating));
  await Promise.all(rows.map((row, index) => {
    const opponentAverage = rows.filter((_, i) => i !== index).reduce((sum, other) => sum + other.rating, 0) / (rows.length - 1);
    return sb.rpc("record_elo_result", {
      p_session_id: sessionId,
      p_profile_id: row.id,
      p_score: row.score >= Math.max(...rows.map((r) => r.score)) ? 1 : 0,
      p_opponent_average: opponentAverage,
    }).then(({ error }) => { if (error) console.warn("[elo] impossible d'enregistrer le classement", error.message); });
  }));
  void ratingsAfter;
}
