# Free Party — Base de données (Supabase / PostgreSQL)

## Principes (spec §13–§15)

- **Migrations reproductibles** dans `supabase/migrations/`
- **RLS deny-by-default** : toute table est fermée, chaque accès est explicitement ouvert par une policy
- Aucune clé exposée : `.env.example` sans secrets ; `service_role` réservé aux scripts serveur
- Les parties sont **local-first** : Supabase est une couche de persistance optionnelle, jamais un point de défaillance

## Migrations

| Fichier | Contenu |
|---|---|
| `20260815000001_init.sql` | Schéma complet + index |
| `20260815000002_rls.sql` | RLS + policies |

## Tables

### Jeu
| Table | Rôle |
|---|---|
| `profiles` | Profils (username, couleur d'avatar) |
| `games` | Parties (mode, catégorie, statut) |
| `game_sessions` | Sessions d'une partie |
| `game_players` | Joueurs (user_id ou guest_name, équipe) |
| `scores` | Points par round (bonne réponse, temps) |

### Questions (spec §14, §38, §41)
| Table | Rôle |
|---|---|
| `questions` | Question canonique : énoncé, 4 réponses (jsonb), correct_answer, catégorie, difficulté, langue, état, confidence, quality_score, source, vérification |
| `question_concepts` | Fait unique partagé par les variantes (spec §40) |
| `question_translations` | Traductions (fr/en/es/de/it/pt) |
| `question_categories` | Taxonomie des catégories |
| `question_families` | Familles anti-répétition (ex: capital-spain) |
| `question_sources` | Registre des sources (licence, usage commercial) |
| `question_history` | Historique : qui a vu quelle question, quand, résultat |
| `question_statistics` | Analytics : times_served, correct/wrong, avg response time, report_count |
| `question_reports` | Signalements (7 motifs, spec §43) |

### Débats (spec §56)
| Table | Rôle |
|---|---|
| `debate_prompts` | Prompts : question, contexte factuel, perspectives (jsonb), relances, sources, sensibilité, dates de vérification |
| `debate_topics` | Thèmes |
| `debates` | Débats (mode : standard / change-my-mind / devils-advocate / ethical-dilemma) |
| `debate_sessions` | Sessions (durée, préparation, statut) |
| `debate_turns` | Tours de parole (phase, durée réelle — fair speaking) |
| `debate_votes` | Votes before/after (position, round) |

## RLS (résumé des policies)

| Table | anon | authenticated |
|---|---|---|
| `questions` | SELECT si `state='verified'` | idem |
| `debate_prompts` | SELECT si `state='verified'` | idem |
| `profiles` | SELECT | + UPDATE/INSERT soi-même |
| `question_history` | — | SELECT/INSERT sur ses lignes |
| `question_reports` | — | INSERT + SELECT sur ses lignes |
| `games` / `game_sessions` / `game_players` / `scores` | — | SELECT/INSERT si membre (created_by = auth.uid()) |
| `debates` / `debate_sessions` / `debate_turns` / `debate_votes` | — | SELECT/INSERT si membre |

> **Note** : les INSERT sur sessions/players/turns/votes restent fermés tant que la persistance multi-joueurs distante n'est pas activée (parties 100% locales). À ouvrir avec des policies de participation explicites (code de partie) quand le mode en ligne verra le jour.

## Index

- `questions`: (state, language), category, difficulty, family_id, source_provider
- `question_history`: question_id, user_id, served_at DESC
- `question_reports`: question_id
- `debate_prompts`: (category, language, state)
- `debate_turns` / `debate_votes` / `scores` / `game_players`: session_id

## NOT VERIFIED

Les migrations sont écrites et relues mais **n'ont pas été exécutées contre un projet Supabase réel** (pas d'instance disponible dans l'environnement de développement). Avant mise en production : `supabase db reset` ou `supabase db push` puis vérification des policies.
