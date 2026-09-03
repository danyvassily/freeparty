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

  const topTwoPoints = archetypeScores[primaryId] + archetypeScores[secondaryId] || 1;

  const primaryRatio = Math.round((archetypeScores[primaryId] / topTwoPoints) * 100);
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
    primaryPercentage: Math.max(52, primaryRatio),
    secondaryArchetype: PSYCHO_ARCHETYPES[secondaryId],
    secondaryPercentage: Math.min(48, secondaryRatio),
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
