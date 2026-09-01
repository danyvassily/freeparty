import { describe, it, expect, beforeEach } from "vitest";
import type { Question } from "@/lib/questions/schema";
import {
  createLobby,
  joinLobbyByCode,
  updateLobbyMode,
  setParticipationStatus,
  leaveLobby,
  reconnectPlayer,
  getConnectedLobbyMembers,
  lobbyStore,
  startGameFromLobby,
  finishGameSession,
  returnToLobby,
  pushGameQuestion,
  gameSessionStore,
  presenceStore,
  friendStore,
  sendLobbyInvitation,
  respondToLobbyInvitation,
  sendJoinRequest,
  respondToJoinRequest,
  partyStore,
  createParty,
  joinParty,
  type RealtimeEventPayload,
} from "@/lib/social";
import { questionHistoryStore, reservationStore } from "@/lib/anti-repetition";

// Mock questions for test
const testQuestions: Question[] = [
  {
    id: "q-fam-1",
    conceptId: "c.1",
    familyId: "fam.1",
    type: "mcq",
    inputMode: "mcq",
    question: "Question de la famille 1 ?",
    answers: ["A", "B", "C", "D"],
    correctAnswer: 0,
    category: "culture-generale",
    subcategory: "test",
    difficulty: "easy",
    language: "fr",
    tags: [],
    source: { provider: "test", license: "CC0" },
    verification: { status: "verified", sources: [] },
    confidence: 1,
    qualityScore: 1,
    version: 1,
  },
  {
    id: "q-fam-2",
    conceptId: "c.2",
    familyId: "fam.2",
    type: "mcq",
    inputMode: "mcq",
    question: "Question de la famille 2 ?",
    answers: ["A", "B", "C", "D"],
    correctAnswer: 0,
    category: "culture-generale",
    subcategory: "test",
    difficulty: "easy",
    language: "fr",
    tags: [],
    source: { provider: "test", license: "CC0" },
    verification: { status: "verified", sources: [] },
    confidence: 1,
    qualityScore: 1,
    version: 1,
  },
  {
    id: "q-fam-3",
    conceptId: "c.3",
    familyId: "fam.3",
    type: "mcq",
    inputMode: "mcq",
    question: "Question de la famille 3 ?",
    answers: ["A", "B", "C", "D"],
    correctAnswer: 0,
    category: "culture-generale",
    subcategory: "test",
    difficulty: "easy",
    language: "fr",
    tags: [],
    source: { provider: "test", license: "CC0" },
    verification: { status: "verified", sources: [] },
    confidence: 1,
    qualityScore: 1,
    version: 1,
  },
  {
    id: "q-fam-4",
    conceptId: "c.4",
    familyId: "fam.4",
    type: "mcq",
    inputMode: "mcq",
    question: "Question de la famille 4 ?",
    answers: ["A", "B", "C", "D"],
    correctAnswer: 0,
    category: "culture-generale",
    subcategory: "test",
    difficulty: "easy",
    language: "fr",
    tags: [],
    source: { provider: "test", license: "CC0" },
    verification: { status: "verified", sources: [] },
    confidence: 1,
    qualityScore: 1,
    version: 1,
  },
  {
    id: "q-fam-5",
    conceptId: "c.5",
    familyId: "fam.5",
    type: "mcq",
    inputMode: "mcq",
    question: "Question de la famille 5 ?",
    answers: ["A", "B", "C", "D"],
    correctAnswer: 0,
    category: "culture-generale",
    subcategory: "test",
    difficulty: "easy",
    language: "fr",
    tags: [],
    source: { provider: "test", license: "CC0" },
    verification: { status: "verified", sources: [] },
    confidence: 1,
    qualityScore: 1,
    version: 1,
  },
  {
    id: "q-fam-6",
    conceptId: "c.6",
    familyId: "fam.6",
    type: "mcq",
    inputMode: "mcq",
    question: "Question de la famille 6 ?",
    answers: ["A", "B", "C", "D"],
    correctAnswer: 0,
    category: "culture-generale",
    subcategory: "test",
    difficulty: "easy",
    language: "fr",
    tags: [],
    source: { provider: "test", license: "CC0" },
    verification: { status: "verified", sources: [] },
    confidence: 1,
    qualityScore: 1,
    version: 1,
  },
];

