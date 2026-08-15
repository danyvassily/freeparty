# Free Party — Debate Engine

## Principes (spec §56–§80)

> Un débat n'est PAS un quiz : pas de bonne réponse, pas de gagnant, pas de perdant.
> Le moteur garantit **profondeur, neutralité, équité** et le respect des opinions.

## Prompt de débat (spec §56)

```json
{
  "id": "pol-01",
  "category": "politics",
  "topic": "Démocratie et tolérance",
  "prompt": "Une démocratie peut-elle légitimement interdire des mouvements politiques qui souhaitent abolir la démocratie ?",
  "context": "Depuis l'après-guerre, plusieurs démocraties ont adopté des mécanismes de « démocratie militante »…",
  "perspectives": ["La démocratie doit se défendre…", "Interdire des idées les rend plus attractives…", "…"],
  "followUps": ["Qui devrait définir la frontière… ?", "…"],
  "sources": [{ "label": "Loi fondamentale allemande", "type": "document" }],
  "difficulty": "deep",
  "sensitivity": "high",
  "lastVerifiedAt": "2026-08-15"
}
```

**74 prompts rédigés** : politics (19) · philosophy (19) · history (12) · ethics (12) · current-issues (12) — tous avec contexte factuel, 2–4 perspectives sérieuses, relances et sources.

## Machine à états (spec §58)

```
presentation → reflection (30s) → player-turn → open-discussion → follow-up → voting → results
```

- Les transitions illégales sont **refusées** (`canTransition` — testé)
- `player-turn` : round-robin entre joueurs
- `open-discussion` : libre, compteurs de points discutés / arguments / questions restantes
- `follow-up` : relances révélées une par une (spec §74)
- `voting` : vote avant/après optionnel → "2 participants ont changé de position" (spec §79)

## Fair speaking timer (spec §59)

- Budget par joueur = `durée totale / nombre de joueurs` (5 min par défaut → 2 joueurs = 150 s chacun)
- `startTurn` refuse un tour si le budget est épuisé (testé)
- `endTurn` comptabilise le temps réel et décrémente le budget
- Affiché pendant les tours, jamais transformé en jugement politique

## Résultats non-compétitifs (spec §78)

Pas de WINNER / LOSER / CORRECT / WRONG. Le bilan affiche :
- Points discutés
- Arguments explorés
- Questions restantes
- Temps de parole par joueur
- Changements de position (si vote)

## Modes (spec §71–§73)

| Mode | Comportement |
|---|---|
| `standard` | Débat classique |
| `change-my-mind` | Position **assignée** affichée clairement — jamais attribuée au joueur |
| `devils-advocate` | Contre-argument honnête après le premier tour |
| `ethical-dilemma` | Situation morale → réflexion → position → contre-argument → discussion |

## Debate Quality Agent (spec §76) — audit automatique

Chaque prompt est audité avant distribution (`src/lib/debate/quality.ts`) :

| Critère | Vérification |
|---|---|
| Profondeur | Longueur du prompt |
| Neutralité | Absence de mots orientés ("doit", "évidemment", "les riches"…) |
| Clarté | Se termine par une question |
| Équité | ≥ 2 perspectives |
| Multi-perspectives | Nombre de perspectives sérieuses |
| Contexte factuel | ≥ 40 caractères, séparé des opinions (spec §65) |
| Biais | Absence de framing ("envahissent", "propagande"…) |
| Fraîcheur | `lastVerifiedAt` requis pour current-issues ; `validUntil` vérifié |
| Discussion | Relances présentes |

**Hard fails** : < 2 perspectives, 0 relance, contexte < 40 caractères → rejet systématique, quel que soit le score moyen.

## Confidentialité (spec §80)

- **Interdiction** : `user.political_orientation` n'existe nulle part
- Les votes de débat sont anonymes par défaut et non stockés par joueur en base
- Aucun profil politique inféré

## Règles du débat affichées (spec §77)

> Critique les arguments. · Laisse les autres terminer. · Aucune attaque personnelle. · Tu peux changer d'avis.
