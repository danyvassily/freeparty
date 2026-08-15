# Feature Spec — Free Party Core

## User stories

### P1 — Jouer immédiatement (MVP jouable, zéro compte)
- US-01 : En tant que joueur, j'ouvre l'app et je vois les modes (Quiz, Social, Débat, Connaissance) en 1 écran.
- US-02 : Je configure une partie en < 10 s : mode + catégorie + joueurs (noms locaux, 1–8) + durée.
- US-03 : Je joue un Classic Quiz (10 questions, 4 réponses, timer, score, feedback correct/incorrect).
- US-04 : Je joue True/False, Rapid Fire (20 q, 6 s), Timeline (ordonner 5 événements), Team Battle (2 équipes).
- US-05 : Je joue Would You Rather et Guess (indices progressifs).
- US-06 : Les questions ne se répètent pas entre parties (anti-répétition locale persistée).
- US-07 : Je peux signaler une question (Réponse incorrecte, ambiguë, obsolète, faute, mauvaise catégorie, contenu inapproprié, autre).

### P2 — Débattre sérieusement
- US-08 : Je lance un débat : topic + contexte factuel, 30 s de réflexion, timer 1/3/5/10/15 min.
- US-09 : Le temps de parole de chaque joueur est mesuré (fair speaking timer).
- US-10 : Le débat propose des relances (follow-ups) et ne déclare ni gagnant ni perdant.
- US-11 : Modes Change My Mind (position assignée, jamais attribuée au joueur) et Devil's Advocate (contre-argument honnête).
- US-12 : Vote optionnel avant/après : "2 participants ont changé de position."

### P3 — Connaissance & contenu
- US-13 : Modules Capitales du monde, Monnaies du monde, Géographie, Grandes guerres, Mythologie grecque, Mythologie égyptienne, Philosophie, Culture générale.
- US-14 : Pipeline questions : validate, dedupe, stats, import (CLI scripts), datasets JSON versionnés par catégorie.
- US-15 : Chaque question a : état, confidence, quality score, source, vérification, famille, difficulté (easy/medium/hard/expert).

### P4 — Supabase (persistance optionnelle)
- US-16 : Migrations SQL complètes : users/profiles, games/sessions/players/scores, questions + concepts/translations/categories/sources/families/history/statistics/reports, debates/prompts/topics/sources/sessions/turns/votes.
- US-17 : RLS deny-by-default ; anon limité au strict nécessaire ; aucune clé exposée.

## Critères d'acceptation

- AC-1 : `npm run lint && npm run typecheck && npm run test && npm run build` passent.
- AC-2 : Le sélecteur de questions n'utilise jamais `ORDER BY RANDOM()` seul ; test prouve la non-répétition des familles sur 200 tirages.
- AC-3 : Aucun appel réseau externe pendant une partie (mode local).
- AC-4 : Un débat sans gagnant affiche points discutés / arguments / questions restantes / temps de parole.
- AC-5 : Les questions invalides (schéma Zod) sont rejetées par la validation.
