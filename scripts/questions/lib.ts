/**
 * Free Party — Question pipeline CLI (spec §31)
 * Usage : npm run questions:<cmd> [-- --flag]
 */
import fs from "node:fs";
import path from "node:path";
import { loadQuestions, QUESTIONS_ROOT } from "../../src/lib/questions/load";
import { parseQuestionBatch } from "../../src/lib/questions/schema";

export { loadQuestions, QUESTIONS_ROOT };

export function logSection(title: string): void {
  console.log(`\n━━━ ${title} ━━━`);
}

export function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function parseJsonFile(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/** Valide un fichier JSON de questions ; exit non-zéro si invalide */
export function validateFile(filePath: string): { ok: boolean; count: number; errors: string[] } {
  try {
    const raw = parseJsonFile(filePath);
    const parsed = parseQuestionBatch(raw);
    if (!parsed.ok) {
      return {
        ok: false,
        count: parsed.questions.length,
        errors: parsed.errors.map((e) => e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")),
      };
    }
    return { ok: true, count: parsed.questions.length, errors: [] };
  } catch (e) {
    return { ok: false, count: 0, errors: [e instanceof Error ? e.message : String(e)] };
  }
}
