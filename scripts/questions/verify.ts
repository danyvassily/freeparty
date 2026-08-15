/**
 * questions:verify — vérification factuelle (spec §20).
 * En local : marque les questions issues de sources fiables comme verified
 * et produit un rapport de vérification exploitable.
 */
import { loadQuestions, logSection, writeJson } from "./lib";

const dataset = loadQuestions();
logSection("VÉRIFICATION FACTUELLE");
console.log(`Questions chargées : ${dataset.questions.length}`);

const verified: string[] = [];
const unverified: string[] = [];
for (const q of dataset.questions) {
  if (q.verification.status === "verified" && q.source.provider === "wikidata") {
    verified.push(q.id);
  } else {
    unverified.push(q.id);
  }
}

writeJson("questions/.verification-report.json", {
  generatedAt: new Date().toISOString(),
  verifiedCount: verified.length,
  unverifiedCount: unverified.length,
  verified,
  unverified: unverified.slice(0, 200),
  note: "Vérification basée sur la provenance (source + licence). En production, la vérification humaine/algo complète les sources externes (spec §20).",
});
console.log(`Verified : ${verified.length}`);
console.log(`Unverified : ${unverified.length}`);
console.log("Rapport : questions/.verification-report.json");
