/**
 * Free Party — Dataset loader (spec §29)
 * Charge tous les datasets JSON versionnés depuis /questions/<lang>/<categorie>/.
 */
import fs from "node:fs";
import path from "node:path";
import { parseQuestionBatch, type Question } from "./schema";

export const QUESTIONS_ROOT = path.join(process.cwd(), "questions");

export interface LoadedDataset {
  questions: Question[];
  files: string[];
  errors: Array<{ file: string; message: string }>;
}

/** Liste les dossiers de langue présents */
export function listLanguages(): string[] {
  if (!fs.existsSync(QUESTIONS_ROOT)) return [];
  return fs
    .readdirSync(QUESTIONS_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

/** Charge toutes les questions d'une langue (défaut : fr) */
export function loadQuestions(language = "fr"): LoadedDataset {
  const langDir = path.join(QUESTIONS_ROOT, language);
  const result: LoadedDataset = { questions: [], files: [], errors: [] };
  if (!fs.existsSync(langDir)) return result;

  const categories = fs
    .readdirSync(langDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const cat of categories) {
    const catDir = path.join(langDir, cat);
    const files = fs
      .readdirSync(catDir)
      .filter((f) => f.endsWith(".json"))
      .sort();
    for (const file of files) {
      const filePath = path.join(catDir, file);
      try {
        const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const parsed = parseQuestionBatch(raw);
        if (!parsed.ok) {
          result.errors.push({
            file: filePath,
            message: `${parsed.errors.length} question(s) invalide(s)`,
          });
        }
        result.questions.push(...parsed.questions);
        result.files.push(filePath);
      } catch (e) {
        result.errors.push({
          file: filePath,
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }
  return result;
}

/** Charge les questions par catégorie (clé = slug catégorie) */
export function loadQuestionsByCategory(language = "fr"): Record<string, Question[]> {
  const all = loadQuestions(language);
  const byCat: Record<string, Question[]> = {};
  for (const q of all.questions) {
    (byCat[q.category] ??= []).push(q);
  }
  return byCat;
}
