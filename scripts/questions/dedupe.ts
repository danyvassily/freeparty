/**
 * questions:dedupe — détecte doublons exacts et quasi-doublons (spec §22).
 */
import { loadQuestions, logSection, writeJson } from "./lib";
import { dedupeQuestions } from "../../src/lib/questions/dedupe";

const dataset = loadQuestions();
logSection("DÉDUPLICATION");
const report = dedupeQuestions(dataset.questions);

console.log(`Questions chargées : ${dataset.questions.length}`);
console.log(`Doublons exacts : ${report.exactDuplicates.length}`);
console.log(`Quasi-doublons (Levenshtein ≤ 15%) : ${report.nearDuplicates.length}`);
console.log(`Questions uniques : ${report.uniqueQuestions.length}`);
console.log(`Retirées au total : ${report.removedCount}`);

for (const d of report.exactDuplicates.slice(0, 10)) {
  console.log(`  exact: ${d.keep} ~ ${d.duplicate}`);
}
for (const n of report.nearDuplicates.slice(0, 10)) {
  console.log(`  near: ${n.a} ~ ${n.b} (dist ${n.distance})`);
}

writeJson("questions/.dedupe-report.json", {
  generatedAt: new Date().toISOString(),
  exactDuplicates: report.exactDuplicates,
  nearDuplicates: report.nearDuplicates,
  removedCount: report.removedCount,
});
console.log("\nRapport écrit : questions/.dedupe-report.json");
