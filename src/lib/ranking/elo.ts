/** Calcul ELO déterministe, partagé par le classement local et Supabase. */
export const DEFAULT_ELO = 1000;
export const ELO_K_FACTOR = 32;

export function expectedScore(rating: number, opponentRating: number): number {
  return 1 / (1 + 10 ** ((opponentRating - rating) / 400));
}

export function calculateElo(rating: number, opponentRating: number, actualScore: number, k = ELO_K_FACTOR): number {
  return Math.round(rating + k * (actualScore - expectedScore(rating, opponentRating)));
}

/** Convertit les scores d'une partie en résultats ELO (les ex-aequo font 0,5). */
export function eloResults(scores: number[], ratings: number[]): number[] {
  if (scores.length !== ratings.length || scores.length < 2) return ratings.map((r) => Math.round(r));
  const averageOpponent = ratings.map((_, i) => ratings.filter((__, j) => j !== i).reduce((a, b) => a + b, 0) / (ratings.length - 1));
  const sorted = [...scores].sort((a, b) => b - a);
  return ratings.map((rating, i) => {
    const rank = sorted.indexOf(scores[i]);
    const same = sorted.filter((score) => score === scores[i]).length;
    const actual = same > 1 ? 0.5 : rank === 0 ? 1 : 0;
    return Math.max(100, calculateElo(rating, averageOpponent[i], actual));
  });
}
