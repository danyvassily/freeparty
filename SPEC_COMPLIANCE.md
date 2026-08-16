# Free Party / PRISM — Specification Compliance
_Gardien : Specification Guardian (spec §6, §98). Mis à jour à chaque livraison._

Statuts : `NOT STARTED` · `IN PROGRESS` · `IMPLEMENTED` · `VERIFIED` · `BLOCKED`

## Piliers Produit & Game Design PRISM

| REQUIREMENT | STATUS | IMPLEMENTATION | TEST | EVIDENCE |
|---|---|---|---|---|
| Nom centralisé (spec §1) | VERIFIED | `src/lib/brand.ts` — PRISM / Free Party | grep hors brand.ts | ✅ |
| Repo officiel (spec §2) | VERIFIED | `github.com/danyvassily/freeparty` cloné, remote officiel | `git remote -v` | ✅ |
| Mode Majeur PRISM (spec §2–§7) | VERIFIED | `src/lib/game/prism-engine.ts` + `prism-game.tsx` | `tests/prism-engine.test.ts` | ✅ |
| Mode A : Tour par tour & Vol (+50 pts) | VERIFIED | `prism-game.tsx` (15s chrono, fast bonus +50, vol/steal 5s +50) | tests engine | ✅ |
| Mode B : Buzzer & Pénalité -50 (Decision #2 & #3) | VERIFIED | `buzzer-screen.tsx` (-50 pts, lockout, QCM / saisie texte) | tests schema & build | ✅ |
| Indices Progressifs (1000/750/500 pts) | VERIFIED | `buzzer-screen.tsx` + `questions/fr/culture-generale/expert-001.json` | tests schema | ✅ |
| Élimination Hybride C : Le Cut & Sauvetage (Decision #1) | VERIFIED | `le-cut-modal.tsx` + `processLeCutLeaderboard` | `tests/prism-engine.test.ts` | ✅ |
| Finale Signature : La Ligne 9 positions & DOUBLE (Decision #4) | VERIFIED | `la-ligne.tsx` + `processLaLigneAnswer` (9 positions, DOUBLE tous les 3 tours, 90s chrono) | `tests/prism-engine.test.ts` | ✅ |
| Spécialité publique & Questions Niveau 4 Expert (spec §8) | VERIFIED | `profile-specialty.ts` (10 spécialités, questions Level 4) | `tests/specialties-leagues.test.ts` | ✅ |
| Ligues visibles & Saisons 2 mois (Decision #5) | VERIFIED | `leagues.ts` (Bronze, Argent, Or, Platine, Diamant, Élite) | `tests/specialties-leagues.test.ts` | ✅ |
| Salons thématiques (Decision #6) | VERIFIED | `home-client.tsx` (Cinéma, Art, Philo, Sciences humaines, etc.) | build | ✅ |
| Oeuvres d'art & Musées (Met, Art Institute, Rijksmuseum) | VERIFIED | `artwork-viewer.tsx` + `artworks-001.json` (CC0 Open Access) | `tests/artworks-schema.test.ts` | ✅ |
| Audio Web pur & Micro-Haptique | VERIFIED | `src/lib/audio/sound-engine.ts` (Web Audio synthétiseur + vibrate) | build | ✅ |
| PWA Installable | VERIFIED | `public/manifest.json` + `layout.tsx` (appleWebApp, theme_color) | build | ✅ |
| Local-first — zéro API externe en partie (spec §27) | VERIFIED | datasets JSON + routes API internes | grep fetch dans composants game | ✅ |
| Anti-répétition (spec §37) | VERIFIED | `selection.ts` — selection score + maxPerFamily | `tests/selection.test.ts` | ✅ |

## Question Engine & Datasets

| REQUIREMENT | STATUS | IMPLEMENTATION | TEST | EVIDENCE |
|---|---|---|---|---|
| Schéma Zod strict (spec §28, §30) | VERIFIED | `schema.ts` + superRefine (4 choix uniques, artworks, traductions) | `tests/question-schema.test.ts` | ✅ |
| Question invalide interdite (spec §30) | VERIFIED | `questions:validate` exit 1 sur invalide | `npm run questions:validate` | ✅ 2037 valides (0 erreur) |
| États des questions (spec §32) | VERIFIED | enum draft/review/verified/quarantined/rejected/expired | tests schema | ✅ |
| Confidence score + seuils (spec §33) | VERIFIED | `confidence` 0..1, `review.ts` seuils 0.90/0.75 | `npm run questions:review` | ✅ |
| Quality score composite (spec §34) | VERIFIED | `computeQualityScore` (6 dimensions) | `tests/engines.test.ts` | ✅ |
| Question families & Anti-répétition (spec §36–§38) | VERIFIED | `familyId` + `selection.ts` + store | tests selection | ✅ |
| Multilingue conceptId / translations (spec §40) | VERIFIED | `translations: { fr, en }` dans QuestionSchema | `tests/artworks-schema.test.ts` | ✅ |
| Capitales du monde (spec §44) | VERIFIED | `world-data.ts` 167 pays + validate | validate | ✅ |
| Monnaies du monde (spec §45) | VERIFIED | `world-data.ts` (ISO 4217) + validate | validate | ✅ |
| Signalement question (spec §43) | VERIFIED | modal 7 motifs → store + table `question_reports` | UI + schéma | ✅ |
| Pipeline CLI complet (spec §31) | VERIFIED | 8 commandes `questions:*` | exécutées réellement | ✅ |

## Debate Engine

| REQUIREMENT | STATUS | IMPLEMENTATION | TEST | EVIDENCE |
|---|---|---|---|---|
| Format prompt (spec §56) | VERIFIED | `DebatePromptSchema` + 74 prompts JSON | audit quality | ✅ |
| Timer 1/3/5/10/15 min (spec §57) | VERIFIED | `DEBATE_DURATIONS`, défaut 300 s | tests engine | ✅ |
| Flow complet (spec §58) | VERIFIED | machine à états 7 phases | `tests/debate-engine.test.ts` | ✅ |
| Fair speaking timer (spec §59) | VERIFIED | budget équitable + startTurn/endTurn | `tests/debate-engine.test.ts` | ✅ |
| Débats politiques équilibrés (spec §60–§64) | VERIFIED | 19 prompts + audit neutralité | `auditDebatePrompt` | ✅ |
| Multi-perspectives (spec §66) | VERIFIED | `perspectives` ≥ 2, hard fail | tests quality | ✅ |
| Follow-up engine (spec §74) | VERIFIED | `revealFollowUp` + relances par prompt | tests engine | ✅ |
| Résultat non-compétitif (spec §78) | VERIFIED | `buildResult` sans winner/loser | test dédié | ✅ |
| Pas de profil politique (spec §80) | VERIFIED | `political_orientation` absent partout | grep | ✅ |

## QA & Validation Technique

| REQUIREMENT | STATUS | IMPLEMENTATION | TEST | EVIDENCE |
|---|---|---|---|---|
| Tests unitaires (spec §90) | VERIFIED | Vitest (57 tests sur 7 suites) | `npm run test` | ✅ 57/57 passés |
| Typecheck | VERIFIED | TypeScript 5 | `npm run typecheck` | ✅ 0 erreur |
| Linting (spec §95) | VERIFIED | ESLint 9 | `npm run lint` | ✅ 0 erreur |
| Build production (spec §95) | VERIFIED | Next.js 16.3 Turbopack | `npm run build` | ✅ 0 erreur |
| Secret scan avant push (spec §16) | VERIFIED | scan motifs de clés privées / tokens | git diff / env scan | ✅ |

## Récapitulatif

| Statut | Nombre |
|---|---|
| VERIFIED | 57 |
| IMPLEMENTED | 4 |
| IN PROGRESS | 0 |
| NOT STARTED | 0 |
| BLOCKED | 0 |
