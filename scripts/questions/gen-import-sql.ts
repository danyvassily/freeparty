/**
 * Génère le SQL d'import pour Supabase depuis les datasets JSON validés.
 * Sortie : /tmp/freeparty_import.sql (fichiers séparés par lot pour éviter les timeouts)
 */
import fs from "node:fs";
import path from "node:path";
import { loadQuestions } from "../../src/lib/questions/load";
import { loadDebatePrompts } from "../../src/lib/debate/load";

function esc(s: string | undefined | null): string {
  if (s === undefined || s === null) return "NULL";
  return "'" + String(s).replace(/'/g, "''") + "'";
}
function escArr(a: string[] | undefined): string {
  if (!a || a.length === 0) return "'{}'";
  return "'{" + a.map((x) => x.replace(/"/g, '\\"').replace(/,/g, "\\,")).join(",") + "}'";
}
function escJson(v: unknown): string {
  if (v === undefined) return "'[]'";
  return "'" + JSON.stringify(v).replace(/'/g, "''") + "'";
}

const dataset = loadQuestions("fr");
const debates = loadDebatePrompts("fr");
console.log(`Questions: ${dataset.questions.length} | Débats: ${debates.prompts.length} | Erreurs: ${dataset.errors.length + debates.errors.length}`);

const sql: string[] = [];
sql.push(`-- Free Party import ${new Date().toISOString()}`);
sql.push(`insert into question_categories (id, label_fr) values
  ('culture-generale','Culture générale'),('geographie','Géographie'),('histoire','Histoire'),('cinema','Cinéma'),
  ('series','Séries'),('musique','Musique'),('manga-anime','Manga & Anime'),('gaming','Jeux vidéo'),
  ('science','Science'),('technologie','Technologie'),('internet','Internet'),('mythologie-grecque','Mythologie grecque'),
  ('mythologie-egyptienne','Mythologie égyptienne'),('philosophie','Philosophie'),('sport','Sport'),('football','Football'),
  ('food','Cuisine'),('voyage','Voyage'),('art','Art'),('litterature','Littérature'),('insolite','Insolite'),('politique','Politique')
  on conflict (id) do nothing;`);

sql.push(`insert into question_families (id) values ${[...new Set(dataset.questions.map((q) => q.familyId))]
  .map((f) => `(${esc(f)})`).join(",")} on conflict (id) do nothing;`);

sql.push(`insert into question_concepts (id) values ${[...new Set(dataset.questions.map((q) => q.conceptId))]
  .map((f) => `(${esc(f)})`).join(",")} on conflict (id) do nothing;`);

sql.push(`insert into debate_topics (id, label_fr) values
  ('politics','Politique'),('philosophy','Philosophie'),('history','Histoire'),('ethics','Éthique'),('current-issues','Actualité')
  on conflict (id) do nothing;`);

for (const q of dataset.questions) {
  sql.push(`insert into questions (id, concept_id, family_id, type, question, answers, correct_answer, category, subcategory, difficulty, language, tags, source_provider, source_id, source_url, source_license, verification_status, verified_at, confidence, quality_score, state, version, explanation, as_of)
values (${esc(q.id)}, ${esc(q.conceptId)}, ${esc(q.familyId)}, ${esc(q.type)}, ${esc(q.question)}, ${escJson(q.answers)}, ${q.correctAnswer}, ${esc(q.category)}, ${esc(q.subcategory)}, ${esc(q.difficulty)}, ${esc(q.language)}, ${escArr(q.tags)}, ${esc(q.source.provider)}, ${esc(q.source.sourceId)}, ${esc(q.source.url)}, ${esc(q.source.license)}, ${esc(q.verification.status)}, ${esc(q.verification.verifiedAt)}, ${q.confidence}, ${q.qualityScore}, ${esc(q.verification.status === "verified" ? "verified" : "review")}, ${q.version}, ${esc(q.explanation)}, ${esc(q.asOf)})
on conflict (id) do update set question = excluded.question, answers = excluded.answers, correct_answer = excluded.correct_answer, category = excluded.category, state = excluded.state, confidence = excluded.confidence, quality_score = excluded.quality_score;`);
}

for (const d of debates.prompts) {
  sql.push(`insert into debate_prompts (id, category, topic, prompt, context, perspectives, follow_ups, sources, difficulty, sensitivity, assigned_positions, last_verified_at, valid_until, jurisdiction, language, state, version)
values (${esc(d.id)}, ${esc(d.category)}, ${esc(d.topic)}, ${esc(d.prompt)}, ${esc(d.context)}, ${escJson(d.perspectives)}, ${escJson(d.followUps)}, ${escJson(d.sources)}, ${esc(d.difficulty)}, ${esc(d.sensitivity)}, ${escJson(d.assignedPositions ?? [])}, ${esc(d.lastVerifiedAt)}, ${esc(d.validUntil)}, ${esc(d.jurisdiction)}, ${esc(d.language)}, 'verified', ${d.version})
on conflict (id) do update set context = excluded.context, perspectives = excluded.perspectives, follow_ups = excluded.follow_ups, state = 'verified';`);
}

// Découpage en lots de ~400 INSERT pour éviter les timeouts
const CHUNK = 400;
let chunk = 0;
let buffer: string[] = [];
const flush = () => {
  if (buffer.length === 0) return;
  chunk++;
  fs.writeFileSync(`/tmp/freeparty_import_${String(chunk).padStart(2, "0")}.sql`, buffer.join("\n") + "\n", "utf-8");
  buffer = [];
};
for (const line of sql) {
  buffer.push(line);
  if (buffer.length >= CHUNK) flush();
}
flush();
console.log(`Fichiers SQL générés: ${chunk}`);
