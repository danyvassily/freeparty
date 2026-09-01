import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const url = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const key = process.env.SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

function candidate(index, family = `test.knowledge.${index}`, language = "fr") {
  return {
    id: `smoke-${language}-${index}-${randomUUID().slice(0, 8)}`,
    conceptId: family,
    familyId: family,
    knowledgeKey: family,
    type: "mcq",
    inputMode: "mcq",
    question: `Quelle connaissance de test correspond au numéro ${index} ?`,
    answers: [`Réponse ${index}`, "B", "C", "D"],
    correctAnswer: 0,
    category: "culture-generale",
    subcategory: `topic-${index % 3}`,
    difficulty: "medium",
    language,
    tags: ["smoke"],
    source: { provider: "manual", license: "CC0" },
    verification: { status: "verified", sources: [] },
    confidence: 0.95,
    qualityScore: 0.95,
  };
}

function unwrap(rows) {
  return (rows ?? []).map((row) => row.question ?? row);
}

async function anonymousClient() {
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.auth.signInAnonymously();
  if (error) throw error;
  return client;
}

async function reserve(client, token, sessionId, candidates, count, localHistory = []) {
  const { data, error } = await client.rpc("reserve_unseen_questions", {
    p_session_id: sessionId,
    p_device_tokens: Array.isArray(token) ? token : [token],
    p_online_session_id: null,
    p_candidates: candidates,
    p_count: count,
    p_local_history: localHistory,
    p_ttl_seconds: 900,
  });
  if (error) throw error;
  return unwrap(data);
}

const client = await anonymousClient();
const token = `device-${randomUUID()}`;
const pool = Array.from({ length: 6 }, (_, index) => candidate(index));

const legacyToken = `device-${randomUUID()}`;
const legacyFamily = `test.legacy.${randomUUID()}`;
const legacyQuestion = candidate(99, legacyFamily);
const migratedLegacy = await reserve(client, legacyToken, randomUUID(), [legacyQuestion], 1, [{
  profileId: legacyToken,
  entries: [{ questionId: legacyQuestion.id, familyId: legacyFamily, servedAt: Date.now(), answeredCorrectly: null }],
}]);
if (migratedLegacy.length !== 0) throw new Error("L'historique local historique n'a pas été repris avant sélection");

const [batchA, batchB] = await Promise.all([
  reserve(client, token, randomUUID(), pool, 2),
  reserve(client, token, randomUUID(), pool, 2),
]);
const overlap = batchA.filter((question) => batchB.some((other) => other.familyId === question.familyId));
if (batchA.length !== 2 || batchB.length !== 2 || overlap.length !== 0) {
  throw new Error(`Réservation concurrente invalide: A=${batchA.length}, B=${batchB.length}, overlap=${overlap.length}`);
}

const displayedSession = randomUUID();
const displayed = batchA[0];
const { error: seenError } = await client.rpc("mark_question_seen", {
  p_session_id: displayedSession,
  p_device_tokens: [token],
  p_online_session_id: null,
  p_question_id: displayed.id,
  p_family_id: displayed.familyId,
});
if (seenError) throw seenError;

const playerA = `device-${randomUUID()}`;
const playerB = `device-${randomUUID()}`;
const sharedFamily = `test.shared.${randomUUID()}`;
const sharedQuestion = candidate(20, sharedFamily, "fr");
const freshQuestion = candidate(21, `test.fresh.${randomUUID()}`, "fr");
await reserve(client, playerA, randomUUID(), [sharedQuestion, freshQuestion], 1);
const { error: sharedSeenError } = await client.rpc("mark_question_seen", {
  p_session_id: randomUUID(),
  p_device_tokens: [playerA],
  p_online_session_id: null,
  p_question_id: sharedQuestion.id,
  p_family_id: sharedFamily,
});
if (sharedSeenError) throw sharedSeenError;
const multiplayer = await reserve(client, [playerA, playerB], randomUUID(), [sharedQuestion, freshQuestion], 2);
if (multiplayer.some((question) => question.familyId === sharedFamily)) {
  throw new Error("L'union multijoueur a resservi une famille vue");
}

const multilingualToken = `device-${randomUUID()}`;
const multilingualFamily = `test.language.${randomUUID()}`;
const french = candidate(30, multilingualFamily, "fr");
const english = candidate(31, multilingualFamily, "en");
const firstLanguage = await reserve(client, multilingualToken, randomUUID(), [french], 1);
const { error: multilingualSeenError } = await client.rpc("mark_question_seen", {
  p_session_id: randomUUID(),
  p_device_tokens: [multilingualToken],
  p_online_session_id: null,
  p_question_id: firstLanguage[0].id,
  p_family_id: multilingualFamily,
});
if (multilingualSeenError) throw multilingualSeenError;
const secondLanguage = await reserve(client, multilingualToken, randomUUID(), [english], 1);
if (secondLanguage.length !== 0) throw new Error("La traduction a contourné QuestionFamily");

// Fusion réelle appareil anonyme + compte existant (A ∪ B), puis partage
// du même historique depuis un second jeton d'appareil.
const anonymousMergeToken = `device-${randomUUID()}`;
const anonymousFamily = `test.merge.anonymous.${randomUUID()}`;
const anonymousQuestion = candidate(40, anonymousFamily);
await reserve(client, anonymousMergeToken, randomUUID(), [anonymousQuestion], 1);
const { error: anonymousHistoryError } = await client.rpc("mark_question_seen", {
  p_session_id: randomUUID(),
  p_device_tokens: [anonymousMergeToken],
  p_online_session_id: null,
  p_question_id: anonymousQuestion.id,
  p_family_id: anonymousFamily,
});
if (anonymousHistoryError) throw anonymousHistoryError;

const accountClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const email = `merge-${randomUUID()}@example.test`;
const { error: signupError } = await accountClient.auth.signUp({ email, password: `Pass-${randomUUID()}!` });
if (signupError) throw signupError;
const accountToken = `device-${randomUUID()}`;
const accountFamily = `test.merge.account.${randomUUID()}`;
const accountQuestion = candidate(41, accountFamily);
await reserve(accountClient, accountToken, randomUUID(), [accountQuestion], 1);
const { error: accountHistoryError } = await accountClient.rpc("mark_question_seen", {
  p_session_id: randomUUID(),
  p_device_tokens: [accountToken],
  p_online_session_id: null,
  p_question_id: accountQuestion.id,
  p_family_id: accountFamily,
});
if (accountHistoryError) throw accountHistoryError;
const { error: mergeError } = await accountClient.rpc("resolve_player_profiles", {
  p_device_tokens: [anonymousMergeToken],
});
if (mergeError) throw mergeError;
const afterMerge = await reserve(
  accountClient,
  anonymousMergeToken,
  randomUUID(),
  [anonymousQuestion, accountQuestion, candidate(42, `test.merge.fresh.${randomUUID()}`)],
  3,
);
if (afterMerge.length !== 1) throw new Error(`Fusion de profils incomplète: ${afterMerge.length} question(s) retournée(s)`);

console.log("Profils/fusion, union multijoueur, langues et réservations concurrentes : OK");
