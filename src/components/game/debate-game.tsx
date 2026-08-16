"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DebatePrompt } from "@/lib/debate/schema";
import type { DebateVote } from "@/lib/debate/schema";
import { createDebate, transition, nextPlayer, endTurn, revealFollowUp, castVote, addDiscussionMetric, buildResult, type DebateState } from "@/lib/debate/engine";
import { useGameStore } from "@/lib/store/game";
import { useSettingsStore } from "@/lib/store/settings";
import { ProgressRing } from "@/components/ui/primitives";
import { MessageSquareQuote, RefreshCw, Vote, Brain, AlertCircle, BookOpen, Mic } from "lucide-react";

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
  const [points, setPoints] = useState({ points: 0, arguments: 0, questions: 0 });

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
        setPrompt(list[0]);
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
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Lancement du débat
  function startDebate() {
    if (!prompt) return;
    const p = players.length >= 2 ? players : [
      { id: "p1", name: "Joueur 1", color: 0, score: 0, correct: 0, wrong: 0 },
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
    setCountdown(10); // temps de lecture de la question
  }

  // Machine à états : gestion des phases avec timers
  const go = useCallback(
    (nextPhase: DebateState["phase"]) => {
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
              // Fin de réflexion → premier tour
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
        timerRef.current = setInterval(() => {
          setSpeechSeconds((s) => {
            const st = stateRef.current;
            if (!st) return s;
            const budget = st.speakingBudgetMs[st.players[st.currentPlayerIndex]?.id ?? ""] ?? 0;
            if (budget <= 0) return s;
            return s + 1;
          });
        }, 1000);
      } else if (nextPhase === "results") {
        const res = buildResult(stateRef.current);
        setResult(res);
        const changes = res.positionChanges;
        setPoints((p) => ({ ...p, points: p.points }));
        if (changes > 0) setPoints((p) => ({ ...p, points: p.points + changes }));
      }
    },
    [],
  );

  // Enregistrer le tour de parole quand on change de phase
  useEffect(() => {
    if (phase === "player-turn" && debate && speechStartRef.current > 0) {
      // le tour en cours est suivi via endTurn à la fin
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function finishTurn() {
    const st = stateRef.current;
    if (!st) return;
    const playerId = st.players[st.currentPlayerIndex]?.id;
    if (!playerId) return;
    const ended = endTurn(st, playerId);
    if (ended.ok) stateRef.current = ended.state;

    // Devil's Advocate : après le 1er tour, montrer un contre-argument
    if (isDA && !showDevil && st.turns.filter((t) => t.phase === "speech").length <= 1) {
      setShowDevil(true);
      setTimeout(() => setShowDevil(false), 6000);
    }

    // next player ou discussion
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
    // clôt le tour en cours
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
    }
  }

  function castVoteLocal(pos: DebateVote["position"]) {
    const st = stateRef.current;
    if (!st || !vote) return;
    const playerId = st.players[0]?.id ?? "p1";
    castVote(st, playerId, pos, "after");
    setVote(pos);
  }

  function addMetric(kind: "points" | "arguments" | "questions") {
    const st = stateRef.current;
    if (!st) return;
    const metricKey = kind === "points" ? "pointsDiscussed" : kind === "arguments" ? "argumentsExplored" : "openQuestions";
    const updated = addDiscussionMetric(st, metricKey);
    stateRef.current = updated;
    setDebate(updated);
    setPoints((p) => ({
      ...p,
      points: kind === "points" ? p.points + 1 : p.points,
      arguments: kind === "arguments" ? p.arguments + 1 : p.arguments,
      questions: kind === "questions" ? p.questions + 1 : p.questions,
    }));
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-sans text-xl font-bold text-white">Une erreur est survenue</h1>
        <p className="mt-2 text-xs text-neutral-400">{error}</p>
        <button type="button" onClick={() => router.push("/")} className="glass-primary mt-6 rounded-xl px-6 py-2.5 text-xs font-bold text-white">Retour</button>
      </main>
    );
  }

  if (phase === "loading") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
          <MessageSquareQuote className="h-6 w-6" />
        </div>
        <p className="mt-4 text-xs text-neutral-400">Préparation du débat…</p>
      </main>
    );
  }

  if (phase === "setup" && prompt) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-10 pt-6">
        <button type="button" onClick={() => router.push("/")} className="text-xs font-semibold text-neutral-400 hover:text-white">← Retour</button>
        <span className="mt-6 inline-block w-fit rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-semibold text-neutral-300">
          {prompt.category} · {prompt.difficulty}
        </span>
        <h1 className="mt-4 font-sans text-2xl sm:text-3xl font-bold text-white leading-snug">{prompt.prompt}</h1>

        {/* Carte de contexte factuel */}
        <div className="glass-panel mt-6 rounded-3xl p-5 border-white/[0.08]">
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-cyan-400">Contexte factuel</h2>
          <p className="mt-2 text-xs leading-relaxed text-neutral-300">{prompt.context}</p>
          {prompt.sources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {prompt.sources.map((s) => (
                <span key={s.label} className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] border border-white/[0.06] px-2.5 py-1 text-[11px] text-neutral-300">
                  <BookOpen className="h-2.5 w-2.5 text-neutral-400" />
                  <span>{s.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {isCMM && (
          <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs">
            <strong className="text-amber-300">Mode Change My Mind</strong>
            <p className="mt-1 text-neutral-300">
              Des positions vous seront assignées pour le jeu. Elles ne reflètent pas nécessairement vos opinions.
            </p>
          </div>
        )}
        {isEthics && (
          <div className="mt-4 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4 text-xs">
            <strong className="text-violet-300">Dilemme éthique</strong>
            <p className="mt-1 text-neutral-300">30 s de réflexion, puis position, contre-argument et discussion.</p>
          </div>
        )}

        <div className="mt-6">
          <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-neutral-400">Règles du débat</h3>
          <div className="mt-3 grid gap-2 text-xs">
            {["Critique les arguments, pas les personnes.", "Laisse les autres terminer.", "Tu peux changer d’avis."].map((r) => (
              <div key={r} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-neutral-300">
                {r}
              </div>
            ))}
          </div>
        </div>

        <button type="button" onClick={startDebate} className="glass-primary mt-8 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg">
          <MessageSquareQuote className="h-4 w-4" />
          <span>Lancer le débat ({durationSeconds / 60} min)</span>
        </button>
      </main>
    );
  }

  if (phase === "results" && result) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-10 pt-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 mb-3">
            <Brain className="h-7 w-7" />
          </div>
          <h1 className="mt-2 font-sans text-2xl sm:text-3xl font-bold text-white">Débat terminé</h1>
          <p className="mt-1 text-xs text-neutral-400">Pas de gagnant ni de perdant — confrontation rigoureuse d&apos;idées.</p>
        </div>

        <div className="fp-card mt-8 p-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-fp-text-dim">Bilan de la discussion</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/5 p-4 text-center">
              <div className="font-display text-3xl font-bold text-fp-primary">{points.points + result.positionChanges}</div>
              <div className="mt-1 text-xs text-fp-text-dim">Points discutés</div>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 text-center">
              <div className="font-display text-3xl font-bold text-fp-accent-2">{points.arguments}</div>
              <div className="mt-1 text-xs text-fp-text-dim">Arguments explorés</div>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 text-center">
              <div className="font-display text-3xl font-bold text-fp-warning">{points.questions}</div>
              <div className="mt-1 text-xs text-fp-text-dim">Questions restantes</div>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 text-center">
              <div className="font-display text-3xl font-bold text-fp-success">
                {result.positionChanges}
              </div>
              <div className="mt-1 text-xs text-fp-text-dim">
                {result.positionChanges > 0 ? "changement(s) de position" : "position(s) stable(s)"}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-display text-xs font-bold uppercase tracking-widest text-fp-text-dim">Temps de parole</h3>
            <div className="mt-2 space-y-2">
              {debate?.players.map((p) => {
                const ms = result.speakingTimeMs[p.id] ?? 0;
                const secs = Math.round(ms / 1000);
                return (
                  <div key={p.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2 text-sm">
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-fp-text-dim">{Math.floor(secs / 60)} min {secs % 60} s</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex w-full gap-3">
          <button type="button" onClick={() => router.push("/")} className="fp-btn-ghost flex-1">Accueil</button>
          <button type="button" onClick={() => window.location.reload()} className="fp-btn-primary flex-1">Nouveau débat</button>
        </div>
      </main>
    );
  }

  if (!debate || !prompt) return null;

  const currentPlayer = debate.players[debate.currentPlayerIndex];
  const activeFollowUp = debate.followUpsRevealed > 0 ? prompt.followUps[debate.followUpIndex] : null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-10 pt-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.push("/")} className="text-sm text-fp-text-dim" aria-label="Quitter">✕</button>
        <span className="rounded-full border border-fp-border bg-fp-surface px-3 py-1 text-xs font-semibold text-fp-text-dim">
          {phase === "reflection" ? "Réflexion" : phase === "player-turn" ? `Tour de ${currentPlayer?.name ?? "…"}` : phase === "open-discussion" ? "Discussion libre" : phase === "follow-up" ? "Relance" : "Débat"}
        </span>
        <span className="text-xs text-fp-text-dim">{Math.round(durationSeconds / 60)} min</span>
      </div>

      {phase === "reflection" && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <ProgressRing seconds={countdown} total={30} size={110} stroke={8} danger={countdown <= 5} />
          <h2 className="mt-6 font-display text-2xl font-bold">Prends 30 secondes pour réfléchir</h2>
          <p className="mt-2 max-w-sm text-fp-text-dim">
            {isEthics ? "Quelle est ta position face à ce dilemme ?" : "Prépare tes arguments."}
          </p>
          {isCMM && (
            <div className="mt-4 max-w-sm rounded-2xl border border-fp-warning/40 bg-fp-warning/10 p-4">
              <p className="text-sm text-fp-warning">
                <strong>Position assignée pour le jeu :</strong>{" "}
                {prompt.assignedPositions?.[0] ?? "à annoncer au premier tour"}
              </p>
              <p className="mt-1 text-xs text-fp-text-dim">Ce n&apos;est pas ton opinion personnelle.</p>
            </div>
          )}
        </div>
      )}

      {phase === "player-turn" && (
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-xl font-bold text-white flex items-center gap-2">
              <Mic className="h-4 w-4 text-cyan-400" />
              <span>À toi, {currentPlayer?.name}</span>
            </h2>
            <div className="text-right">
              <div className="font-mono text-2xl font-bold tabular-nums text-white">
                {Math.floor(speechSeconds / 60)}:{String(speechSeconds % 60).padStart(2, "0")}
              </div>
              <div className="text-[11px] text-neutral-400">temps de parole</div>
            </div>
          </div>

          {isCMM && (
            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs">
              <strong className="text-amber-300">Position assignée :</strong>{" "}
              <span className="text-white">
                {prompt.assignedPositions?.[debate.turns.filter((t) => t.phase === "speech").length % Math.max(1, prompt.assignedPositions?.length ?? 1)] ??
                  "défends cette position comme si elle était la tienne"}
              </span>
            </div>
          )}

          <p className="mt-4 text-xs text-neutral-400">Question du débat :</p>
          <p className="mt-1 font-sans text-base sm:text-lg font-bold leading-snug text-white">{prompt.prompt}</p>

          {isDA && showDevil && (
            <div className="animate-pop mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
              <p className="text-xs font-bold text-rose-300">Perspective contradictoire</p>
              <p className="mt-1 text-xs text-neutral-300">
                {prompt.perspectives[prompt.perspectives.length - 1] ?? "Voici un contre-argument sérieux à considérer : qu’en dirait une personne de bonne foi qui pense l’inverse ?"}
              </p>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button type="button" onClick={finishTurn} className="glass-primary flex-1 py-3 rounded-xl text-xs font-bold text-white shadow-lg">
              Passer la parole
            </button>
            <button type="button" onClick={moveToDiscussion} className="glass-button flex-1 py-3 rounded-xl text-xs font-semibold text-neutral-300">
              Discussion libre
            </button>
          </div>
          <button
            type="button"
            onClick={() => addMetric("points")}
            className="mt-3 w-full rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] py-2 text-xs font-semibold text-neutral-400 transition-colors hover:border-violet-400 hover:text-white"
          >
            + Point discuté ({points.points})
          </button>
        </div>
      )}

      {phase === "open-discussion" && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 mb-2">
            <MessageSquareQuote className="h-7 w-7" />
          </div>
          <h2 className="mt-2 font-sans text-2xl font-bold text-white">Discussion libre</h2>
          <p className="mt-1 max-w-sm text-xs text-neutral-400">Échange d&apos;arguments sans chronomètre strict.</p>
          <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
            <button type="button" onClick={() => addMetric("arguments")} className="glass-button py-2.5 rounded-xl text-xs text-neutral-300">
              + Un argument exploré ({points.arguments})
            </button>
            <button type="button" onClick={() => addMetric("questions")} className="glass-button py-2.5 rounded-xl text-xs text-neutral-300">
              + Une question restante ({points.questions})
            </button>
            <button type="button" onClick={showFollowUp} className="glass-primary mt-2 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold text-white shadow-lg">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Nouvelle relance</span>
            </button>
            <button type="button" onClick={() => go("voting")} className="glass-button mt-2 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white">
              Passer au vote final →
            </button>
          </div>
        </div>
      )}

      {phase === "follow-up" && activeFollowUp && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30 mb-2">
            <RefreshCw className="h-6 w-6" />
          </div>
          <h2 className="mt-2 font-sans text-xl font-bold text-white">Relance d&apos;approfondissement</h2>
          <p className="mt-3 max-w-md font-sans text-base sm:text-lg font-semibold text-neutral-200 leading-snug">{activeFollowUp}</p>
          <div className="mt-8 flex w-full max-w-sm flex-col gap-2">
            <button type="button" onClick={() => go("player-turn")} className="glass-primary py-3 rounded-xl text-xs font-bold text-white shadow-lg">
              Reprendre les tours
            </button>
            <button type="button" onClick={() => go("open-discussion")} className="glass-button py-2.5 rounded-xl text-xs text-neutral-300">
              Discussion libre
            </button>
          </div>
        </div>
      )}

      {phase === "voting" && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
            <Vote className="h-7 w-7" />
          </div>
          <h2 className="mt-2 font-sans text-2xl font-bold text-white">Vote final</h2>
          <p className="mt-1 text-xs text-neutral-400">Avez-vous fait évoluer votre point de vue ?</p>
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
                className={`rounded-2xl border-2 px-4 py-3 font-semibold transition-all ${
                  vote === val ? "border-fp-primary bg-fp-primary/15 text-white" : "border-fp-border bg-fp-surface text-fp-text-dim hover:border-fp-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => go("results")} className="fp-btn-primary mt-8 w-full max-w-sm">
            Voir le bilan
          </button>
        </div>
      )}
    </main>
  );
}
