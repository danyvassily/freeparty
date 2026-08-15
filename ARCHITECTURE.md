# Free Party — Architecture

## Vue d'ensemble

```
┌──────────────────────────────────────────────────────┐
│                    CLIENT (Next.js)                  │
│  Home → Config partie → /play → mode → questions     │
│  Zustand (config, historique, rapports) persisté     │
└──────────────┬───────────────────────────┬───────────┘
               │ POST /api/questions       │ GET /api/debates
               ▼                           ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│   Selection Engine       │   │   Debate Engine          │
│   (anti-répétition,      │   │   (machine à états,      │
│   équilibre, fraîcheur)  │   │   timers, votes)         │
└──────────┬───────────────┘   └──────────┬───────────────┘
           │                              │
           ▼                              ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│  questions/fr/**/*.json  │   │  debates/fr/*.json       │
│  Datasets versionnés     │   │  74 prompts validés      │
└──────────────────────────┘   └──────────────────────────┘
           │
           ▼ (optionnel, scripts)
┌──────────────────────────┐
│  Supabase (PostgreSQL,   │
│  RLS deny-by-default)    │
└──────────────────────────┘
```

## Décisions clés

### 1. Local-first (spec §27)
Les parties ne dépendent **jamais** d'une API externe. Les datasets JSON sont embarqués dans le repo et servis par les routes API Next.js. Une panne de réseau ou de Supabase ne casse jamais une partie.

### 2. Anti-répétition serveur (spec §37)
Le client envoie son historique (persisté en localStorage) à `/api/questions` ; le serveur calcule un **selection score** :
```
novelty + category_balance + difficulty_balance + freshness − repetition_penalty
```
avec un jitter contrôlé (jamais `ORDER BY RANDOM()`).

### 3. Machine à états de débat (spec §58)
`presentation → reflection(30s) → player-turn → open-discussion → follow-up → voting → results`.
Les transitions illégales sont **refusées** (testées), le budget de parole est équitable (`durée / nb joueurs`), et le résultat n'a ni gagnant ni perdant.

### 4. Stack

| Couche | Choix | Raison |
|---|---|---|
| Framework | Next.js 16 (App Router) | SSR/SSG, routes API intégrées, déploiement Vercel |
| Langage | TypeScript strict | Aucun `any` ; contrat de types sur tout le domaine |
| UI | Tailwind CSS v4 + design system propriétaire | Premium, mobile-first, zéro dépendance UI |
| State | Zustand + persist | Léger, testable |
| Validation | Zod | Schémas stricts questions/débats (spec §30) |
| Tests | Vitest | 42 tests : schema, sélection, débat, dédup, contenus |
| Base | Supabase PostgreSQL + RLS | Migrations reproductibles, deny-by-default |

## Arborescence

```
src/
  app/                  Routes (/, /play, /api/*)
  components/
    ui/                 Design system (primitives)
    home/               Flux de configuration
    game/               Moteurs de jeu (quiz, timeline, team, wyr, guess, debate)
  lib/
    brand.ts            Nom produit centralisé (spec §1)
    questions/          Question Engine
    debate/             Debate Engine
    game/               Datasets sociaux
    store/              Stores Zustand
    supabase/           Client optionnel
questions/fr/           Datasets JSON (par langue / catégorie)
debates/fr/             Prompts de débat
supabase/migrations/    SQL reproductible + RLS
scripts/questions/      Pipeline CLI
tests/                  Tests Vitest
```

## Extensibilité (spec §39, §40)

- **100 000+ questions** : le loader lit tout fichier JSON sous `questions/<lang>/<categorie>/` ; l'ajout d'un fichier suffit.
- **Localisation** : le schéma sépare `concept` (fait) de `translation` (formulation) ; `question_translations` en base.
- **Nouveaux modes** : ajouter un composant dans `src/components/game/` + une entrée dans `GAME_MODES`.
