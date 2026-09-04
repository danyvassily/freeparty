/**
 * JOUXTA — Moteur de calcul du Profil Psycho
 * Algorithme pur et déterministe pour déterminer les archétypes et jauges psychologiques.
 */
import {
  PSYCHO_ARCHETYPES,
  PSYCHO_QUESTIONS,
  type PsychoArchetype,
  type PsychoArchetypeId,
} from "./psycho-data";

export interface PsychoAxesScores {
  audace: number; // 0 à 100 %
  empathie: number; // 0 à 100 %
  ordre: number; // 0 à 100 %
  idealisme: number; // 0 à 100 %
}

export interface PsychoProfileResult {
  primaryArchetype: PsychoArchetype;
  primaryPercentage: number;
  secondaryArchetype: PsychoArchetype;
  secondaryPercentage: number;
  axes: PsychoAxesScores;
  allArchetypeScores: Record<PsychoArchetypeId, number>;
  completedQuestions: number;
}

export interface PsychoCompatibilityResult {
  affinity: number;
  strongestSharedAxis: keyof PsychoAxesScores;
  biggestDifferenceAxis: keyof PsychoAxesScores;
}

export interface PsychoGroupResult {
  averages: PsychoAxesScores;
  diversity: number;
  dominantAxis: keyof PsychoAxesScores;
}

const PSYCHO_AXES = ["audace", "empathie", "ordre", "idealisme"] as const;

/** Affinité ludique : proximité moyenne des quatre axes, sans valeur clinique. */
export function calculatePsychoCompatibility(a: PsychoProfileResult, b: PsychoProfileResult): PsychoCompatibilityResult {
  const differences = PSYCHO_AXES.map((axis) => ({ axis, value: Math.abs(a.axes[axis] - b.axes[axis]) }));
  const averageDifference = differences.reduce((sum, item) => sum + item.value, 0) / differences.length;
  const sorted = [...differences].sort((x, y) => x.value - y.value);
  return {
    affinity: Math.max(0, Math.min(100, Math.round(100 - averageDifference))),
    strongestSharedAxis: sorted[0].axis,
    biggestDifferenceAxis: sorted.at(-1)!.axis,
  };
}

export function calculatePsychoGroup(profiles: PsychoProfileResult[]): PsychoGroupResult {
  if (profiles.length === 0) {
    return { averages: { audace: 50, empathie: 50, ordre: 50, idealisme: 50 }, diversity: 0, dominantAxis: "audace" };
  }
  const averages = Object.fromEntries(
    PSYCHO_AXES.map((axis) => [axis, Math.round(profiles.reduce((sum, profile) => sum + profile.axes[axis], 0) / profiles.length)]),
  ) as unknown as PsychoAxesScores;
  const pairDifferences: number[] = [];
  for (let a = 0; a < profiles.length; a++) {
    for (let b = a + 1; b < profiles.length; b++) {
      pairDifferences.push(PSYCHO_AXES.reduce((sum, axis) => sum + Math.abs(profiles[a].axes[axis] - profiles[b].axes[axis]), 0) / 4);
    }
  }
  const dominantAxis = [...PSYCHO_AXES].sort((a, b) => averages[b] - averages[a])[0];
  return {
    averages,
    diversity: pairDifferences.length ? Math.round(pairDifferences.reduce((sum, value) => sum + value, 0) / pairDifferences.length) : 0,
    dominantAxis,
  };
}

/**
 * Calcule le profil psychologique complet à partir des réponses (indices 0 à 3)
 */
