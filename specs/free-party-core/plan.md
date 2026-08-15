# Implementation Plan — Free Party Core

## Stack

| Couche | Choix | Justification |
|---|---|---|
| Framework | Next.js 15 App Router + TypeScript strict | SSR/SSG, routing propre, écosystème Vercel |
| UI | Tailwind CSS v4 + design system custom | Premium, tokens, zéro dépendance lourde |
| State | Zustand | Léger, testable, persist middleware (localStorage) |
| Validation | Zod | Schéma questions/débats strict (spec §30) |
| Tests | Vitest | Unit + engine + selection + debate |
| Backend | Supabase (migrations SQL + RLS) | PostgreSQL, deny-by-default, reproductible |
| Branding | `src/lib/brand.ts` centralisé | Spec §1 |

## Architecture

```
src/
  app/                  # Routes Next.js (home, play, debate, quiz, ...)
  components/           # UI (design system) + game components
  lib/
    brand.ts            # Nom produit centralisé
    engine/
      selection.ts      # Anti-répétition (selection score)
      scoring.ts        # Scores par mode
      timeline.ts       # Ordonnancement Timeline
      debate.ts         # Flow débat (phases, timers)
    questions/
      schema.ts         # Zod QuestionSchema (spec §28/30)
      validate.ts       # Validation + quality score
      dedupe.ts         # Détection doublons (normalisation + Levenshtein)
      stats.ts          # Statistiques dataset
      load.ts           # Chargement datasets JSON
      families.ts       # Familles de questions
    debate/
      prompts.ts        # Chargement prompts débat
      quality.ts        # Checks de qualité (neutralité, perspectives)
    store/              # Zustand stores (game, players, history, reports)
    supabase/
      client.ts         # Client SDK (optionnel, local-first)
      schema.ts         # Types DB
  questions/fr/         # Datasets JSON versionnés par catégorie
  debates/fr/           # Prompts de débat JSON
  supabase/
    migrations/         # SQL reproductibles + RLS
    seed/               # Seed éventuel
  scripts/              # Pipeline CLI questions (validate/dedupe/stats/import)
```

## Décisions d'ingénierie

1. **Local-first** : le store de partie vit en mémoire + localStorage ; Supabase est branché en option (env présents) sans jamais bloquer le jeu.
2. **Sélection** : `selectQuestions(candidates, history, opts)` calcule un score par question : équilibre catégorie/difficulté, fraîcheur (last_seen), pénalité famille/question vues, jitter contrôlé. Testé par propriété.
3. **Debate flow** : machine à états (reflection → turn → open → followUp → end), timers indépendants par joueur, résultats non-compétitifs, vote before/after optionnel.
4. **Sécurité** : pas de secret dans le client ; `.env.example` ; RLS deny-by-default ; `TO authenticated` + ownership predicates ; `WITH CHECK` sur updates.
5. **Design** : tokens Tailwind (couleurs vives premium, radius, ombres), typo Inter/Space Grotesk, animations CSS (réduites si `prefers-reduced-motion`), mobile-first.

## Étapes

1. Scaffold Next.js + Tailwind + deps
2. Brand + design system + layout home
3. Question engine (schéma, validation, datasets, sélection, dédup)
4. Debate engine (prompts, flow, timers)
5. Modes de jeu (quiz/social/timeline/team)
6. Supabase migrations + RLS + client optionnel
7. Tests Vitest (engine, selection, debate, scoring)
8. Documentation + SPEC_COMPLIANCE
9. Build, push GitHub, deploy Vercel
