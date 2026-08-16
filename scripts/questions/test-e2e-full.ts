/**
 * FREE PARTY — Test complet de bout en bout (spec §90–§91)
 * Exécute en réel : création de comptes, partie multijoueur 2 joueurs
 * complète (créer salon → rejoindre → lancer → répondre → scores),
 * et 3 parties solo vérifiant la variation + l'anti-répétition.
 */
import { createClient } from "@supabase/supabase-js";

const URL = "https://qkzcuepxissfybhvgqrk.supabase.co";
const KEY = "sb_publishable_5sFEmU0JRx7-hMSWmIG2-g_Y_5Cxzti";
const APP = "https://freeparty.vercel.app";

const results: { test: string; ok: boolean; detail: string }[] = [];
function report(test: string, ok: boolean, detail: string) {
  results.push({ test, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${test} — ${detail}`);
}

async function makeUser(tag: string) {
  const email = `qa-${tag}-${Date.now()}@freeparty.test`;
  const client = createClient(URL, KEY, { auth: { persistSession: false } });
  const { error: su } = await client.auth.signUp({ email, password: "qa-password-123" });
  if (su) throw new Error(`signup ${tag}: ${su.message}`);
  const { data, error } = await client.auth.signInWithPassword({ email, password: "qa-password-123" });
  if (error || !data.user) throw new Error(`signin ${tag}: ${error?.message}`);
  return { client, userId: data.user.id, email };
}

async function main() {
  console.log("=== PARTIE MULTIJOUEUR 2 JOUEURS ===\n");
  const host = await makeUser("host");
  const bob = await makeUser("bob");
  report("Création comptes test (2)", true, `${host.email}, ${bob.email}`);

  // HOST : crée le salon
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const { data: sess, error: e1 } = await host.client
    .from("game_sessions")
    .insert({ room_code: code, host_id: host.userId, phase: "lobby", mode: "classic", category: "geographie", question_count: 5 })
    .select()
    .single();
  report("Host crée le salon", !e1, e1 ? e1.message : `code ${code}`);
  if (e1 || !sess) return;

  const { error: e2 } = await host.client
    .from("game_players")
    .insert({ session_id: sess.id, user_id: host.userId, name: "Alice", is_host: true });
  report("Host s'inscrit comme joueur", !e2, e2?.message ?? "Alice (host)");

  // BOB : cherche par code et rejoint
  const { data: found, error: e3 } = await bob.client
    .from("game_sessions").select("id, phase").eq("room_code", code).eq("phase", "lobby").maybeSingle();
  report("Bob trouve le salon par code", !e3 && !!found, e3?.message ?? (found ? "salon trouvé" : "introuvable"));
  if (!found) return;

  const { error: e4 } = await bob.client
    .from("game_players")
    .insert({ session_id: found.id, user_id: bob.userId, name: "Bob", is_host: false });
  // Relecture séparée (même pattern que le client room.ts : pas de RETURNING en RLS)
  const { data: bobPlayer, error: e4b } = await bob.client
    .from("game_players")
    .select("*")
    .eq("session_id", found.id)
    .eq("user_id", bob.userId)
    .single();
  const joinErr = e4 ?? e4b;
  report("Bob rejoint le salon", !joinErr && !!bobPlayer, joinErr ? joinErr.message : `Bob id=${bobPlayer?.id}`);
  if (joinErr || !bobPlayer) return;

  // Les 2 joueurs visibles
  const { data: players, error: e5 } = await host.client
    .from("game_players").select("name, is_host").eq("session_id", found.id);
  report("2 joueurs visibles dans le lobby", !e5 && players?.length === 2, JSON.stringify(players));

  // HOST : charge les questions depuis la PROD et lance
  const resQ = await fetch(`${APP}/api/questions`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count: 5, category: "geographie", history: [] }),
  });
  const qData = await resQ.json();
  const questions = qData.questions ?? [];
  report("Host charge 5 questions géographie", questions.length === 5, `${questions.length} questions, pool ${qData.poolSize}`);

  // Pousse la question 1 (sans la réponse)
  const { error: e6 } = await host.client
    .from("game_sessions")
    .update({ phase: "playing", question_index: 0, current_question: { question: questions[0].question, answers: questions[0].answers }, answers_revealed: false, state_version: Date.now() })
    .eq("id", found.id);
  report("Host lance la partie (question 1)", !e6, e6?.message ?? "phase=playing");

  // BOB voit la question et répond
  const { data: bobView, error: e7 } = await bob.client
    .from("game_sessions").select("phase, current_question").eq("id", found.id).single();
  const seesQ = !e7 && bobView?.phase === "playing" && !!bobView?.current_question;
  report("Bob voit la question", seesQ, e7?.message ?? (bobView?.current_question?.question ?? "?").slice(0, 40));

  // Bob répond (bonne réponse ? on simule answer_index 0)
  const { error: e8 } = await bob.client
    .from("room_answers")
    .insert({ session_id: found.id, player_id: bobPlayer.id, question_index: 0, answer_index: 0, response_time_ms: 4000 });
  report("Bob envoie sa réponse", !e8, e8?.message ?? "answer_index=0");

  // Host voit la réponse + marque correct + score
  const { data: ans, error: e9 } = await host.client
    .from("room_answers").select("id, answer_index").eq("session_id", found.id).eq("question_index", 0);
  report("Host voit la réponse de Bob", !e9 && ans?.length === 1, JSON.stringify(ans));
  if (!e9 && ans?.length === 1) {
    const correct = ans[0].answer_index === questions[0].correctAnswer;
    const { error: e10 } = await host.client.from("room_answers").update({ correct }).eq("id", ans[0].id);
    const { error: e11 } = await host.client.rpc("increment_player_score", { p_player_id: bobPlayer.id, p_points: correct ? 10 : 0 });
    report("Host marque la réponse + score", !e10 && !e11, `correct=${correct}, ${e10?.message ?? e11?.message ?? "score mis à jour"}`);
  }

  // Fin de partie
  const { error: e12 } = await host.client.from("game_sessions").update({ phase: "finished" }).eq("id", found.id);
  report("Fin de partie", !e12, e12?.message ?? "phase=finished");

  // Nettoyage
  await host.client.from("game_sessions").delete().eq("id", found.id);

  console.log("\n=== PARTIES SOLO : variation + anti-répétition ===\n");
  const seenFamilies: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const hist = seenFamilies.slice(0, 20).map((familyId, j) => ({ questionId: `q${j}`, familyId, servedAt: 1786800000000, answeredCorrectly: true }));
    const r = await fetch(`${APP}/api/questions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: 5, category: "mixed", history: hist }),
    });
    const d = await r.json();
    const fams = (d.questions ?? []).map((q: { familyId: string }) => q.familyId);
    const repeats = fams.filter((f: string) => seenFamilies.includes(f));
    report(`Partie solo ${i} : 5 questions nouvelles`, repeats.length === 0, `familles: ${fams.slice(0, 3).join(", ")}… répétées: ${repeats.length}`);
    seenFamilies.push(...fams);
  }

  // Variation entre 2 parties sans historique (mêmes questions ?)
  const r1 = await fetch(`${APP}/api/questions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ count: 5, category: "mixed", history: [] }) });
  const r2 = await fetch(`${APP}/api/questions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ count: 5, category: "mixed", history: [] }) });
  const d1 = (await r1.json()).questions ?? [];
  const d2 = (await r2.json()).questions ?? [];
  const same = d1.length === d2.length && d1.every((q: { id: string }, i: number) => q.id === d2[i].id);
  report("2 tirages sans historique ≠ (variation)", !same, same ? "❌ IDENTIQUES" : "tirages différents");

  console.log("\n=== BILAN ===");
  const ok = results.filter((r) => r.ok).length;
  console.log(`${ok}/${results.length} tests OK`);
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.log("ÉCHECS :");
    for (const f of failed) console.log(`  ❌ ${f.test}: ${f.detail}`);
    process.exit(1);
  }
  console.log("✅ TEST COMPLET RÉUSSI");
}

main().catch((e) => { console.log("FATAL:", e.message); process.exit(1); });
