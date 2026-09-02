/**
 * questions:audit:apply — applique des verdicts de ground-truth à la banque.
 * Lit questions/.audit-verdicts.json : tableau { id, correct_idx, evidence }.
 * Pour chaque entrée, réindexe correctAnswer vers correct_idx, incrémente version,
 * passe verification.status="disputed" et ajoute la source de preuve.
 * Idempotent + ne touche que les IDs présents.
 */
import fs from "node:fs";
import path from "node:path";
import { loadQuestions, logSection } from "../lib";
import { QUESTIONS_ROOT } from "../lib";

const VERDICTS = path.join(QUESTIONS_ROOT, ".audit-verdicts.json");
if (!fs.existsSync(VERDICTS)) {
  console.log("Aucun fichier questions/.audit-verdicts.json. Rien à appliquer.");
  process.exit(0);
}

const verdicts = JSON.parse(fs.readFileSync(VERDICTS, "utf-8")) as Array<{
  id: string;
  correct_idx: number;
  evidence?: string;
}>;
logSection("APPLIQUER LES VERDICTS DE GROUND-TRUTH");
console.log(`Verdicts à appliquer : ${verdicts.length}`);

const byVerdict = new Map(verdicts.map((v) => [v.id, v]));
const files = loadQuestions().files as string[];
let applied = 0;
let skipped = 0;
let filesChanged = 0;

for (const file of files) {
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf-8")) as Array<Record<string, unknown>>;
    let changed = false;
    for (const item of raw) {
      const v = byVerdict.get((item as any).id as string);
      if (!v) continue;
      const ans = (item as any).answers as string[];
      if (v.correct_idx < 0 || v.correct_idx > 3 || !ans || ans[v.correct_idx] == null) {
        console.log(`  ! skip ${(item as any).id} : correct_idx ${v.correct_idx} hors bornes`);
        skipped++;
        continue;
      }
      if ((item as any).correctAnswer !== v.correct_idx) {
        (item as any).correctAnswer = v.correct_idx;
        (item as any).version = ((item as any).version ?? 1) + 1;
        (item as any).verification = {
          status: "disputed",
          verifiedAt: new Date().toISOString().slice(0, 10),
          sources: v.evidence ? [v.evidence] : ["agent-verified"],
        };
        applied++;
        changed = true;
        console.log(`  ✓ ${(item as any).id} → correctAnswer ${v.correct_idx} (« ${ans[v.correct_idx]} »)`);
      } else {
        skipped++;
      }
    }
    if (changed) {
      fs.writeFileSync(file, JSON.stringify(raw, null, 2), "utf-8");
      filesChanged++;
    }
  } catch (e) {
    console.error(`  ! ${file}: ${e instanceof Error ? e.message : e}`);
  }
}

console.log(`\nAppliquées : ${applied} | déjà bonnes/skippées : ${skipped} | fichiers réécrits : ${filesChanged}`);
