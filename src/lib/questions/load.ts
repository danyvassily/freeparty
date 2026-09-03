/**
 * Free Party — Dataset loader (spec §29)
 * Charge tous les datasets JSON versionnés depuis /questions/<lang>/<categorie>/.
 * Robuste sur Vercel Serverless, Node.js et environnements conteneurisés.
 */
import fs from "node:fs";
import path from "node:path";
import { parseQuestionBatch, type Question } from "./schema";

function resolveQuestionsRoot(): string {
  const cwdPath = path.join(process.cwd(), "questions");
  if (fs.existsSync(cwdPath)) return cwdPath;
  try {
    const parentPath = path.resolve(__dirname, "../../../questions");
    if (fs.existsSync(parentPath)) return parentPath;
  } catch {
    // fallback
  }
  return cwdPath;
}

export const QUESTIONS_ROOT = resolveQuestionsRoot();

export interface LoadedDataset {
  questions: Question[];
  files: string[];
  errors: Array<{ file: string; message: string }>;
}

/** Liste les dossiers de langue présents */
export function listLanguages(): string[] {
  const root = resolveQuestionsRoot();
  if (!fs.existsSync(root)) return [];
  try {
    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
  } catch {
    return [];
  }
}

const datasetCache = new Map<string, LoadedDataset>();

/** Réinitialise le cache mémoire des questions (utile pour tests / scripts) */
export function clearQuestionsCache(): void {
  datasetCache.clear();
}

/** Charge toutes les questions d'une langue (défaut : fr) avec mise en cache mémoire */
export function loadQuestions(language = "fr"): LoadedDataset {
  const cached = datasetCache.get(language);
  if (cached) return cached;

  const root = resolveQuestionsRoot();
  const langDir = path.join(root, language);
  const result: LoadedDataset = { questions: [], files: [], errors: [] };
  if (!fs.existsSync(langDir)) return result;

  try {
    const categories = fs
      .readdirSync(langDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const cat of categories) {
      const catDir = path.join(langDir, cat);
      try {
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
      } catch {
        // dossier catégorie inaccessible
      }
    }
  } catch (e) {
    result.errors.push({
      file: langDir,
      message: e instanceof Error ? e.message : String(e),
    });
  }

  // Met en cache uniquement si aucune erreur critique de chargement global
  if (result.questions.length > 0) {
    datasetCache.set(language, result);
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
