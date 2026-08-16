/**
 * Génère le SQL d'import pour Supabase depuis les datasets JSON validés.
 * Sortie : /tmp/freeparty_import.sql (fichiers séparés par lot pour éviter les timeouts)
 */
import fs from "node:fs";
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
  if (q.artwork) {
    sql.push(`insert into artwork_catalog (id, title, artist, artist_birth, artist_death, year_start, year_end, movement, country, museum, image_url, image_license, source_url)
values (${esc(q.id)}, ${esc(q.artwork.title)}, ${esc(q.artwork.artist)}, ${q.artwork.artistBirth ?? "NULL"}, ${q.artwork.artistDeath ?? "NULL"}, ${q.artwork.yearStart ?? "NULL"}, ${q.artwork.yearEnd ?? "NULL"}, ${esc(q.artwork.movement)}, ${esc(q.artwork.country)}, ${esc(q.artwork.museum)}, ${esc(q.artwork.imageUrl)}, ${esc(q.artwork.imageLicense)}, ${esc(q.artwork.sourceUrl)})
on conflict (id) do update set title = excluded.title, artist = excluded.artist, museum = excluded.museum, image_url = excluded.image_url;`);
  }

  sql.push(`insert into questions (id, concept_id, family_id, type, input_mode, question, answers, correct_answer, accepted_typed_answers, progressive_clues, artwork, category, subcategory, difficulty, language, tags, source_provider, source_id, source_url, source_license, verification_status, verified_at, confidence, quality_score, state, version, explanation, as_of)
values (${esc(q.id)}, ${esc(q.conceptId)}, ${esc(q.familyId)}, ${esc(q.type)}, ${esc(q.inputMode ?? "mcq")}, ${esc(q.question)}, ${escJson(q.answers)}, ${q.correctAnswer}, ${escJson(q.acceptedTypedAnswers ?? [])}, ${escJson(q.progressiveClues ?? [])}, ${escJson(q.artwork ?? null)}, ${esc(q.category)}, ${esc(q.subcategory)}, ${esc(q.difficulty)}, ${esc(q.language)}, ${escArr(q.tags)}, ${esc(q.source.provider)}, ${esc(q.source.sourceId)}, ${esc(q.source.url)}, ${esc(q.source.license)}, ${esc(q.verification.status)}, ${esc(q.verification.verifiedAt)}, ${q.confidence}, ${q.qualityScore}, ${esc(q.verification.status === "verified" ? "verified" : "review")}, ${q.version}, ${esc(q.explanation)}, ${esc(q.asOf)})
on conflict (id) do update set question = excluded.question, answers = excluded.answers, correct_answer = excluded.correct_answer, category = excluded.category, state = excluded.state, confidence = excluded.confidence, quality_score = excluded.quality_score, input_mode = excluded.input_mode, accepted_typed_answers = excluded.accepted_typed_answers, progressive_clues = excluded.progressive_clues, artwork = excluded.artwork;`);
}

for (const d of debates.prompts) {
  sql.push(`insert into debate_prompts (id, category, topic, prompt, context, perspectives, follow_ups, sources, difficulty, sensitivity, assigned_positions, last_verified_at, valid_until, jurisdiction, language, state, version)
values (${esc(d.id)}, ${esc(d.category)}, ${esc(d.topic)}, ${esc(d.prompt)}, ${esc(d.context)}, ${escJson(d.perspectives)}, ${escJson(d.followUps)}, ${escJson(d.sources)}, ${esc(d.difficulty)}, ${esc(d.sensitivity)}, ${escJson(d.assignedPositions ?? [])}, ${esc(d.lastVerifiedAt)}, ${esc(d.validUntil)}, ${esc(d.jurisdiction)}, ${esc(d.language)}, 'verified', ${d.version})
on conflict (id) do update set context = excluded.context, perspectives = excluded.perspectives, follow_ups = excluded.follow_ups, state = 'verified';`);
}

// Saisons 2026
sql.push(`insert into seasons (season_number, name, starts_at, ends_at, active) values
  (1, 'Saison des Pionniers', '2026-01-01 00:00:00+00', '2026-02-28 23:59:59+00', false),
  (2, 'Saison des Stratèges', '2026-03-01 00:00:00+00', '2026-04-30 23:59:59+00', false),
  (3, 'Saison des Grands Esprits', '2026-05-01 00:00:00+00', '2026-06-30 23:59:59+00', false),
  (4, 'Saison des Maîtres', '2026-07-01 00:00:00+00', '2026-08-31 23:59:59+00', true),
  (5, 'Saison d''Or & Lumières', '2026-09-01 00:00:00+00', '2026-10-31 23:59:59+00', false),
  (6, 'Saison Élite Universelle', '2026-11-01 00:00:00+00', '2026-12-31 23:59:59+00', false)
on conflict (season_number) do update set name = excluded.name, active = excluded.active;`);

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
