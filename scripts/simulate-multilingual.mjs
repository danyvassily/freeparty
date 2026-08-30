/**
 * Simulation end-to-end MULTILINGUE — Free Party.
 *
 * Scénario :
 *   1. Création de deux comptes : Dany (français) et Emma (anglais),
 *      langue sauvegardée dans le profil Supabase (comme auth-form.tsx)
 *   2. Les questions bilingues sont générées via le vrai endpoint
 *      /api/questions du serveur de dev (DeepSeek, FR + traduction EN)
 *   3. Dany crée un salon, Emma le rejoint par code
 *   4. Dany pousse la question avec ses traductions (comme hostPushQuestion)
 *   5. Vérification : Emma reçoit en temps réel la question et la voit en
 *      ANGLAIS pendant que Dany la voit en FRANÇAIS (même index de réponse)
 *   6. Les deux répondent, correction, scores, fin de partie
 *
 * Prérequis : serveur de dev lancé sur :7100 (npm run dev -- --port 7100)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const DEV = "http://localhost:7100";

let failures = 0;
const ok = (name) => console.log(`  ✅ ${name}`);
const ko = (name, err) => { failures++; console.error(`  ❌ ${name} : ${err?.message ?? err}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const genCode = () => Array.from({ length: 6 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");

// Replique exacte de src/lib/questions/localize.ts
function localize(q, lang) {
  const base = lang.toLowerCase().split("-")[0];
  if (base !== "fr") {
    const t = q.translations?.[base];
    if (t && t.question.trim().length >= 5 && t.answers && t.answers.length === q.answers.length) {
      return { question: t.question, answers: t.answers, correctAnswer: q.correctAnswer, lang: base };
    }
  }
  return { question: q.question, answers: q.answers, correctAnswer: q.correctAnswer, lang: "fr" };
}

// ─── 1. Création des comptes avec langue ───
console.log("\n1. Création des comptes (Dany 🇫🇷 / Emma 🇬🇧)");
const dany = createClient(URL, KEY, { auth: { storageKey: `ml-dany-${Date.now()}` } });
const emma = createClient(URL, KEY, { auth: { storageKey: `ml-emma-${Date.now()}` } });

async function signUpWithLanguage(sb, pseudo, lang) {
  const email = `ml.${pseudo.toLowerCase()}.${Date.now()}@freeparty.app`;
  const { data, error } = await sb.auth.signUp({
    email,
    password: "sim-pass-123!",
    options: { data: { username: pseudo } },
  });
  if (error) throw error;
  if (!data.session) throw new Error("pas de session (confirmation email activée)");
  // Comme auth-form.tsx : la langue choisie à l'inscription est sauvegardée
  const { error: e2 } = await sb.from("profiles").insert({
    id: data.user.id,
    username: pseudo,
    avatar_color: 0,
    language: lang,
  });
  if (e2) throw e2;
  return data.user.id;
}

let danyId, emmaId;
try {
  danyId = await signUpWithLanguage(dany, "Dany", "fr");
  ok("compte Dany créé, langue = fr");
} catch (e) { ko("compte Dany", e); }
try {
  emmaId = await signUpWithLanguage(emma, "Emma", "en");
  ok("compte Emma créé, langue = en");
} catch (e) { ko("compte Emma", e); }
if (!danyId || !emmaId) { console.error("\n⚠️  Impossible de continuer sans les deux comptes.\n"); process.exit(1); }

// Relecture des profils (comme au login)
const { data: profDany } = await dany.from("profiles").select("language").eq("id", danyId).single();
const { data: profEmma } = await emma.from("profiles").select("language").eq("id", emmaId).single();
profDany?.language === "fr" ? ok("profil Dany relu : fr") : ko("profil Dany", JSON.stringify(profDany));
profEmma?.language === "en" ? ok("profil Emma relu : en") : ko("profil Emma", JSON.stringify(profEmma));

// ─── 2. Questions bilingues via le vrai endpoint de l'app ───
console.log("\n2. Génération des questions bilingues (/api/questions → DeepSeek)");
let questions = [];
try {
  const res = await fetch(`${DEV}/api/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count: 3, category: "culture-generale" }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} — le serveur de dev tourne-t-il ? (npm run dev -- --port 7100)`);
  const data = await res.json();
  questions = data.questions ?? [];
  if (questions.length === 0) throw new Error("aucune question renvoyée");
  ok(`${questions.length} questions reçues (aiGenerated=${data.aiGenerated})`);
} catch (e) { ko("génération questions", e); }

const bilingual = questions.filter((q) => q.translations?.en?.answers?.length === 4);
bilingual.length === questions.length && questions.length > 0
  ? ok(`${bilingual.length}/${questions.length} questions ont une traduction anglaise complète`)
  : ko("traductions", `${bilingual.length}/${questions.length} questions bilingues`);
if (questions.length === 0) { console.error("\n⚠️  Sans questions, arrêt.\n"); process.exit(1); }

const Q = questions[0];

// ─── 3. Dany crée un salon, Emma rejoint ───
console.log("\n3. Salon en ligne");
let sessionId = null;
try {
  const code = genCode();
  const { data: session, error } = await dany.from("game_sessions")
    .insert({ room_code: code, host_id: danyId, phase: "lobby", mode: "classic", category: "culture-generale", question_count: 3, max_players: 4 })
    .select().single();
  if (error) throw error;
  sessionId = session.id;
  const { error: e1 } = await dany.from("game_players").insert({ session_id: sessionId, user_id: danyId, name: "Dany", is_host: true });
  if (e1) throw e1;
  ok(`Dany a créé le salon ${code}`);

  const { data: found } = await emma.from("game_sessions").select("*").eq("room_code", code).eq("phase", "lobby").maybeSingle();
  if (!found) throw new Error("salon introuvable par code");
  const { error: e2 } = await emma.from("game_players").insert({ session_id: sessionId, user_id: emmaId, name: "Emma", is_host: false });
  if (e2) throw e2;
  ok("Emma a rejoint avec le code");

  // ─── 4. Emma s'abonne, Dany pousse la question AVEC traductions ───
  console.log("\n4. Question poussée (multilingue) — chaque joueur dans sa langue");
  let received = null;
  let subscribed = false;
  const channel = emma.channel(`ml-${sessionId}`)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "game_sessions", filter: `id=eq.${sessionId}` }, (p) => { received = p.new; })
    .subscribe((st) => { if (st === "SUBSCRIBED") subscribed = true; });
  for (let i = 0; i < 24 && !subscribed; i++) await sleep(250);
  if (!subscribed) ko("abonnement Realtime d'Emma", "jamais confirmé");
  await sleep(1000); // laisse le canal se stabiliser avant le push

  // Payload identique à hostPushQuestion (non révélé : sans correctAnswer)
  const payload = { question: Q.question, answers: Q.answers, translations: Q.translations };
  const { error: e3 } = await dany.from("game_sessions").update({
    phase: "playing", current_question: payload, question_index: 0, answers_revealed: false, state_version: 1,
  }).eq("id", sessionId);
  if (e3) throw e3;
  ok("question poussée par Dany (sans la bonne réponse)");

  await sleep(5000);
  if (!received?.current_question) {
    ko("réception Emma", "aucun événement Realtime");
  } else {
    // ─── 5. Vérification du rendu par langue ───
    const cq = received.current_question;
    const vueDany = localize(cq, profDany?.language ?? "fr");
    const vueEmma = localize(cq, profEmma?.language ?? "fr");

    console.log(`\n  📱 Écran de Dany (fr) : « ${vueDany.question} »`);
    console.log(`  📱 Écran d'Emma (en) : « ${vueEmma.question} »\n`);

    vueDany.lang === "fr" && vueDany.question === Q.question
      ? ok("Dany voit la question en FRANÇAIS")
      : ko("vue Dany", vueDany.question);
    vueEmma.lang === "en" && vueEmma.question !== Q.question
      ? ok("Emma voit la MÊME question en ANGLAIS")
      : ko("vue Emma", vueEmma.question);
    cq.correctAnswer === undefined
      ? ok("bonne réponse non divulguée avant révélation")
      : ko("fuite", "correctAnswer visible avant révélation");

    // Même partie : les réponses d'Emma sont dans l'ordre anglais = même index
    vueDany.answers[vueDany.correctAnswer ?? Q.correctAnswer] !== undefined &&
    vueEmma.answers.length === 4
      ? ok("les 4 réponses d'Emma sont traduites (même ordre, même index)")
      : ko("réponses Emma", "traduction incomplète");

    // ─── 6. Les deux répondent (bonne réponse, index partagé) ───
    console.log("\n5. Réponses et scores");
    const { data: playersRows } = await dany.from("game_players").select("*").eq("session_id", sessionId);
    const danyP = playersRows?.find((p) => p.name === "Dany");
    const emmaP = playersRows?.find((p) => p.name === "Emma");
    const ins = (sb, p, idx) => sb.from("room_answers").insert({ session_id: sessionId, player_id: p.id, question_index: 0, answer_index: idx, response_time_ms: 3000 });
    // Dany répond juste (index FR), Emma répond juste (même index vu en EN)
    const [r1, r2] = await Promise.all([ins(dany, danyP, Q.correctAnswer), ins(emma, emmaP, Q.correctAnswer)]);
    if (r1.error) ko("réponse Dany", r1.error); else ok("Dany a répondu (vu en FR)");
    if (r2.error) ko("réponse Emma", r2.error); else ok("Emma a répondu (vu en EN, même index)");

    const { data: answers } = await dany.from("room_answers").select("*").eq("session_id", sessionId).eq("question_index", 0);
    await Promise.all((answers ?? []).map(async (a) => {
      const correct = a.answer_index === Q.correctAnswer;
      await dany.from("room_answers").update({ correct }).eq("id", a.id);
      if (correct) await dany.rpc("increment_player_score", { p_player_id: a.player_id, p_points: 10 });
    }));
    await dany.from("game_sessions").update({
      current_question: { ...payload, correctAnswer: Q.correctAnswer, explanation: Q.explanation },
      answers_revealed: true, state_version: 2,
    }).eq("id", sessionId);
    await dany.from("game_sessions").update({ phase: "finished" }).eq("id", sessionId);

    const { data: finalPlayers } = await dany.from("game_players").select("name, score").eq("session_id", sessionId).order("score", { ascending: false });
    console.log("\n  🏆 Classement :");
    for (const [i, p] of (finalPlayers ?? []).entries()) console.log(`     ${i + 1}. ${p.name} — ${p.score} pts`);
    const allScored = (finalPlayers ?? []).every((p) => p.score === 10);
    allScored ? ok("les deux joueurs ont marqué (l'index partagé FR/EN fonctionne)") : ko("scores", JSON.stringify(finalPlayers));
  }
  await emma.removeChannel(channel);
} catch (e) {
  failures++;
  console.error(`  ❌ Erreur : ${e.message}`);
} finally {
  if (sessionId) {
    await emma.from("game_players").delete().eq("session_id", sessionId);
    await dany.from("game_players").delete().eq("session_id", sessionId);
    await dany.from("game_sessions").delete().eq("id", sessionId);
    console.log("\n  🧹 Salon de test nettoyé");
  }
}

console.log(failures === 0
  ? "\n🎉 SIMULATION MULTILINGUE RÉUSSIE — même partie, deux langues.\n"
  : `\n⚠️  ${failures} point(s) à corriger (voir ci-dessus).\n`);
process.exit(failures === 0 ? 0 : 1);
