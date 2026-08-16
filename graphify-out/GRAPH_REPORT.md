# Graph Report - freeparty  (2026-08-16)

## Corpus Check
- 183 files · ~237,239 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 748 nodes · 1106 edges · 49 communities (43 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.53)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `655dde06`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- questions/schema.ts
- engines.test.ts
- online-room.tsx
- debate/schema.ts
- scripts
- common.sh
- useSettingsStore
- compilerOptions
- Tasks: [FEATURE NAME]
- speckit-analyze/SKILL.md
- gen-import-sql.ts
- devDependencies
- Execution Steps
- 🎉 FREE PARTY — FINAL REPORT
- generate.ts
- Feature Specification: [FEATURE NAME]
- speckit-plan/SKILL.md
- speckit-specify/SKILL.md
- speckit-tasks/SKILL.md
- Free Party — Base de données (Supabase / PostgreSQL)
- Core Principles
- Décisions clés
- Free Party — Debate Engine
- Tasks — Free Party Core
- Free Party — Question Engine
- 🎉 Free Party
- Implementation Plan: [FEATURE]
- speckit-checklist/SKILL.md
- User stories
- layout.tsx
- speckit-clarify/SKILL.md
- speckit-implement/SKILL.md
- Free Party — Specification Compliance
- speckit-constitution/SKILL.md
- Free Party — Analyse concurrentielle (spec §10)
- Contributing — Free Party
- Free Party — Project Constitution
- Implementation Plan — Free Party Core
- speckit-taskstoissues/SKILL.md
- [CHECKLIST TYPE] Checklist: [FEATURE NAME]
- server.ts
- test-room.ts
- AGENTS.md
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `getSupabaseBrowser()` - 21 edges
2. `OnlineRoom()` - 20 edges
3. `scripts` - 16 edges
4. `compilerOptions` - 16 edges
5. `loadQuestions()` - 15 edges
6. `Question` - 15 edges
7. `useGameStore` - 15 edges
8. `DebateGame()` - 14 edges
9. `🎉 FREE PARTY — FINAL REPORT` - 14 edges
10. `useSettingsStore` - 13 edges

## Surprising Connections (you probably didn't know these)
- `validateFile()` --calls--> `parseQuestionBatch()`  [EXTRACTED]
  scripts/questions/lib.ts → src/lib/questions/schema.ts
- `LoadedDebates` --references--> `DebatePrompt`  [EXTRACTED]
  src/lib/debate/load.ts → src/lib/debate/schema.ts
- `resolve-template.sh script` --calls--> `has_jq()`  [EXTRACTED]
  .specify/scripts/bash/resolve-template.sh → .specify/scripts/bash/common.sh
- `GET()` --calls--> `loadDebatePrompts()`  [EXTRACTED]
  src/app/api/stats/route.ts → src/lib/debate/load.ts
- `PlayPage()` --calls--> `useGameStore`  [EXTRACTED]
  src/app/play/page.tsx → src/lib/store/game.ts

## Import Cycles
- None detected.

## Communities (49 total, 6 thin omitted)

### Community 0 - "questions/schema.ts"
Cohesion: 0.05
Nodes (51): PlayPage(), Phase, QuizGame(), load(), QuizGameProps, TeamBattleGame(), handleAnswer(), load() (+43 more)

### Community 1 - "engines.test.ts"
Cohesion: 0.06
Nodes (45): dataset, report, SOURCES, client, dataset, logSection(), parseJsonFile(), validateFile() (+37 more)

### Community 2 - "online-room.tsx"
Cohesion: 0.07
Nodes (44): AuthForm(), logout(), submit(), AuthView, OnlineRoom(), create(), index(), join() (+36 more)

### Community 3 - "debate/schema.ts"
Cohesion: 0.09
Nodes (42): DebateGame(), addMetric(), castVoteLocal(), finishTurn(), moveToDiscussion(), showFollowUp(), startDebate(), LocalPhase (+34 more)

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (36): motion, next, dependencies, motion, next, react, react-dom, @supabase/ssr (+28 more)

### Community 5 - "common.sh"
Cohesion: 0.08
Nodes (17): check-prerequisites.sh script, check_dir(), check_file(), get_feature_paths(), get_repo_root(), has_jq(), _persist_feature_json(), resolve_specify_init_dir() (+9 more)

### Community 6 - "useSettingsStore"
Cohesion: 0.10
Nodes (22): GuessGame(), next(), submit(), TimelineGame(), check(), WyrGame(), choose(), GUESS_ITEMS (+14 more)

### Community 7 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 8 - "Tasks: [FEATURE NAME]"
Cohesion: 0.07
Nodes (26): Dependencies & Execution Order, Format: `[ID] [P?] [Story] Description`, Implementation for User Story 1, Implementation for User Story 2, Implementation for User Story 3, Implementation Strategy, Incremental Delivery, MVP First (User Story 1 Only) (+18 more)

