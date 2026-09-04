/**
 * Free Party — Online room helpers (multijoueur en ligne)
 * Host-authoritative : le créateur du salon pilote la partie via Supabase
 * Realtime. Chaque joueur agit sur son appareil.
 *
 * Pas de compte requis : connexion anonyme Supabase + pseudo
 * (nécessite "Anonymous sign-ins" activé dans le dashboard Supabase).
 */
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Question } from "@/lib/questions/schema";
import { MAX_PLAYERS } from "@/lib/store/game";
import { getOrCreateDeviceToken, resolvePlayerProfiles } from "@/lib/identity/identity-service";

export interface OnlineSession {
  id: string;
  room_code: string;
  host_id: string | null;
  phase: "lobby" | "playing" | "finished";
  question_index: number;
  current_question: {
    id?: string;
    familyId?: string;
    knowledgeKey?: string;
    category?: string;
    subcategory?: string;
    difficulty?: string;
    type?: string;
    language?: string;
    question: string;
    answers: string[];
    correctAnswer?: number; // présent uniquement quand answers_revealed
    explanation?: string;
    /** Traductions (en) — chaque joueur affiche sa langue */
    translations?: Partial<Record<string, { question: string; answers?: string[]; explanation?: string }>>;
  } | null;
  answers_revealed: boolean;
  state_version: number;
  mode: string | null;
  category: string | null;
  question_count: number;
  max_players: number;
  buzzer_player_id: string | null;
}

