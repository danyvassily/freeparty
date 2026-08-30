"use client";

/**
 * Free Party — Salon en ligne
 * Pseudo (sans compte) → créer un salon avec options (mode, catégorie,
 * questions, joueurs max) ou rejoindre avec un code → partie synchronisée.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useGameStore, MAX_PLAYERS } from "@/lib/store/game";
import { useHistoryStore, toSelectionHistory } from "@/lib/store/history";
import {
  createRoom,
  joinRoom,
  subscribeSession,
  subscribePlayers,
  subscribeAnswers,
  hostPushQuestion,
  hostMarkAnswers,
  submitAnswer,
  finishRoom,
  leaveRoom,
  refreshAnswers,
  type OnlineSession,
  type OnlinePlayer,
  type RoomAnswer,
} from "@/lib/online/room";
import { MODE_META, CATEGORY_LABELS, QUESTION_COUNT_OPTIONS } from "@/lib/game/modes";
import { CATEGORIES, type QuestionCategory } from "@/lib/questions/schema";
import type { Question } from "@/lib/questions/schema";
import type { GameMode } from "@/lib/store/game";
import { TimerBar, Confetti, PlayerDot, SegmentControl, SectionTitle, PillBadge } from "@/components/ui/primitives";
import { AppIcon } from "@/components/ui/icons";
import { Globe, Trophy, Play, Eye, ArrowRight, ChevronLeft, Minus, Plus, Copy, Check, Crown } from "lucide-react";

type View = "entry" | "create" | "lobby" | "playing" | "results";

// Hors composant : Date.now() est autorisé ici (le lint React interdit
// les appels impurs dans le corps du composant).
function elapsedSince(start: number) {
  return Math.max(0, Date.now() - start);
}

export function OnlineRoom() {
  const router = useRouter();
  const { entries, addEntry } = useHistoryStore();
  const savedPlayers = useGameStore((s) => s.players);

  const [view, setView] = useState<View>("entry");
  const [pseudo, setPseudo] = useState(savedPlayers[0]?.name ?? "");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<OnlineSession | null>(null);
  const [players, setPlayers] = useState<OnlinePlayer[]>([]);
  const [answers, setAnswers] = useState<RoomAnswer[]>([]);
  const [myPlayer, setMyPlayer] = useState<OnlinePlayer | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const searchParams = useSearchParams();
  const roomFromUrl = searchParams.get("room");

  // Options de création
  const [createMode, setCreateMode] = useState<GameMode>("classic");
  const [createCategory, setCreateCategory] = useState<QuestionCategory | "mixed">("mixed");
  const [createCount, setCreateCount] = useState<number>(10);
  const [createMaxPlayers, setCreateMaxPlayers] = useState<number>(4);

  const questionsRef = useRef<Question[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef<OnlineSession | null>(null);
  const myPlayerRef = useRef<OnlinePlayer | null>(null);
  const startRef = useRef(0);
  const joiningRef = useRef(false);
  const autoJoinedRef = useRef(false);

  const isHost = myPlayer?.is_host === true;
  const currentQuestion: Question | null =
    questions[index()] ?? (session?.current_question as Question | null) ?? null;
  const revealed = session?.answers_revealed ?? false;
  const questionCount = session?.question_count ?? questions.length ?? 10;
  const timePerQuestion = 15;

  function index() {
    return session?.question_index ?? 0;
  }

  // Abonnements Realtime quand un salon est actif
  useEffect(() => {
    if (!session) return;
    const unsubSession = subscribeSession(session.id, (s) => {
      sessionRef.current = s;
      setSession(s);
    });
    const unsubPlayers = subscribePlayers(session.id, (pl) => {
      setPlayers(pl);
      const cached = myPlayerRef.current;
      if (cached) {
        const updated = pl.find((p) => p.id === cached.id) ?? cached;
        myPlayerRef.current = updated;
        setMyPlayer(updated);
      }
    });
    const unsubAnswers = subscribeAnswers(session.id, setAnswers);
    return () => {
      unsubSession();
      unsubPlayers();
      unsubAnswers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  // Synchronise la vue avec la phase serveur
  useEffect(() => {
    if (!session) return;
    const phase = session.phase;
    const id = setTimeout(() => {
      if (phase === "playing") setView((v) => (v === "lobby" || v === "create" ? "playing" : v));
      else if (phase === "finished") setView("results");
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.phase]);

  // Timer du joueur quand la question est poussée
  useEffect(() => {
    if (view !== "playing" || revealed || !session?.current_question) return;
    const id = setTimeout(() => {
      setAnswered(false);
      setSelected(null);
      setTimeLeft(timePerQuestion);
      startRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setTimeLeft((tl) => {
          if (tl <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setAnswered(true);
            return 0;
          }
          return tl - 1;
        });
      }, 1000);
    }, 0);
    return () => {
      clearTimeout(id);
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.state_version, view, revealed]);

  async function create() {
    if (joiningRef.current) return;
    joiningRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await createRoom(pseudo, {
        mode: createMode,
        category: createCategory,
        questionCount: createCount,
        maxPlayers: createMaxPlayers,
      });
      sessionRef.current = res.session;
      setSession(res.session);
      myPlayerRef.current = res.player;
      setMyPlayer(res.player);
      localStorage.setItem("freeparty-last-room", JSON.stringify({ sessionId: res.session.id, playerId: res.player.id }));
      setView("lobby");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      joiningRef.current = false;
      setBusy(false);
    }
  }

  async function join(code?: string) {
    if (joiningRef.current) return;
    joiningRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await joinRoom((code ?? joinCode).trim().toUpperCase(), pseudo);
      sessionRef.current = res.session;
      setSession(res.session);
      myPlayerRef.current = res.player;
      setMyPlayer(res.player);
      localStorage.setItem("freeparty-last-room", JSON.stringify({ sessionId: res.session.id, playerId: res.player.id }));
      setView("lobby");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      joiningRef.current = false;
      setBusy(false);
    }
  }

  // Auto-rejoint le salon passé en paramètre d'URL (?room=CODE)
  useEffect(() => {
    if (view !== "entry" || !roomFromUrl || autoJoinedRef.current) return;
    autoJoinedRef.current = true;
    setJoinCode(roomFromUrl.toUpperCase());
    // L'utilisateur confirme son pseudo puis rejoint
  }, [view, roomFromUrl]);

  // Le host lance la partie : charge les questions, pousse la première
  async function startGame() {
    if (!session || !isHost) return;
    setError(null);
    try {
      let qs = questionsRef.current;
      if (qs.length === 0) {
        const res = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            count: session.question_count ?? 10,
            category: session.category,
            history: toSelectionHistory(entries),
          }),
        });
        if (!res.ok) throw new Error("Impossible de charger les questions");
        const data = await res.json();
        qs = data.questions ?? [];
        questionsRef.current = qs;
        setQuestions(qs);
        try {
          localStorage.setItem(`freeparty-questions-${session.id}`, JSON.stringify(qs));
        } catch {
          // quota localStorage — non bloquant
        }
      }
      if (qs.length === 0) throw new Error("Aucune question disponible");
      await hostPushQuestion(session.id, qs[0], 0, false, session.state_version ?? 0);
      setView("playing");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  // Le joueur répond
  async function sendAnswer(i: number) {
    if (answered || revealed || !session || !myPlayer) return;
    setSelected(i);
    setAnswered(true);
    const elapsed = elapsedSince(startRef.current);
    try {
      await submitAnswer(session.id, myPlayer.id, index(), i, elapsed);
    } catch {
      // idempotent : déjà répondu (23505) ou réseau — on garde la réponse locale
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }

  // Le host révèle la bonne réponse et marque les scores
  async function reveal() {
    if (!session || !isHost || !currentQuestion) return;
    const fresh = await refreshAnswers(session.id, index());
    // Si le host vient de répondre et que sa réponse n'est pas encore persistée
    if (answered && selected !== null && myPlayer) {
      const already = fresh.some((a) => a.player_id === myPlayer.id);
      if (!already) {
        fresh.push({
          id: `local-${myPlayer.id}-${index()}`,
          session_id: session.id,
          player_id: myPlayer.id,
          question_index: index(),
          answer_index: selected,
          correct: null,
          response_time_ms: null,
        } as RoomAnswer);
      }
    }
    await hostMarkAnswers(session.id, currentQuestion, fresh);
    await hostPushQuestion(session.id, currentQuestion, index(), true, session.state_version ?? 0);
    const mine = fresh.find((a) => a.player_id === myPlayer?.id);
    addEntry({
      questionId: currentQuestion.id,
      familyId: currentQuestion.familyId,
      answeredCorrectly: mine ? mine.answer_index === currentQuestion.correctAnswer : false,
    });
  }

  async function nextQuestion() {
    if (!session || !isHost) return;
    const qs = questionsRef.current;
    const nextIdx = index() + 1;
    if (nextIdx >= qs.length) {
      await finishRoom(session.id);
      setView("results");
      return;
    }
    await hostPushQuestion(session.id, qs[nextIdx], nextIdx, false, session.state_version ?? 0);
  }

  function copyCode() {
    if (!session) return;
    navigator.clipboard?.writeText(session.room_code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // Restauration après refresh : dernier salon actif + questions du host
  useEffect(() => {
    if (view !== "entry" || roomFromUrl) return;
    try {
      const raw = localStorage.getItem("freeparty-last-room");
      if (!raw) return;
      const { sessionId, playerId } = JSON.parse(raw) as { sessionId: string; playerId: string };
      const sb = getSupabaseBrowser();
      if (!sb) return;
      void (async () => {
        const { data: sess } = await sb.from("game_sessions").select("*").eq("id", sessionId).single();
        if (!sess || sess.phase === "finished") {
          localStorage.removeItem("freeparty-last-room");
          return;
        }
        const { data: pl } = await sb.from("game_players").select("*").eq("id", playerId).maybeSingle();
        if (!pl) return;
        const rawQ = localStorage.getItem(`freeparty-questions-${sessionId}`);
        if (rawQ) {
          try {
            const qs = JSON.parse(rawQ) as Question[];
            questionsRef.current = qs;
            setQuestions(qs);
          } catch {
            // ignore
          }
        }
        sessionRef.current = sess as OnlineSession;
        setSession(sess as OnlineSession);
        myPlayerRef.current = pl as OnlinePlayer;
        setMyPlayer(pl as OnlinePlayer);
        setView(sess.phase === "playing" ? "playing" : "lobby");
      })();
    } catch {
      // pas de salon en cache
    }
  }, [view, roomFromUrl]);

  async function leave() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (session && myPlayer && !isHost) {
      try {
        await leaveRoom(session.id, myPlayer.id);
      } catch {
        // best effort
      }
    }
    localStorage.removeItem("freeparty-last-room");
    localStorage.removeItem(`freeparty-questions-${session?.id ?? ""}`);
    router.push("/");
  }

  const q = session?.current_question;
  const correctAnswer = revealed ? q?.correctAnswer : undefined;
  const answeredCount = answers.filter((a) => a.question_index === index()).length;
  const pseudoValid = pseudo.trim().length >= 2;

  // ---------- Entrée : pseudo + créer / rejoindre ----------
  if (view === "entry") {
    return (
      <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-4">
        <button type="button" onClick={() => router.push("/")} className="fp-btn-ghost inline-flex items-center gap-0.5 px-2 py-1 text-[15px]">
          <ChevronLeft className="h-5 w-5" />
          Retour
        </button>

        <header className="px-1 pb-5 pt-4">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-fp-text">Jouer en ligne</h1>
          <p className="mt-1 text-[14px] text-fp-text-dim">
            Chacun sur son appareil. Pas de compte — un pseudo suffit.
          </p>
        </header>

        <SectionTitle>Ton pseudo</SectionTitle>
        <div className="fp-card p-4">
          <input
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            maxLength={20}
            placeholder="Ex : Alex"
            aria-label="Ton pseudo"
            className="fp-input w-full px-4 py-3 text-[16px] font-medium"
          />
        </div>

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={() => setView("create")}
            disabled={!pseudoValid}
            className="fp-btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-[16px]"
          >
            <Plus className="h-4.5 w-4.5" />
            Créer un salon
          </button>

          <div className="fp-card p-4">
            <label className="mb-2 block text-[13px] font-medium text-fp-text-dim" htmlFor="join-code">
              Rejoindre avec un code
            </label>
            <div className="flex gap-2">
              <input
                id="join-code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="FRTY12"
                maxLength={6}
                className="fp-input min-w-0 flex-1 px-4 py-3 text-center font-mono text-[18px] font-bold uppercase tracking-[0.3em]"
                aria-label="Code du salon"
              />
              <button
                type="button"
                onClick={() => join()}
                disabled={joinCode.trim().length < 4 || !pseudoValid || busy}
                className="fp-btn-primary px-6 py-3 text-[15px]"
              >
                Entrer
              </button>
            </div>
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl bg-fp-danger/10 px-4 py-2.5 text-[13px] text-fp-danger">{error}</p>}
      </main>
    );
  }

  // ---------- Création : options du salon ----------
  if (view === "create") {
    return (
      <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-4 animate-rise">
        <div className="flex items-center justify-between px-1 py-2">
          <button type="button" onClick={() => setView("entry")} className="fp-btn-ghost inline-flex items-center gap-0.5 px-2 py-1 text-[15px]">
            <ChevronLeft className="h-5 w-5" />
            Retour
          </button>
          <h1 className="text-[17px] font-semibold text-fp-text">Nouveau salon</h1>
          <span className="w-16" aria-hidden="true" />
        </div>

        <div className="mt-4">
          <SectionTitle>Mode de jeu</SectionTitle>
          <div className="fp-list">
            {(["classic", "rapidfire", "truefalse"] as GameMode[]).map((m) => {
              const meta = MODE_META[m];
              const selected = createMode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCreateMode(m)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-black/[0.02]"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-white ${meta.iconBg}`}>
                    <AppIcon name={meta.icon} className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-fp-text">{meta.name}</p>
                    <p className="truncate text-[13px] text-fp-text-dim">{meta.subtitle}</p>
                  </div>
                  {selected && <Check className="h-5 w-5 text-fp-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <SectionTitle>Catégorie</SectionTitle>
          <div className="fp-card p-3">
            <div className="flex flex-wrap gap-1.5">
              {(["mixed", ...CATEGORIES] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCreateCategory(c)}
                  className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition active:scale-95 ${
                    createCategory === c
                      ? "bg-fp-primary text-white"
                      : "bg-black/[0.04] text-fp-text hover:bg-black/[0.08]"
                  }`}
                >
                  {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <SectionTitle>Nombre de questions</SectionTitle>
          <div className="px-1">
            <SegmentControl
              options={QUESTION_COUNT_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
              value={String(createCount)}
              onChange={(v) => setCreateCount(Number(v))}
            />
          </div>
        </div>

        <div className="mt-6">
          <SectionTitle>Joueurs maximum</SectionTitle>
          <div className="fp-list">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[15px] text-fp-text">Places dans le salon</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCreateMaxPlayers((n) => Math.max(2, n - 1))}
                  disabled={createMaxPlayers <= 2}
                  aria-label="Moins de places"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.05] transition active:scale-95 disabled:opacity-30"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center text-[17px] font-semibold tabular-nums">{createMaxPlayers}</span>
                <button
                  type="button"
                  onClick={() => setCreateMaxPlayers((n) => Math.min(MAX_PLAYERS, n + 1))}
                  disabled={createMaxPlayers >= MAX_PLAYERS}
                  aria-label="Plus de places"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.05] transition active:scale-95 disabled:opacity-30"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={create}
          disabled={busy}
          className="fp-btn-primary mt-8 flex w-full items-center justify-center gap-2 py-3.5 text-[16px]"
        >
          <Globe className="h-4.5 w-4.5" />
          {busy ? "Création…" : "Créer le salon"}
        </button>
        {error && <p className="mt-4 rounded-xl bg-fp-danger/10 px-4 py-2.5 text-[13px] text-fp-danger">{error}</p>}
      </main>
    );
  }

  // ---------- Lobby ----------
  if (view === "lobby" && session) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-4">
        <button type="button" onClick={leave} className="fp-btn-ghost inline-flex items-center gap-0.5 px-2 py-1 text-[15px]">
          <ChevronLeft className="h-5 w-5" />
          Quitter
        </button>

        <div className="mt-6 text-center">
          <p className="text-[13px] font-medium uppercase tracking-wide text-fp-text-dim">Code du salon</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="fp-card px-6 py-3 font-mono text-[28px] font-bold tracking-[0.3em] text-fp-text">
              {session.room_code}
            </span>
            <button type="button" onClick={copyCode} aria-label="Copier le code" className="fp-btn-secondary flex h-11 w-11 items-center justify-center rounded-xl">
              {copied ? <Check className="h-4.5 w-4.5 text-fp-success" /> : <Copy className="h-4.5 w-4.5" />}
            </button>
          </div>
          <p className="mt-2 text-[13px] text-fp-text-dim">
            Partage ce code — tes amis le saisissent dans « Jouer en ligne ».
          </p>
        </div>

        <div className="mt-6">
          <SectionTitle>Joueurs ({players.length}/{session.max_players ?? MAX_PLAYERS})</SectionTitle>
          <div className="fp-list">
            {players.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <PlayerDot name={p.name} colorIndex={i} size={32} />
                <span className="flex-1 text-[15px] font-medium text-fp-text">
                  {p.name}
                  {p.user_id === myPlayer?.user_id && <span className="ml-1.5 text-[13px] text-fp-primary">(toi)</span>}
                </span>
                {p.is_host && (
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-fp-text-dim">
                    <Crown className="h-3.5 w-3.5 text-fp-warning" />
                    hôte
                  </span>
                )}
              </div>
            ))}
            {players.length < (session.max_players ?? MAX_PLAYERS) && (
              <p className="animate-pulse px-4 py-3 text-[13px] text-fp-text-dim">
                En attente d&apos;autres joueurs…
              </p>
            )}
          </div>
        </div>

        {isHost ? (
          <button
            type="button"
            onClick={startGame}
            disabled={players.length < 2}
            className="fp-btn-primary mt-6 flex w-full items-center justify-center gap-2 py-3.5 text-[16px]"
          >
            <Play className="h-4.5 w-4.5 fill-white" />
            Lancer la partie ({players.length} joueur{players.length > 1 ? "s" : ""})
          </button>
        ) : (
          <p className="mt-6 text-center text-[13px] text-fp-text-dim">En attente que l&apos;hôte lance la partie…</p>
        )}
        {error && <p className="mt-4 rounded-xl bg-fp-danger/10 px-4 py-2.5 text-[13px] text-fp-danger">{error}</p>}
      </main>
    );
  }

  // ---------- Partie ----------
  if (view === "playing" && session) {
    const qIndex = index();
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-10 pt-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={leave} className="fp-btn-ghost inline-flex items-center gap-0.5 px-2 py-1 text-[15px]" aria-label="Quitter">
            <ChevronLeft className="h-5 w-5" />
            Quitter
          </button>
          <div className="flex items-center gap-1.5" aria-label={`Question ${qIndex + 1}`}>
            {Array.from({ length: Math.min(questionCount, 20) }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i < qIndex ? "w-3 bg-fp-success" : i === qIndex ? "w-5 bg-fp-primary" : "w-1.5 bg-black/[0.1]"
                }`}
              />
            ))}
          </div>
          <span className="text-[13px] font-medium text-fp-text-dim tabular-nums">{qIndex + 1}/{questionCount}</span>
        </div>

        {!revealed && <div className="mt-4"><TimerBar seconds={timeLeft} total={timePerQuestion} /></div>}

        {q ? (
          <section className="mt-5 flex-1">
            <div className="flex items-center justify-between">
              <PillBadge>{isHost ? "Hôte · Réponds !" : "Réponds !"}</PillBadge>
              <span className="text-[12px] font-medium text-fp-text-dim tabular-nums">
                {answeredCount}/{players.length} réponses
              </span>
            </div>
            <h1 key={q.question} className="animate-rise mt-4 text-[20px] font-semibold leading-snug text-fp-text sm:text-[24px]">
              {q.question}
            </h1>

            <div className="mt-6 grid grid-cols-1 gap-2">
              {q.answers.map((answer, i) => {
                let cls = "fp-card text-fp-text hover:bg-black/[0.02]";
                if (revealed) {
                  if (i === correctAnswer) cls = "border-2 border-fp-success bg-fp-success/10 text-fp-text font-semibold";
                  else if (i === selected && i !== correctAnswer) cls = "border-2 border-fp-danger bg-fp-danger/10 text-fp-text";
                  else cls = "fp-card opacity-35";
                } else if (answered) {
                  cls = i === selected ? "border-2 border-fp-primary bg-fp-primary/10 text-fp-text" : "fp-card opacity-40";
                }
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={revealed || answered}
                    onClick={() => sendAnswer(i)}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] font-medium transition-all active:scale-[0.98] ${cls}`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-[13px] font-semibold text-fp-text-dim">
                      {["A", "B", "C", "D"][i]}
                    </span>
                    <span className="flex-1">{answer}</span>
                  </button>
                );
              })}
            </div>

            {revealed && q.explanation && (
              <p className="animate-rise mt-4 rounded-2xl bg-black/[0.03] px-4 py-3 text-[13px] leading-relaxed text-fp-text-dim">
                {q.explanation}
              </p>
            )}
          </section>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-black/10 border-t-fp-primary" />
            <p className="mt-4 text-[13px] text-fp-text-dim">Préparation des questions…</p>
          </div>
        )}

        {/* Contrôles du host */}
        {isHost && (
          <div className="mt-6 flex gap-3">
            {!revealed ? (
              <button type="button" onClick={reveal} disabled={!q} className="fp-btn-primary flex flex-1 items-center justify-center gap-2 py-3 text-[15px]">
                <Eye className="h-4 w-4" />
                Révéler la réponse
              </button>
            ) : (
              <button type="button" onClick={nextQuestion} className="fp-btn-primary flex flex-1 items-center justify-center gap-2 py-3 text-[15px]">
                {index() >= questions.length - 1 ? "Voir le classement" : "Question suivante"}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        {answered && !revealed && (
          <p className="mt-5 animate-pulse text-center text-[13px] text-fp-text-dim">
            {isHost ? "Réponse envoyée — révèle quand tout le monde a joué" : "Réponse envoyée — en attente du salon…"}
          </p>
        )}
      </main>
    );
  }

  // ---------- Résultats ----------
  if (view === "results") {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-16 pt-10">
        <Confetti />
        <div className="text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-fp-warning/15 text-fp-warning">
            <Trophy className="h-7 w-7" />
          </div>
          <h1 className="mt-3 text-[26px] font-bold text-fp-text">Partie terminée</h1>
          {sorted[0] && <p className="mt-1 text-[14px] text-fp-text-dim">{sorted[0].name} remporte la partie</p>}
        </div>

        <div className="fp-list mt-8">
          {sorted.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-5 text-center text-[15px] font-semibold text-fp-text-dim tabular-nums">{i + 1}</span>
              <PlayerDot name={p.name} colorIndex={players.indexOf(p)} size={32} />
              <span className="flex-1 text-[15px] font-medium text-fp-text">
                {p.name}
                {p.user_id === myPlayer?.user_id && <span className="ml-1.5 text-[13px] text-fp-primary">(toi)</span>}
              </span>
              <span className="text-[15px] font-semibold text-fp-text tabular-nums">{p.score} pts</span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex w-full gap-3">
          <button type="button" onClick={leave} className="fp-btn-secondary flex-1 py-3 text-[15px]">Accueil</button>
          {isHost && (
            <button type="button" onClick={startGame} className="fp-btn-primary flex-1 py-3 text-[15px]">Rejouer</button>
          )}
        </div>
      </main>
    );
  }

  return null;
}
