# 🎉 Free Party

**Joue. Connais. Débats.**

Free Party est une application web mobile-first de jeu social : quiz, culture générale, mythologies, défis intellectuels et **débats profonds** — conçue pour les soirées entre amis, sans inscription, prête en 5 secondes.

> Architecture **local-first** : les parties fonctionnent 100% hors-ligne avec des datasets JSON versionnés. Aucune API externe n'est appelée pendant une partie (Wikidata/OpenTDB servent uniquement au pipeline de fabrication des questions).

## ✨ Modes de jeu

| Famille | Modes |
|---|---|
| 🎯 **Quiz** | Classic Quiz · Vrai/Faux · Rapid Fire · Timeline · Team Battle |
| 🎉 **Social** | Would You Rather · Guess |
| 💬 **Débat** | Politique · Philosophie · Histoire · Éthique · Actualité · Change My Mind · Avocat du diable · Dilemme éthique |
| 📚 **Connaissance** | Géographie · Capitales · Monnaies · Histoire & guerres · Mythologies · Philosophie · Culture pop |

## 🚀 Démarrage

```bash
git clone https://github.com/danyvassily/freeparty.git
cd freeparty
npm install
npm run dev
```

Ouvrez http://localhost:3000 — aucun compte requis.

## 🧪 Validation (spec §95)

```bash
npm run lint        # ESLint strict
npm run typecheck   # TypeScript strict
npm run test        # Vitest (42+ tests : schema, anti-répétition, débat, dédup…)
npm run build       # Build de production Next.js
```

## ❓ Pipeline des questions

```bash
npm run questions:validate   # schéma Zod strict — 0 question invalide autorisée
npm run questions:dedupe     # doublons exacts + quasi-doublons (Levenshtein)
npm run questions:stats      # statistiques du dataset
npm run questions:import     # import Supabase (si configuré)
npm run questions:generate   # génération capitales/monnaies depuis world-data
npm run questions:fetch      # registre des sources (Wikidata, OpenTDB…)
npm run questions:verify     # rapport de vérification factuelle
npm run questions:review     # revue qualité (production/review/quarantine)
```

## 📁 Structure

```
src/lib/questions/    Question Engine (schéma, sélection anti-répétition, dédup)
src/lib/debate/       Debate Engine (machine à états, timers, qualité)
src/lib/game/         Datasets sociaux (WYR, Guess, Timeline)
src/components/game/  Composants de jeu
supabase/migrations/  Schéma SQL + RLS (deny-by-default)
questions/fr/         Datasets JSON versionnés par catégorie
debates/fr/           Prompts de débat JSON
```

## 📚 Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — choix techniques et décisions
- [DATABASE.md](DATABASE.md) — schéma Supabase et RLS
- [QUESTION_ENGINE.md](QUESTION_ENGINE.md) — pipeline de fabrication des questions
- [DEBATE_ENGINE.md](DEBATE_ENGINE.md) — moteur de débat et garanties de neutralité
- [COMPETITIVE_ANALYSIS.md](COMPETITIVE_ANALYSIS.md) — analyse des concurrents
- [SPEC_COMPLIANCE.md](SPEC_COMPLIANCE.md) — conformité à la spec
- [CONTRIBUTING.md](CONTRIBUTING.md) — comment contribuer

## 🔒 Sécurité

- RLS **deny-by-default** sur toutes les tables Supabase (voir `supabase/migrations/20260815000002_rls.sql`)
- Aucun secret dans le dépôt : `.env.example` sans valeurs
- Validation Zod stricte de toute donnée entrante
- Debates : neutralité garantie par un audit automatique (perspectives multiples, pas de framing)

## 📄 Licence des données

- Questions : faits structurés (licence CC0 / Wikidata) + contenus originaux rédigés pour Free Party
- Prompts de débat : contenus originaux
- OpenTDB : évalué mais **non utilisé** (licence incompatible avec l'usage commercial — voir `QUESTION_ENGINE.md`)
