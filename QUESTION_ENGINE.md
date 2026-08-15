# Free Party — Question Engine

## Principes (spec §17–§42)

> Pas une liste de questions : un pipeline complet de fabrication, validation et sélection.

```
DATA SOURCES → INGESTION → NORMALIZATION → GENERATION → FACT VERIFICATION
→ QUALITY REVIEW → DEDUPLICATION → FAMILY ANALYSIS → JSON DATASETS
→ SUPABASE → SELECTION ENGINE → PLAYER ANALYTICS → CONTINUOUS IMPROVEMENT
```

## Pipeline CLI (`npm run questions:*`)

| Commande | Rôle | Statut |
|---|---|---|
| `fetch` | Registre des sources (Wikidata CC0 prioritaire, OpenTDB évalué) | ✅ |
| `generate` | Génération capitales/monnaies depuis `world-data.ts` (167 pays) | ✅ |
| `validate` | Schéma Zod strict — **question invalide = interdite en production** | ✅ |
| `verify` | Rapport de vérification (provenance + sources) | ✅ |
| `dedupe` | Doublons exacts (clé canonique) + quasi-doublons (Levenshtein ≤ 15%) | ✅ |
| `review` | Quality score composite → production / review / quarantine | ✅ |
| `stats` | Statistiques (catégorie, difficulté, langue, type, source) | ✅ |
| `import` | Upsert Supabase (batch de 500, `onConflict: id`) | ✅ (si configuré) |

## Schéma de question (extrait, spec §28)

```json
{
  "id": "capital-espagne-001",
  "conceptId": "fact-capitale-espagne",
  "familyId": "capital-spain",
  "type": "mcq",
  "question": "Quelle est la capitale de l'Espagne ?",
  "answers": ["Madrid", "Lisbonne", "Rome", "Athènes"],
  "correctAnswer": 0,
  "category": "geographie",
  "subcategory": "capitales",
  "difficulty": "easy",
  "language": "fr",
  "tags": ["espagne"],
  "source": { "provider": "wikidata", "sourceId": "Q29", "url": "https://www.wikidata.org/wiki/Q29", "license": "CC0" },
  "verification": { "status": "verified", "verifiedAt": "2026-08-15", "sources": ["wikidata"] },
  "confidence": 0.98,
  "qualityScore": 0.95,
  "version": 1
}
```

### Garde-fous du schéma (Zod `superRefine`)
- Exactement 4 réponses, **uniques** (pas de doublon)
- La bonne réponse **ne doit pas apparaître dans l'énoncé**
- `id` kebab-case, catégorie dans le référentiel, correctAnswer 0–3
- URL de source acceptée vide (données générées), licence par défaut CC0

## États (spec §32)

`draft → review → verified → quarantined / rejected / expired`
Seules les questions `verified` sont distribuées (filtre RLS + sélection).

## Anti-répétition (spec §37) — LE CŒUR

La sélection ne repose **jamais** sur le hasard pur :

```ts
selection_score =
  novelty × 2
  + category_balance × 1.5
  + difficulty_balance × 1.2
  + freshness × 2
  − repetition_penalty (×10 par question vue, ×4 par famille vue)
```

- `maxPerFamily = 1` par partie : deux questions de la même famille ne peuvent pas apparaître ensemble
- Jitter contrôlé (0.15 par défaut) : variété sans hasard pur
- L'historique du groupe est persisté en localStorage et envoyé à chaque requête

**Preuve** : `tests/selection.test.ts` — 200 tirages sans resservir une question tant que le pool le permet ; les questions fraîches sont toujours choisies avant les vues.

## Sources (spec §18, §23–§26)

| Source | Licence | Usage commercial | Statut |
|---|---|---|---|
| Wikidata | CC0 | ✅ Oui | **Prioritaire** — faits structurés (capitale P36, monnaie P38…) |
| Wikipédia | CC BY-SA 4.0 | ❌ Non direct | Contexte/vérification uniquement (jamais copier → question) |
| OpenTDB | CC BY-SA 4.0 | ❌ Non | Évalué, **désactivé** (incompatibilité commerciale) |

`question_sources` (table + `scripts/questions/fetch.ts`) enregistre provider, licence, enabled, dernière vérification.

## Dataset actuel

- Format : `questions/fr/<categorie>/*.json` (~50 questions par fichier, jamais de fichier géant)
- Objectif architecture : **100 000+ questions** (milestones 5k/10k/25k/50k/100k) — le loader est agnostique du volume
- **QUALITY > QUANTITY** : toute question douteuse est rejetée plutôt qu'ajoutée
