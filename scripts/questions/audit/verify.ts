/**
 * questions:audit:verify — Agent Maître (vérification + correction d'exactitude des réponses).
 *
 * Le schéma Zod ne valide QUE la structure — jamais la justesse sémantique de la
 * bonne réponse. Cet agent maître vérifie chaque question contre une source
 * de ground truth (web / agent), identifie les questions dont `correctAnswer`
 * pointe vers la MAUVAISE réponse, et les CORRIGE automatiquement dans les JSON.
 *
 * GROUND_TRUTH : id → texte de la BONNE réponse (présent dans `answers`).
 * Si le texte est trouvé et sa position ≠ correctAnswer, la question est corrigée
 * (correctAnswer réindexé + version incrémentée).
 *
 * Sorties :
 *   questions/.audit-verifier.json   (risque + corrections)
 *   questions/audit-kill-list.csv    (liste des anomalies, à reconfirmer pour le reste)
 */
import { loadQuestions, logSection, writeJson } from "../lib";
import fs from "node:fs";
import path from "node:path";
import { QUESTIONS_ROOT } from "../lib";

const dataset = loadQuestions();
const qs = dataset.questions;
logSection("AGENT MAÎTRE — Vérification & correction d'exactitude des réponses");

// ---------------------------------------------------------------------------
// GROUND TRUTH (vérifié web/agent) : id → texte EXACT de la bonne réponse.
// DONNÉES MONTRÉES RESPONSABLES : pour chacune, marked est FAUX, le texte ci-
// dessous est la bonne réponse qui existe dans le tableau `answers`.
// ---------------------------------------------------------------------------
const GROUND_TRUTH: Record<string, { correct: string; evidence: string }> = {
  "film-casablanca-rick": { correct: "Humphrey Bogart", evidence: "Wikipedia: Rick Blaine joué par Humphrey Bogart" },
  "film-beetlejuice-burton": { correct: "Tim Burton", evidence: "Wikipedia: Tim Burton réal. Beetlejuice/Étrange Noël" },
  "cg-ins-pacifique": { correct: "Le Pacifique", evidence: "Wikipedia: plus grand océan = Pacifique" },
  "foot-wc-1930-winner": { correct: "L'Uruguay", evidence: "Wikipedia: Uruguay vainqueur Coupe du monde 1930" },
  "foot-messi-club": { correct: "Le FC Barcelone", evidence: "Wikipedia: Messi premiers Ballons d'Or au Barça" },
  "game-ea-fc": { correct: "EA Sports FC", evidence: "Wikipedia: EA Sports FC remplace FIFA" },
  "war-ww2-midway": { correct: "Midway", evidence: "Wikipedia: bataille de Midway (guerre du Pacifique)" },
  "odd-barcode-gum": { correct: "Un paquet de chewing-gum", evidence: "code-barres 1er scanné = paquet de chewing-gum" },
  "web-whatsapp": { correct: "WhatsApp", evidence: "Wikipedia: messagerie dominant = WhatsApp" },
  "web-meme-dawkins": { correct: "Richard Dawkins", evidence: "Wikipedia: Dawkins, gène égoïste / mémo" },
  "book-wilde": { correct: "Oscar Wilde", evidence: "Wikipedia: Le Portrait de Dorian Gray = Oscar Wilde" },
  "book-shelley": { correct: "Mary Shelley", evidence: "Wikipedia: Frankenstein = Mary Shelley" },
  "anime-evangelion-shinji": { correct: "Shinji", evidence: "Wikipedia: Shinji Ikari pilote Evangelion-01" },
  "music-dion-my-heart": { correct: "Céline Dion", evidence: "Wikipedia: My Heart Will Go On = Céline Dion" },
  "sci-dna-shape": { correct: "Une double hélice", evidence: "Wikipedia: ADN en double hélice" },
  "sport-nadal-roland": { correct: "Rafael Nadal", evidence: "Wikipedia: Nadal record Roland-Garros" },
  "tech-grace-hopper": { correct: "Grace Hopper", evidence: "Wikipedia: Grace Hopper, coobstacle COBOL" },
  // Confiance expert élevée (re-vérifiable) :
  "food-sushi-japan": { correct: "Le Japon", evidence: "Wikipedia: sushi originaire du Japon" },
  "food-couscous": { correct: "Le Maghreb", evidence: "Wikipedia: couscous du Maghreb (Afrique du Nord)" },
  "cg-rec-everest-m": { correct: "8 849 mètres", evidence: "Wikipedia: Everest ~8 849 m" },
  "music-guitar-strings": { correct: "6", evidence: "Wikipedia: guitare 6 cordes" },
  "tv-family-guy-creator": { correct: "Seth MacFarlane", evidence: "Wikipedia: Seth MacFarlane crée Family Guy" },
  "tech-spacex-mars": { correct: "Coloniser Mars", evidence: "Wikipedia: mission SpaceX = coloniser Mars" },
  // Pack séries (re-vérifiées lecture + web) :
  "tv-breaking-bad-actor": { correct: "Bryan Cranston", evidence: "Wikipedia: Bryan Cranston joue Walter White" },
  "tv-got-valar": { correct: "Valar morghulis", evidence: "Wikipedia: Valar morghulis, phrase-clé de GoT" },
  "tv-friends-city": { correct: "New York", evidence: "Wikipedia: Friends se déroule à New York" },
  "tv-simpsons-homer": { correct: "Homer", evidence: "Wikipedia: Homer Simpson, père de la famille" },
  "tv-simpsons-creator": { correct: "Matt Groening", evidence: "Wikipedia: Matt Groening crée Les Simpson" },
  "tv-stranger-things-town": { correct: "Hawkins", evidence: "Wikipedia: Hawkins, ville de Stranger Things" },
};

