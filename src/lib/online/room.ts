/**
 * Free Party — Online room helpers (multijoueur en ligne)
 * Host-authoritative : le créateur du salon pilote la partie via Supabase
 * Realtime. Chaque joueur agit sur son appareil.
 */
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Question } from "@/lib/questions/schema";

export interface OnlineSession {
  id: string;
  room_code: string;
  host_id: string | null;
  phase: "lobby" | "playing" | "finished";
  question_index: number;
  current_question: {
    question: string;
    answers: string[];
    correctAnswer?: number; // présent uniquement quand answers_revealed
    explanation?: string;
  } | null;
  answers_revealed: boolean;
  state_version: number;
  mode: string | null;
  category: string | null;
  question_count: number;
}

export interface OnlinePlayer {
  id: string;
  session_id: string;
  user_id: string | null;
  name: string;
  is_host: boolean;
  score: number;
}

export interface RoomAnswer {
  id: string;
  session_id: string;
  player_id: string;
  question_index: number;
  answer_index: number | null;
  correct: boolean | null;
  response_time_ms: number | null;
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans O/0/I/1
export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/** Crée un salon et y inscrit le host */
export async function createRoom(opts: { mode: string; category: string; questionCount: number }): Promise<{ session: OnlineSession; player: OnlinePlayer }> {
  const sb = getSupabaseBrowser();
  if (!sb) throw new Error("Supabase non configuré");
  const { data: user } = await sb.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  let code = generateRoomCode();
  // Évite la collision (rare)
  const { data: existing } = await sb.from("game_sessions").select("id").eq("room_code", code).maybeSingle();
  if (existing) code = generateRoomCode();

  const { data: session, error } = await sb
    .from("game_sessions")
    .insert({
      room_code: code,
      host_id: user.user.id,
      phase: "lobby",
      mode: opts.mode,
      category: opts.category,
      question_count: opts.questionCount,
    })
    .select()
    .single();
  if (error) throw error;

  const { error: err2 } = await sb
    .from("game_players")
    .insert({
      session_id: session.id,
      user_id: user.user.id,
      name: (user.user.user_metadata?.username as string) ?? "Hôte",
      is_host: true,
    });
  if (err2) throw err2;

  // Relit le joueur (un INSERT avec RETURNING échoue en RLS : policy SELECT
  // pas encore applicable au moment du statement)
  const { data: player, error: err3 } = await sb
    .from("game_players")
    .select("*")
    .eq("session_id", session.id)
    .eq("user_id", user.user.id)
    .single();
  if (err3) throw err3;

  return { session: session as OnlineSession, player: player as OnlinePlayer };
}

/** Rejoint un salon par code */
export async function joinRoom(code: string): Promise<{ session: OnlineSession; player: OnlinePlayer }> {
  const sb = getSupabaseBrowser();
  if (!sb) throw new Error("Supabase non configuré");
  const { data: user } = await sb.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data: session, error } = await sb
    .from("game_sessions")
    .select("*")
    .eq("room_code", code.trim().toUpperCase())
    .eq("phase", "lobby")
    .maybeSingle();
  if (error) throw error;
  if (!session) throw new Error("Room not found");

  const { error: err2 } = await sb
    .from("game_players")
    .insert({
      session_id: session.id,
      user_id: user.user.id,
      name: (user.user.user_metadata?.username as string) ?? "Joueur",
      is_host: false,
    });
  if (err2) throw err2;

  // Relit le joueur (même raison que createRoom : pas de RETURNING en RLS)
  const { data: player, error: err3 } = await sb
    .from("game_players")
    .select("*")
    .eq("session_id", session.id)
    .eq("user_id", user.user.id)
    .single();
  if (err3) throw err3;

  return { session: session as OnlineSession, player: player as OnlinePlayer };
}

