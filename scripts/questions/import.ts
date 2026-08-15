/**
 * questions:import — importe les datasets JSON vers Supabase (spec §31).
 * Local-first : sans SUPABASE_URL/KEY configurés, affiche un aperçu et sort en succès.
 */
import { loadQuestions, logSection } from "./lib";
import { createClient } from "@supabase/supabase-js";

const dataset = loadQuestions();
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

logSection("IMPORT VERS SUPABASE");
console.log(`Questions prêtes : ${dataset.questions.length}`);

if (!url || !key) {
  console.log("ℹ️  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY non configurés — mode local. Rien n'est envoyé.");
  console.log("   (La partie joue 100% en local : c'est le comportement voulu par design.)");
  process.exit(0);
}

const client = createClient(url, key, { auth: { persistSession: false } });
const batchSize = 500;
let inserted = 0;
for (let i = 0; i < dataset.questions.length; i += batchSize) {
  const batch = dataset.questions.slice(i, i + batchSize).map((q) => ({
    id: q.id,
    concept_id: q.conceptId,
    family_id: q.familyId,
    type: q.type,
    question: q.question,
    answers: q.answers,
    correct_answer: q.correctAnswer,
    category: q.category,
    subcategory: q.subcategory,
    difficulty: q.difficulty,
    language: q.language,
    tags: q.tags,
    source_provider: q.source.provider,
    source_id: q.source.sourceId,
    source_url: q.source.url,
    source_license: q.source.license,
    verification_status: q.verification.status,
    verified_at: q.verification.verifiedAt,
    confidence: q.confidence,
    quality_score: q.qualityScore,
    version: q.version,
    explanation: q.explanation,
    as_of: q.asOf,
    state: q.verification.status === "verified" ? "verified" : "review",
  }));
  const { error } = await client.from("questions").upsert(batch, { onConflict: "id" });
  if (error) {
    console.error("❌ Erreur d'import :", error.message);
    process.exit(1);
  }
  inserted += batch.length;
  console.log(`  importés : ${inserted}/${dataset.questions.length}`);
}
console.log(`✓ Import terminé : ${inserted} questions.`);