function normIdx(ans: string[], target: string): number {
  const t = target.trim().toLowerCase();
  return ans.findIndex((a) => a.trim().toLowerCase() === t || a.trim().toLowerCase().includes(t));
}

const byId = new Map(qs.map((q) => [q.id, q]));
let corrected = 0;
const corrections: Array<{ id: string; from: number; to: number; text: string }> = [];
let notFound: string[] = [];

for (const [id, gt] of Object.entries(GROUND_TRUTH)) {
  const q = byId.get(id);
  if (!q) { notFound.push(id); continue; }
  const toIdx = normIdx(q.answers, gt.correct);
  if (toIdx === -1) { notFound.push(`${id} (texte absent)`); continue; }
  if (toIdx !== q.correctAnswer) {
    corrections.push({ id, from: q.correctAnswer, to: toIdx, text: q.answers[toIdx] });
    q.correctAnswer = toIdx;
    q.version = (q.version ?? 1) + 1;
    q.verification.status = "disputed"; // re-confirmation requise
    q.verification.sources = [gt.evidence];
    corrected++;
  }
}
console.log(`Ground truth seedés : ${Object.keys(GROUND_TRUTH).length}`);
console.log(`Corrections appliquées : ${corrected}`);
for (const c of corrections) console.log(`  ✓ ${c.id}  correctAnswer ${c.from} → ${c.to}  (« ${c.text} »)`);
if (notFound.length) console.log(`Non trouvés : ${notFound.join(", ")}`);

// Si des corrections ont été faites, on écrit les fichiers JSON corrigés.
if (corrected > 0) {
  // Recharger les fichiers d'origine et réécrire uniquement les questions modifiées.
  const files = dataset.files as string[];
  let writtenFiles = 0;
  for (const file of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(file, "utf-8")) as Array<Record<string, unknown>>;
      let changed = false;
      for (const item of raw) {
        const c = corrections.find((x) => x.id === (item as any).id);
        if (c) {
          (item as any).correctAnswer = c.to;
          (item as any).version = ((item as any).version ?? 1) + 1;
          (item as any).verification = {
            status: "disputed",
            verifiedAt: new Date().toISOString().slice(0, 10),
            sources: [GROUND_TRUTH[(item as any).id]?.evidence ?? "agent-verified"],
          };
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(file, JSON.stringify(raw, null, 2), "utf-8");
        writtenFiles++;
      }
    } catch (e) {
      console.error(`  ! ${file}: ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log(`Fichiers JSON réécrits : ${writtenFiles}`);
} else {
  console.log("Aucune correction nécessaire sur les seeds actuels.");
}

// ---- Risque positionnel (déterministe) pour le reste de la banque ----
type Risk = { id: string; category: string; markedIdx: number; marked: string; risks: string[]; riskScore: number };
const risky: Risk[] = [];
for (const q of qs) {
  if (GROUND_TRUTH[q.id]) continue; // déjà traité
  const risks: string[] = [];
  const lens = q.answers.map((a) => a.length);
  const avg = lens.reduce((s, l) => s + l, 0) / lens.length;
  const markedLen = lens[q.correctAnswer];
  const max = Math.max(...lens); const min = Math.min(...lens);
  if (markedLen === max && max > avg * 1.45 && max - min > 8) risks.push("reponse-trop-longue");
  if (markedLen === min && min < avg * 0.55) risks.push("reponse-trop-courte");
  if (q.correctAnswer === 1 || q.correctAnswer === 3) risks.push("position-1ou3");
  if (risks.length) risky.push({ id: q.id, category: q.category, markedIdx: q.correctAnswer, marked: q.answers[q.correctAnswer], risks, riskScore: Math.min(1, risks.length * 0.25) });
}
risky.sort((a, b) => b.riskScore - a.riskScore);
console.log(`\nSuspicion positionnelle (reste de la banque, hors seeds) : ${risky.length}`);
console.log(`À haut risque (>=0.5) : ${risky.filter((r) => r.riskScore >= 0.5).length}`);

writeJson("questions/.audit-verifier.json", {
  generatedAt: new Date().toISOString(),
  total: qs.length,
  seeds: Object.keys(GROUND_TRUTH).length,
  corrected,
  corrections,
  notFound,
  riskyCount: risky.length,
  highRiskCount: risky.filter((r) => r.riskScore >= 0.5).length,
  highRisk: risky.filter((r) => r.riskScore >= 0.5).slice(0, 400),
});

const csvLines: string[] = ["id;categorie;marked_idx;marked;detection;action"];
for (const r of risky) {
  if (r.riskScore >= 0.25) csvLines.push(`${r.id};${r.category};${r.markedIdx};${(r.marked || "").replace(/;/g, ",")};${r.risks.join(" ")};A_RECONFIRMER`);
}
for (const c of corrections) csvLines.push(`${c.id};;${c.from};→${c.to}(${c.text});ground_truth;CORRIGE`);
fs.writeFileSync(path.join(QUESTIONS_ROOT, "audit-kill-list.csv"), csvLines.join("\n"), "utf-8");
console.log("\nRapports : questions/.audit-verifier.json + questions/audit-kill-list.csv");
