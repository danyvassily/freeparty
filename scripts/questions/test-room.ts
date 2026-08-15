import { createClient } from "@supabase/supabase-js";

const URL = "https://qkzcuepxissfybhvgqrk.supabase.co";
const KEY = "sb_publishable_5sFEmU0JRx7-hMSWmIG2-g_Y_5Cxzti";

async function makeUser(tag: string) {
  const email = `t-${tag}-${Date.now()}@freeparty.test`;
  const client = createClient(URL, KEY, { auth: { persistSession: false } });
  await client.auth.signUp({ email, password: "test-password-123" });
  const { data } = await client.auth.signInWithPassword({ email, password: "test-password-123" });
  return { client, userId: data.user!.id };
}

async function main() {
  const a = await makeUser("host");
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const { data: sess } = await a.client
    .from("game_sessions")
    .insert({ room_code: code, host_id: a.userId, phase: "lobby", mode: "classic", category: "mixed", question_count: 10 })
    .select()
    .single();
  console.log("A: salon:", sess.id, code);
  await a.client.from("game_players").insert({ session_id: sess.id, user_id: a.userId, name: "Alice", is_host: true });

  const b = await makeUser("join");
  const { data: found } = await b.client
    .from("game_sessions")
    .select("id")
    .eq("room_code", code)
    .eq("phase", "lobby")
    .maybeSingle();
  console.log("B: trouvé:", found?.id);

  // Test can_join_session via RPC
  const { data: canJoin, error: rpcErr } = await b.client.rpc("can_join_session", { s: found!.id });
  console.log("B: can_join_session RPC:", rpcErr ? "❌ " + rpcErr.message : "→ " + canJoin);

  // Test INSERT sans select
  const { error: insErr } = await b.client
    .from("game_players")
    .insert({ session_id: found!.id, user_id: b.userId, name: "Bob", is_host: false });
  console.log("B: INSERT sans select:", insErr ? "❌ " + insErr.message : "✅ OK");

  // Test SELECT players par B (membre maintenant ?)
  const { data: pl, error: plErr } = await b.client
    .from("game_players")
    .select("id")
    .eq("session_id", found!.id);
  console.log("B: SELECT players:", plErr ? "❌ " + plErr.message : "✅ " + JSON.stringify(pl));

  await a.client.from("game_sessions").delete().eq("id", found!.id);
  console.log("   nettoyé");
}

main().catch((e) => console.log("FATAL:", e.message));
