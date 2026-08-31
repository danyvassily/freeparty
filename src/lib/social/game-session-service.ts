/**
 * Free Party — Game Session Service
 * Gère le cycle de vie d'une partie (GameSession) lancée depuis un salon persistant (Lobby).
 * Les participants CONNECTED + PLAYING sont transférés automatiquement dans la partie,
 * puis retournent au même salon à la fin du jeu.
 */
import { randomUUID } from "node:crypto";
import type { GameSession, GameSessionParticipant, Lobby } from "./types";
import type { GameMode } from "@/lib/store/game";
import type { Question, QuestionCategory } from "@/lib/questions/schema";
import { lobbyStore, getLobby } from "./lobby-service";
import { presenceStore } from "./presence-service";
import { getQuestions, markQuestionSeen } from "@/lib/anti-repetition";

class InMemoryGameSessionStore {
  sessions = new Map<string, GameSession>();
  // key: `${sessionId}:${profileId}`
  participants = new Map<string, GameSessionParticipant>();
  // key: sessionId -> Question[]
  questionsBySession = new Map<string, Question[]>();

  clear() {
    this.sessions.clear();
    this.participants.clear();
    this.questionsBySession.clear();
  }
}

export const gameSessionStore = new InMemoryGameSessionStore();

/**
 * Lance une nouvelle partie depuis un salon persistant.
 * - Vérifie l'hôte
 * - Empêche les démarrages concurrents (anti double-clic)
 * - Transfère automatiquement tous les membres CONNECTED et PLAYING
 * - Interroge QuestionSelectionService avec l'UNION des historiques des participants
 */