### Community 9 - "speckit-analyze/SKILL.md"
Cohesion: 0.08
Nodes (25): 1. Initialize Analysis Context, 2. Load Artifacts (Progressive Disclosure), 3. Build Semantic Models, 4. Detection Passes (Token-Efficient Analysis), 5. Severity Assignment, 6. Produce Compact Analysis Report, 7. Provide Next Actions, 8. Offer Remediation (+17 more)

### Community 10 - "gen-import-sql.ts"
Cohesion: 0.10
Nodes (18): buffer, dataset, debates, sql, GET(), DEBATES_ROOT, loadDebatePrompts(), loadDebatesByCategory() (+10 more)

### Community 11 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tsx (+13 more)

### Community 12 - "Execution Steps"
Cohesion: 0.12
Nodes (15): 1. Initialize Convergence Context, 2. Load Artifacts (Progressive Disclosure), 3. Build the Intent Inventory, 4. Assess the Codebase and Classify Findings, 5. Assign Severity, 6. Present the In-Session Findings Summary, 7. Append Convergence Tasks (or report converged), 8. Provide Next Actions (Handoff) (+7 more)

### Community 13 - "🎉 FREE PARTY — FINAL REPORT"
Cohesion: 0.13
Nodes (14): Architecture, Debate Engine, Déploiement, 🎉 FREE PARTY — FINAL REPORT, GitHub, Performance (mesures réelles), Product, Product Critic (+6 more)

### Community 14 - "generate.ts"
Cohesion: 0.27
Nodes (10): all, generateCapitals(), generateCurrencies(), isHomonymCountry(), makeQuestion(), norm(), rng, shuffle() (+2 more)

### Community 15 - "Feature Specification: [FEATURE NAME]"
Cohesion: 0.15
Nodes (12): Assumptions, Edge Cases, Feature Specification: [FEATURE NAME], Functional Requirements, Key Entities *(include if feature involves data)*, Measurable Outcomes, Requirements *(mandatory)*, Success Criteria *(mandatory)* (+4 more)

### Community 16 - "speckit-plan/SKILL.md"
Cohesion: 0.18
Nodes (10): Completion Report, Done When, Key rules, Mandatory Post-Execution Hooks, Outline, Phase 0: Outline & Research, Phase 1: Design & Contracts, Phases (+2 more)

### Community 17 - "speckit-specify/SKILL.md"
Cohesion: 0.18
Nodes (10): Completion Report, Done When, For AI Generation, Mandatory Post-Execution Hooks, Outline, Pre-Execution Checks, Quick Guidelines, Section Requirements (+2 more)

### Community 18 - "speckit-tasks/SKILL.md"
Cohesion: 0.18
Nodes (10): Checklist Format (REQUIRED), Completion Report, Done When, Mandatory Post-Execution Hooks, Outline, Phase Structure, Pre-Execution Checks, Task Generation Rules (+2 more)

### Community 19 - "Free Party — Base de données (Supabase / PostgreSQL)"
Cohesion: 0.18
Nodes (10): Débats (spec §56), Free Party — Base de données (Supabase / PostgreSQL), Index, Jeu, Migrations, NOT VERIFIED, Principes (spec §13–§15), Questions (spec §14, §38, §41) (+2 more)

### Community 20 - "Core Principles"
Cohesion: 0.18
Nodes (10): Core Principles, Governance, [PRINCIPLE_1_NAME], [PRINCIPLE_2_NAME], [PRINCIPLE_3_NAME], [PRINCIPLE_4_NAME], [PRINCIPLE_5_NAME], [PROJECT_NAME] Constitution (+2 more)

### Community 21 - "Décisions clés"
Cohesion: 0.20
Nodes (9): 1. Local-first (spec §27), 2. Anti-répétition serveur (spec §37), 3. Machine à états de débat (spec §58), 4. Stack, Arborescence, Décisions clés, Extensibilité (spec §39, §40), Free Party — Architecture (+1 more)

### Community 22 - "Free Party — Debate Engine"
Cohesion: 0.20
Nodes (10): Confidentialité (spec §80), Debate Quality Agent (spec §76) — audit automatique, Fair speaking timer (spec §59), Free Party — Debate Engine, Machine à états (spec §58), Modes (spec §71–§73), Principes (spec §56–§80), Prompt de débat (spec §56) (+2 more)

### Community 23 - "Tasks — Free Party Core"
Cohesion: 0.20
Nodes (9): T1 — Scaffold, T2 — Design system, T3 — Question Engine, T4 — Debate Engine, T5 — Game modes, T6 — Supabase, T7 — Tests, T8 — Docs & livraison (+1 more)

