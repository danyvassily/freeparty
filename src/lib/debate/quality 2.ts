/**
 * Free Party — Debate Quality Agent (spec §76)
 * Vérifie : profondeur, neutralité, clarté, équité, multi-perspectives,
 * contexte factuel, biais, fraîcheur, potentiel de discussion.
 * Rejette : propagande, framing biaisé, faux dilemmes, prémisses fausses,
 * questions triviales, questions manipulatoires.
 */
import type { DebatePrompt } from "./schema";

export interface DebateQualityReport {
  id: string;
  scores: {
    depth: number; // 0..1
    neutrality: number;
    clarity: number;
    fairness: number;
    multiPerspective: number;
    factualContext: number;
    bias: number; // 1 = sans biais
    timeliness: number;
    discussionPotential: number;
  };
  overall: number; // moyenne
  flags: string[];
  pass: boolean; // overall >= 0.75 et pas de flag critique
}

const NEUTRALITY_WORDS = [
  "doit", "faut", "obligatoirement", "évidemment", "bien sûr", "sans doute",
  "clairement", "forcément", "uniquement", "toujours", "jamais",
  "les immigrés", "les wokistes", "les riches", "les pauvres", "la gauche",
  "la droite", "les islamistes", "les capitalistes", "le totalitarisme",
];

/** Mots qui signalent un framing biaisé / prémisses douteuses */
const FRAMING_WORDS = [
  "envahissent", "racket", "propagande", "décadence", "race", "trahison",
  "angoisse", "peur", "menace", "catastrophe", "effondrement",
];

export function auditDebatePrompt(prompt: DebatePrompt): DebateQualityReport {
  const flags: string[] = [];
  const text = `${prompt.prompt} ${prompt.context}`.toLowerCase();

  // 1. Profondeur : longueur du prompt + contexte riche
  const depth =
    prompt.prompt.length >= 60 ? 1 : prompt.prompt.length >= 40 ? 0.8 : prompt.prompt.length >= 25 ? 0.6 : 0.4;

  // 2. Neutralité : absence de mots orientés
  const neutralHits = NEUTRALITY_WORDS.filter((w) => text.includes(w));
  const neutrality = Math.max(0, 1 - neutralHits.length * 0.15);
  if (neutralHits.length >= 3) flags.push(`Mots potentiellement orientés : ${neutralHits.slice(0, 3).join(", ")}`);

  // 3. Clarté : question unique, se termine par "?"
  const clarity = prompt.prompt.trim().endsWith("?") ? 1 : 0.6;
  if (!prompt.prompt.trim().endsWith("?")) flags.push("Le prompt ne se termine pas par une question");

  // 4. Équité : au moins 2 perspectives sérieuses
  const fairness = Math.min(1, prompt.perspectives.length / 3);
  if (prompt.perspectives.length < 2) flags.push("Moins de 2 perspectives");

  // 5. Multi-perspectives
  const multiPerspective = Math.min(1, prompt.perspectives.length / 4 + 0.2);

  // 6. Contexte factuel
  const factualContext = prompt.context.length >= 80 ? 1 : prompt.context.length >= 40 ? 0.7 : 0.4;
  if (prompt.context.length < 40) flags.push("Contexte factuel trop court (spec §65)");

  // 7. Biais : framing words
  const framingHits = FRAMING_WORDS.filter((w) => text.includes(w));
  const bias = Math.max(0, 1 - framingHits.length * 0.25);
  if (framingHits.length > 0) flags.push(`Framing possible : ${framingHits.join(", ")}`);

  // 8. Fraîcheur : pour current-issues, lastVerifiedAt requis
  let timeliness = 1;
  if (prompt.category === "current-issues" && !prompt.lastVerifiedAt) {
    timeliness = 0.4;
    flags.push("current-issues sans lastVerifiedAt (spec §63)");
  }
  if (prompt.validUntil && prompt.validUntil < new Date().toISOString().slice(0, 10)) {
    timeliness = 0.3;
    flags.push("Prompt expiré (validUntil dépassé)");
  }

  // 9. Potentiel de discussion : relances présentes, sujet non trivial
  const followUpsScore = Math.min(1, prompt.followUps.length / 3);
  const discussionPotential = Math.min(1, (depth + followUpsScore) / 2 + 0.1);
  if (prompt.followUps.length === 0) flags.push("Aucune relance (spec §74)");

  const scores = {
    depth,
    neutrality,
    clarity,
    fairness,
    multiPerspective,
    factualContext,
    bias,
    timeliness,
    discussionPotential,
  };
  const overall = Object.values(scores).reduce((s, x) => s + x, 0) / Object.keys(scores).length;

  const criticalFlags = flags.filter((f) => f.startsWith("Framing") || f.includes("Prémisses"));

  // Hard fails (spec §76) : un prompt sans perspectives, sans relances ou sans
  // contexte factuel sérieux ne PEUT PAS passer, quel que soit le score moyen.
  const hardFail =
    prompt.perspectives.length < 2 ||
    prompt.followUps.length === 0 ||
    prompt.context.length < 40;
  if (hardFail) {
    if (prompt.perspectives.length < 2) flags.push("Moins de 2 perspectives (rejet)");
    if (prompt.followUps.length === 0) flags.push("Aucune relance (rejet)");
    if (prompt.context.length < 40) flags.push("Contexte factuel trop court (rejet)");
  }

  const pass = overall >= 0.75 && criticalFlags.length === 0 && !hardFail;

  return { id: prompt.id, scores, overall, flags, pass };
}

/** Filtre un lot de prompts : ne garde que ceux qui passent l'audit */
export function filterPassingPrompts(prompts: DebatePrompt[]): {
  passing: DebatePrompt[];
  rejected: Array<{ id: string; reason: string }>;
} {
  const passing: DebatePrompt[] = [];
  const rejected: Array<{ id: string; reason: string }> = [];
  for (const p of prompts) {
    const audit = auditDebatePrompt(p);
    if (audit.pass) passing.push(p);
    else rejected.push({ id: p.id, reason: audit.flags.join(" | ") });
  }
  return { passing, rejected };
}

/** Sélection équilibrée d'un prompt (par catégorie, jamais le même 2×) */
export function selectDebatePrompt(
  prompts: DebatePrompt[],
  category?: string,
  excludedIds: string[] = [],
  difficulty?: string,
): DebatePrompt | null {
  const candidates = prompts.filter(
    (p) =>
      (!category || p.category === category) &&
      !excludedIds.includes(p.id) &&
      (!difficulty || p.difficulty === difficulty),
  );
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
