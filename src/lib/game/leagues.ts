/**
 * PRISM / Free Party — Visible Leagues & 2-Month Seasons (spec §21, Decision #5)
 *
 * Système sans ELO caché :
 * - Progression claire et gratifiante basée sur les points de saison.
 * - Saisons de 2 mois avec remise à niveau saisonnière et archivage des records.
 */

export interface LeagueTier {
  id: string;
  name: string;
  nameEn: string;
  minPoints: number;
  maxPoints: number;
  emoji: string;
  badgeColor: string;
  gradient: string;
  textColor: string;
}

export const LEAGUE_TIERS: LeagueTier[] = [
  {
    id: "bronze",
    name: "Bronze",
    nameEn: "Bronze",
    minPoints: 0,
    maxPoints: 999,
    emoji: "🥉",
    badgeColor: "#cd7f32",
    gradient: "from-amber-800 to-amber-950",
    textColor: "text-amber-400",
  },
  {
    id: "argent",
    name: "Argent",
    nameEn: "Silver",
    minPoints: 1000,
    maxPoints: 2499,
    emoji: "🥈",
    badgeColor: "#c0c0c0",
    gradient: "from-slate-400 to-slate-700",
    textColor: "text-slate-200",
  },
  {
    id: "or",
    name: "Or",
    nameEn: "Gold",
    minPoints: 2500,
    maxPoints: 4999,
    emoji: "🥇",
    badgeColor: "#f59e0b",
    gradient: "from-amber-400 to-yellow-600",
    textColor: "text-amber-300",
  },
  {
    id: "platine",
    name: "Platine",
    nameEn: "Platinum",
    minPoints: 5000,
    maxPoints: 7999,
    emoji: "💎",
    badgeColor: "#22d3ee",
    gradient: "from-cyan-400 to-blue-600",
    textColor: "text-cyan-300",
  },
  {
    id: "diamant",
    name: "Diamant",
    nameEn: "Diamond",
    minPoints: 8000,
    maxPoints: 11999,
    emoji: "👑",
    badgeColor: "#d946ef",
    gradient: "from-fuchsia-500 to-purple-800",
    textColor: "text-fuchsia-300",
  },
  {
    id: "elite",
    name: "Élite (Top 1%)",
    nameEn: "Elite (Top 1%)",
    emoji: "🌌",
    minPoints: 12000,
    maxPoints: Infinity,
    badgeColor: "#8b5cf6",
    gradient: "from-violet-500 via-fuchsia-500 to-amber-400",
    textColor: "text-violet-200",
  },
];

export function getLeagueForPoints(points: number): LeagueTier {
  for (let i = LEAGUE_TIERS.length - 1; i >= 0; i--) {
    if (points >= LEAGUE_TIERS[i].minPoints) {
      return LEAGUE_TIERS[i];
    }
  }
  return LEAGUE_TIERS[0];
}

export function getNextLeague(currentTier: LeagueTier): LeagueTier | null {
  const index = LEAGUE_TIERS.findIndex((t) => t.id === currentTier.id);
  if (index >= 0 && index < LEAGUE_TIERS.length - 1) {
    return LEAGUE_TIERS[index + 1];
  }
  return null;
}

export function getLeagueProgress(points: number): {
  currentTier: LeagueTier;
  nextTier: LeagueTier | null;
  progressPercent: number;
  pointsToNext: number;
} {
  const currentTier = getLeagueForPoints(points);
  const nextTier = getNextLeague(currentTier);

  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      progressPercent: 100,
      pointsToNext: 0,
    };
  }

  const range = nextTier.minPoints - currentTier.minPoints;
  const currentInRange = points - currentTier.minPoints;
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentInRange / range) * 100)));
  const pointsToNext = Math.max(0, nextTier.minPoints - points);

  return {
    currentTier,
    nextTier,
    progressPercent,
    pointsToNext,
  };
}

/**
 * Calcul de la saison actuelle (cycles de 2 mois)
 */
export function getCurrentSeason(): {
  seasonNumber: number;
  name: string;
  daysRemaining: number;
  endsAt: string;
} {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-11
  const seasonIndex = Math.floor(month / 2) + 1; // 1 to 6
  const seasonYearOffset = (year - 2026) * 6;
  const seasonNumber = Math.max(1, seasonYearOffset + seasonIndex);

  // Fin de la saison actuelle : dernier jour du mois pair
  const endMonth = Math.floor(month / 2) * 2 + 1; // 1, 3, 5, 7, 9, 11
  const endDate = new Date(Date.UTC(year, endMonth + 1, 0, 23, 59, 59));
  const diffMs = endDate.getTime() - now.getTime();
  const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const seasonNames = [
    "Saison des Pionniers",
    "Saison des Stratèges",
    "Saison des Grands Esprits",
    "Saison des Maîtres",
    "Saison d'Or & Lumières",
    "Saison Élite Universelle",
  ];

  return {
    seasonNumber,
    name: seasonNames[(seasonNumber - 1) % seasonNames.length],
    daysRemaining,
    endsAt: endDate.toISOString(),
  };
}

export function calculateSeasonPointsAwarded(params: {
  placement: 1 | 2 | 3 | 4;
  isVictory: boolean;
  isFinalist: boolean;
  correctAnswersCount: number;
  streak: number;
}): number {
  let pts = 0;
  if (params.isVictory) pts += 150;
  else if (params.isFinalist) pts += 75;
  else if (params.placement === 3) pts += 35;
  else pts += 15;

  pts += Math.min(60, params.correctAnswersCount * 5);

  if (params.streak > 1) {
    pts += Math.min(50, (params.streak - 1) * 15);
  }

  return pts;
}