### Community 24 - "Free Party — Question Engine"
Cohesion: 0.22
Nodes (9): Anti-répétition (spec §37) — LE CŒUR, Dataset actuel, Free Party — Question Engine, Garde-fous du schéma (Zod `superRefine`), Pipeline CLI (`npm run questions:*`), Principes (spec §17–§42), Schéma de question (extrait, spec §28), Sources (spec §18, §23–§26) (+1 more)

### Community 25 - "🎉 Free Party"
Cohesion: 0.22
Nodes (9): 📚 Documentation, 🚀 Démarrage, 🎉 Free Party, 📄 Licence des données, ✨ Modes de jeu, ❓ Pipeline des questions, 📁 Structure, 🔒 Sécurité (+1 more)

### Community 26 - "Implementation Plan: [FEATURE]"
Cohesion: 0.22
Nodes (8): Complexity Tracking, Constitution Check, Documentation (this feature), Implementation Plan: [FEATURE], Project Structure, Source Code (repository root), Summary, Technical Context

### Community 27 - "speckit-checklist/SKILL.md"
Cohesion: 0.25
Nodes (7): Anti-Examples: What NOT To Do, Checklist Purpose: "Unit Tests for English", Example Checklist Types & Sample Items, Execution Steps, Post-Execution Checks, Pre-Execution Checks, User Input

### Community 28 - "User stories"
Cohesion: 0.25
Nodes (7): Critères d'acceptation, Feature Spec — Free Party Core, P1 — Jouer immédiatement (MVP jouable, zéro compte), P2 — Débattre sérieusement, P3 — Connaissance & contenu, P4 — Supabase (persistance optionnelle), User stories

### Community 29 - "layout.tsx"
Cohesion: 0.29
Nodes (5): inter, metadata, spaceGrotesk, viewport, Brand

### Community 30 - "speckit-clarify/SKILL.md"
Cohesion: 0.29
Nodes (6): Completion Report, Done When, Mandatory Post-Execution Hooks, Outline, Pre-Execution Checks, User Input

### Community 31 - "speckit-implement/SKILL.md"
Cohesion: 0.29
Nodes (6): Completion Report, Done When, Mandatory Post-Execution Hooks, Outline, Pre-Execution Checks, User Input

### Community 32 - "Free Party — Specification Compliance"
Cohesion: 0.29
Nodes (7): Backend / Sécurité / QA, Debate Engine, Free Party — Specification Compliance, Modes & UI/UX, Piliers produit, Question Engine, Récapitulatif

### Community 33 - "speckit-constitution/SKILL.md"
Cohesion: 0.33
Nodes (5): Outline, Post-Execution Checks, Pre-Execution Checks, Scope Guard, User Input

### Community 34 - "Free Party — Analyse concurrentielle (spec §10)"
Cohesion: 0.33
Nodes (5): Ce que Free Party fait différemment, Free Party — Analyse concurrentielle (spec §10), Marché observé, Points de douleur des utilisateurs (avis publics), Positionnement cible

### Community 35 - "Contributing — Free Party"
Cohesion: 0.33
Nodes (5): Ajouter des questions, Ajouter un débat, Contributing — Free Party, Sécurité, Workflow

### Community 36 - "Free Party — Project Constitution"
Cohesion: 0.33
Nodes (5): 1. Mission, 2. Non-négociables (dans l'ordre), 3. Contraintes, 4. Définition de done, Free Party — Project Constitution

### Community 37 - "Implementation Plan — Free Party Core"
Cohesion: 0.33
Nodes (5): Architecture, Décisions d'ingénierie, Implementation Plan — Free Party Core, Stack, Étapes

### Community 38 - "speckit-taskstoissues/SKILL.md"
Cohesion: 0.40
Nodes (4): Outline, Post-Execution Checks, Pre-Execution Checks, User Input

### Community 39 - "[CHECKLIST TYPE] Checklist: [FEATURE NAME]"
Cohesion: 0.40
Nodes (4): [Category 1], [Category 2], [CHECKLIST TYPE] Checklist: [FEATURE NAME], Notes

## Knowledge Gaps
- **370 isolated node(s):** `common.sh script`, `eslintConfig`, `nextConfig`, `name`, `version` (+365 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Question` connect `engines.test.ts` to `questions/schema.ts`, `online-room.tsx`, `generate.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `useGameStore` connect `questions/schema.ts` to `online-room.tsx`, `debate/schema.ts`, `useSettingsStore`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `OnlineRoom()` connect `online-room.tsx` to `questions/schema.ts`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `common.sh script`, `eslintConfig`, `nextConfig` to the rest of the system?**
  _370 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `questions/schema.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05336951605608322 - nodes in this community are weakly interconnected._
- **Should `engines.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06299603174603174 - nodes in this community are weakly interconnected._
- **Should `online-room.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07486338797814207 - nodes in this community are weakly interconnected._