export function calculatePsychoProfile(answers: number[]): PsychoProfileResult {
  const archetypeScores: Record<PsychoArchetypeId, number> = {
    stratege: 0,
    chaos: 0,
    diplomate: 0,
    protecteur: 0,
    cameleon: 0,
    franc_tireur: 0,
    analyste: 0,
    roi_soleil: 0,
  };

  const rawAxes = {
    audace: 0,
    empathie: 0,
    ordre: 0,
    idealisme: 0,
  };

  let count = 0;
  answers.forEach((optionIndex, qIndex) => {
    const question = PSYCHO_QUESTIONS[qIndex];
    if (!question) return;
    const option = question.options[optionIndex];
    if (!option) return;

    count++;

    // Accumule les scores d'archétypes
    for (const [archId, points] of Object.entries(option.archetypes)) {
      if (archId in archetypeScores && typeof points === "number") {
        archetypeScores[archId as PsychoArchetypeId] += points;
      }
    }

    // Accumule les axes (-2 à +2 par question)
    rawAxes.audace += option.axes.audace;
    rawAxes.empathie += option.axes.empathie;
    rawAxes.ordre += option.axes.ordre;
    rawAxes.idealisme += option.axes.idealisme;
  });

  // Trie les archétypes par score décroissant
  const sortedArchetypes = (Object.keys(archetypeScores) as PsychoArchetypeId[]).sort(
    (a, b) => archetypeScores[b] - archetypeScores[a],
  );

  const primaryId = sortedArchetypes[0] ?? "cameleon";
  const secondaryId = sortedArchetypes[1] ?? (primaryId === "cameleon" ? "diplomate" : "cameleon");

  const topTwoPoints = archetypeScores[primaryId] + archetypeScores[secondaryId];

  const primaryRatio = topTwoPoints === 0 ? 50 : Math.round((archetypeScores[primaryId] / topTwoPoints) * 100);
  const secondaryRatio = 100 - primaryRatio;

  // Normalise les axes entre 0% et 100% (valeur neutre = 50%)
  // Plage théorique max : -36 à +36 pour 18 questions (2 * 18)
  const maxSpan = Math.max(1, count * 2);
  const normalizeAxis = (val: number) => {
    const normalized = Math.round(50 + (val / maxSpan) * 50);
    return Math.max(5, Math.min(95, normalized));
  };

  const axes: PsychoAxesScores = {
    audace: normalizeAxis(rawAxes.audace),
    empathie: normalizeAxis(rawAxes.empathie),
    ordre: normalizeAxis(rawAxes.ordre),
    idealisme: normalizeAxis(rawAxes.idealisme),
  };

  return {
    primaryArchetype: PSYCHO_ARCHETYPES[primaryId],
    primaryPercentage: primaryRatio,
    secondaryArchetype: PSYCHO_ARCHETYPES[secondaryId],
    secondaryPercentage: secondaryRatio,
    axes,
    allArchetypeScores: archetypeScores,
    completedQuestions: count,
  };
}

/**
 * Génère le texte de partage pour les réseaux sociaux et messageries (WhatsApp, X, Instagram)
 */
export function generatePsychoShareText(profile: PsychoProfileResult, playerName = "Joueur"): string {
  const p = profile.primaryArchetype;
  const s = profile.secondaryArchetype;

  return [
    `🎭 Profil Psycho (${playerName}) sur JOUXTA`,
    `Jeu de soirée — résultat ludique, sans valeur diagnostique.`,
    `──────────────────────────`,
    `${p.emoji} Archétype Majeur : ${p.name} (${profile.primaryPercentage}%)`,
    `✨ Nuance : ${s.name} (${profile.secondaryPercentage}%)`,
    ``,
    `💬 ${p.quote}`,
    ``,
    `⚡ Super-Pouvoir : ${p.superpower}`,
    `⚠️ Talon d'Achille : ${p.blindSpot}`,
    ``,
    `📊 Tempéraments :`,
    `• Audace : ${profile.axes.audace}%`,
    `• Empathie : ${profile.axes.empathie}%`,
    `• Ordre : ${profile.axes.ordre}%`,
    `• Idéalisme : ${profile.axes.idealisme}%`,
    ``,
    `❤️ Binôme Idéal : ${p.idealPair.name}`,
    `⚡ Némésis Toxique : ${p.nemesisPair.name}`,
    `──────────────────────────`,
    `Découvre ton profil sur JOUXTA ! 🎮`,
  ].join("\n");
}
