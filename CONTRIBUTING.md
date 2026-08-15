# Contributing — Free Party

## Workflow

1. Forkez / créez une branche : `git checkout -b feat/ma-fonctionnalite`
2. Commits en [Conventional Commits](https://www.conventionalcommits.org/) : `feat:`, `fix:`, `perf:`, `test:`, `docs:`
3. Validez avant push : `npm run lint && npm run typecheck && npm run test && npm run build`
4. Ouvrez une Pull Request vers `main`

## Ajouter des questions

1. Créez `questions/fr/<categorie>/<sous-theme>-NNN.json` (tableau de questions conformes au schéma — voir `QUESTION_ENGINE.md`)
2. `npm run questions:validate` — **0 question invalide autorisée**
3. `npm run questions:dedupe` — pas de doublon
4. `npm run questions:stats` — vérifiez la répartition

Règles de contenu :
- Faits stables et vérifiables ; sources Wikidata quand possible (CC0)
- 4 réponses, distracteurs du **même type sémantique**
- La bonne réponse ne doit jamais apparaître dans l'énoncé
- Varier les formulations au sein d'une même famille

## Ajouter un débat

1. Ajoutez un objet conforme au schéma dans `debates/fr/<categorie>.json`
2. Exigences : question ouverte finissant par « ? », contexte factuel ≥ 40 caractères, ≥ 2 perspectives sérieuses, ≥ 1 relance
3. `npm run test` — le Debate Quality Agent rejettera tout prompt biaisé ou tronqué

## Sécurité

- Jamais de secret commité ; utilisez `.env.local` et `.env.example`
- Toute donnée utilisateur passe par le schéma Zod
- Les tables Supabase nécessitent RLS deny-by-default
