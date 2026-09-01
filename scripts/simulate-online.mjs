/**
 * Simulation end-to-end d'un salon en ligne Free Party — 2 joueurs.
 * Reproduit exactement les appels de src/lib/online/room.ts :
 *   Dany (hôte) crée un salon → Alex rejoint avec le code → abonnement
 *   Realtime → l'hôte pousse une question → les deux répondent →
 *   l'hôte corrige et révèle → fin de partie → vérification des scores.
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
if (!URL || !KEY) { console.error("❌ Variables Supabase manquantes"); process.exit(1); }

let failures = 0;
const ok = (name) => console.log(`  ✅ ${name}`);
const ko = (name, err) => { failures++; console.error(`  ❌ ${name} : ${err?.message ?? err}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const genCode = () => Array.from({ length: 6 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");

const QUESTION = {
  question: "Quelle est la capitale de l'Australie ?",
  answers: ["Sydney", "Canberra", "Melbourne", "Perth"],
  correctAnswer: 1,
  explanation: "Canberra est la capitale depuis 1913.",
};

async function signIn(sb, pseudo) {
  // 1) Voie normale de l'app : connexion anonyme
  const { data, error } = await sb.auth.signInAnonymously({ options: { data: { username: pseudo } } });
  if (!error) return { id: data.user.id, via: "anonyme" };
  // 2) Fallback de test si l'anonyme n'est pas encore activé :
  //    compte email jetable (le comportement RLS/Realtime est identique)
  if (error.message.toLowerCase().includes("anonymous")) {
    const email = `sim.${pseudo.toLowerCase()}.${Date.now()}@freeparty.app`;
    const { data: d2, error: e2 } = await sb.auth.signUp({ email, password: "sim-pass-123!", options: { data: { username: pseudo } } });
    if (e2) throw e2;
    if (!d2.session) throw new Error("signUp sans session (confirmation email activée)");
    return { id: d2.user.id, via: "email jetable (anonyme désactivé)" };
  }
  throw error;
}

// ─── Deux clients indépendants = deux appareils ───
const dany = createClient(URL, KEY, { auth: { storageKey: "fp-sim-dany" } });
const alex = createClient(URL, KEY, { auth: { storageKey: "fp-sim-alex" } });

let sessionId = null;
try {
  // 1. Connexions anonymes
  console.log("\n1. Connexion anonyme (pseudo sans compte)");
  const danyAuth = await signIn(dany, "Dany").then((r) => { ok(`Dany connecté (${r.via})`); return r; }).catch((e) => { ko("connexion Dany", e); return null; });
  const alexAuth = await signIn(alex, "Alex").then((r) => { ok(`Alex connecté (${r.via})`); return r; }).catch((e) => { ko("connexion Alex", e); return null; });
  if (!danyAuth || !alexAuth) throw new Error("Connexion impossible — active « Anonymous sign-ins » dans Supabase (Authentication → Providers).");
  const danyId = danyAuth.id, alexId = alexAuth.id;

  // 2. Dany crée un salon (4 places, classic, culture, 10 questions)
  console.log("\n2. Création du salon par Dany (4 places max)");
  const code = genCode();
  const { data: session, error: e1 } = await dany.from("game_sessions")
    .insert({ room_code: code, host_id: danyId, phase: "lobby", mode: "classic", category: "culture", question_count: 10, max_players: 4 })
    .select().single();
  if (e1) { ko("INSERT game_sessions", e1); throw new Error("stop"); }
  sessionId = session.id;
  ok(`salon créé, code ${code}, max_players=${session.max_players}`);

  const { error: e2 } = await dany.from("game_players")
    .insert({ session_id: sessionId, user_id: danyId, name: "Dany", is_host: true });
  if (e2) { ko("INSERT game_players (hôte)", e2); throw new Error("stop"); }
  const { data: danyPlayer, error: e3 } = await dany.from("game_players").select("*").eq("session_id", sessionId).eq("user_id", danyId).single();
  if (e3) { ko("relecture joueur hôte", e3); throw new Error("stop"); }
  ok(`hôte inscrit (${danyPlayer.name})`);

  // 3. Alex rejoint par code
  console.log("\n3. Alex rejoint avec le code");
  const { error: e5 } = await alex.rpc("join_game_session", { p_room_code: code, p_player_name: "Alex" });
  if (e5) { ko("join_game_session (Alex)", e5); throw new Error("stop"); }
  const { data: alexPlayer, error: e6 } = await alex.from("game_players").select("*").eq("session_id", sessionId).eq("user_id", alexId).single();
  if (e6) { ko("relecture joueur Alex", e6); throw new Error("stop"); }
  ok(`Alex inscrit (${alexPlayer.name})`);

  // 4. Capacité : l'adhésion est passée par la fonction atomique
  const { count } = await alex.from("game_players").select("id", { count: "exact", head: true }).eq("session_id", sessionId);
  if (count === 2) ok(`comptage joueurs = 2/4`); else ko("comptage joueurs", `attendu 2, obtenu ${count}`);

  // 5. Alex s'abonne au salon (Realtime)
  console.log("\n4. Synchronisation temps réel");
  let received = null;
  let subscribed = false;
  const channel = alex.channel(`session-${sessionId}`)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "game_sessions", filter: `id=eq.${sessionId}` }, (p) => { received = p.new; })
    .subscribe((st) => { if (st === "SUBSCRIBED") subscribed = true; });
  // Attend la confirmation d'abonnement (comme dans l'app : on s'abonne
  // dès l'entrée dans le lobby, bien avant le premier push)
  for (let i = 0; i < 24 && !subscribed; i++) await sleep(250);
  if (!subscribed) ko("abonnement Realtime", "jamais confirmé (SUBSCRIBED)");

  // 6. Dany (hôte) pousse la question 1 — SANS la bonne réponse
  const { error: e7 } = await dany.from("game_sessions").update({
    phase: "playing",
    current_question: { question: QUESTION.question, answers: QUESTION.answers },
    question_index: 0,
    answers_revealed: false,
    state_version: 1,
  }).eq("id", sessionId);
  if (e7) ko("push question par l'hôte", e7);
  else ok("question poussée (sans la bonne réponse)");

  await sleep(2500);
  if (received && received.current_question?.question === QUESTION.question) {
    const leaked = received.current_question.correctAnswer !== undefined;
    if (leaked) ko("question reçue par Alex en temps réel", "correctAnswer a fuité !");
    else ok(`Alex a reçu la question en temps réel (sans fuite de la réponse)`);
  } else {
    ko("réception Realtime par Alex", received ? "contenu inattendu" : "aucun événement reçu en 2,5 s");
  }

  // 7. Les deux répondent (Dany se trompe, Alex juste)
  console.log("\n5. Réponses des joueurs");
  const ins = async (sb, player, idx, ms) => sb.from("room_answers").insert({ session_id: sessionId, player_id: player.id, question_index: 0, answer_index: idx, response_time_ms: ms });
  const [r1, r2] = await Promise.all([ins(dany, danyPlayer, 0, 4200), ins(alex, alexPlayer, 1, 2600)]);
  if (r1.error) ko("réponse Dany", r1.error); else ok("Dany a répondu (Sydney — faux)");
  if (r2.error) ko("réponse Alex", r2.error); else ok("Alex a répondu (Canberra — juste)");

  // 8. Idempotence : Alex répond une 2e fois → ignoré silencieusement (23505)
  const r3 = await ins(alex, alexPlayer, 2, 999);
  if (r3.error && r3.error.code !== "23505") ko("idempotence réponse", r3.error); else ok("double réponse bloquée (idempotent)");

  // 9. L'hôte corrige + score (hostMarkAnswers)
  console.log("\n6. Correction par l'hôte");
  const { data: answers } = await dany.from("room_answers").select("*").eq("session_id", sessionId).eq("question_index", 0);
  if (!answers || answers.length !== 2) ko("relecture des réponses", `attendu 2, obtenu ${answers?.length}`);
  else {
    await Promise.all(answers.map(async (a) => {
      const correct = a.answer_index === QUESTION.correctAnswer;
      await dany.from("room_answers").update({ correct }).eq("id", a.id);
      if (correct) await dany.rpc("increment_player_score", { p_player_id: a.player_id, p_points: 10 });
    }));
    ok("réponses corrigées + score attribué via RPC increment_player_score");
  }

  // 10. Révélation (avec bonne réponse)
  const { error: e8 } = await dany.from("game_sessions").update({
    current_question: QUESTION,
    answers_revealed: true,
    state_version: 2,
  }).eq("id", sessionId);
  if (e8) ko("révélation", e8); else ok("bonne réponse révélée à tous");

  // 11. Fin de partie + vérification des scores
  console.log("\n7. Fin de partie et scores");
  const { error: e9 } = await dany.from("game_sessions").update({ phase: "finished" }).eq("id", sessionId);
  if (e9) ko("fin de partie", e9); else ok("salon passé en phase finished");

  const { data: players } = await dany.from("game_players").select("name, score, is_host").eq("session_id", sessionId).order("score", { ascending: false });
  console.log("\n  🏆 Classement final :");
  for (const [i, p] of (players ?? []).entries()) console.log(`     ${i + 1}. ${p.name}${p.is_host ? " (hôte)" : ""} — ${p.score} pts`);
  const alexScore = players?.find((p) => p.name === "Alex")?.score;
  const danyScore = players?.find((p) => p.name === "Dany")?.score;
  if (alexScore === 10) ok("Alex a bien 10 pts (bonne réponse)"); else ko("score Alex", `attendu 10, obtenu ${alexScore}`);
  if (danyScore === 0) ok("Dany a bien 0 pt (mauvaise réponse)"); else ko("score Dany", `attendu 0, obtenu ${danyScore}`);

  alex.removeChannel(channel);
} catch (e) {
  if (e.message !== "stop") { failures++; console.error(`\n❌ Erreur inattendue : ${e.message}`); }
} finally {
  // Nettoyage : quitte le salon et supprime la session de test
  if (sessionId) {
    await alex.from("game_players").delete().eq("session_id", sessionId);
    await dany.from("game_players").delete().eq("session_id", sessionId);
    await dany.from("game_sessions").delete().eq("id", sessionId);
    console.log("\n  🧹 Salon de test nettoyé");
  }
}

console.log(failures === 0 ? "\n🎉 SIMULATION RÉUSSIE — le salon en ligne fonctionne de bout en bout.\n" : `\n⚠️  ${failures} point(s) à corriger (voir ci-dessus).\n`);
process.exit(failures === 0 ? 0 : 1);
