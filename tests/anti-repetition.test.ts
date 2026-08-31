import { describe, it, expect, beforeEach } from "vitest";
import type { Question } from "@/lib/questions/schema";
import {
  getQuestions,
  markQuestionSeen,
  getOrCreateDeviceProfile,
  linkUserToProfile,
  inMemoryIdentity,
  questionHistoryStore,
  reservationStore,
  computeContentHash,
  normalizeKnowledgeKey,
  computeTextSimilarity,
} from "@/lib/anti-repetition";

// Mock dataset pour les tests de sélection déterministes
const mockQuestions: Question[] = [
  {
    id: "geo-fr-cap-01",
    conceptId: "geo.country.fr.capital",
    familyId: "geo.country.fr.capital",
    type: "mcq",
    inputMode: "mcq",
    question: "Quelle est la capitale de la France ?",
    answers: ["Paris", "Lyon", "Marseille", "Bordeaux"],
    correctAnswer: 0,
    category: "geographie",
    subcategory: "capitales",
    difficulty: "easy",
    language: "fr",
    tags: ["france", "europe"],
    source: { provider: "wikidata", license: "CC0" },
    verification: { status: "verified", sources: ["wikidata"] },
    confidence: 0.98,
    qualityScore: 0.95,
    version: 1,
  },
  {
    id: "geo-fr-cap-02",
    conceptId: "geo.country.fr.capital",
    familyId: "geo.country.fr.capital",
    type: "mcq",
    inputMode: "mcq",
    question: "Paris est la capitale de quel pays européen ?",
    answers: ["France", "Belgique", "Suisse", "Monaco"],
    correctAnswer: 0,
    category: "geographie",
    subcategory: "capitales",
    difficulty: "easy",
    language: "fr",
    tags: ["france"],
    source: { provider: "wikidata", license: "CC0" },
    verification: { status: "verified", sources: ["wikidata"] },
    confidence: 0.98,
    qualityScore: 0.95,
    version: 1,
  },
  {
    id: "geo-fr-cap-en",
    conceptId: "geo.country.fr.capital",
    familyId: "geo.country.fr.capital",
    type: "mcq",
    inputMode: "mcq",
    question: "What is the capital of France?",
    answers: ["Paris", "Lyon", "Marseille", "Bordeaux"],
    correctAnswer: 0,
    category: "geographie",
    subcategory: "capitales",
    difficulty: "easy",
    language: "en",
    tags: ["france"],
    source: { provider: "wikidata", license: "CC0" },
    verification: { status: "verified", sources: ["wikidata"] },
    confidence: 0.98,
    qualityScore: 0.95,
    version: 1,
  },
  {
    id: "geo-jp-cap-01",
    conceptId: "geo.country.jp.capital",
    familyId: "geo.country.jp.capital",
    type: "mcq",
    inputMode: "mcq",
    question: "Quelle est la capitale du Japon ?",
    answers: ["Tokyo", "Kyoto", "Osaka", "Nagoya"],
    correctAnswer: 0,
    category: "geographie",
    subcategory: "capitales",
    difficulty: "easy",
    language: "fr",
    tags: ["japon", "asie"],
    source: { provider: "wikidata", license: "CC0" },
    verification: { status: "verified", sources: ["wikidata"] },
    confidence: 0.98,
    qualityScore: 0.95,
    version: 1,
  },
  {
    id: "geo-jp-cap-en",
    conceptId: "geo.country.jp.capital",
    familyId: "geo.country.jp.capital",
    type: "mcq",
    inputMode: "mcq",
    question: "What is the capital of Japan?",
    answers: ["Tokyo", "Kyoto", "Osaka", "Nagoya"],
    correctAnswer: 0,
    category: "geographie",
    subcategory: "capitales",
    difficulty: "easy",
    language: "en",
    tags: ["japon"],
    source: { provider: "wikidata", license: "CC0" },
    verification: { status: "verified", sources: ["wikidata"] },
    confidence: 0.98,
    qualityScore: 0.95,
    version: 1,
  },
  {
    id: "hist-ww2-start",
    conceptId: "hist.ww2.start.year",
    familyId: "hist.ww2.start.year",
    type: "mcq",
    inputMode: "mcq",
    question: "En quelle année a débuté la Seconde Guerre mondiale ?",
    answers: ["1939", "1914", "1945", "1936"],
    correctAnswer: 0,
    category: "histoire",
    subcategory: "guerre-mondiale",
    difficulty: "easy",
    language: "fr",
    tags: ["ww2"],
    source: { provider: "wikidata", license: "CC0" },
    verification: { status: "verified", sources: ["wikidata"] },
    confidence: 0.98,
    qualityScore: 0.95,
    version: 1,
  },
  {
    id: "sci-water-formula",
    conceptId: "sci.chem.water.formula",
    familyId: "sci.chem.water.formula",
    type: "mcq",
    inputMode: "mcq",
    question: "Quelle est la formule chimique de l'eau ?",
    answers: ["H2O", "CO2", "NaCl", "CH4"],
    correctAnswer: 0,
    category: "science",
    subcategory: "chimie",
    difficulty: "easy",
    language: "fr",
    tags: ["chimie"],
    source: { provider: "wikidata", license: "CC0" },
    verification: { status: "verified", sources: ["wikidata"] },
    confidence: 0.98,
    qualityScore: 0.95,
    version: 1,
  },
  {
    id: "sci-gravity-newton",
    conceptId: "sci.phys.gravity.newton",
    familyId: "sci.phys.gravity.newton",
    type: "mcq",
    inputMode: "mcq",
    question: "Qui a formulé la loi de la gravitation universelle ?",
    answers: ["Isaac Newton", "Albert Einstein", "Galilée", "Niels Bohr"],
    correctAnswer: 0,
    category: "science",
    subcategory: "physique",
    difficulty: "medium",
    language: "fr",
    tags: ["physique"],
    source: { provider: "wikidata", license: "CC0" },
    verification: { status: "verified", sources: ["wikidata"] },
    confidence: 0.98,
    qualityScore: 0.95,
    version: 1,
  },
  {
    id: "myth-zeus-god",
    conceptId: "myth.greek.zeus.role",
    familyId: "myth.greek.zeus.role",
    type: "mcq",
    inputMode: "mcq",
    question: "Dans la mythologie grecque, de quoi Zeus est-il le dieu souverain ?",
    answers: ["Le ciel et la foudre", "Les océans", "Les enfers", "La guerre"],
    correctAnswer: 0,
    category: "mythologie-grecque",
    subcategory: "dieux",
    difficulty: "easy",
    language: "fr",
    tags: ["zeus"],
    source: { provider: "wikidata", license: "CC0" },
    verification: { status: "verified", sources: ["wikidata"] },
    confidence: 0.98,
    qualityScore: 0.95,
    version: 1,
  },
  {
    id: "art-mona-lisa",
    conceptId: "art.painting.mona.lisa.painter",
    familyId: "art.painting.mona.lisa.painter",
    type: "mcq",
    inputMode: "mcq",
    question: "Qui a peint La Joconde ?",
    answers: ["Léonard de Vinci", "Michel-Ange", "Raphaël", "Botticelli"],
    correctAnswer: 0,
    category: "art",
    subcategory: "renaissance",
    difficulty: "easy",
    language: "fr",
    tags: ["peinture"],
    source: { provider: "wikidata", license: "CC0" },
    verification: { status: "verified", sources: ["wikidata"] },
    confidence: 0.98,
    qualityScore: 0.95,
    version: 1,
  },
];

