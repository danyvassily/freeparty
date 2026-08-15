/**
 * questions:validate — valide tous les datasets JSON contre le schéma Zod strict.
 * Une question invalide = fichier signalé + exit code 1 (spec §30).
 */
import { loadQuestions, logSection, validateFile } from "./lib";

const dataset = loadQuestions();
let totalFiles = 0;
let totalQuestions = 0;
let invalidFiles = 0;

logSection("VALIDATION DES DATASETS (schéma Zod strict)");
for (const f of dataset.files) {
  totalFiles++;
  const res = validateFile(f);
  totalQuestions += res.count;
  if (!res.ok) {
    invalidFiles++;
    console.log(`❌ ${f}`);
    for (const e of res.errors) console.log(`   → ${e}`);
  }
}
if (dataset.errors.length) {
  invalidFiles += dataset.errors.length;
  for (const e of dataset.errors) console.log(`❌ ${e.file} → ${e.message}`);
}

console.log(`\nFichiers : ${totalFiles} | Questions valides : ${totalQuestions} | Fichiers invalides : ${invalidFiles}`);
if (invalidFiles > 0) {
  console.log("ÉCHEC : des questions invalides sont présentes. Correction obligatoire.");
  process.exit(1);
}
console.log("✓ Toutes les questions sont conformes au schéma.");
