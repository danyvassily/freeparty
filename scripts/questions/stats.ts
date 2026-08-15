/**
 * questions:stats — statistiques du dataset (spec §31, §41).
 */
import { loadQuestions, logSection } from "./lib";
import { computeStats } from "../../src/lib/questions/stats";

const dataset = loadQuestions();
const stats = computeStats(dataset.questions);

logSection("STATISTIQUES DU DATASET");
console.log(`Total questions : ${stats.total}`);
console.log(`\nPar catégorie :`);
for (const [k, v] of Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(22)} ${String(v).padStart(5)}`);
}
console.log(`\nPar difficulté :`);
for (const [k, v] of Object.entries(stats.byDifficulty)) console.log(`  ${k.padEnd(10)} ${v}`);
console.log(`\nPar langue :`, JSON.stringify(stats.byLanguage));
console.log(`Par type :`, JSON.stringify(stats.byType));
console.log(`\nPar source :`, JSON.stringify(stats.bySource));
console.log(`\nConfidence : min ${stats.confidence.min} max ${stats.confidence.max} avg ${stats.confidence.avg.toFixed(3)}`);
console.log(`QualityScore : min ${stats.qualityScore.min} max ${stats.qualityScore.max} avg ${stats.qualityScore.avg.toFixed(3)}`);
console.log(`\nErreurs de chargement : ${dataset.errors.length}`);
