# Tasks — Free Party Core

## T1 — Scaffold
- [ ] T1.1 `create-next-app` (TypeScript, Tailwind, App Router) dans le repo
- [ ] T1.2 Dépendances : zustand, zod, vitest, framer-motion
- [ ] T1.3 `src/lib/brand.ts` + nom centralisé
- [ ] T1.4 `.env.example` sans secrets + `.gitignore` (pas de .env)

## T2 — Design system
- [ ] T2.1 Tokens globals.css (couleurs, radius, shadows, typo)
- [ ] T2.2 Composants : Button, Card, Badge, Timer, ProgressRing, Modal, PlayerChip, Logo
- [ ] T2.3 Layout home mobile-first premium

## T3 — Question Engine
- [ ] T3.1 `schema.ts` : QuestionSchema Zod (spec §28)
- [ ] T3.2 `validate.ts` : validation + quality_score + confidence
- [ ] T3.3 `dedupe.ts` : normalisation, hash, Levenshtein
- [ ] T3.4 `selection.ts` : selection score anti-répétition
- [ ] T3.5 `stats.ts` + scripts pipeline (validate/dedupe/stats/import)
- [ ] T3.6 Datasets FR : capitales, monnaies, géographie, guerres, mythologie gr/égyptienne, philosophie, culture générale, cinéma, musique, science, sport, littérature

## T4 — Debate Engine
- [ ] T4.1 Prompts JSON FR : politics, philosophy, history, ethics, current issues
- [ ] T4.2 `debate.ts` : machine à états + timers + fair speaking time
- [ ] T4.3 Follow-ups, context cards, multi-perspectives, quality checks
- [ ] T4.4 Modes : Change My Mind, Devil's Advocate, Ethical Dilemmas
- [ ] T4.5 Résultats non-compétitifs + vote before/after

## T5 — Game modes
- [ ] T5.1 Config partie (mode, catégorie, joueurs, durée)
- [ ] T5.2 Classic Quiz, True/False, Rapid Fire, Timeline, Team Battle
- [ ] T5.3 Social : Would You Rather, Guess
- [ ] T5.4 Report question + historique localStorage

## T6 — Supabase
- [ ] T6.1 Migrations : profiles, games, questions (concepts/translations/categories/sources/families/history/statistics/reports), debates (prompts/topics/sources/sessions/turns/votes)
- [ ] T6.2 RLS deny-by-default + policies + indexes
- [ ] T6.3 Client optionnel local-first

## T7 — Tests
- [ ] T7.1 Vitest : schema, dedupe, selection (anti-répétition), scoring, debate flow, timeline
- [ ] T7.2 `npm run lint/typecheck/test/build` verts

## T8 — Docs & livraison
- [ ] T8.1 README, ARCHITECTURE, DATABASE, QUESTION_ENGINE, DEBATE_ENGINE, COMPETITIVE_ANALYSIS, SPEC_COMPLIANCE, CONTRIBUTING
- [ ] T8.2 Secret scan + push GitHub officiel
- [ ] T8.3 Deploy Vercel + rapport final
