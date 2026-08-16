"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useLanguageStore } from "@/lib/store/language";
import { translate } from "@/lib/i18n";
import { useGameStore } from "@/lib/store/game";
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
import type { Question } from "@/lib/questions/schema";
import { TimerBar, Confetti } from "@/components/ui/primitives";

type View = "auth" | "home" | "lobby" | "playing" | "results";

export function OnlineRoom() {
  const router = useRouter();
  const lang = useLanguageStore((s) => s.language);
  const config = useGameStore((s) => s.config);
  const { entries } = useHistoryStore();

  const [view, setView] = useState<View>("auth");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<OnlineSession | null>(null);
  const [players, setPlayers] = useState<OnlinePlayer[]>([]);
  const [answers, setAnswers] = useState<RoomAnswer[]>([]);
  const [myPlayer, setMyPlayer] = useState<OnlinePlayer | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const questionsRef = useRef<Question[]>([]);
  const answersRef = useRef<RoomAnswer[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef<OnlineSession | null>(null);
  const myPlayerRef = useRef<OnlinePlayer | null>(null);
  const startRef = useRef(0);
  const joiningRef = useRef(false);

  const t = (k: string) => translate(lang, k);
  const isHost = myPlayer?.is_host === true;
  const currentQuestion: Question | null =
    questions[index()] ?? (session?.current_question as Question | null) ?? null;
  const revealed = session?.answers_revealed ?? false;
  const timePerQuestion = config?.timePerQuestion ?? 15;
  const questionCount = session?.question_count ?? questions.length ?? 10;

  function index() {
    return session?.question_index ?? 0;
  }

  // Vérifie l'auth au montage
  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) {
      queueMicrotask(() => setError("Supabase non configuré"));
      return;
    }
    sb.auth.getUser().then(({ data }) => {
      if (data.user) {
        setView("home");
      } else {
        setView("auth");
      }
    });
  }, []);

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
    const unsubAnswers = subscribeAnswers(session.id, (a) => {
      answersRef.current = a;
      setAnswers(a);
    });
    return () => {
      unsubSession();
      unsubPlayers();
      unsubAnswers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  // CRITIQUE (audit) : synchronise la vue avec la phase serveur —
  // le joiner doit quitter le lobby quand le host lance, et voir les résultats
  useEffect(() => {
    if (!session) return;
    const phase = session.phase;
    const id = setTimeout(() => {
      if (phase === "playing") setView((v) => (v === "lobby" ? "playing" : v));
      else if (phase === "finished") setView("results");
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.phase]);

  // Timer du joueur quand la question est poussée
  useEffect(() => {
    if (view !== "playing" || revealed || !session?.current_question || isHost) return;
    // Reset asynchrone pour éviter les cascades de rendu
    const id = setTimeout(() => {
      setAnswered(false);
      setSelected(null);
      setTimeLeft(timePerQuestion);
      startRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setTimeLeft((tl) => {
          if (tl <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setAnswered(true); // timeout : on ne peut plus répondre
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

  // Le host : quand une nouvelle question démarre, on remet à zéro les réponses locales
  useEffect(() => {
    if (view === "playing" && isHost && session) {
      void refreshAnswers(session.id, index()).then((a) => {
        answersRef.current = a;
        setAnswers(a);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.question_index, session?.answers_revealed, view]);

  async function create() {
    if (joiningRef.current) return;
    joiningRef.current = true;
    setError(null);
    try {
      const res = await createRoom({
        mode: config?.mode ?? "classic",
        category: config?.category ?? "mixed",
        questionCount: config?.questionCount ?? 10,
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
    }
  }

  async function join() {
    if (joiningRef.current) return;
    joiningRef.current = true;
    setError(null);
    try {
      const res = await joinRoom(joinCode);
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
    }
  }

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
        // Persiste pour une reprise après refresh (audit)
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
    if (answered || revealed || !session || !myPlayer || isHost) return;
    setSelected(i);
    setAnswered(true);
    const elapsed = Math.max(0, Date.now() - startRef.current);
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
    // Audit : rafraîchit les réponses AVANT de marquer (course au clic)
    const fresh = await refreshAnswers(session.id, index());
    answersRef.current = fresh;
    await hostMarkAnswers(session.id, currentQuestion, fresh);
    await hostPushQuestion(session.id, currentQuestion, index(), true, session.state_version ?? 0);
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
    await hostPushQuestion(session.id, qs[nextIdx], nextIdx, false);
  }

  function copyCode() {
    if (!session) return;
    navigator.clipboard?.writeText(session.room_code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // Restauration après refresh (audit) : dernier salon actif + questions du host
  useEffect(() => {
    if (view !== "home") return;
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
        // Questions du host restaurées
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
  }, [view]);

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

  // ---------- RENDU ----------
  if (view === "auth") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl" aria-hidden="true">🌍</div>
        <h1 className="mt-4 font-display text-3xl font-bold">{t("online.title")}</h1>
        <p className="mt-2 max-w-sm text-fp-text-dim">{t("online.needAuth")}</p>
        {error && <p className="mt-4 rounded-xl bg-fp-danger/10 px-4 py-2.5 text-sm text-fp-danger">{error}</p>}
        <button type="button" onClick={() => router.push("/auth")} className="fp-btn-primary mt-8">
          {t("auth.login")} / {t("auth.register")}
        </button>
      </main>
    );
  }

  if (view === "home") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-10 pt-6">
        <button type="button" onClick={() => router.push("/")} className="text-sm text-fp-text-dim">← {t("config.back")}</button>
        <h1 className="mt-4 font-display text-3xl font-bold">🌍 {t("online.title")}</h1>
        <p className="mt-1 text-fp-text-dim">
          {lang === "fr" ? "Crée un salon et partage le code avec tes amis — chacun joue sur son appareil." : "Create a room and share the code — everyone plays on their own device."}
        </p>

        <div className="fp-card mt-6 p-6">
          <h2 className="font-display text-lg font-bold">{t("online.create")}</h2>
          <p className="mt-1 text-sm text-fp-text-dim">
            {config
              ? lang === "fr" ? `Config actuelle : ${config.mode} · ${config.category}` : `Current config: ${config.mode} · ${config.category}`
              : lang === "fr" ? "Utilise la configuration de ta dernière partie (ou reviens configurer sur l'accueil)." : "Uses your latest game config (or configure from home)."}
          </p>
          <button type="button" onClick={create} className="fp-btn-primary mt-4 w-full">
            🏠 {t("online.create")}
          </button>
        </div>

        <div className="fp-card mt-4 p-6">
          <h2 className="font-display text-lg font-bold">{t("online.join")}</h2>
          <div className="mt-3 flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder={t("online.codePlaceholder")}
              maxLength={6}
              className="flex-1 rounded-full border border-fp-border bg-fp-surface px-4 py-3 text-center font-mono text-lg font-bold uppercase tracking-widest outline-none focus:border-fp-primary"
              aria-label={t("online.code")}
            />
            <button type="button" onClick={join} disabled={joinCode.length < 4} className="fp-btn-primary disabled:opacity-40">
              {t("online.enterCode")}
            </button>
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl bg-fp-danger/10 px-4 py-2.5 text-sm text-fp-danger">{error}</p>}
      </main>
    );
  }

  if (view === "lobby" && session) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-10 pt-6">
        <button type="button" onClick={leave} className="text-sm text-fp-text-dim">✕ {t("online.leave")}</button>

        <div className="mt-6 text-center">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-fp-text-dim">{t("online.yourCode")}</h2>
          <div className="mt-2 flex items-center justify-center gap-3">
            <span className="rounded-2xl border border-fp-primary/40 bg-fp-primary/10 px-6 py-3 font-mono text-3xl font-bold tracking-[0.3em] text-white">
              {session.room_code}
            </span>
            <button type="button" onClick={copyCode} className="fp-btn-ghost px-4 py-3 text-sm">
              {copied ? t("online.copied") : t("online.copy")}
            </button>
          </div>
          <p className="mt-2 text-sm text-fp-text-dim">
            {lang === "fr" ? "Partage ce code — l'autre joueur va sur freeparty.vercel.app → Jouer en ligne → Rejoindre." : "Share this code — the other player goes to freeparty.vercel.app → Play online → Join."}
          </p>
        </div>

        <div className="fp-card mt-6 p-5">
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-fp-text-dim">
            {t("online.players")} ({players.length})
          </h3>
          <div className="mt-3 space-y-2">
            {players.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5">
                <span className="font-semibold">
                  {p.name} {p.user_id === myPlayer?.user_id && <span className="text-fp-accent-2">{t("online.you")}</span>}
                  {p.is_host && <span className="ml-1 text-xs text-fp-text-dim">{t("online.host")}</span>}
                </span>
                <span className="text-xs text-fp-text-dim">{p.score} pts</span>
              </div>
            ))}
            {players.length < 2 && (
              <p className="animate-pulse rounded-xl border border-dashed border-fp-border px-4 py-3 text-sm text-fp-text-dim">
                {t("online.waiting")}
              </p>
            )}
          </div>
        </div>

        {isHost ? (
          <button type="button" onClick={startGame} disabled={players.length < 2} className="fp-btn-primary mt-6 w-full text-lg disabled:opacity-40">
            🚀 {t("online.start")} ({players.length}/2+)
          </button>
        ) : (
          <p className="mt-6 text-center text-fp-text-dim">{lang === "fr" ? "En attente que l'hôte lance la partie…" : "Waiting for the host to start…"}</p>
        )}
        {error && <p className="mt-4 rounded-xl bg-fp-danger/10 px-4 py-2.5 text-sm text-fp-danger">{error}</p>}
      </main>
    );
  }

  if (view === "playing" && session) {
    const qIndex = index();
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-10 pt-6">
        <div className="flex items-center justify-between">
          <button type="button" onClick={leave} className="text-sm text-fp-text-dim" aria-label={t("online.leave")}>✕</button>
          <div className="flex items-center gap-1.5" aria-label={`Question ${qIndex + 1}`}>
            {Array.from({ length: Math.min(questionCount, 10) }).map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i < qIndex ? "w-4 bg-fp-success" : i === qIndex ? "w-6 bg-fp-primary" : "w-2 bg-white/15"}`} />
            ))}
          </div>
          <span className="text-sm font-semibold text-fp-text-dim">{qIndex + 1}/{questionCount}</span>
        </div>

        {!isHost && !revealed && <div className="mt-5"><TimerBar seconds={timeLeft} total={timePerQuestion} /></div>}

        {q ? (
          <section className="mt-6 flex-1">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-fp-border bg-fp-surface px-3 py-1 text-xs font-semibold text-fp-text-dim">
                {isHost ? `🎮 ${t("online.host")}` : t("online.answer")}
              </span>
              <span className="text-xs text-fp-text-dim">{answeredCount}/{players.length} ✓</span>
            </div>
            <h1 key={q.question} className="animate-rise mt-4 font-display text-2xl font-bold leading-snug">{q.question}</h1>

            <div className="mt-6 grid gap-3">
              {q.answers.map((answer, i) => {
                let cls = "border-fp-border bg-fp-surface hover:border-fp-primary";
                if (revealed) {
                  if (i === correctAnswer) cls = "animate-pop border-fp-success bg-fp-success/15 text-fp-success";
                  else if (i === selected) cls = "animate-shake border-fp-danger bg-fp-danger/15 text-fp-danger";
                  else cls = "border-fp-border bg-fp-surface opacity-40";
                } else if (answered && !isHost) {
                  cls = i === selected ? "border-fp-primary bg-fp-primary/15" : "border-fp-border bg-fp-surface opacity-40";
                }
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={revealed || (answered && !isHost) || isHost}
                    onClick={() => sendAnswer(i)}
                    className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left font-semibold transition-all active:scale-[0.98] ${cls}`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold">{["A", "B", "C", "D"][i]}</span>
                    <span className="flex-1">{answer}</span>
                    {revealed && i === correctAnswer && <span aria-hidden="true">✓</span>}
                    {revealed && i === selected && i !== correctAnswer && <span aria-hidden="true">✗</span>}
                  </button>
                );
              })}
            </div>

            {revealed && q.explanation && (
              <p className="animate-rise mt-4 rounded-2xl border border-fp-border bg-fp-surface/60 px-4 py-3 text-sm text-fp-text-dim">💡 {q.explanation}</p>
            )}
          </section>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="animate-pulse text-5xl">🎲</div>
            <p className="mt-4 text-fp-text-dim">{t("loading.prep")}</p>
          </div>
        )}

        {/* Contrôles du host */}
        {isHost && (
          <div className="mt-6 flex gap-3">
            {!revealed ? (
              <button type="button" onClick={reveal} disabled={!q} className="fp-btn-primary flex-1">
                👁️ {t("online.reveal")}
              </button>
            ) : (
              <button type="button" onClick={nextQuestion} className="fp-btn-primary flex-1">
                {index() >= questions.length - 1 ? "🏁 " + t("online.results") : "➡️ " + t("online.next")}
              </button>
            )}
          </div>
        )}
        {!isHost && answered && !revealed && (
          <p className="mt-6 animate-pulse text-center text-sm text-fp-text-dim">
            {lang === "fr" ? "Réponse envoyée — en attente du hôte…" : "Answer sent — waiting for the host…"}
          </p>
        )}
      </main>
    );
  }

  if (view === "results") {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-10 pt-8">
        <Confetti />
        <div className="text-center">
          <div className="animate-pop text-6xl">🏆</div>
          <h1 className="mt-3 font-display text-3xl font-bold">{t("online.finished")}</h1>
        </div>
        <div className="fp-card mt-8 p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-fp-text-dim">{t("online.players")}</h2>
          <div className="mt-3 space-y-2">
            {sorted.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                <span className="font-semibold">
                  {i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : ""}
                  {p.name} {p.user_id === myPlayer?.user_id && <span className="text-fp-accent-2">{t("online.you")}</span>}
                </span>
                <span className="font-bold text-fp-accent">{p.score} {t("game.score")}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex w-full gap-3">
          <button type="button" onClick={leave} className="fp-btn-ghost flex-1">{t("config.back")}</button>
          {isHost && (
            <button type="button" onClick={startGame} className="fp-btn-primary flex-1">{t("online.again")}</button>
          )}
        </div>
      </main>
    );
  }

  return null;
}
