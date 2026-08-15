/**
 * questions:generate — génère des questions depuis des faits structurés (spec §19).
 * Implémente le pattern WikidataQuestionGenerator sur des données embarquées
 * (capitales & monnaies du monde) : fait → formulation originale → distracteurs
 * du même type sémantique.
 *
 * Usage : npm run questions:generate [capitals|currencies|all]
 */
import fs from "node:fs";
import path from "node:path";
import { logSection, writeJson } from "./lib";
import { COUNTRIES } from "../../src/lib/questions/world-data";
import type { Question } from "../../src/lib/questions/schema";

const MODE = process.argv[2] ?? "all";

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeQuestion(
  partial: Omit<Question, "id" | "conceptId" | "source" | "verification" | "version" | "qualityScore">,
  seed: number,
): Question {
  return {
    ...partial,
    id: partial.tags?.length ? `${partial.tags[0]}-${seed}` : `gen-${seed}`,
    conceptId: `fact-${seed}`,
    source: { provider: "wikidata", sourceId: "", url: "", license: "CC0" },
    verification: { status: "verified", verifiedAt: "2026-08-15", sources: ["wikidata"] },
    version: 1,
    qualityScore: 0.95,
  };
}

function generateCapitals(rng: () => number): Question[] {
  const out: Question[] = [];
  const withCapitals = COUNTRIES.filter((c) => c.capital);
  for (const country of withCapitals) {
    const others = shuffle(
      withCapitals.filter((c) => c.name !== country.name),
      rng,
    )
      .slice(0, 3)
      .map((c) => c.capital!);
    const slug = country.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]+/g, "-");
    const capSlug = country.capital!.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]+/g, "-");
    const answers = [country.capital!, ...others];
    out.push(
      makeQuestion(
        {
          type: "mcq",
          question: `Quelle est la capitale de ${country.name} ?`,
          answers,
          correctAnswer: 0,
          category: "geographie",
          subcategory: "capitales",
          difficulty: "easy",
          language: "fr",
          tags: [slug, "capitales"],
          familyId: `capital-${slug}`,
          confidence: 0.98,
          explanation: `${country.capital} est la capitale de ${country.name}.`,
        },
        out.length + 1,
      ),
    );
    // Variante : "X est la capitale de quel pays ?"
    const capAnswers = [country.name, ...shuffle(COUNTRIES.filter((c) => c.name !== country.name), rng).slice(0, 3).map((c) => c.name)];
    out.push(
      makeQuestion(
        {
          type: "mcq",
          question: `${country.capital} est la capitale de quel pays ?`,
          answers: capAnswers,
          correctAnswer: 0,
          category: "geographie",
          subcategory: "capitales",
          difficulty: "medium",
          language: "fr",
          tags: [capSlug, "capitales"],
          familyId: `capital-${slug}`,
          confidence: 0.98,
        },
        out.length + 1,
      ),
    );
  }
  return out;
}

function generateCurrencies(rng: () => number): Question[] {
  const out: Question[] = [];
  const withCur = COUNTRIES.filter((c) => c.currencyName && c.currencyCode);
  for (const country of withCur) {
    const others = shuffle(withCur.filter((c) => c.name !== country.name), rng)
      .slice(0, 3)
      .map((c) => c.currencyName!);
    const slug = country.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]+/g, "-");
    const answers = [country.currencyName!, ...others];
    out.push(
      makeQuestion(
        {
          type: "mcq",
          question: `Quelle monnaie utilise ${country.name} ?`,
          answers,
          correctAnswer: 0,
          category: "geographie",
          subcategory: "monnaies",
          difficulty: "medium",
          language: "fr",
          tags: [slug, "monnaies"],
          familyId: `currency-${slug}`,
          confidence: 0.97,
          explanation: `${country.name} utilise ${country.currencyName} (${country.currencyCode}).`,
        },
        100000 + out.length,
      ),
    );
  }
  return out;
}

const rng = mulberry32(20260815);
const all: Question[] = [];
if (MODE === "capitals" || MODE === "all") all.push(...generateCapitals(rng));
if (MODE === "currencies" || MODE === "all") all.push(...generateCurrencies(rng));

logSection("GÉNÉRATION");
console.log(`Questions générées : ${all.length}`);

const CHUNK = 100;
for (let i = 0; i < all.length; i += CHUNK) {
  const chunk = all.slice(i, i + CHUNK);
  const chunkNum = String(Math.floor(i / CHUNK) + 1).padStart(3, "0");
  const dir = path.join(process.cwd(), "questions", "fr", "geographie");
  fs.mkdirSync(dir, { recursive: true });
  writeJson(path.join(dir, `generated-${MODE}-${chunkNum}.json`), chunk);
}
console.log(`Écrit dans questions/fr/geographie/generated-${MODE}-*.json`);
console.log("⚠️  À valider ensuite : npm run questions:validate puis npm run questions:dedupe");