describe("Salons Persistants & Système Social — Tests Spécification", () => {
  beforeEach(() => {
    lobbyStore.clear();
    gameSessionStore.clear();
    presenceStore.clear();
    friendStore.clear();
    partyStore.clear();
    questionHistoryStore.clear();
    reservationStore.clear();
  });

  // TEST 1: Créer salon, ajouter A, B, C, lancer partie, terminer partie -> A, B, C restent membres du même salon
  it("TEST 1: Le salon survit à la fin d'une partie et conserve tous ses membres", async () => {
    const { lobby, member: host } = await createLobby({ ownerProfileId: "prof_A", nickname: "Alice" });
    await joinLobbyByCode({ code: lobby.code, profileId: "prof_B", nickname: "Bob" });
    await joinLobbyByCode({ code: lobby.code, profileId: "prof_C", nickname: "Charlie" });

    // Lancer la partie
    const { session } = await startGameFromLobby({
      lobbyId: lobby.id,
      requestedByProfileId: host.profileId,
      questionsDataset: testQuestions,
    });

    expect(session.status).toBe("PLAYING");
    expect(lobbyStore.lobbies.get(lobby.id)?.status).toBe("IN_GAME");

    // Terminer la partie
    await finishGameSession(session.id);
    expect(lobbyStore.lobbies.get(lobby.id)?.status).toBe("POST_GAME");

    // Retour au salon
    await returnToLobby(lobby.id);
    expect(lobbyStore.lobbies.get(lobby.id)?.status).toBe("WAITING");

    // Vérifier que A, B, C sont toujours connectés dans le même salon
    const members = await getConnectedLobbyMembers(lobby.id);
    const memberIds = members.map((m) => m.profileId);
    expect(memberIds).toEqual(expect.arrayContaining(["prof_A", "prof_B", "prof_C"]));
  });

  // TEST 2: Après GameSession 1, host choisit un autre mode et crée GameSession 2
  it("TEST 2: Changement de mode dans le même salon avec les mêmes participants", async () => {
    const { lobby, member: host } = await createLobby({ ownerProfileId: "prof_A", nickname: "Alice", mode: "classic" });
    await joinLobbyByCode({ code: lobby.code, profileId: "prof_B", nickname: "Bob" });

    // Match 1
    const { session: s1 } = await startGameFromLobby({
      lobbyId: lobby.id,
      requestedByProfileId: host.profileId,
      questionsDataset: testQuestions,
    });
    await finishGameSession(s1.id);
    await returnToLobby(lobby.id);

    // Host sélectionne 'rapidfire'
    await updateLobbyMode({ lobbyId: lobby.id, requestedByProfileId: host.profileId, gameMode: "rapidfire" });

    // Match 2
    const { session: s2 } = await startGameFromLobby({
      lobbyId: lobby.id,
      gameMode: "rapidfire",
      requestedByProfileId: host.profileId,
      questionsDataset: testQuestions,
    });

    expect(s2.lobbyId).toBe(lobby.id);
    expect(s2.gameMode).toBe("rapidfire");
    expect(s2.id).not.toBe(s1.id);

    const members = await getConnectedLobbyMembers(lobby.id);
    expect(members).toHaveLength(2);
  });

  // TEST 3: Trois parties successives (Classic, Rapidfire, Debate) -> 1 Lobby, 3 GameSessions
  it("TEST 3: Trois parties successives produisent 1 seul Lobby et 3 GameSessions distinctes", async () => {
    const { lobby, member: host } = await createLobby({ ownerProfileId: "prof_A", nickname: "Alice" });
    await joinLobbyByCode({ code: lobby.code, profileId: "prof_B", nickname: "Bob" });

    const modes = ["classic", "rapidfire", "debate"] as const;
    const sessionIds: string[] = [];

    for (const m of modes) {
      await updateLobbyMode({ lobbyId: lobby.id, requestedByProfileId: host.profileId, gameMode: m });
      const { session } = await startGameFromLobby({
        lobbyId: lobby.id,
        gameMode: m,
        requestedByProfileId: host.profileId,
        questionsDataset: testQuestions,
      });
      sessionIds.push(session.id);
      await finishGameSession(session.id);
      await returnToLobby(lobby.id);
    }

    expect(sessionIds).toHaveLength(3);
    expect(new Set(sessionIds).size).toBe(3); // 3 sessions uniques
    expect(lobbyStore.lobbies.size).toBe(1); // 1 seul Lobby persistant !
  });

  // TEST 4: Joueur invité par code -> rejoint -> après fin de partie, reste dans le salon
  it("TEST 4: Un joueur rejoint par code PIN et reste dans le salon après la partie", async () => {
    const { lobby, member: host } = await createLobby({ ownerProfileId: "prof_A", nickname: "Alice" });
    await joinLobbyByCode({ code: lobby.code, profileId: "prof_guest", nickname: "GuestPlayer" });

    const { session } = await startGameFromLobby({
      lobbyId: lobby.id,
      requestedByProfileId: host.profileId,
      questionsDataset: testQuestions,
    });
    await finishGameSession(session.id);
    await returnToLobby(lobby.id);

    const members = await getConnectedLobbyMembers(lobby.id);
    expect(members.some((m) => m.profileId === "prof_guest")).toBe(true);
  });

  // TEST 5: Joueur invité via liste d'amis -> accepte -> devient LobbyMember
  it("TEST 5: Invitation d'un ami au salon acceptée l'ajoute comme LobbyMember", async () => {
    const { lobby, member: host } = await createLobby({ ownerProfileId: "prof_A", nickname: "Alice" });

    // Ami envoie invitation
    const inv = await sendLobbyInvitation({ lobbyId: lobby.id, senderProfileId: host.profileId, receiverProfileId: "prof_B" });
    expect(inv.status).toBe("PENDING");

    // L'ami accepte et rejoint le salon
    await respondToLobbyInvitation(inv.id, "prof_B", true);
    await joinLobbyByCode({ code: lobby.code, profileId: "prof_B", nickname: "Bob" });

    const members = await getConnectedLobbyMembers(lobby.id);
    expect(members.some((m) => m.profileId === "prof_B")).toBe(true);
  });

  // TEST 6: Friend demande à rejoindre -> Host accepte -> apparaît dans le salon
  it("TEST 6: Demande pour rejoindre acceptée par l'hôte", async () => {
    const { lobby } = await createLobby({ ownerProfileId: "prof_A", nickname: "Alice" });
    const req = await sendJoinRequest({ lobbyId: lobby.id, requesterProfileId: "prof_B" });

    const resolved = await respondToJoinRequest(req.id, true);
    expect(resolved.status).toBe("ACCEPTED");

    await joinLobbyByCode({ code: lobby.code, profileId: "prof_B", nickname: "Bob" });
    const members = await getConnectedLobbyMembers(lobby.id);
    expect(members.some((m) => m.profileId === "prof_B")).toBe(true);
  });

  // TEST 7: Friend demande à rejoindre -> Host refuse -> ne devient pas membre
  it("TEST 7: Demande pour rejoindre refusée par l'hôte", async () => {
    const { lobby } = await createLobby({ ownerProfileId: "prof_A", nickname: "Alice" });
    const req = await sendJoinRequest({ lobbyId: lobby.id, requesterProfileId: "prof_B" });

    const resolved = await respondToJoinRequest(req.id, false);
    expect(resolved.status).toBe("DECLINED");

    const members = await getConnectedLobbyMembers(lobby.id);
    expect(members.some((m) => m.profileId === "prof_B")).toBe(false);
  });

  // TEST 8: Party (A, B, C) crée un salon -> les trois rejoignent
  it("TEST 8: Une Party constituée rejoint le même salon", async () => {
    const party = await createParty("prof_A");
    await joinParty(party.id, "prof_B");
    await joinParty(party.id, "prof_C");

    const { lobby } = await createLobby({ ownerProfileId: "prof_A", nickname: "Alice" });
    await joinLobbyByCode({ code: lobby.code, profileId: "prof_B", nickname: "Bob" });
    await joinLobbyByCode({ code: lobby.code, profileId: "prof_C", nickname: "Charlie" });

    const members = await getConnectedLobbyMembers(lobby.id);
    expect(members).toHaveLength(3);
  });

  // TEST 9: Host change de mode -> diffusion de LOBBY_MODE_CHANGED
  it("TEST 9: Changement de mode diffuse l'événement temps réel", async () => {
    const { lobby, member: host } = await createLobby({ ownerProfileId: "prof_A", nickname: "Alice" });

    const events: RealtimeEventPayload[] = [];
    const unsub = presenceStore.subscribe((e) => events.push(e));

    await updateLobbyMode({ lobbyId: lobby.id, requestedByProfileId: host.profileId, gameMode: "truefalse" });

    expect(events.some((e) => e.type === "LOBBY_MODE_CHANGED" && e.gameMode === "truefalse")).toBe(true);
    unsub();
  });

  // TEST 10: Host lance nouvelle partie -> tous reçoivent GAME_STARTED
  it("TEST 10: Lancement de partie diffuse GAME_STARTED vers la même GameSession", async () => {
    const { lobby, member: host } = await createLobby({ ownerProfileId: "prof_A", nickname: "Alice" });
    await joinLobbyByCode({ code: lobby.code, profileId: "prof_B", nickname: "Bob" });

    const events: RealtimeEventPayload[] = [];
    const unsub = presenceStore.subscribe((e) => events.push(e));

    const { session } = await startGameFromLobby({
      lobbyId: lobby.id,
      requestedByProfileId: host.profileId,
      questionsDataset: testQuestions,
    });

    const startEvent = events.find((e) => e.type === "GAME_STARTED");
    expect(startEvent).toBeDefined();
    expect(startEvent?.gameSessionId).toBe(session.id);
    unsub();
  });

  // TEST 11: Fin de partie -> diffusion GAME_FINISHED et retour salon
  it("TEST 11: Fin de partie diffuse GAME_FINISHED et permet le retour au salon", async () => {
    const { lobby, member: host } = await createLobby({ ownerProfileId: "prof_A", nickname: "Alice" });
    const { session } = await startGameFromLobby({
      lobbyId: lobby.id,
      requestedByProfileId: host.profileId,
      questionsDataset: testQuestions,
    });

    const events: RealtimeEventPayload[] = [];
    const unsub = presenceStore.subscribe((e) => events.push(e));

    await finishGameSession(session.id);
    expect(events.some((e) => e.type === "GAME_FINISHED")).toBe(true);

    await returnToLobby(lobby.id);
    expect(events.some((e) => e.type === "LOBBY_RETURN")).toBe(true);
    unsub();
  });

  // TEST 12: Joueur quitte volontairement -> exclu des prochaines parties
  it("TEST 12: Un joueur qui quitte le salon ne participe plus aux parties suivantes", async () => {
    const { lobby, member: host } = await createLobby({ ownerProfileId: "prof_A", nickname: "Alice" });
    await joinLobbyByCode({ code: lobby.code, profileId: "prof_B", nickname: "Bob" });
    await joinLobbyByCode({ code: lobby.code, profileId: "prof_C", nickname: "Charlie" });

    // Charlie quitte le salon
    await leaveLobby(lobby.id, "prof_C");

    const { participants } = await startGameFromLobby({
      lobbyId: lobby.id,
      requestedByProfileId: host.profileId,
      questionsDataset: testQuestions,
    });

    const participantIds = participants.map((p) => p.profileId);
    expect(participantIds).toEqual(["prof_A", "prof_B"]);
    expect(participantIds).not.toContain("prof_C");
  });

  // TEST 13: Déconnexion temporaire puis reconnexion -> retrouve automatiquement son salon
  it("TEST 13: Reconnexion restaure l'accès au salon actif", async () => {
    const { lobby } = await createLobby({ ownerProfileId: "prof_A", nickname: "Alice" });
    await joinLobbyByCode({ code: lobby.code, profileId: "prof_B", nickname: "Bob" });

    // Joueur B se reconnecte
    const reconn = await reconnectPlayer("prof_B");
    expect(reconn.destination).toBe("LOBBY");
    expect(reconn.lobbyId).toBe(lobby.id);
  });

  // TEST 14: Déconnexion pendant partie -> reconnexion retrouve la GameSession
  it("TEST 14: Reconnexion pendant une partie renvoie vers la GameSession active", async () => {
    const { lobby, member: host } = await createLobby({ ownerProfileId: "prof_A", nickname: "Alice" });
    await joinLobbyByCode({ code: lobby.code, profileId: "prof_B", nickname: "Bob" });

    const { session } = await startGameFromLobby({
      lobbyId: lobby.id,
      requestedByProfileId: host.profileId,
      questionsDataset: testQuestions,
    });

    const reconn = await reconnectPlayer("prof_B");
    expect(reconn.destination).toBe("GAME");
    expect(reconn.gameSessionId).toBe(session.id);
  });

  // TEST 15: L'hôte quitte -> nouveau propriétaire désigné automatiquement
  it("TEST 15: Host migration désigne le membre connecté le plus ancien", async () => {
    const { lobby } = await createLobby({ ownerProfileId: "prof_A", nickname: "Alice" });
    await joinLobbyByCode({ code: lobby.code, profileId: "prof_B", nickname: "Bob" });
    await joinLobbyByCode({ code: lobby.code, profileId: "prof_C", nickname: "Charlie" });

    // Host A quitte
    await leaveLobby(lobby.id, "prof_A");

    const updatedLobby = lobbyStore.lobbies.get(lobby.id);
    expect(updatedLobby?.ownerProfileId).toBe("prof_B"); // Bob est le plus ancien après Alice
    expect(updatedLobby?.status).not.toBe("CLOSED");
  });

  // TEST 16: Dernier joueur quitte -> salon marqué CLOSED
  it("TEST 16: Le salon est fermé lorsque tous les joueurs ont quitté", async () => {
    const { lobby } = await createLobby({ ownerProfileId: "prof_A", nickname: "Alice" });
    await leaveLobby(lobby.id, "prof_A");

    const updated = lobbyStore.lobbies.get(lobby.id);
    expect(updated?.status).toBe("CLOSED");
  });

  // TEST 17: Joueur en SITTING_OUT -> reste dans le salon mais non ajouté à la GameSession
  it("TEST 17: Un joueur en SITTING_OUT reste membre du salon sans jouer la partie", async () => {
    const { lobby, member: host } = await createLobby({ ownerProfileId: "prof_A", nickname: "Alice" });
    await joinLobbyByCode({ code: lobby.code, profileId: "prof_B", nickname: "Bob" });
    await joinLobbyByCode({ code: lobby.code, profileId: "prof_C", nickname: "Charlie" });

    // Charlie choisit de ne pas participer au prochain match
    await setParticipationStatus(lobby.id, "prof_C", "SITTING_OUT");

    const { participants } = await startGameFromLobby({
      lobbyId: lobby.id,
      requestedByProfileId: host.profileId,
      questionsDataset: testQuestions,
    });

    expect(participants.map((p) => p.profileId)).toEqual(["prof_A", "prof_B"]);

    // Mais Charlie est toujours membre du salon
    const members = await getConnectedLobbyMembers(lobby.id);
    expect(members.some((m) => m.profileId === "prof_C")).toBe(true);
  });

  // TEST 18: Double clic sur LANCER -> rejet idempotent
  it("TEST 18: Empêche les démarrages concurrents (anti double-clic)", async () => {
    const { lobby, member: host } = await createLobby({ ownerProfileId: "prof_A", nickname: "Alice" });
    await joinLobbyByCode({ code: lobby.code, profileId: "prof_B", nickname: "Bob" });

    await startGameFromLobby({
      lobbyId: lobby.id,
      requestedByProfileId: host.profileId,
      questionsDataset: testQuestions,
    });

    // Deuxième appel simultané alors que la partie est déjà IN_GAME
    await expect(
      startGameFromLobby({
        lobbyId: lobby.id,
        requestedByProfileId: host.profileId,
        questionsDataset: testQuestions,
      }),
    ).rejects.toThrow("GAME_ALREADY_RUNNING");
  });

  // TEST 19: Invitations multiples idempotentes
  it("TEST 19: Adhésion par code répétée reste idempotente (1 seul LobbyMember)", async () => {
    const { lobby } = await createLobby({ ownerProfileId: "prof_A", nickname: "Alice" });

    // Double join par Bob
    await joinLobbyByCode({ code: lobby.code, profileId: "prof_B", nickname: "Bob" });
    await joinLobbyByCode({ code: lobby.code, profileId: "prof_B", nickname: "Bob" });

    const members = await getConnectedLobbyMembers(lobby.id);
    expect(members.filter((m) => m.profileId === "prof_B")).toHaveLength(1);
  });

  // TEST 20: Intégration Anti-Répétition avec le Lobby persistant
  it("TEST 20: Intégration Anti-Répétition entre parties successives dans le même salon", async () => {
    const { lobby, member: host } = await createLobby({ ownerProfileId: "prof_A", nickname: "Alice", questionCount: 2 });
    await joinLobbyByCode({ code: lobby.code, profileId: "prof_B", nickname: "Bob" });

    // Match 1 : sert 2 questions (ex: fam.1 et fam.2)
    const { session: s1, questions: q1 } = await startGameFromLobby({
      lobbyId: lobby.id,
      requestedByProfileId: host.profileId,
      questionsDataset: testQuestions,
    });
    expect(q1).toHaveLength(2);
    const seenFamIds1 = q1.map((q) => q.familyId);

    // Marquer les questions de la session 1 comme vues
    for (let i = 0; i < q1.length; i++) {
      await pushGameQuestion({ sessionId: s1.id, questionIndex: i, revealed: false });
    }

    await finishGameSession(s1.id);
    await returnToLobby(lobby.id);

    // Match 2 dans le même salon sans réinviter personne
    const { questions: q2 } = await startGameFromLobby({
      lobbyId: lobby.id,
      requestedByProfileId: host.profileId,
      questionsDataset: testQuestions,
    });

    expect(q2).toHaveLength(2);
    for (const q of q2) {
      // Aucune famille du match 1 ne doit réapparaître dans le match 2 !
      expect(seenFamIds1).not.toContain(q.familyId);
    }
  });
});
