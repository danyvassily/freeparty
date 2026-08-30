"use client";

/**
 * JOUXTA — Mode Débat (Apple HIG & Mascottes Kawaii)
 * Pas de gagnant : temps de parole équitable, relances, vote avant/après.
 * Mascotte Conférence en cours de débat et Mascotte qui a eu très chaud à la fin !
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DebatePrompt, DebateVote } from "@/lib/debate/schema";
import {
  createDebate,
  transition,
  nextPlayer,
  endTurn,
  revealFollowUp,
  castVote,
  addDiscussionMetric,
  buildResult,
  type DebateState,
} from "@/lib/debate/engine";
import { useGameStore } from "@/lib/store/game";
import { useSettingsStore } from "@/lib/store/settings";
import { ProgressRing, PillBadge, TimerBar, PlayerDot } from "@/components/ui/primitives";
import { KawaiiMascot } from "@/components/ui/kawaii-mascot";
import {
  MessageSquareQuote,
  RefreshCw,
  Vote,
  AlertCircle,
  BookOpen,
  Mic,
  ChevronLeft,
  Flame,
} from "lucide-react";

type LocalPhase = "loading" | "setup" | DebateState["phase"];

export function DebateGame() {
  const router = useRouter();
  const config = useGameStore((s) => s.config);
  const settings = useSettingsStore();
  const players = config?.players ?? [];

  const [phase, setPhase] = useState<LocalPhase>("loading");
  const [prompt, setPrompt] = useState<DebatePrompt | null>(null);
  const [debate, setDebate] = useState<DebateState | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [speechSeconds, setSpeechSeconds] = useState(0);
  const [globalDebateTime, setGlobalDebateTime] = useState(300);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<typeof buildResult> | null>(null);
  const [vote, setVote] = useState<DebateVote["position"] | null>(null);
  const [showDevil, setShowDevil] = useState(false);
  const [metrics, setMetrics] = useState({ points: 0, arguments: 0, questions: 0 });
  const [reloadKey, setReloadKey] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const globalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef<DebateState | null>(null);
  const speechStartRef = useRef(0);

  const durationSeconds = config?.debateMinutes ? config.debateMinutes * 60 : 300;
  const debateMode = (config?.debateMode ?? "standard") as DebateState["mode"];
  const isCMM = debateMode === "change-my-mind";
  const isDA = debateMode === "devils-advocate";
  const isEthics = debateMode === "ethical-dilemma";

  // Chargement des prompts
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setPhase("loading");
        setVote(null);
        setResult(null);
        setMetrics({ points: 0, arguments: 0, questions: 0 });
        setDebate(null);
        stateRef.current = null;
        setGlobalDebateTime(durationSeconds);
        const cat = config?.category && config.category !== "mixed" ? config.category : "all";
        const res = await fetch(`/api/debates?category=${encodeURIComponent(cat)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        const list = (data.prompts ?? []) as DebatePrompt[];
        if (list.length === 0) {
          setError("Aucun sujet de débat disponible.");
          return;
        }
        setPrompt(list[Math.floor(Math.random() * list.length)]);
        setPhase("setup");
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur de chargement");
      }
    }
    load();
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    };
  }, [reloadKey, durationSeconds, config?.category]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const go = useCallback((nextPhase: DebateState["phase"]) => {
    const current = stateRef.current;
    if (!current) return;
    const res = transition(current, nextPhase);
    if (!res.ok) {
      // Forcer la phase si la transition stricte n'est pas prévue
      setPhase(nextPhase);
      return;
    }
    stateRef.current = res.state;
    setDebate(res.state);
    setPhase(nextPhase);

    clearTimer();
    if (nextPhase === "reflection") {
      setCountdown(settings.debatePreparation || 30);
      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearTimer();
            const s = stateRef.current;
            if (s) {
              const t = nextPlayer(s);
              stateRef.current = t;
              setDebate(t);
              setPhase("player-turn");
              setSpeechSeconds(0);
              speechStartRef.current = Date.now();
            }
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else if (nextPhase === "player-turn") {
      setSpeechSeconds(0);
      speechStartRef.current = Date.now();
      timerRef.current = setInterval(() => setSpeechSeconds((s) => s + 1), 1000);
    } else if (nextPhase === "results") {
      setResult(buildResult(stateRef.current));
      if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    }
  }, [settings.debatePreparation]);

  function startDebate() {
    if (!prompt) return;
    const p =
      players.length >= 2
        ? players
        : [
            { id: "p1", name: players[0]?.name ?? "Joueur 1", color: 0, score: 0, correct: 0, wrong: 0 },
            { id: "p2", name: "Joueur 2", color: 1, score: 0, correct: 0, wrong: 0 },
          ];
    const state = createDebate(
      prompt,
      p.map((pl) => ({ id: pl.id, name: pl.name })),
      { mode: debateMode, durationSeconds, preparationSeconds: settings.debatePreparation },
    );
    stateRef.current = state;
    setDebate(state);

    // Lancer le chrono global du débat
    setGlobalDebateTime(durationSeconds);
    if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    globalTimerRef.current = setInterval(() => {
      setGlobalDebateTime((t) => {
        if (t <= 1) {
          if (globalTimerRef.current) clearInterval(globalTimerRef.current);
          go("voting");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // Commencer directement par la phase de réflexion
    go("reflection");
  }

  function finishTurn() {
    const st = stateRef.current;
    if (!st) return;
    const playerId = st.players[st.currentPlayerIndex]?.id;
    if (!playerId) return;
    const ended = endTurn(st, playerId);
    if (ended.ok) stateRef.current = ended.state;

    if (isDA && !showDevil && st.turns.filter((t) => t.phase === "speech").length <= 1) {
      setShowDevil(true);
      setTimeout(() => setShowDevil(false), 6000);
    }

    const after = stateRef.current;
    if (after) {
      const nextSt = nextPlayer(after);
      stateRef.current = nextSt;
      setDebate(nextSt);
      setSpeechSeconds(0);
      speechStartRef.current = Date.now();
    }
  }

  function moveToDiscussion() {
    const st = stateRef.current;
    if (!st) return;
    const playerId = st.players[st.currentPlayerIndex]?.id;
    if (playerId) {
      const ended = endTurn(st, playerId);
      if (ended.ok) stateRef.current = ended.state;
    }
    go("open-discussion");
  }

  function showFollowUp() {
    const st = stateRef.current;
    if (!st) return;
    const res = revealFollowUp(st);
    if (res.ok) {
      stateRef.current = res.state;
      setDebate(res.state);
      setPhase("follow-up");
    }
  }

  function castVoteLocal(pos: DebateVote["position"]) {
    const st = stateRef.current;
    if (!st) return;
    const playerId = st.players[0]?.id ?? "p1";
    castVote(st, playerId, pos, "after");
    setVote(pos);
  }

  function addMetric(kind: "points" | "arguments" | "questions") {
    const st = stateRef.current;
    if (!st) return;
    const metricKey =
      kind === "points" ? "pointsDiscussed" : kind === "arguments" ? "argumentsExplored" : "openQuestions";
    const updated = addDiscussionMetric(st, metricKey);
    stateRef.current = updated;
    setDebate(updated);
    setMetrics((p) => ({ ...p, [kind]: p[kind] + 1 }));
  }

  // ---------- Erreur ----------
  if (error) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fp-danger/10 text-fp-danger">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-[20px] font-semibold text-fp-text">Une erreur est survenue</h1>
        <p className="mt-2 text-[14px] text-fp-text-dim">{error}</p>
        <button type="button" onClick={() => router.push("/")} className="fp-btn-primary mt-6 px-6 py-2.5 text-[15px]">
          Retour
        </button>
      </main>
    );
  }

  // ---------- Chargement ----------
  if (phase === "loading") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-black/10 border-t-fp-primary" />
        <p className="mt-4 text-[14px] text-fp-text-dim">Préparation du sujet de débat…</p>
      </main>
    );
  }

  // ---------- Écran 1 : Présentation du sujet ----------
  if (phase === "setup" && prompt) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl sm:max-w-3xl flex-col px-4 sm:px-6 pb-12 pt-3 animate-rise">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="fp-btn-ghost inline-flex items-center gap-1 px-2 py-1 text-[15px]"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Accueil</span>
          </button>
          <PillBadge colorClass="bg-fp-primary/10 text-fp-primary">
            Sujet de débat
          </PillBadge>
          <span className="text-[13px] text-fp-text-dim tabular-nums">
            {Math.round(durationSeconds / 60)} min
          </span>
        </div>

        {/* Mascotte Conférence en grand */}
        <div className="mt-6 flex flex-col items-center text-center">
          <KawaiiMascot theme="conference" size={100} animation="float" className="shadow-md" />
          <h1 className="mt-4 text-[24px] sm:text-[30px] font-bold leading-snug text-fp-text">
            {prompt.prompt}
          </h1>
        </div>

        {/* Contexte factuel */}
        <div className="fp-card mt-6 p-5 border border-black/[0.04]">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-fp-text-dim">
            Contexte & Enjeux
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-fp-text">
            {prompt.context}
          </p>
          {prompt.sources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {prompt.sources.map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-3 py-1 text-[12px] text-fp-text-dim"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  {s.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {isCMM && (
          <div className="mt-4 rounded-2xl bg-fp-warning/10 p-4 text-[13px] text-fp-text">
            <strong>Mode Change My Mind :</strong> des positions vous seront assignées pour le jeu.
          </div>
        )}
        {isEthics && (
          <div className="mt-4 rounded-2xl bg-[#af52de]/10 p-4 text-[13px] text-fp-text">
            <strong>Dilemme éthique :</strong> Réflexion, argumentation puis vote final.
          </div>
        )}

        <button
          type="button"
          onClick={startDebate}
          className="fp-btn-primary mt-8 flex w-full items-center justify-center gap-2 py-4 text-[16px]"
        >
          <MessageSquareQuote className="h-5 w-5" />
          <span>Lancer le débat ({Math.round(durationSeconds / 60)} min)</span>
        </button>
      </main>
    );
  }

  // ---------- Écran Fin / Bilan (Mascotte qui a eu très chaud) ----------
  if (phase === "results" && result) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl sm:max-w-3xl flex-col px-4 sm:px-6 pb-16 pt-10 animate-rise">
        <div className="text-center">
          {/* Mascotte qui a eu très chaud */}
          <div className="mx-auto mb-3 flex justify-center">
            <KawaiiMascot theme="sweating" size={105} animation="pop" className="shadow-md" />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-fp-danger/10 px-3 py-1 text-[12px] font-semibold text-fp-danger mb-2">
            <Flame className="h-3.5 w-3.5" />
            Débat intense terminé !
          </div>
          <h1 className="text-[28px] sm:text-[34px] font-bold text-fp-text">Ouf, quel débat !</h1>
          <p className="mt-1 text-[15px] text-fp-text-dim">
            Pas de perdant : les idées ont chauffé et la discussion fut riche !
          </p>
        </div>

        <div className="fp-card mt-8 p-5 border border-black/[0.04]">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-fp-text-dim">
            Bilan de la séance
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { v: metrics.points, l: "Points discutés" },
              { v: metrics.arguments, l: "Arguments explorés" },
              { v: metrics.questions, l: "Questions ouvertes" },
              { v: result.positionChanges, l: "Avis qui ont évolué" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl bg-black/[0.03] p-4 text-center">
                <div className="text-[30px] font-bold tabular-nums text-fp-text">{s.v}</div>
                <div className="mt-0.5 text-[12px] text-fp-text-dim">{s.l}</div>
              </div>
            ))}
          </div>

          <h3 className="mt-6 text-[12px] font-semibold uppercase tracking-wider text-fp-text-dim">
            Temps de parole par joueur
          </h3>
          <div className="mt-2.5 space-y-2">
            {debate?.players.map((p, i) => {
              const ms = result.speakingTimeMs[p.id] ?? 0;
              const secs = Math.round(ms / 1000);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl bg-black/[0.03] px-4 py-3 text-[14px]"
                >
                  <div className="flex items-center gap-2.5">
                    <PlayerDot name={p.name} colorIndex={i} size={28} />
                    <span className="font-semibold text-fp-text">{p.name}</span>
                  </div>
                  <span className="font-bold text-fp-text tabular-nums">
                    {Math.floor(secs / 60)}m {String(secs % 60).padStart(2, "0")}s
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex w-full gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="fp-btn-secondary flex-1 py-4 text-[16px]"
          >
            Accueil
          </button>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="fp-btn-primary flex-1 py-4 text-[16px]"
          >
            Nouveau débat
          </button>
        </div>
      </main>
    );
  }

  if (!debate || !prompt) return null;

  const currentPlayer = debate.players[debate.currentPlayerIndex];
  const activeFollowUp = debate.followUpsRevealed > 0 ? prompt.followUps[debate.followUpIndex] : null;

  const phaseLabel =
    phase === "reflection"
      ? "Temps de réflexion"
      : phase === "player-turn"
        ? `Parole à ${currentPlayer?.name ?? "…"}`
        : phase === "open-discussion"
          ? "Discussion libre"
          : phase === "follow-up"
            ? "Relance"
            : "Vote final";

  const mins = Math.floor(globalDebateTime / 60);
  const secs = String(globalDebateTime % 60).padStart(2, "0");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl sm:max-w-3xl flex-col px-4 sm:px-6 pb-12 pt-3 animate-rise">
      {/* Barre de navigation avec chrono global qui défile */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="fp-btn-ghost inline-flex items-center gap-1 px-2 py-1 text-[15px]"
          aria-label="Quitter"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Quitter</span>
        </button>

        <PillBadge colorClass="bg-fp-primary/10 text-fp-primary">
          {phaseLabel}
        </PillBadge>

        {/* Chronomètre global du débat qui défile */}
        <div className="flex items-center gap-1.5 rounded-full bg-black/[0.05] px-3 py-1 text-[14px] font-bold tabular-nums text-fp-text">
          <span className="inline-block h-2 w-2 rounded-full bg-[#34c759] animate-pulse" />
          <span>{mins}:{secs}</span>
        </div>
      </div>

      {/* Barre de progression du temps global */}
      <div className="mt-3">
        <TimerBar seconds={globalDebateTime} total={durationSeconds} />
      </div>

      {/* 1. Phase Réflexion */}
      {phase === "reflection" && (
        <div className="flex flex-1 flex-col items-center justify-center text-center mt-6">
          <KawaiiMascot theme="thinking" size={90} animation="float" className="mb-4" />
          <ProgressRing seconds={countdown} total={30} size={110} stroke={8} danger={countdown <= 5} />
          <h2 className="mt-6 text-[24px] font-bold text-fp-text">30 secondes de réflexion</h2>
          <p className="mt-2 max-w-md text-[15px] text-fp-text-dim">
            Préparez vos arguments face à l&apos;assemblée.
          </p>

          <div className="fp-card mt-6 p-4 max-w-md w-full border border-black/[0.04] text-left">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-fp-text-dim">Sujet</p>
            <p className="mt-1 text-[16px] font-bold text-fp-text">{prompt.prompt}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              clearTimer();
              const s = stateRef.current;
              if (s) {
                const t = nextPlayer(s);
                stateRef.current = t;
                setDebate(t);
                setPhase("player-turn");
                setSpeechSeconds(0);
                speechStartRef.current = Date.now();
                timerRef.current = setInterval(() => setSpeechSeconds((x) => x + 1), 1000);
              }
            }}
            className="fp-btn-primary mt-6 w-full max-w-sm py-3.5 text-[16px]"
          >
            Prêt, passer à l&apos;argumentation →
          </button>
        </div>
      )}

      {/* 2. Phase Tour de parole (Mascotte Conférence à l'assemblée) */}
      {phase === "player-turn" && (
        <div className="flex flex-1 flex-col justify-between mt-4">
          <div>
            <div className="fp-card p-5 border border-black/[0.04] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <KawaiiMascot theme="conference" size={72} animation="wobble" className="shadow-xs shrink-0" />
                <div>
                  <h2 className="flex items-center gap-1.5 text-[18px] sm:text-[20px] font-bold text-fp-text">
                    <Mic className="h-5 w-5 text-fp-primary" />
                    À toi, {currentPlayer?.name}
                  </h2>
                  <p className="text-[13px] text-fp-text-dim">Tu t&apos;adresses à l&apos;assemblée.</p>
                </div>
              </div>

              {/* Compteur temps de parole individuel */}
              <div className="text-right shrink-0">
                <div className="text-[26px] font-bold tabular-nums text-fp-primary">
                  {Math.floor(speechSeconds / 60)}:{String(speechSeconds % 60).padStart(2, "0")}
                </div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-fp-text-dim">Parole</div>
              </div>
            </div>

            <div className="fp-card mt-4 p-5 border border-black/[0.04]">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-fp-text-dim">Thèse à débattre</p>
              <p className="mt-1.5 text-[18px] sm:text-[20px] font-bold leading-snug text-fp-text">{prompt.prompt}</p>
            </div>

            {isDA && showDevil && (
              <div className="animate-pop mt-4 rounded-2xl bg-fp-danger/10 p-4">
                <p className="text-[13px] font-semibold text-fp-danger">Perspective contradictoire</p>
                <p className="mt-1 text-[13px] text-fp-text">
                  {prompt.perspectives[prompt.perspectives.length - 1] ??
                    "Qu'en dirait une personne de bonne foi qui pense l'inverse ?"}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={finishTurn}
                className="fp-btn-primary flex items-center justify-center gap-2 py-4 text-[16px]"
              >
                <span>Passer la parole au suivant</span>
              </button>
              <button
                type="button"
                onClick={moveToDiscussion}
                className="fp-btn-secondary flex items-center justify-center gap-2 py-4 text-[16px]"
              >
                <span>Discussion libre ouverte</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => addMetric("points")}
              className="w-full rounded-2xl border border-dashed border-black/[0.12] py-3 text-[14px] font-semibold text-fp-text-dim transition-colors hover:border-fp-primary hover:text-fp-primary"
            >
              + Marquer un point discuté ({metrics.points})
            </button>
          </div>
        </div>
      )}

      {/* 3. Phase Discussion libre */}
      {phase === "open-discussion" && (
        <div className="flex flex-1 flex-col items-center justify-center text-center mt-6">
          <KawaiiMascot theme="conference" size={96} animation="float" className="mb-3" />
          <h2 className="text-[24px] font-bold text-fp-text">Discussion libre & Débat ouvert</h2>
          <p className="mt-1 max-w-md text-[14px] text-fp-text-dim">
            Tout le monde échange ses arguments sans restriction de tour.
          </p>

          <div className="fp-card mt-5 p-4 max-w-md w-full border border-black/[0.04]">
            <p className="text-[16px] font-bold text-fp-text">{prompt.prompt}</p>
          </div>

          <div className="mt-6 flex w-full max-w-md flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => addMetric("arguments")}
                className="fp-btn-secondary py-3 text-[14px]"
              >
                + Argument ({metrics.arguments})
              </button>
              <button
                type="button"
                onClick={() => addMetric("questions")}
                className="fp-btn-secondary py-3 text-[14px]"
              >
                + Question ({metrics.questions})
              </button>
            </div>

            <button
              type="button"
              onClick={showFollowUp}
              className="fp-btn-secondary flex items-center justify-center gap-2 py-3.5 text-[15px]"
            >
              <RefreshCw className="h-4.5 w-4.5" />
              <span>Relancer avec un nouvel angle</span>
            </button>

            <button
              type="button"
              onClick={() => go("voting")}
              className="fp-btn-primary mt-2 py-4 text-[16px]"
            >
              Passer au vote final →
            </button>
          </div>
        </div>
      )}

      {/* 4. Phase Relance */}
      {phase === "follow-up" && activeFollowUp && (
        <div className="flex flex-1 flex-col items-center justify-center text-center mt-6">
          <KawaiiMascot theme="debate" size={90} animation="wobble" className="mb-3" />
          <h2 className="text-[22px] font-bold text-fp-text">Pour aller plus loin</h2>
          <div className="fp-card mt-4 p-5 max-w-md w-full border border-black/[0.04]">
            <p className="text-[17px] font-semibold leading-snug text-fp-text">{activeFollowUp}</p>
          </div>

          <div className="mt-6 flex w-full max-w-md flex-col gap-3">
            <button
              type="button"
              onClick={() => go("player-turn")}
              className="fp-btn-primary py-4 text-[16px]"
            >
              Reprendre les tours de parole
            </button>
            <button
              type="button"
              onClick={() => go("open-discussion")}
              className="fp-btn-secondary py-3.5 text-[15px]"
            >
              Revenir à la discussion libre
            </button>
          </div>
        </div>
      )}

      {/* 5. Phase Vote final */}
      {phase === "voting" && (
        <div className="flex flex-1 flex-col items-center justify-center text-center mt-6">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-fp-warning/15 text-fp-warning mb-2">
            <Vote className="h-7 w-7" />
          </div>
          <h2 className="text-[24px] font-bold text-fp-text">Vote & Avis Final</h2>
          <p className="mt-1 text-[14px] text-fp-text-dim">
            Après ce débat, quelle est votre position ?
          </p>

          <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-3">
            {(
              [
                ["pour", "👍 Pour"],
                ["contre", "👎 Contre"],
                ["nuance", "🤔 Nuancé"],
                ["indecis", "🤷 Indécis"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => castVoteLocal(val)}
                className={`min-h-[56px] rounded-2xl px-4 py-3.5 text-[16px] font-bold transition-all active:scale-[0.98] ${
                  vote === val
                    ? "bg-fp-primary text-white shadow-sm"
                    : "fp-card text-fp-text hover:bg-black/[0.02] border border-black/[0.04]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => go("results")}
            className="fp-btn-primary mt-8 w-full max-w-md py-4 text-[16px]"
          >
            Voir le bilan du débat
          </button>
        </div>
      )}
    </main>
  );
}
