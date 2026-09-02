/**
 * questions:audit:structural — Agent Auditeur (passe structurelle déterministe, sans réseau).
 * Catch les anomalies d'exactitude des RÉPONSES qui échappent au schéma Zod :
 *   - distribution des positions de correctAnswer (décalage systématique = bug de shuffle)
 *   - fuite de la bonne réponse dans le texte / réponse contenue dans une autre
 *   - distracteur identique au concept / ambiguïté interne
 *   - répétitions de jeux de réponses avec correctAnswer différent
 *   - questions "homonymie" où plusieurs réponses seraient plausibles
 * Sortie : questions/.audit-structural.json + console.
 */
import { loadQuestions, logSection, writeJson } from "../lib";

const dataset = loadQuestions();
const qs = dataset.questions;
logSection("AUDIT STRUCTUREL — exactitude des réponses (Agent Auditeur)");
console.log(`Questions analysées : ${qs.length}`);

// 1. Distribution des positions de la bonne réponse
const posDist: Record<string, number> = { "0": 0, "1": 0, "2": 0, "3": 0 };
const indexOutside = qs.filter((q) => q.correctAnswer < 0 || q.correctAnswer > 3);
for (const q of qs) posDist[String(q.correctAnswer)] = (posDist[String(q.correctAnswer)] ?? 0) + 1;

console.log("\n--- Distribution correctAnswer (index 0..3) ---");
for (const k of Object.keys(posDist).sort()) {
  const n = posDist[k] ?? 0;
  const pct = ((n / qs.length) * 100).toFixed(1);
  console.log(`  index ${k} : ${n} (${pct}%)`);
}
// Signal de décalage : si un index est très sur-représenté (>= 40%) c'est louche
const expected = qs.length / 4;
const skew = Object.entries(posDist).filter(([, n]) => n > expected * 1.5);
if (skew.length) {
  console.log(`\n⚠️  SKEW détecté — certaine(s) position(s) sur-représentée(s): ${skew.map(([k, n]) => `${k} (${n})`).join(", ")}`);
  console.log("    (générateur qui place toujours la bonne réponse au même endroit = suspect)");
}

// 2. Fuite de la bonne réponse dans la question
const answerLeak: Array<{ id: string; q: string; answer: string }> = [];
for (const q of qs) {
  const slice = (s: string) => s.trim().toLowerCase();
  const good = slice(q.answers[q.correctAnswer] ?? "");
  if (good && good.length > 3 && q.question.toLowerCase().includes(good)) {
    answerLeak.push({ id: q.id, q: q.question, answer: q.answers[q.correctAnswer] });
  }
}
console.log(`\nFuite bonne réponse dans le texte : ${answerLeak.length}`);
answerLeak.slice(0, 20).forEach((x) => console.log(`  ${x.id} :: ${x.q} → « ${x.answer} »`));

// 3. Une réponse est sous-chaîne d'une autre (distracteur parasite)
const subStr: Array<{ id: string; a: string; b: string }> = [];
for (const q of qs) {
  const a = q.answers.map((x) => x.trim().toLowerCase());
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a.length; j++) {
      if (i !== j && a[i].length > 3 && a[j].includes(a[i]) && a[j] !== a[i]) {
        subStr.push({ id: q.id, a: q.answers[i], b: q.answers[j] });
      }
    }
  }
}
console.log(`\nRép. contenue dans une autre (parasite) : ${subStr.length}`);
subStr.slice(0, 15).forEach((x) => console.log(`  ${x.id} :: « ${x.a} » ⊂ « ${x.b} »`));

// 4. Duplicats : même jeu de réponses (ordonné) mais correctAnswer ≠ → incohérence
const sigMap = new Map<string, string[]>();
for (const q of qs) {
  const sig = [...q.answers].map((a) => a.trim().toLowerCase()).sort().join("|");
  const list = sigMap.get(sig) ?? [];
  list.push(`${q.id}@${q.correctAnswer}`);
  sigMap.set(sig, list);
}
const dupGroups = [...sigMap.entries()].filter(([, v]) => v.length > 1);
console.log(`\nJeux de réponses identiques partagés par >1 question : ${dupGroups.length}`);
dupGroups.slice(0, 10).forEach(([sig, v]) => console.log(`  ${v.join(" , ")}  <- [${sig}]`));

// 5. Réponses plausibles : toutes très courtes ou une seule très longue (indice dénonçant la bonne)
const lengthOutliers: Array<{ id: string; answers: string[]; correctIdx: number }> = [];
for (const q of qs) {
  const lens = q.answers.map((a) => a.length);
  const max = Math.max(...lens);
  const min = Math.min(...lens);
  const good = q.answers[q.correctAnswer].length;
  const avg = lens.reduce((s, l) => s + l, 0) / lens.length;
  // La bonne réponse est nettement la plus longue ET très au-dessus de la moyenne
  if (good === max && max > avg * 1.5 && max - min > 8) {
    lengthOutliers.push({ id: q.id, answers: q.answers, correctIdx: q.correctAnswer });
  }
}
console.log(`\nBonne réponse anormalement plus longue (indice dénonciateur) : ${lengthOutliers.length}`);
lengthOutliers.slice(0, 20).forEach((x) => console.log(`  ${x.id} :: ` + x.answers.join(" | ") + `  → idx ${x.correctIdx}`));

// 6. Catégorie vs subcategory incohérentes (nombre d'items par (cat,subcat) réduire les fautes)
const catSub = new Map<string, number>();
for (const q of qs) {
  const k = `${q.category}/${q.subcategory}`;
  catSub.set(k, (catSub.get(k) ?? 0) + 1);
}
const orphans = [...catSub.entries()].filter(([, n]) => n === 1);
console.log(`\nSous-catégories à 1 seule question (peu fiables / à vérifier) : ${orphans.length}`);
orphans.slice(0, 15).forEach(([k]) => console.log(`  ${k}`));

writeJson("questions/.audit-structural.json", {
  generatedAt: new Date().toISOString(),
  total: qs.length,
  correctAnswerDistribution: posDist,
  skew,
  answerLeakCount: answerLeak.length,
  answerLeaks: answerLeak.slice(0, 200),
  substringDistractorCount: subStr.length,
  substringDistractors: subStr.slice(0, 200),
  duplicateAnswerGroups: dupGroups,
  lengthOutlierCount: lengthOutliers.length,
  lengthOutliers: lengthOutliers.slice(0, 200),
  singleItemSubcategories: orphans,
});
console.log("\nRapport: questions/.audit-structural.json");