export async function startGameFromLobby(params: {
  lobbyId: string;
  gameMode?: GameMode;
  requestedByProfileId: string;
  questionsDataset?: Question[];
}): Promise<{ session: GameSession; questions: Question[]; participants: GameSessionParticipant[] }> {
  const { lobbyId, gameMode, requestedByProfileId, questionsDataset } = params;

  const lobby = await getLobby(lobbyId);
  if (!lobby) throw new Error("LOBBY_NOT_FOUND");
  if (lobby.ownerProfileId !== requestedByProfileId) throw new Error("NOT_LOBBY_OWNER");
  if (lobby.status === "IN_GAME" || lobby.status === "STARTING") {
    throw new Error("GAME_ALREADY_RUNNING");
  }

  // Sélectionne les membres connectés et actifs pour le jeu (ignore SITTING_OUT et SPECTATING)
  const connectedMembers = Array.from(lobbyStore.members.values()).filter(
    (m) => m.lobbyId === lobbyId && m.status === "CONNECTED" && m.participationStatus === "PLAYING",
  );

  if (connectedMembers.length === 0) {
    throw new Error("NO_PLAYERS_AVAILABLE");
  }

  const modeToPlay = gameMode || lobby.selectedGameMode || "classic";
  const sessionId = `game_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const now = new Date().toISOString();

  // Transition atomique du salon
  lobby.status = "IN_GAME";
  lobby.selectedGameMode = modeToPlay;
  lobby.currentGameSessionId = sessionId;
  lobby.updatedAt = now;
  lobbyStore.lobbies.set(lobbyId, lobby);

  // Création de la GameSession
  const session: GameSession = {
    id: sessionId,
    lobbyId,
    gameMode: modeToPlay,
    status: "PLAYING",
    createdBy: requestedByProfileId,
    questionIndex: 0,
    answersRevealed: false,
    stateVersion: 1,
    createdAt: now,
    startedAt: now,
  };

  gameSessionStore.sessions.set(sessionId, session);

  // Inscription des participants
  const participants: GameSessionParticipant[] = [];
  for (const m of connectedMembers) {
    const part: GameSessionParticipant = {
      gameSessionId: sessionId,
      profileId: m.profileId,
      status: "ACTIVE",
      score: 0,
      nickname: m.nickname,
      joinedAt: now,
    };
    gameSessionStore.participants.set(`${sessionId}:${m.profileId}`, part);
    participants.push(part);
  }

  // Sélection des questions avec intégration Anti-Répétition
  const playerProfileIds = participants.map((p) => p.profileId);
  const categoriesParam = lobby.category && lobby.category !== "mixed" ? [lobby.category as QuestionCategory] : undefined;

  const selection = await getQuestions(
    {
      playerProfileIds,
      count: lobby.questionCount || 10,
      categories: categoriesParam,
      sessionId,
      allowAiFallback: true,
    },
    questionsDataset,
  );

  const questions = selection.questions;
  gameSessionStore.questionsBySession.set(sessionId, questions);

  // Démarre la première question si disponible
  if (questions.length > 0) {
    session.currentQuestion = questions[0] as unknown as Record<string, unknown>;
    // Marque immédiatement la première question comme vue pour tous les participants
    await markQuestionSeen({
      profileIds: playerProfileIds,
      questionId: questions[0].id,
      familyId: questions[0].familyId,
      sessionId,
    });
  }

  // Notifie tous les joueurs du salon en temps réel
  presenceStore.broadcast({
    type: "GAME_STARTED",
    lobbyId,
    gameSessionId: sessionId,
    gameMode: modeToPlay,
    timestamp: now,
    data: { session, participantsCount: participants.length },
  });

  return { session, questions, participants };
}

/**
 * L'hôte pousse une question (ou révèle la réponse) et marque la question comme vue pour les participants.
 */
export async function pushGameQuestion(params: {
  sessionId: string;
  questionIndex: number;
  revealed: boolean;
}): Promise<GameSession> {
  const { sessionId, questionIndex, revealed } = params;
  const session = gameSessionStore.sessions.get(sessionId);
  if (!session) throw new Error("SESSION_NOT_FOUND");

  const questions = gameSessionStore.questionsBySession.get(sessionId) ?? [];
  const q = questions[questionIndex];

  session.questionIndex = questionIndex;
  session.currentQuestion = q ? (q as unknown as Record<string, unknown>) : null;
  session.answersRevealed = revealed;
  session.stateVersion += 1;
  gameSessionStore.sessions.set(sessionId, session);

  // Marque la question comme vue pour tous les participants actifs dès qu'elle est affichée
  if (q && !revealed) {
    const participants = Array.from(gameSessionStore.participants.values())
      .filter((p) => p.gameSessionId === sessionId)
      .map((p) => p.profileId);

    await markQuestionSeen({
      profileIds: participants,
      questionId: q.id,
      familyId: q.familyId,
      sessionId,
    });
  }

  return session;
}

/**
 * Enregistre le score d'un participant.
 */
export async function addParticipantScore(
  sessionId: string,
  profileId: string,
  points: number,
): Promise<GameSessionParticipant> {
  const key = `${sessionId}:${profileId}`;
  const part = gameSessionStore.participants.get(key);
  if (!part) throw new Error("PARTICIPANT_NOT_FOUND");

  part.score += points;
  gameSessionStore.participants.set(key, part);
  return part;
}

/**
 * Termine la partie active et bascule le salon en POST_GAME (podium / résultats) sans détruire le salon.
 */
export async function finishGameSession(sessionId: string): Promise<{ session: GameSession; lobby: Lobby | null }> {
  const session = gameSessionStore.sessions.get(sessionId);
  if (!session) throw new Error("SESSION_NOT_FOUND");

  const now = new Date().toISOString();
  session.status = "FINISHED";
  session.finishedAt = now;
  gameSessionStore.sessions.set(sessionId, session);

  const lobby = lobbyStore.lobbies.get(session.lobbyId) ?? null;
  if (lobby) {
    lobby.status = "POST_GAME";
    lobby.currentGameSessionId = null;
    lobby.updatedAt = now;
    lobbyStore.lobbies.set(lobby.id, lobby);
  }

  presenceStore.broadcast({
    type: "GAME_FINISHED",
    lobbyId: session.lobbyId,
    gameSessionId: sessionId,
    timestamp: now,
  });

  return { session, lobby };
}

/**
 * Retourne au salon d'attente (depuis l'écran des résultats).
 * Les joueurs restent membres du salon et peuvent relancer une nouvelle partie ou changer de mode.
 */
export async function returnToLobby(lobbyId: string): Promise<Lobby> {
  const lobby = lobbyStore.lobbies.get(lobbyId);
  if (!lobby) throw new Error("LOBBY_NOT_FOUND");

  lobby.status = "WAITING";
  lobby.currentGameSessionId = null;
  lobby.updatedAt = new Date().toISOString();
  lobbyStore.lobbies.set(lobbyId, lobby);

  presenceStore.broadcast({
    type: "LOBBY_RETURN",
    lobbyId,
    timestamp: lobby.updatedAt,
  });

  return lobby;
}

/**
 * Récupère les participants d'une session de jeu.
 */
export async function getGameSessionParticipants(sessionId: string): Promise<GameSessionParticipant[]> {
  return Array.from(gameSessionStore.participants.values()).filter((p) => p.gameSessionId === sessionId);
}