/** Abonnement Realtime : session (état du jeu) — avec fallback polling 3 s */
export function subscribeSession(sessionId: string, onUpdate: (s: OnlineSession) => void): () => void {
  const sb = getSupabaseBrowser();
  if (!sb) return () => {};
  let cancelled = false;

  const poll = async () => {
    try {
      const { data } = await sb.from("game_sessions").select("*").eq("id", sessionId).single();
      if (!cancelled && data) onUpdate(data as OnlineSession);
    } catch {
      // salon supprimé ou réseau — ignoré, le polling continue
    }
  };

  const channel = sb
    .channel(`session-${sessionId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "game_sessions", filter: `id=eq.${sessionId}` },
      (payload) => {
        if (payload.new) onUpdate(payload.new as OnlineSession);
      },
    )
    .subscribe();
  const interval = setInterval(poll, 3000);

  return () => {
    cancelled = true;
    clearInterval(interval);
    sb.removeChannel(channel);
  };
}

/** Abonnement Realtime : joueurs du salon — avec fallback polling 3 s */
export function subscribePlayers(sessionId: string, onUpdate: (players: OnlinePlayer[]) => void): () => void {
  const sb = getSupabaseBrowser();
  if (!sb) return () => {};
  let cancelled = false;

  const poll = () => {
    if (!cancelled) void refreshPlayers(sessionId).then(onUpdate);
  };

  const channel = sb
    .channel(`players-${sessionId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "game_players", filter: `session_id=eq.${sessionId}` },
      () => {
        void refreshPlayers(sessionId).then(onUpdate);
      },
    )
    .subscribe();
  void refreshPlayers(sessionId).then(onUpdate);
  const interval = setInterval(poll, 3000);

  return () => {
    cancelled = true;
    clearInterval(interval);
    sb.removeChannel(channel);
  };
}

export async function refreshPlayers(sessionId: string): Promise<OnlinePlayer[]> {
  const sb = getSupabaseBrowser();
  if (!sb) return [];
  const { data } = await sb.from("game_players").select("*").eq("session_id", sessionId).order("is_host", { ascending: false });
  return (data ?? []) as OnlinePlayer[];
}

/** Abonnement Realtime : réponses — avec fallback polling 3 s */
export function subscribeAnswers(sessionId: string, onUpdate: (answers: RoomAnswer[]) => void): () => void {
  const sb = getSupabaseBrowser();
  if (!sb) return () => {};
  let cancelled = false;

  const poll = () => {
    if (!cancelled) void refreshAnswers(sessionId).then(onUpdate);
  };

  const channel = sb
    .channel(`answers-${sessionId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "room_answers", filter: `session_id=eq.${sessionId}` },
      () => {
        void refreshAnswers(sessionId).then(onUpdate);
      },
    )
    .subscribe();
  void refreshAnswers(sessionId).then(onUpdate);
  const interval = setInterval(poll, 3000);

  return () => {
    cancelled = true;
    clearInterval(interval);
    sb.removeChannel(channel);
  };
}

export async function refreshAnswers(sessionId: string, questionIndex?: number): Promise<RoomAnswer[]> {
  const sb = getSupabaseBrowser();
  if (!sb) return [];
  let query = sb.from("room_answers").select("*").eq("session_id", sessionId);
  if (questionIndex !== undefined) query = query.eq("question_index", questionIndex);
  const { data } = await query.order("answered_at");
  return (data ?? []) as RoomAnswer[];
}

/** Le host pousse la question courante (sans la bonne réponse) */
export async function hostPushQuestion(
  sessionId: string,
  question: Question,
  index: number,
  revealed: boolean,
): Promise<void> {
  const sb = getSupabaseBrowser();
  if (!sb) return;
  const payload = revealed
    ? {
        question: question.question,
        answers: question.answers,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      }
    : { question: question.question, answers: question.answers };
  await sb
    .from("game_sessions")
    .update({
      current_question: payload,
      question_index: index,
      answers_revealed: revealed,
      state_version: new Date().getTime(),
    })
    .eq("id", sessionId);
}

/** Le host met à jour les réponses (correct/wrong) et les scores */
export async function hostMarkAnswers(
  sessionId: string,
  question: Question,
  answers: RoomAnswer[],
): Promise<void> {
  const sb = getSupabaseBrowser();
  if (!sb) return;
  for (const a of answers) {
    const correct = a.answer_index === question.correctAnswer;
    await sb
      .from("room_answers")
      .update({ correct })
      .eq("id", a.id);
    if (correct) {
      await sb.rpc("increment_player_score", { p_player_id: a.player_id, p_points: 10 });
    }
  }
}

/** Le joueur envoie sa réponse */
export async function submitAnswer(
  sessionId: string,
  playerId: string,
  questionIndex: number,
  answerIndex: number,
  responseTimeMs: number,
): Promise<void> {
  const sb = getSupabaseBrowser();
  if (!sb) return;
  await sb.from("room_answers").insert({
    session_id: sessionId,
    player_id: playerId,
    question_index: questionIndex,
    answer_index: answerIndex,
    response_time_ms: responseTimeMs,
  });
}

/** Fin de partie */
export async function finishRoom(sessionId: string): Promise<void> {
  const sb = getSupabaseBrowser();
  if (!sb) return;
  await sb.from("game_sessions").update({ phase: "finished" }).eq("id", sessionId);
}

export { isSupabaseConfigured };
