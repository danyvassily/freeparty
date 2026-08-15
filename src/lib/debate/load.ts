/**
 * Free Party — Debate prompts loader (spec §56)
 * Charge les prompts depuis /debates/<lang>/*.json, validés par Zod.
 */
import fs from "node:fs";
import path from "node:path";
import { DebatePromptSchema, type DebatePrompt } from "./schema";

export const DEBATES_ROOT = path.join(process.cwd(), "debates");

export interface LoadedDebates {
  prompts: DebatePrompt[];
  errors: Array<{ file: string; message: string }>;
}

export function loadDebatePrompts(language = "fr"): LoadedDebates {
  const langDir = path.join(DEBATES_ROOT, language);
  const result: LoadedDebates = { prompts: [], errors: [] };
  if (!fs.existsSync(langDir)) return result;

  const files = fs
    .readdirSync(langDir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  for (const file of files) {
    const filePath = path.join(langDir, file);
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const items = Array.isArray(raw) ? raw : raw.prompts;
      if (!Array.isArray(items)) {
        result.errors.push({ file: filePath, message: "Format attendu : tableau de prompts" });
        continue;
      }
      for (const item of items) {
        const parsed = DebatePromptSchema.safeParse(item);
        if (parsed.success) result.prompts.push(parsed.data);
        else {
          result.errors.push({
            file: filePath,
            message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
          });
        }
      }
    } catch (e) {
      result.errors.push({ file: filePath, message: e instanceof Error ? e.message : String(e) });
    }
  }
  return result;
}

export function loadDebatesByCategory(language = "fr"): Record<string, DebatePrompt[]> {
  const { prompts } = loadDebatePrompts(language);
  const byCat: Record<string, DebatePrompt[]> = {};
  for (const p of prompts) (byCat[p.category] ??= []).push(p);
  return byCat;
}
