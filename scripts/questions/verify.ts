/**
 * questions:verify — contrôle de cohérence des verdicts enregistrés.
 * Une provenance déclarée ne constitue pas une vérification factuelle.
 */
import { loadQuestions, logSection, writeJson } from "./lib";
import verdicts from "../../questions/.audit-verdicts.json";

const dataset = loadQuestions();
logSection("COHÉRENCE DES CORRECTIONS ENREGISTRÉES");
console.log(`Questions chargées : ${dataset.questions.length}`);

const byId = new Map(dataset.questions.map((q) => [q.id, q]));
const failures = verdicts.filter((v) => !Number.isInteger(v.correct_idx) || v.correct_idx < 0 || v.correct_idx > 3 || byId.get(v.id)?.correctAnswer !== v.correct_idx);
const verdictIds = new Set(verdicts.map((v) => v.id));
const uncovered = dataset.questions.filter((q) => !verdictIds.has(q.id));

writeJson("questions/.verification-report.json", {
  generatedAt: new Date().toISOString(),
  checkedVerdicts: verdicts.length,
  inconsistentVerdicts: failures,
  withoutRecordedVerdict: uncovered.length,
  loadErrors: dataset.errors,
  note: "Contrôle d'index par rapport aux verdicts du dépôt, sans nouvelle vérification des sources. Les questions sans verdict ne sont pas déclarées fausses ou vérifiées par ce contrôle.",
});
console.log(`Verdicts contrôlés : ${verdicts.length} | incohérences : ${failures.length}`);
console.log(`Questions sans verdict enregistré : ${uncovered.length}`);
console.log("Rapport : questions/.verification-report.json");
if (failures.length || dataset.errors.length || byId.size !== dataset.questions.length || verdictIds.size !== verdicts.length) process.exitCode = 1;
