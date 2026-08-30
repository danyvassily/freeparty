"use client";

/**
 * Free Party — Mode Débat
 * Pas de gagnant : temps de parole équitable, relances, vote avant/après.
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
import { ProgressRing, PillBadge } from "@/components/ui/primitives";
import {
  MessageSquareQuote,
  RefreshCw,
  Vote,
  Brain,
  AlertCircle,
  BookOpen,
  Mic,
  ChevronLeft,
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
  const [countdown, setCountdown] = useState(0);
  const [speechSeconds, setSpeechSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<typeof buildResult> | null>(null);
  const [vote, setVote] = useState<DebateVote["position"] | null>(null);
  const [showDevil, setShowDevil] = useState(false);
  const [metrics, setMetrics] = useState({ points: 0, arguments: 0, questions: 0 });
  const [reloadKey, setReloadKey] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
        const cat = config?.category && config.category !== "mixed" ? config.category : "all";
        const res = await fetch(`/api/debates?category=${encodeURIComponent(cat)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        const list = (data.prompts ?? []) as DebatePrompt[];
        if (list.length === 0) {
          setError("Aucun débat disponible pour ce thème.");
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

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
    setPhase("presentation");
    setCountdown(10);
  }

  const go = useCallback((nextPhase: DebateState["phase"]) => {
    const current = stateRef.current;
    if (!current) return;
    const res = transition(current, nextPhase);
    if (!res.ok) return;
    stateRef.current = res.state;
    setDebate(res.state);
    setPhase(nextPhase);

    clearTimer();
    if (nextPhase === "reflection") {
      setCountdown(30);
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
    }
  }, []);

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
        <button type="button" onClick={() => router.push("/")} className="fp-btn-primary mt-6 px-6 py-2.5 text-[15px]">Retour</button>
      </main>
    );
  }

  // ---------- Chargement ----------
  if (phase === "loading") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-black/10 border-t-fp-primary" />
        <p className="mt-4 text-[14px] text-fp-text-dim">Préparation du débat…</p>
      </main>
    );
  }

  // ---------- Présentation ----------
  if (phase === "setup" && prompt) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-10 pt-3">
        <button type="button" onClick={() => router.push("/")} className="fp-btn-ghost inline-flex w-fit items-center gap-0.5 px-2 py-1 text-[15px]">
          <ChevronLeft className="h-5 w-5" />
          Retour
        </button>
        <div className="mt-5">
          <PillBadge>{prompt.category} · {prompt.difficulty}</PillBadge>
        </div>
        <h1 className="mt-3 text-[24px] font-bold leading-snug text-fp-text sm:text-[28px]">{prompt.prompt}</h1>

        {/* Contexte factuel */}
        <div className="fp-card mt-6 p-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-fp-text-dim">Contexte</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-fp-text">{prompt.context}</p>
          {prompt.sources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {prompt.sources.map((s) => (
                <span key={s.label} className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-2.5 py-1 text-[12px] text-fp-text-dim">
                  <BookOpen className="h-3 w-3" />
                  {s.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {isCMM && (
          <div className="mt-4 rounded-2xl bg-fp-warning/10 p-4 text-[13px] text-fp-text">
            <strong>Mode Change My Mind :</strong> des positions seront assignées pour le jeu.
            Elles ne reflètent pas vos opinions réelles.
          </div>
        )}
        {isEthics && (
          <div className="mt-4 rounded-2xl bg-[#af52de]/10 p-4 text-[13px] text-fp-text">
            <strong>Dilemme éthique :</strong> 30 s de réflexion, puis position, contre-argument et discussion.
          </div>
        )}

        <div className="mt-6">
          <h3 className="px-1 text-[13px] font-normal uppercase tracking-wide text-fp-text-dim">Règles du débat</h3>
          <div className="fp-list mt-1.5">
            {["Critique les arguments, pas les personnes.", "Laisse les autres terminer.", "Tu peux changer d'avis."].map((r) => (
              <div key={r} className="px-4 py-3 text-[14px] text-fp-text">{r}</div>
            ))}
          </div>
        </div>

        <button type="button" onClick={startDebate} className="fp-btn-primary mt-8 flex w-full items-center justify-center gap-2 py-3.5 text-[16px]">
          <MessageSquareQuote className="h-4.5 w-4.5" />
          Lancer le débat ({durationSeconds / 60} min)
        </button>
      </main>
    );
  }

  // ---------- Bilan ----------
  if (phase === "results" && result) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-16 pt-10">
        <div className="text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-fp-primary/10 text-fp-primary">
            <Brain className="h-7 w-7" />
          </div>
          <h1 className="mt-3 text-[26px] font-bold text-fp-text">Débat terminé</h1>
          <p className="mt-1 text-[14px] text-fp-text-dim">Pas de gagnant — une confrontation d&apos;idées réussie.</p>
        </div>

        <div className="fp-card mt-8 p-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-fp-text-dim">Bilan</h2>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {[
              { v: metrics.points, l: "Points discutés" },
              { v: metrics.arguments, l: "Arguments explorés" },
              { v: metrics.questions, l: "Questions restantes" },
              { v: result.positionChanges, l: "Changements de position" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl bg-black/[0.03] p-4 text-center">
                <div className="text-[28px] font-bold tabular-nums text-fp-text">{s.v}</div>
                <div className="mt-0.5 text-[12px] text-fp-text-dim">{s.l}</div>
              </div>
            ))}
          </div>

          <h3 className="mt-5 text-[13px] font-semibold uppercase tracking-wide text-fp-text-dim">Temps de parole</h3>
          <div className="mt-2 space-y-1.5">
            {debate?.players.map((p) => {
              const ms = result.speakingTimeMs[p.id] ?? 0;
              const secs = Math.round(ms / 1000);
              return (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-black/[0.03] px-4 py-2.5 text-[14px]">
                  <span className="font-medium text-fp-text">{p.name}</span>
                  <span className="text-fp-text-dim tabular-nums">{Math.floor(secs / 60)} min {secs % 60} s</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex w-full gap-3">
          <button type="button" onClick={() => router.push("/")} className="fp-btn-secondary flex-1 py-3 text-[15px]">Accueil</button>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="fp-btn-primary flex-1 py-3 text-[15px]">Nouveau débat</button>
        </div>
      </main>
    );
  }

  if (!debate || !prompt) return null;

  const currentPlayer = debate.players[debate.currentPlayerIndex];
  const activeFollowUp = debate.followUpsRevealed > 0 ? prompt.followUps[debate.followUpIndex] : null;

  const phaseLabel =
    phase === "reflection"
      ? "Réflexion"
      : phase === "player-turn"
        ? `Tour de ${currentPlayer?.name ?? "…"}`
        : phase === "open-discussion"
          ? "Discussion libre"
          : phase === "follow-up"
            ? "Relance"
            : "Débat";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-10 pt-3">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.push("/")} className="fp-btn-ghost inline-flex items-center gap-0.5 px-2 py-1 text-[15px]" aria-label="Quitter">
          <ChevronLeft className="h-5 w-5" />
          Quitter
        </button>
        <PillBadge>{phaseLabel}</PillBadge>
        <span className="w-10 text-right text-[13px] text-fp-text-dim tabular-nums">{Math.round(durationSeconds / 60)} min</span>
      </div>

      {phase === "reflection" && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <ProgressRing seconds={countdown} total={30} size={110} stroke={8} danger={countdown <= 5} />
          <h2 className="mt-6 text-[22px] font-bold text-fp-text">Prends 30 secondes pour réfléchir</h2>
          <p className="mt-2 max-w-sm text-[14px] text-fp-text-dim">
            {isEthics ? "Quelle est ta position face à ce dilemme ?" : "Prépare tes arguments."}
          </p>
          {isCMM && (
            <div className="mt-4 max-w-sm rounded-2xl bg-fp-warning/10 p-4">
              <p className="text-[14px] text-fp-text">
                <strong>Position assignée pour le jeu :</strong>{" "}
                {prompt.assignedPositions?.[0] ?? "à annoncer au premier tour"}
              </p>
              <p className="mt-1 text-[12px] text-fp-text-dim">Ce n&apos;est pas ton opinion personnelle.</p>
            </div>
          )}
        </div>
      )}

      {phase === "player-turn" && (
        <div className="flex flex-1 flex-col">
          <div className="mt-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[20px] font-bold text-fp-text">
              <Mic className="h-5 w-5 text-fp-primary" />
              À toi, {currentPlayer?.name}
            </h2>
            <div className="text-right">
              <div className="text-[24px] font-bold tabular-nums text-fp-text">
                {Math.floor(speechSeconds / 60)}:{String(speechSeconds % 60).padStart(2, "0")}
              </div>
              <div className="text-[11px] text-fp-text-dim">temps de parole</div>
            </div>
          </div>

          {isCMM && (
            <div className="mt-4 rounded-2xl bg-fp-warning/10 p-4 text-[13px] text-fp-text">
              <strong>Position assignée :</strong>{" "}
              {prompt.assignedPositions?.[
                debate.turns.filter((t) => t.phase === "speech").length % Math.max(1, prompt.assignedPositions?.length ?? 1)
              ] ?? "défends cette position comme si elle était la tienne"}
            </div>
          )}

          <p className="mt-5 text-[12px] font-medium uppercase tracking-wide text-fp-text-dim">Question du débat</p>
          <p className="mt-1 text-[17px] font-semibold leading-snug text-fp-text sm:text-[19px]">{prompt.prompt}</p>

          {isDA && showDevil && (
            <div className="animate-pop mt-4 rounded-2xl bg-fp-danger/10 p-4">
              <p className="text-[13px] font-semibold text-fp-danger">Perspective contradictoire</p>
              <p className="mt-1 text-[13px] text-fp-text">
                {prompt.perspectives[prompt.perspectives.length - 1] ??
                  "Qu'en dirait une personne de bonne foi qui pense l'inverse ?"}
              </p>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button type="button" onClick={finishTurn} className="fp-btn-primary flex-1 py-3 text-[15px]">
              Passer la parole
            </button>
            <button type="button" onClick={moveToDiscussion} className="fp-btn-secondary flex-1 py-3 text-[15px]">
              Discussion libre
            </button>
          </div>
          <button
            type="button"
            onClick={() => addMetric("points")}
            className="mt-3 w-full rounded-2xl border border-dashed border-black/[0.12] py-2.5 text-[13px] font-medium text-fp-text-dim transition-colors hover:border-fp-primary hover:text-fp-primary"
          >
            + Point discuté ({metrics.points})
          </button>
        </div>
      )}

      {phase === "open-discussion" && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-fp-primary/10 text-fp-primary">
            <MessageSquareQuote className="h-7 w-7" />
          </div>
          <h2 className="mt-3 text-[22px] font-bold text-fp-text">Discussion libre</h2>
          <p className="mt-1 max-w-sm text-[13px] text-fp-text-dim">Échange d&apos;arguments sans chronomètre strict.</p>
          <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
            <button type="button" onClick={() => addMetric("arguments")} className="fp-btn-secondary py-2.5 text-[14px]">
              + Un argument exploré ({metrics.arguments})
            </button>
            <button type="button" onClick={() => addMetric("questions")} className="fp-btn-secondary py-2.5 text-[14px]">
              + Une question restante ({metrics.questions})
            </button>
            <button type="button" onClick={showFollowUp} className="fp-btn-primary mt-2 flex items-center justify-center gap-1.5 py-3 text-[15px]">
              <RefreshCw className="h-4 w-4" />
              Nouvelle relance
            </button>
            <button type="button" onClick={() => go("voting")} className="fp-btn-ghost mt-1 py-2.5 text-[14px]">
              Passer au vote final →
            </button>
          </div>
        </div>
      )}

      {phase === "follow-up" && activeFollowUp && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#af52de]/10 text-[#af52de]">
            <RefreshCw className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-[20px] font-bold text-fp-text">Pour aller plus loin</h2>
          <p className="mt-3 max-w-md text-[17px] font-semibold leading-snug text-fp-text">{activeFollowUp}</p>
          <div className="mt-8 flex w-full max-w-sm flex-col gap-2">
            <button type="button" onClick={() => go("player-turn")} className="fp-btn-primary py-3 text-[15px]">
              Reprendre les tours
            </button>
            <button type="button" onClick={() => go("open-discussion")} className="fp-btn-secondary py-2.5 text-[14px]">
              Discussion libre
            </button>
          </div>
        </div>
      )}

      {phase === "voting" && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-fp-warning/15 text-fp-warning">
            <Vote className="h-7 w-7" />
          </div>
          <h2 className="mt-3 text-[22px] font-bold text-fp-text">Vote final</h2>
          <p className="mt-1 text-[13px] text-fp-text-dim">As-tu fait évoluer ton point de vue ?</p>
          <div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-2">
            {(
              [
                ["pour", "Pour"],
                ["contre", "Contre"],
                ["nuance", "Nuancé"],
                ["indecis", "Indécis"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => castVoteLocal(val)}
                className={`rounded-2xl px-4 py-3 text-[15px] font-medium transition-all active:scale-[0.98] ${
                  vote === val
                    ? "bg-fp-primary text-white"
                    : "fp-card text-fp-text hover:bg-black/[0.02]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => go("results")} className="fp-btn-primary mt-8 w-full max-w-sm py-3 text-[15px]">
            Voir le bilan
          </button>
        </div>
      )}
    </main>
  );
}