export interface OnlinePlayer {
  id: string;
  session_id: string;
  user_id: string | null;
  profile_id: string | null;
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

export interface RoomOptions {
  mode: string;
  category: string;
  questionCount: number;
  maxPlayers: number;
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans O/0/I/1
export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * Garantit une session authentifiée (anonyme si besoin) et enregistre
 * le pseudo dans les métadonnées. Renvoie l'id utilisateur.
 */
export async function ensureOnlineIdentity(pseudo: string): Promise<{ userId: string; profileId: string | null; deviceToken: string; name: string }> {
  const sb = getSupabaseBrowser();
  if (!sb) throw new Error("Supabase non configuré");

  const name = pseudo.trim().slice(0, 20) || "Joueur";

  const { data: existing } = await sb.auth.getUser();
  let user = existing.user;
  if (!user) {
    const { data, error } = await sb.auth.signInAnonymously({
      options: { data: { username: name } },
    });
    if (error) {
      if (error.message.toLowerCase().includes("anonymous")) {
        throw new Error(
          "La connexion anonyme n'est pas activée sur le projet Supabase (Authentication → Sign In / Providers → Anonymous).",
        );
      }
      throw error;
    }
    if (!data.user) throw new Error("Impossible de créer la session invité");
    user = data.user;
  }

  // Session existante : met à jour le pseudo si changé
  const current = user.user_metadata?.username as string | undefined;
  if (current !== name) {
    await sb.auth.updateUser({ data: { username: name } });
  }
  const deviceToken = await getOrCreateDeviceToken();
  const profiles = await resolvePlayerProfiles([deviceToken]);
  return { userId: user.id, profileId: profiles[0]?.profile_id ?? null, deviceToken, name };
}

/** Crée un salon et y inscrit le host */
export async function createRoom(
  pseudo: string,
  opts: RoomOptions,
): Promise<{ session: OnlineSession; player: OnlinePlayer }> {
  const sb = getSupabaseBrowser();
  if (!sb) throw new Error("Supabase non configuré");
  const identity = await ensureOnlineIdentity(pseudo);

  // Génère un code libre : plusieurs tentatives (collision très rare mais
  // possible quand beaucoup de salons s'accumulent — jamais de doublon).
  let code = "";
  let session: { id: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateRoomCode();
    const { data: existing } = await sb.from("game_sessions").select("id").eq("room_code", code).maybeSingle();
    if (existing) continue;
    const { data: inserted, error } = await sb
      .from("game_sessions")
      .insert({
        room_code: code,
        host_id: identity.userId,
        phase: "lobby",
        mode: opts.mode,
        category: opts.category,
        question_count: opts.questionCount,
        max_players: Math.max(2, Math.min(MAX_PLAYERS, opts.maxPlayers)),
      })
      .select()
      .single();
    if (error) {
      // 23505 = contrainte unique sur room_code (course entre deux hôtes)
      if (error.code === "23505") continue;
      throw error;
    }
    session = inserted;
    break;
  }
  if (!session) throw new Error("Impossible de générer un code de salon libre, réessaie");

  const { error: err2 } = await sb
    .from("game_players")
    .insert({
      session_id: session.id,
      user_id: identity.userId,
        name: identity.name,
        is_host: true,
        profile_id: identity.profileId,
    });
  if (err2) throw err2;

  // Relit le joueur (un INSERT avec RETURNING échoue en RLS : policy SELECT
  // pas encore applicable au moment du statement)
  const { data: player, error: err3 } = await sb
    .from("game_players")
    .select("*")
    .eq("session_id", session.id)
    .eq("user_id", identity.userId)
    .single();
  if (err3) throw err3;
  if (identity.profileId) {
    const { error: attachError } = await sb.rpc("attach_game_player_profile", {
      p_player_id: player.id,
      p_device_token: identity.deviceToken,
    });
    if (attachError) throw attachError;
  }

  return { session: session as OnlineSession, player: player as OnlinePlayer };
}

/** Rejoint un salon par code — idempotent (anti double-clic) */
export async function joinRoom(
  code: string,
  pseudo: string,
): Promise<{ session: OnlineSession; player: OnlinePlayer }> {
  const sb = getSupabaseBrowser();
  if (!sb) throw new Error("Supabase non configuré");
  const identity = await ensureOnlineIdentity(pseudo);

  // La fonction SQL verrouille le salon : vérification de capacité + insertion
  // forment une seule opération, y compris lors d'arrivées simultanées.
  const { data: membership, error } = await sb.rpc("join_game_session", {
    p_room_code: code.trim().toUpperCase(),
    p_player_name: identity.name,
  });
  if (error) {
    if (error.message.includes("room_capacity_reached")) {
      throw new Error("Ce salon est complet");
    }
    if (error.message.includes("room_not_found")) {
      throw new Error("Salon introuvable : vérifie le code — ou la partie a peut-être déjà commencé");
    }
    throw error;
  }

  const joined = Array.isArray(membership) ? membership[0] : membership;
  if (!joined?.session_id || !joined?.player_id) {
    throw new Error("Impossible de rejoindre ce salon");
  }

  if (identity.profileId) {
    const { error: profileError } = await sb.rpc("attach_game_player_profile", {
      p_player_id: joined.player_id,
      p_device_token: identity.deviceToken,
    });
    if (profileError) throw profileError;
  }

  const [{ data: session, error: sessionError }, { data: player, error: playerError }] = await Promise.all([
    sb.from("game_sessions").select("*").eq("id", joined.session_id).single(),
    sb
    .from("game_players")
    .select("*")
      .eq("id", joined.player_id)
      .single(),
  ]);
  if (sessionError) throw sessionError;
  if (playerError) throw playerError;

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

/** Le host pousse la question courante (sans la bonne réponse)
 *  - passe phase à 'playing' au premier push
 *  - state_version monotone (évite les collisions de ms)
 */
export async function hostPushQuestion(
  sessionId: string,
  question: Question,
  index: number,
  revealed: boolean,
  currentStateVersion: number = 0,
): Promise<void> {
  const sb = getSupabaseBrowser();
  if (!sb) return;
  const payload = revealed
    ? {
        id: question.id,
        familyId: question.familyId,
        knowledgeKey: question.knowledgeKey,
        category: question.category,
        subcategory: question.subcategory,
        difficulty: question.difficulty,
        type: question.type,
        language: question.language,
        question: question.question,
        answers: question.answers,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        translations: question.translations,
      }
    : {
        id: question.id,
        familyId: question.familyId,
        knowledgeKey: question.knowledgeKey,
        category: question.category,
        subcategory: question.subcategory,
        difficulty: question.difficulty,
        type: question.type,
        language: question.language,
        question: question.question,
        answers: question.answers,
        translations: question.translations,
      };
  const { error } = await sb
    .from("game_sessions")
    .update({
      phase: index === 0 && !revealed ? "playing" : undefined,
      current_question: payload,
      question_index: index,
      answers_revealed: revealed,
      state_version: currentStateVersion + 1,
      ...(!revealed ? { buzzer_player_id: null } : {}),
    })
    .eq("id", sessionId);
  if (error) throw new Error(`Push question: ${error.message}`);
}

/** Nettoie la manche précédente tout en conservant le salon et son code. */
export async function resetOnlineRound(sessionId: string, mode?: string): Promise<OnlineSession> {
  const sb = getSupabaseBrowser();
  if (!sb) throw new Error("Supabase non configuré");
  const { data, error } = await sb.rpc("reset_online_round", { p_session_id: sessionId, p_mode: mode ?? null });
  if (error) throw new Error(`Nouvelle manche: ${error.message}`);
  const session = Array.isArray(data) ? data[0] : data;
  if (!session) throw new Error("Nouvelle manche: réponse du serveur vide");
  return session as OnlineSession;
}

/** Le premier appel transactionnel gagne le buzzer. */
export async function claimRoomBuzzer(sessionId: string, playerId: string): Promise<boolean> {
  const sb = getSupabaseBrowser();
  if (!sb) return false;
  const { data, error } = await sb.rpc("claim_room_buzzer", { p_session_id: sessionId, p_player_id: playerId });
  if (error) throw new Error(`Buzzer: ${error.message}`);
  return data === true;
}

export async function submitRoomBuzzerAnswer(
  sessionId: string,
  playerId: string,
  questionIndex: number,
  answerIndex: number,
  responseTimeMs: number,
): Promise<boolean> {
  const sb = getSupabaseBrowser();
  if (!sb) return false;
  const { data, error } = await sb.rpc("submit_room_buzzer_answer", {
    p_session_id: sessionId,
    p_player_id: playerId,
    p_question_index: questionIndex,
    p_answer_index: answerIndex,
    p_response_time_ms: responseTimeMs,
  });
  if (error) throw new Error(`Réponse buzzer: ${error.message}`);
  return data === true;
}

/** Le host met à jour les réponses (correct/wrong) et les scores — en parallèle */
export async function hostMarkAnswers(
  sessionId: string,
  question: Question,
  answers: RoomAnswer[],
): Promise<void> {
  const sb = getSupabaseBrowser();
  if (!sb) return;
  await Promise.all(
    answers.map(async (a) => {
      const correct = a.answer_index === question.correctAnswer;
      await sb.from("room_answers").update({ correct }).eq("id", a.id);
      if (correct) {
        await sb.rpc("increment_player_score", { p_player_id: a.player_id, p_points: 10 });
      }
    }),
  );
}

/** Le joueur envoie sa réponse — idempotent (23505 = déjà répondu) */
export async function submitAnswer(
  sessionId: string,
  playerId: string,
  questionIndex: number,
  answerIndex: number,
  responseTimeMs: number,
): Promise<void> {
  const sb = getSupabaseBrowser();
  if (!sb) return;
  const { error } = await sb.from("room_answers").insert({
    session_id: sessionId,
    player_id: playerId,
    question_index: questionIndex,
    answer_index: answerIndex,
    response_time_ms: responseTimeMs,
  });
  if (error && error.code !== "23505") {
    throw new Error(`Réponse: ${error.message}`);
  }
}

/** Fin de partie */
export async function finishRoom(sessionId: string): Promise<void> {
  const sb = getSupabaseBrowser();
  if (!sb) return;
  const { error } = await sb.from("game_sessions").update({ phase: "finished" }).eq("id", sessionId);
  if (error) throw new Error(`Fin de partie: ${error.message}`);
}

/** Quitte le salon : supprime la ligne joueur (best effort) */
export async function leaveRoom(sessionId: string, playerId: string): Promise<void> {
  const sb = getSupabaseBrowser();
  if (!sb) return;
  const { error } = await sb.from("game_players").delete().eq("id", playerId).eq("session_id", sessionId);
  if (error) throw new Error(`Impossible de quitter le salon : ${error.message}`);
}

export { isSupabaseConfigured };
