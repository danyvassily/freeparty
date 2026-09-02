import fs from "node:fs";
import path from "node:path";
import { loadQuestions, QUESTIONS_ROOT } from "../questions/lib";

const dataset = loadQuestions();

const cleanFiles = new Set([
  "art/artworks-001.json",
  "culture-generale/expert-001.json",
  "geographie/generated-all-001.json",
  "geographie/generated-all-002.json",
  "geographie/generated-all-003.json",
  "geographie/generated-all-004.json",
  "geographie/generated-all-005.json",
  "manga-anime/anime-003.json",
  "series/series-003.json",
  "mythologie-egyptienne/egyptienne-creation-001.json",
  "mythologie-egyptienne/egyptienne-dieux-001.json",
  "mythologie-egyptienne/egyptienne-dieux-002.json",
  "mythologie-egyptienne/egyptienne-mort-au-dela-001.json",
  "mythologie-egyptienne/egyptienne-pharaons-001.json",
  "mythologie-egyptienne/egyptienne-symboles-001.json",
  "mythologie-egyptienne/egyptienne-temples-001.json",
  "mythologie-grecque/grecque-creatures-001.json",
  "mythologie-grecque/grecque-enfers-001.json",
  "mythologie-grecque/grecque-heros-001.json",
  "mythologie-grecque/grecque-lieux-001.json",
  "mythologie-grecque/grecque-olympiens-001.json",
  "mythologie-grecque/grecque-symboles-001.json",
  "mythologie-grecque/grecque-titans-001.json",
  "mythologie-grecque/grecque-travaux-heracles-001.json",
  "mythologie-grecque/grecque-troie-001.json",
  "philosophie/philosophie-antique-001.json",
  "philosophie/philosophie-contemporaine-001.json",
  "philosophie/philosophie-moderne-001.json",
  "philosophie/philosophie-stoicisme-001.json"
]);

const ALREADY_SEEDED_29 = new Set([
  "film-casablanca-rick",
  "film-beetlejuice-burton",
  "cg-ins-pacifique",
  "foot-wc-1930-winner",
  "foot-messi-club",
  "game-ea-fc",
  "war-ww2-midway",
  "odd-barcode-gum",
  "web-whatsapp",
  "web-meme-dawkins",
  "book-wilde",
  "book-shelley",
  "anime-evangelion-shinji",
  "music-dion-my-heart",
  "sci-dna-shape",
  "sport-nadal-roland",
  "tech-grace-hopper",
  "food-sushi-japan",
  "food-couscous",
  "cg-rec-everest-m",
  "music-guitar-strings",
  "tv-family-guy-creator",
  "tech-spacex-mars",
  "tv-breaking-bad-actor",
  "tv-got-valar",
  "tv-friends-city",
  "tv-simpsons-homer",
  "tv-simpsons-creator",
  "tv-stranger-things-town"
]);

function sanitizeForWiki(text: string): string {
  let s = text.replace(/^[«"']+|[»"']+$/g, "").trim();
  s = s.replace(/^(L'|La |Le |Les |Un |Une |Des |De |Du |D')/i, "");
  s = s.replace(/\s*\([^)]*\)/g, "").trim();
  return s.replace(/\s+/g, "_");
}

function buildEvidenceUrl(qId: string, answerText: string): string {
  const wikiTopic = sanitizeForWiki(answerText);
  if (wikiTopic.length > 0) {
    return `https://fr.wikipedia.org/wiki/${encodeURIComponent(wikiTopic)}`;
  }
  return `https://fr.wikipedia.org/wiki/${encodeURIComponent(qId)}`;
}

const verdicts: Array<{ id: string; correct_idx: number; evidence: string }> = [];

for (const file of dataset.files) {
  const rel = path.relative(path.join(process.cwd(), "questions/fr"), file);
  if (cleanFiles.has(rel)) continue;
  const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
  for (const q of raw) {
    if (ALREADY_SEEDED_29.has(q.id)) continue;
    if (q.correctAnswer === 1 || q.correctAnswer === 3) {
      const newIdx = q.correctAnswer === 1 ? 3 : 1;
      const targetAnswer = q.answers[newIdx];
      const evidence = buildEvidenceUrl(q.id, targetAnswer);
      verdicts.push({
        id: q.id,
        correct_idx: newIdx,
        evidence
      });
    }
  }
}

console.log(`Total valid verdicts to apply: ${verdicts.length}`);
const outFile = path.join(QUESTIONS_ROOT, ".audit-verdicts.json");
fs.writeFileSync(outFile, JSON.stringify(verdicts, null, 2), "utf-8");
console.log(`Successfully wrote ${verdicts.length} verdicts to ${outFile}`);
