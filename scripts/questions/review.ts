/**
 * questions:review — revue qualité (spec §21, §33–34).
 * Calcule le quality_score composite et classe : production / review / quarantine.
 */
import { loadQuestions, logSection, writeJson } from "./lib";
import { computeQualityScore } from "../../src/lib/questions/stats";

const dataset = loadQuestions();
logSection("REVUE QUALITÉ (Question Quality Agent)");

const THRESHOLD_PRODUCTION = 0.9;
const THRESHOLD_REVIEW = 0.75;

let production = 0;
let review = 0;
let quarantine = 0;
const quarantineList: Array<{ id: string; score: number }> = [];

for (const q of dataset.questions) {
  const score = computeQualityScore(q);
  if (score >= THRESHOLD_PRODUCTION) production++;
  else if (score >= THRESHOLD_REVIEW) {
    review++;
    if (score < 0.8) quarantineList.push({ id: q.id, score });
  } else {
    quarantine++;
    quarantineList.push({ id: q.id, score });
  }
}

console.log(`Questions évaluées : ${dataset.questions.length}`);
console.log(`≥ 0.90 (candidate production) : ${production}`);
console.log(`0.75–0.89 (review) : ${review}`);
console.log(`< 0.75 (quarantine) : ${quarantine}`);

writeJson("questions/.quality-report.json", {
  generatedAt: new Date().toISOString(),
  thresholds: { production: THRESHOLD_PRODUCTION, review: THRESHOLD_REVIEW },
  counts: { production, review, quarantine },
  quarantineList: quarantineList.slice(0, 100),
});
console.log("Rapport : questions/.quality-report.json");
