"use client";

/**
 * Free Party — Salon en ligne (Apple HIG Design)
 * Pseudo (sans compte) → créer un salon avec options (mode, catégorie,
 * questions, joueurs max) ou rejoindre avec un code → partie synchronisée en temps réel.
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
import { localizeQuestion } from "@/lib/questions/localize";
import { useLanguageStore } from "@/lib/store/language";
import { CATEGORIES, type QuestionCategory } from "@/lib/questions/schema";
import type { Question } from "@/lib/questions/schema";
import type { GameMode } from "@/lib/store/game";
import { TimerBar, Confetti, PlayerDot, SegmentControl, SectionTitle, PillBadge } from "@/components/ui/primitives";
import { KawaiiMascot } from "@/components/ui/kawaii-mascot";
import { AppIcon } from "@/components/ui/icons";
import { Globe, Trophy, Play, Eye, ArrowRight, ChevronLeft, Minus, Plus, Copy, Check, Crown, Users } from "lucide-react";

type View = "entry" | "create" | "lobby" | "playing" | "results";

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

  useEffect(() => {
    if (view !== "entry" || !roomFromUrl || autoJoinedRef.current) return;
    autoJoinedRef.current = true;
    setJoinCode(roomFromUrl.toUpperCase());
  }, [view, roomFromUrl]);

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
          // localStorage non bloquant
        }
      }
      if (qs.length === 0) throw new Error("Aucune question disponible");
      await hostPushQuestion(session.id, qs[0], 0, false, session.state_version ?? 0);
      setView("playing");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function sendAnswer(i: number) {
    if (answered || revealed || !session || !myPlayer) return;
    setSelected(i);
    setAnswered(true);
    const elapsed = elapsedSince(startRef.current);
    try {
      await submitAnswer(session.id, myPlayer.id, index(), i, elapsed);
    } catch {
      // idempotent
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function reveal() {
    if (!session || !isHost || !currentQuestion) return;
    const fresh = await refreshAnswers(session.id, index());
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
      // pas de cache
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
  const lang = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const qLocal = q ? localizeQuestion(q, lang) : null;
  const correctAnswer = revealed ? q?.correctAnswer : undefined;
  const answeredCount = answers.filter((a) => a.question_index === index()).length;
  const pseudoValid = pseudo.trim().length >= 2;

  // ---------- Vue 1 : Entrée (Pseudo + Créer / Rejoindre) ----------
  if (view === "entry") {
    return (
      <main className="mx-auto w-full max-w-xl sm:max-w-2xl px-4 sm:px-6 pb-20 pt-4 animate-rise">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="fp-btn-ghost inline-flex items-center gap-1 px-2 py-1 text-[16px]"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Accueil</span>
        </button>

        <header className="px-1 pb-6 pt-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#34c759]/10 px-3 py-1 text-[12px] font-semibold text-[#34c759]">
            <Globe className="h-3.5 w-3.5" />
            Multijoueur Connecté
          </div>
          <h1 className="mt-2 text-[30px] sm:text-[36px] font-bold leading-tight tracking-tight text-fp-text">
            Salons en ligne
          </h1>
          <p className="mt-1 text-[15px] text-fp-text-dim">
            Rejoignez une partie avec vos amis, chacun sur son écran sans inscription.
          </p>
        </header>

        <SectionTitle>Votre pseudo</SectionTitle>
        <div className="fp-card p-4 flex items-center gap-3">
          <PlayerDot name={pseudo || "?"} colorIndex={0} size={38} />
          <input
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            maxLength={20}
            placeholder="Ex : Alex"
            aria-label="Votre pseudo"
            className="fp-input flex-1 px-4 py-3 text-[16px] font-medium"
          />
        </div>

        <SectionTitle>Langue des questions</SectionTitle>
        <div className="fp-card flex gap-2 p-2.5">
          {(["fr", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLanguage(l)}
              className={`flex-1 rounded-xl py-3 text-[14px] font-semibold transition-all active:scale-[0.98] ${
                lang === l
                  ? "bg-fp-primary text-white shadow-xs"
                  : "bg-black/[0.04] text-fp-text-dim hover:bg-black/[0.07]"
              }`}
            >
              {l === "fr" ? "🇫🇷 Français" : "🇬🇧 English"}
            </button>
          ))}
        </div>
        <p className="mt-2 px-1 text-[12px] text-fp-text-dim">
          Chaque joueur du salon verra les questions dans sa langue préférée.
        </p>

        <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setView("create")}
            disabled={!pseudoValid}
            className="fp-btn-primary flex items-center justify-center gap-2 py-4 text-[16px]"
          >
            <Plus className="h-5 w-5" />
            <span>Créer un salon</span>
          </button>

          <div className="fp-card p-3.5 flex flex-col justify-between">
            <div className="flex gap-2">
              <input
                id="join-code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="CODE PIN"
                maxLength={6}
                className="fp-input min-w-0 flex-1 px-3 text-center font-mono text-[17px] font-bold uppercase tracking-widest"
                aria-label="Code du salon"
              />
              <button
                type="button"
                onClick={() => join()}
                disabled={joinCode.trim().length < 4 || !pseudoValid || busy}
                className="fp-btn-secondary px-5 text-[15px]"
              >
                Entrer
              </button>
            </div>
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl bg-fp-danger/10 px-4 py-3 text-[13px] text-fp-danger">{error}</p>}
      </main>
    );
  }

  // ---------- Vue 2 : Création de salon ----------
  if (view === "create") {
    return (
      <main className="mx-auto w-full max-w-xl sm:max-w-2xl px-4 sm:px-6 pb-20 pt-4 animate-rise">
        <div className="flex items-center justify-between px-1 py-2">
          <button
            type="button"
            onClick={() => setView("entry")}
            className="fp-btn-ghost inline-flex items-center gap-1 px-2 py-1 text-[16px]"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Retour</span>
          </button>
          <h1 className="text-[17px] font-semibold text-fp-text">Options du salon</h1>
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
                  className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-black/[0.02] active:bg-black/[0.04]"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${meta.iconBg}`}>
                    <AppIcon name={meta.icon} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-fp-text">{meta.name}</p>
                    <p className="truncate text-[13px] text-fp-text-dim">{meta.subtitle}</p>
                  </div>
                  {selected && <Check className="h-5 w-5 text-fp-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <SectionTitle>Catégorie</SectionTitle>
          <div className="fp-card p-3">
            <div className="flex flex-wrap gap-2">
              {(["mixed", ...CATEGORIES] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCreateCategory(c)}
                  className={`rounded-full px-3.5 py-2 text-[13px] font-medium transition active:scale-95 ${
                    createCategory === c
                      ? "bg-fp-primary text-white shadow-xs"
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
              options={QUESTION_COUNT_OPTIONS.map((n) => ({ value: String(n), label: `${n} questions` }))}
              value={String(createCount)}
              onChange={(v) => setCreateCount(Number(v))}
            />
          </div>
        </div>

        <div className="mt-6">
          <SectionTitle>Capacité du salon</SectionTitle>
          <div className="fp-list">
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[15px] font-medium text-fp-text">Joueurs max</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCreateMaxPlayers((n) => Math.max(2, n - 1))}
                  disabled={createMaxPlayers <= 2}
                  aria-label="Moins de places"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.05] transition active:scale-95 disabled:opacity-30"
                >
                  <Minus className="h-4.5 w-4.5" />
                </button>
                <span className="w-7 text-center text-[17px] font-semibold tabular-nums text-fp-text">{createMaxPlayers}</span>
                <button
                  type="button"
                  onClick={() => setCreateMaxPlayers((n) => Math.min(MAX_PLAYERS, n + 1))}
                  disabled={createMaxPlayers >= MAX_PLAYERS}
                  aria-label="Plus de places"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.05] transition active:scale-95 disabled:opacity-30"
                >
                  <Plus className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={create}
          disabled={busy}
          className="fp-btn-primary mt-8 flex w-full items-center justify-center gap-2 py-4 text-[16px]"
        >
          <Globe className="h-5 w-5" />
          <span>{busy ? "Création du salon…" : "Créer et ouvrir le salon"}</span>
        </button>
        {error && <p className="mt-4 rounded-xl bg-fp-danger/10 px-4 py-3 text-[13px] text-fp-danger">{error}</p>}
      </main>
    );
  }

  // ---------- Vue 3 : Lobby d'attente (AirDrop style) ----------
  if (view === "lobby" && session) {
    return (
      <main className="mx-auto w-full max-w-xl sm:max-w-2xl px-4 sm:px-6 pb-20 pt-4 animate-rise">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={leave}
            className="fp-btn-ghost inline-flex items-center gap-1 px-2 py-1 text-[16px]"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Quitter</span>
          </button>
          <PillBadge colorClass="bg-fp-primary/10 text-fp-primary">
            Salon en direct
          </PillBadge>
          <span className="w-16" aria-hidden="true" />
        </div>

        {/* Carte Code PIN centrale */}
        <div className="mt-6 fp-card p-6 text-center border border-black/[0.04]">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-fp-text-dim">
            Code d&apos;accès au salon
          </p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="rounded-2xl bg-black/[0.04] px-6 py-3 font-mono text-[32px] font-bold tracking-[0.25em] text-fp-text">
              {session.room_code}
            </span>
            <button
              type="button"
              onClick={copyCode}
              aria-label="Copier le code"
              className="fp-btn-secondary flex h-14 w-14 items-center justify-center rounded-2xl"
            >
              {copied ? <Check className="h-6 w-6 text-fp-success" /> : <Copy className="h-6 w-6" />}
            </button>
          </div>
          <p className="mt-3 text-[13px] text-fp-text-dim">
            Partagez ce code avec vos amis pour qu&apos;ils rejoignent la partie.
          </p>
        </div>

        {/* Grille des participants */}
        <div className="mt-6">
          <div className="flex items-center justify-between px-1 pb-2">
            <SectionTitle>Participants ({players.length}/{session.max_players ?? MAX_PLAYERS})</SectionTitle>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {players.map((p, i) => (
              <div
                key={p.id}
                className="fp-card flex items-center gap-3 p-3.5 border border-black/[0.04]"
              >
                <PlayerDot name={p.name} colorIndex={i} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-fp-text truncate">
                    {p.name}
                    {p.user_id === myPlayer?.user_id && (
                      <span className="ml-1.5 text-[12px] font-normal text-fp-primary">(vous)</span>
                    )}
                  </p>
                </div>
                {p.is_host && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-fp-warning/15 px-2.5 py-0.5 text-[11px] font-semibold text-fp-warning">
                    <Crown className="h-3 w-3" />
                    Hôte
                  </span>
                )}
              </div>
            ))}
          </div>

          {players.length < (session.max_players ?? MAX_PLAYERS) && (
            <div className="mt-6 flex flex-col items-center justify-center text-center">
              <KawaiiMascot theme="waiting" size={96} animation="float" className="shadow-md" />
              <p className="mt-3 text-[14px] font-medium text-fp-text">
                En attente d&apos;autres joueurs…
              </p>
              <p className="text-[12px] text-fp-text-dim">
                Chacun regarde son portable et rejoint avec le code !
              </p>
            </div>
          )}
        </div>

        {isHost ? (
          <button
            type="button"
            onClick={startGame}
            disabled={players.length < 2}
            className="fp-btn-primary mt-8 flex w-full items-center justify-center gap-2 py-4 text-[17px]"
          >
            <Play className="h-5 w-5 fill-white" />
            <span>Lancer la partie ({players.length} joueur{players.length > 1 ? "s" : ""})</span>
          </button>
        ) : (
          <div className="fp-card mt-8 p-5 text-center flex flex-col items-center justify-center">
            <KawaiiMascot theme="waiting" size={80} animation="wobble" className="mb-2" />
            <p className="text-[15px] font-bold text-fp-text">Prépare-toi sur ton écran !</p>
            <p className="text-[13px] text-fp-text-dim">L&apos;hôte va lancer la partie d&apos;un instant à l&apos;autre…</p>
          </div>
        )}
        {error && <p className="mt-4 rounded-xl bg-fp-danger/10 px-4 py-3 text-[13px] text-fp-danger">{error}</p>}
      </main>
    );
  }

  // ---------- Vue 4 : En jeu (Game Screen) ----------
  if (view === "playing" && session) {
    const qIndex = index();
    const myAnswer = selected;
    const isOnlineCorrect = revealed && myAnswer === correctAnswer;
    const isOnlineWrong = revealed && myAnswer !== null && myAnswer !== correctAnswer;

    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl sm:max-w-3xl flex-col px-4 sm:px-6 pb-12 pt-3 animate-rise">
        {/* Navigation & Question Indicator */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={leave}
            className="fp-btn-ghost inline-flex items-center gap-1 px-2 py-1 text-[15px]"
            aria-label="Quitter"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Quitter</span>
          </button>
          
          <div className="flex items-center gap-1.5" aria-label={`Question ${qIndex + 1}`}>
            {Array.from({ length: Math.min(questionCount, 20) }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i < qIndex ? "w-3 bg-fp-success" : i === qIndex ? "w-6 bg-fp-primary" : "w-1.5 bg-black/[0.1]"
                }`}
              />
            ))}
          </div>

          <span className="text-[14px] font-semibold text-fp-text-dim tabular-nums">
            {qIndex + 1}/{questionCount}
          </span>
        </div>

        {/* Timer Bar */}
        {!revealed && (
          <div className="mt-4">
            <TimerBar seconds={timeLeft} total={timePerQuestion} />
          </div>
        )}

        {q ? (
          <section className="mt-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <PillBadge colorClass="bg-fp-primary/10 text-fp-primary">
                  {isHost ? "Hôte · Répondez !" : "À vous de jouer !"}
                </PillBadge>
                <span className="text-[13px] font-medium text-fp-text-dim tabular-nums">
                  {answeredCount}/{players.length} ont répondu
                </span>
              </div>

              {/* Mascotte interactive temps réel */}
              <div className="mt-4 flex items-center gap-3.5 rounded-2xl bg-white p-3.5 border border-black/[0.04] shadow-xs">
                {!answered && !revealed && (
                  <>
                    <KawaiiMascot theme="thinking" size={62} animation="float" />
                    <div>
                      <p className="text-[14px] font-bold text-fp-text">À toi de réfléchir 🤔</p>
                      <p className="text-[12px] text-fp-text-dim">Sélectionne vite ta réponse avant la fin du chrono !</p>
                    </div>
                  </>
                )}
                {answered && !revealed && (
                  <>
                    <KawaiiMascot theme="waiting" size={62} animation="wobble" />
                    <div>
                      <p className="text-[14px] font-bold text-fp-primary">Réponse validée ! 📱</p>
                      <p className="text-[12px] text-fp-text-dim">Patiente pendant que les autres joueurs répondent.</p>
                    </div>
                  </>
                )}
                {isOnlineCorrect && (
                  <>
                    <KawaiiMascot theme="happy" size={62} animation="pop" />
                    <div>
                      <p className="text-[14px] font-bold text-fp-success">Bravo ! Bonne réponse 🎉</p>
                      <p className="text-[12px] text-fp-text-dim">Tu marques des points pour le classement !</p>
                    </div>
                  </>
                )}
                {isOnlineWrong && (
                  <>
                    <KawaiiMascot theme="sad" size={62} animation="pop" />
                    <div>
                      <p className="text-[14px] font-bold text-fp-danger">Aïe… Mauvaise réponse 😢</p>
                      <p className="text-[12px] text-fp-text-dim">La bonne réponse est indiquée en vert.</p>
                    </div>
                  </>
                )}
              </div>

              <h1
                key={qLocal!.question}
                className="animate-rise mt-4 text-[22px] sm:text-[28px] font-bold leading-snug text-fp-text"
              >
                {qLocal!.question}
              </h1>

              {/* 4 Cartes de réponses (2x2 sur iPad, 1 col sur mobile) */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {qLocal!.answers.map((answer, i) => {
                  let cls = "fp-card text-fp-text hover:bg-black/[0.02]";
                  if (revealed) {
                    if (i === correctAnswer) {
                      cls = "border-2 border-fp-success bg-fp-success/10 text-fp-text font-semibold shadow-xs";
                    } else if (i === selected && i !== correctAnswer) {
                      cls = "border-2 border-fp-danger bg-fp-danger/10 text-fp-text";
                    } else {
                      cls = "fp-card opacity-35";
                    }
                  } else if (answered) {
                    cls = i === selected
                      ? "border-2 border-fp-primary bg-fp-primary/10 text-fp-text font-semibold shadow-xs"
                      : "fp-card opacity-40";
                  }

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={revealed || answered}
                      onClick={() => sendAnswer(i)}
                      className={`flex min-h-[64px] items-center gap-3.5 rounded-2xl px-5 py-4 text-left text-[16px] font-medium transition-all active:scale-[0.98] ${cls}`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-[14px] font-bold text-fp-text-dim">
                        {["A", "B", "C", "D"][i]}
                      </span>
                      <span className="flex-1 leading-snug">{answer}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explication */}
              {revealed && qLocal?.explanation && (
                <div className="animate-rise mt-5 rounded-2xl bg-black/[0.03] p-4 text-[14px] leading-relaxed text-fp-text-dim">
                  <strong className="block text-[12px] font-semibold uppercase tracking-wider text-fp-text mb-1">
                    Explication
                  </strong>
                  {qLocal.explanation}
                </div>
              )}
            </div>

            {/* Contrôles de l'hôte */}
            {isHost && (
              <div className="mt-8 flex gap-3">
                {!revealed ? (
                  <button
                    type="button"
                    onClick={reveal}
                    disabled={!q}
                    className="fp-btn-primary flex flex-1 items-center justify-center gap-2 py-4 text-[16px]"
                  >
                    <Eye className="h-5 w-5" />
                    <span>Révéler la réponse</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={nextQuestion}
                    className="fp-btn-primary flex flex-1 items-center justify-center gap-2 py-4 text-[16px]"
                  >
                    <span>{index() >= questions.length - 1 ? "Voir le classement final" : "Question suivante"}</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {answered && !revealed && (
              <p className="mt-6 text-center text-[14px] font-medium text-fp-text-dim animate-pulse">
                {isHost ? "Votre réponse est enregistrée — révélez dès que tout le monde est prêt" : "Réponse envoyée — en attente des autres joueurs…"}
              </p>
            )}
          </section>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-black/10 border-t-fp-primary" />
            <p className="mt-4 text-[14px] text-fp-text-dim">Préparation des questions…</p>
          </div>
        )}
      </main>
    );
  }

  // ---------- Vue 5 : Résultats / Podium ----------
  if (view === "results") {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const winner = sorted[0];

    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-xl sm:max-w-2xl flex-col px-4 sm:px-6 pb-20 pt-10 animate-rise">
        <Confetti />
        
        <div className="text-center">
          <div className="mx-auto mb-2 flex justify-center">
            <KawaiiMascot theme="party" size={88} className="border border-black/[0.05] shadow-sm" />
          </div>
          <h1 className="mt-3 text-[28px] sm:text-[34px] font-bold text-fp-text">Partie terminée</h1>
          {winner && (
            <p className="mt-1 text-[16px] text-fp-text-dim">
              🎉 <strong>{winner.name}</strong> remporte la victoire avec {winner.score} points !
            </p>
          )}
        </div>

        {/* Classement style Apple Fitness */}
        <div className="fp-list mt-8">
          {sorted.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3.5 px-4 py-3.5">
              <span className="w-6 text-center text-[16px] font-bold text-fp-text-dim tabular-nums">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
              </span>
              <PlayerDot name={p.name} colorIndex={players.indexOf(p)} size={36} />
              <span className="flex-1 text-[16px] font-semibold text-fp-text">
                {p.name}
                {p.user_id === myPlayer?.user_id && (
                  <span className="ml-1.5 text-[13px] font-normal text-fp-primary">(vous)</span>
                )}
              </span>
              <span className="rounded-full bg-black/[0.04] px-3 py-1 text-[15px] font-bold text-fp-text tabular-nums">
                {p.score} pts
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex w-full gap-3">
          <button
            type="button"
            onClick={leave}
            className="fp-btn-secondary flex-1 py-4 text-[16px]"
          >
            Accueil
          </button>
          {isHost && (
            <button
              type="button"
              onClick={startGame}
              className="fp-btn-primary flex-1 py-4 text-[16px]"
            >
              Rejouer une partie
            </button>
          )}
        </div>
      </main>
    );
  }

  return null;
}