describe("Système Anti-Répétition — Tests Spécification", () => {
  beforeEach(() => {
    inMemoryIdentity.clear();
    questionHistoryStore.clear();
    reservationStore.clear();
  });

  // TEST 1: Joueur nouveau -> historique vide -> questions valides
  it("TEST 1: Nouveau joueur avec historique vide reçoit des questions valides", async () => {
    const { profile } = await getOrCreateDeviceProfile("device_test_1");
    const result = await getQuestions(
      { playerProfileIds: [profile.id], count: 3, language: "fr" },
      mockQuestions,
    );

    expect(result.returned).toBe(3);
    expect(result.poolExhausted).toBe(false);
    expect(result.questions).toHaveLength(3);
    for (const q of result.questions) {
      expect(q.language).toBe("fr");
      expect(q.id).toBeDefined();
    }
  });

  // TEST 2: Joueur ayant déjà vu Family A, B, C -> le moteur ne doit jamais retourner A, B, C
  it("TEST 2: Exclut strictement toutes les familles déjà vues par le joueur", async () => {
    const { profile } = await getOrCreateDeviceProfile("device_test_2");
    const seenFamilies = ["geo.country.fr.capital", "hist.ww2.start.year", "sci.chem.water.formula"];

    for (const fam of seenFamilies) {
      await markQuestionSeen({
        profileIds: [profile.id],
        familyId: fam,
        questionId: `mock_${fam}`,
      });
    }

    const result = await getQuestions(
      { playerProfileIds: [profile.id], count: 3, language: "fr" },
      mockQuestions,
    );

    expect(result.returned).toBe(3);
    for (const q of result.questions) {
      expect(seenFamilies).not.toContain(q.familyId);
    }
  });

  // TEST 3: Deux variantes Q1 et Q2 de Family A -> si Q1 vue, Q2 doit être exclue
  it("TEST 3: Deux variantes de la même QuestionFamily sont exclues dès que l'une est vue", async () => {
    const { profile } = await getOrCreateDeviceProfile("device_test_3");

    // Joueur voit Q1 (geo-fr-cap-01) appartenant à geo.country.fr.capital
    await markQuestionSeen({
      profileIds: [profile.id],
      familyId: "geo.country.fr.capital",
      questionId: "geo-fr-cap-01",
    });

    const result = await getQuestions(
      { playerProfileIds: [profile.id], count: 5, language: "fr" },
      mockQuestions,
    );

    const questionIds = result.questions.map((q) => q.id);
    expect(questionIds).not.toContain("geo-fr-cap-01");
    expect(questionIds).not.toContain("geo-fr-cap-02"); // La reformulation est aussi exclue !
  });

  // TEST 4: Deux joueurs A({A,B}) et B({C,D}) -> le moteur doit exclure {A,B,C,D}
  it("TEST 4: En multijoueur, l'UNION des historiques des deux joueurs est exclue", async () => {
    const { profile: playerA } = await getOrCreateDeviceProfile("dev_A");
    const { profile: playerB } = await getOrCreateDeviceProfile("dev_B");

    // Player A a vu France et WW2
    await markQuestionSeen({ profileIds: [playerA.id], familyId: "geo.country.fr.capital", questionId: "q1" });
    await markQuestionSeen({ profileIds: [playerA.id], familyId: "hist.ww2.start.year", questionId: "q2" });

    // Player B a vu Japon et Eau
    await markQuestionSeen({ profileIds: [playerB.id], familyId: "geo.country.jp.capital", questionId: "q3" });
    await markQuestionSeen({ profileIds: [playerB.id], familyId: "sci.chem.water.formula", questionId: "q4" });

    const result = await getQuestions(
      { playerProfileIds: [playerA.id, playerB.id], count: 3, language: "fr" },
      mockQuestions,
    );

    const forbidden = ["geo.country.fr.capital", "hist.ww2.start.year", "geo.country.jp.capital", "sci.chem.water.formula"];
    for (const q of result.questions) {
      expect(forbidden).not.toContain(q.familyId);
    }
  });

  // TEST 5: Deux joueurs ayant déjà joué ensemble
  it("TEST 5: Les familles vues lors d'anciennes parties communes sont exclues de la nouvelle", async () => {
    const { profile: playerA } = await getOrCreateDeviceProfile("dev_A5");
    const { profile: playerB } = await getOrCreateDeviceProfile("dev_B5");

    // Partie 1 ensemble : ils voient la Joconde et Zeus
    await markQuestionSeen({
      profileIds: [playerA.id, playerB.id],
      familyId: "art.painting.mona.lisa.painter",
      questionId: "art-mona-lisa",
      sessionId: "session_1",
    });
    await markQuestionSeen({
      profileIds: [playerA.id, playerB.id],
      familyId: "myth.greek.zeus.role",
      questionId: "myth-zeus-god",
      sessionId: "session_1",
    });

    // Partie 2 : sélection pour la nouvelle partie
    const result = await getQuestions(
      { playerProfileIds: [playerA.id, playerB.id], count: 3, language: "fr", sessionId: "session_2" },
      mockQuestions,
    );

    for (const q of result.questions) {
      expect(q.familyId).not.toBe("art.painting.mona.lisa.painter");
      expect(q.familyId).not.toBe("myth.greek.zeus.role");
    }
  });

  // TEST 6: Ajout d'un troisième joueur C({E,F}) -> Interdit: {A,B,C,D,E,F}
  it("TEST 6: L'arrivée d'un 3e joueur ajoute son historique à l'ensemble interdit", async () => {
    const { profile: pA } = await getOrCreateDeviceProfile("dev_6A");
    const { profile: pB } = await getOrCreateDeviceProfile("dev_6B");
    const { profile: pC } = await getOrCreateDeviceProfile("dev_6C");

    await markQuestionSeen({ profileIds: [pA.id], familyId: "geo.country.fr.capital", questionId: "1" });
    await markQuestionSeen({ profileIds: [pA.id], familyId: "hist.ww2.start.year", questionId: "2" });
    await markQuestionSeen({ profileIds: [pB.id], familyId: "geo.country.jp.capital", questionId: "3" });
    await markQuestionSeen({ profileIds: [pB.id], familyId: "sci.chem.water.formula", questionId: "4" });
    await markQuestionSeen({ profileIds: [pC.id], familyId: "sci.phys.gravity.newton", questionId: "5" });
    await markQuestionSeen({ profileIds: [pC.id], familyId: "art.painting.mona.lisa.painter", questionId: "6" });

    const result = await getQuestions(
      { playerProfileIds: [pA.id, pB.id, pC.id], count: 1, language: "fr" },
      mockQuestions,
    );

    // Seule la famille Zeus reste inédite pour tous les 3
    expect(result.questions[0].familyId).toBe("myth.greek.zeus.role");
  });

  // TEST 7: Utilisateur anonyme A B C -> création de compte -> compte conserve A B C
  it("TEST 7: Création de compte conserve intégralement l'historique anonyme", async () => {
    const { profile: anonProfile } = await getOrCreateDeviceProfile("phone_device_7");

    await markQuestionSeen({ profileIds: [anonProfile.id], familyId: "geo.country.fr.capital", questionId: "1" });
    await markQuestionSeen({ profileIds: [anonProfile.id], familyId: "geo.country.jp.capital", questionId: "2" });
    await markQuestionSeen({ profileIds: [anonProfile.id], familyId: "hist.ww2.start.year", questionId: "3" });

    // L'utilisateur crée un compte
    const userProfile = await linkUserToProfile("user_12345", anonProfile.id, "Dany");

    // Vérification : les questions vues sont toujours rattachées au profil utilisateur
    const seenFamilies = questionHistoryStore.getSeenFamiliesForProfiles([userProfile.id]);
    expect(seenFamilies.has("geo.country.fr.capital")).toBe(true);
    expect(seenFamilies.has("geo.country.jp.capital")).toBe(true);
    expect(seenFamilies.has("hist.ww2.start.year")).toBe(true);
  });

  // TEST 8: Compte existant (D E F) + connexion depuis appareil anonyme (A B C) -> Résultat : A B C D E F
  it("TEST 8: Connexion fusionne l'historique anonyme local avec l'historique du compte", async () => {
    // 1. Profil du compte existant (vu D E F)
    const accountProfile = await linkUserToProfile("user_account_8", undefined, "Alice");
    await markQuestionSeen({ profileIds: [accountProfile.id], familyId: "sci.chem.water.formula", questionId: "D" });
    await markQuestionSeen({ profileIds: [accountProfile.id], familyId: "sci.phys.gravity.newton", questionId: "E" });
    await markQuestionSeen({ profileIds: [accountProfile.id], familyId: "myth.greek.zeus.role", questionId: "F" });

    // 2. Profil anonyme sur un nouveau téléphone (vu A B C)
    const { profile: anonPhone } = await getOrCreateDeviceProfile("new_phone_8");
    await markQuestionSeen({ profileIds: [anonPhone.id], familyId: "geo.country.fr.capital", questionId: "A" });
    await markQuestionSeen({ profileIds: [anonPhone.id], familyId: "geo.country.jp.capital", questionId: "B" });
    await markQuestionSeen({ profileIds: [anonPhone.id], familyId: "hist.ww2.start.year", questionId: "C" });

    // 3. Connexion au compte depuis ce téléphone
    await linkUserToProfile("user_account_8", anonPhone.id);

    // 4. L'historique du compte doit maintenant contenir l'union A B C D E F
    const finalSeen = questionHistoryStore.getSeenFamiliesForProfiles([accountProfile.id]);
    expect(finalSeen.size).toBe(6);
    expect(finalSeen.has("geo.country.fr.capital")).toBe(true);
    expect(finalSeen.has("geo.country.jp.capital")).toBe(true);
    expect(finalSeen.has("hist.ww2.start.year")).toBe(true);
    expect(finalSeen.has("sci.chem.water.formula")).toBe(true);
    expect(finalSeen.has("sci.phys.gravity.newton")).toBe(true);
    expect(finalSeen.has("myth.greek.zeus.role")).toBe(true);
  });

  // TEST 9: Question affichée puis partie quittée sans réponse -> considérée comme vue
  it("TEST 9: Une question affichée est considérée comme vue même sans réponse", async () => {
    const { profile } = await getOrCreateDeviceProfile("dev_9");

    // Question affichée
    await markQuestionSeen({
      profileIds: [profile.id],
      familyId: "geo.country.fr.capital",
      questionId: "geo-fr-cap-01",
      sessionId: "session_aborted",
    });

    // L'utilisateur quitte sans répondre
    // Sélection suivante : la question ne doit plus être proposée
    const result = await getQuestions(
      { playerProfileIds: [profile.id], count: 5, language: "fr" },
      mockQuestions,
    );

    expect(result.questions.map((q) => q.familyId)).not.toContain("geo.country.fr.capital");
  });

  // TEST 10: IA indisponible -> sélection dans la base locale sans réintroduire de contenu déjà vu
  it("TEST 10: Quand l'IA est indisponible, sélectionne uniquement dans la base locale sans réintroduire de contenu vu", async () => {
    const { profile } = await getOrCreateDeviceProfile("dev_10");

    await markQuestionSeen({ profileIds: [profile.id], familyId: "geo.country.fr.capital", questionId: "1" });
    await markQuestionSeen({ profileIds: [profile.id], familyId: "geo.country.jp.capital", questionId: "2" });

    const result = await getQuestions(
      { playerProfileIds: [profile.id], count: 3, language: "fr", allowAiFallback: false },
      mockQuestions,
    );

    expect(result.returned).toBe(3);
    for (const q of result.questions) {
      expect(q.familyId).not.toBe("geo.country.fr.capital");
      expect(q.familyId).not.toBe("geo.country.jp.capital");
    }
  });

  // TEST 11: Pool insuffisant -> retourne poolExhausted = true sans réutiliser de question vue
  it("TEST 11: En cas de pool insuffisant, retourne poolExhausted=true sans réinjecter de questions vues", async () => {
    const { profile } = await getOrCreateDeviceProfile("dev_11");

    // On marque presque toutes les familles comme vues sauf 2
    await markQuestionSeen({ profileIds: [profile.id], familyId: "geo.country.fr.capital", questionId: "1" });
    await markQuestionSeen({ profileIds: [profile.id], familyId: "geo.country.jp.capital", questionId: "2" });
    await markQuestionSeen({ profileIds: [profile.id], familyId: "hist.ww2.start.year", questionId: "3" });
    await markQuestionSeen({ profileIds: [profile.id], familyId: "sci.chem.water.formula", questionId: "4" });
    await markQuestionSeen({ profileIds: [profile.id], familyId: "sci.phys.gravity.newton", questionId: "5" });

    // On demande 5 questions alors qu'il n'en reste que 2 inédites en français
    const result = await getQuestions(
      { playerProfileIds: [profile.id], count: 5, language: "fr", allowAiFallback: false },
      mockQuestions,
    );

    expect(result.poolExhausted).toBe(true);
    expect(result.reason).toBe("INSUFFICIENT_UNSEEN_QUESTIONS");
    expect(result.returned).toBe(2); // retourne uniquement les 2 inédites (Zeus et Mona Lisa)
    for (const q of result.questions) {
      expect(["myth.greek.zeus.role", "art.painting.mona.lisa.painter"]).toContain(q.familyId);
    }
  });

  // TEST 12: Même connaissance dans deux langues (FR / EN) -> exclusion multilingue
  it("TEST 12: Une question vue en français exclut sa version anglaise partageant la même familyId", async () => {
    const { profile } = await getOrCreateDeviceProfile("dev_12");

    // Le joueur a vu la version française de la capitale du Japon
    await markQuestionSeen({
      profileIds: [profile.id],
      familyId: "geo.country.jp.capital",
      questionId: "geo-jp-cap-01",
    });

    // Plus tard, il joue en anglais
    const result = await getQuestions(
      { playerProfileIds: [profile.id], count: 5, language: "en", allowAiFallback: false },
      mockQuestions,
    );

    const questionIds = result.questions.map((q) => q.id);
    expect(questionIds).not.toContain("geo-jp-cap-en"); // Exclue !
  });

  // TEST 13: Deux appels simultanés avec réservation -> évite de sélectionner deux fois la même famille
  it("TEST 13: La réservation temporaire empêche deux requêtes concurrentes de sélectionner les mêmes familles", async () => {
    const { profile: p1 } = await getOrCreateDeviceProfile("dev_13A");

    // Session 1 demande 3 questions
    const res1 = await getQuestions(
      { playerProfileIds: [p1.id], count: 3, language: "fr", sessionId: "sess_concurrent_1" },
      mockQuestions,
    );

    // Les familles sélectionnées par la Session 1 sont désormais réservées
    const reservedBy1 = new Set(res1.questions.map((q) => q.familyId));

    // Si la même session ou joueur réessaie de demander des questions avant affichage
    const res2 = await getQuestions(
      { playerProfileIds: [p1.id], count: 3, language: "fr", sessionId: "sess_concurrent_2" },
      mockQuestions,
    );

    for (const q of res2.questions) {
      expect(reservedBy1.has(q.familyId)).toBe(false);
    }
  });

  // DÉDUPLICATION & HASH TESTS
  it("Calcule un hash SHA-256 déterministe et insensible aux accents/espaces/ponctuation", () => {
    const q1 = "Quelle est la capitale de la France ?";
    const q2 = "  quelle  est la CAPITALE de la france   ";
    const q3 = "Quelle est la capitale de l'Espagne ?";

    expect(computeContentHash(q1)).toBe(computeContentHash(q2));
    expect(computeContentHash(q1)).not.toBe(computeContentHash(q3));
  });

  it("Normalise les knowledgeKeys et évalue la similarité sémantique (Level 3)", () => {
    expect(normalizeKnowledgeKey("geo_country_FR_capital")).toBe("geo.country.fr.capital");
    expect(normalizeKnowledgeKey("history.ww2.start-year.")).toBe("history.ww2.start.year");

    const sim = computeTextSimilarity(
      "Quelle est la capitale de la France ?",
      "Quelle est la capitale de la France",
    );
    expect(sim).toBe(1);
  });
});
