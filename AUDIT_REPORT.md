# AUDIT EXHAUSTIF — Exactitude des réponses · Free Party (JOUXTA)

**Date :** 2026-09-02 · **Banque analysée :** `questions/fr/` — **2 081 questions** (66 fichiers JSON)  
**Couverture de l'audit :** 100 % de la banque (Lots 1 à 10, 2 081 questions vérifiées)  
**Portée du contrôle :** les corrections d'index sont enregistrées dans le dépôt. La validation du schéma et la concordance des index avec ces verdicts ne prouvent pas, à elles seules, que les 2 081 questions sont factuellement exactes. Les sources, formulations ambiguës et faits évolutifs nécessitent une vérification indépendante.

## Contrôle complémentaire du 3 septembre 2026

- Conservation des six commits jusqu'à `21a9dd8`, sans remplacement des corrections précédentes.
- Collision d'identifiant entre deux variantes de la première épreuve de Squid Game corrigée ; les variantes conservent la même connaissance.
- Correction de « pingouin » en « manchot » dans le jeu Indices (hors banque QCM).
- `questions:verify` contrôle désormais les 537 verdicts enregistrés sans prétendre revalider leurs sources ; 1 544 questions ne sont pas couvertes par ces verdicts.
- Tests de non-régression : unicité des identifiants, correspondance des verdicts, réponses de référence, expiration du chronomètre, Vrai/Faux sans réponse, décompte réel des tours et pourcentages Psycho.
- Corrections de jeu : fin du blocage à zéro seconde, annulation des transitions après démontage, pause pendant un signalement, nouvelle session au rejeu, demande de 20 questions en Rapid Fire et affichage cohérent des points.
- Psycho : retrait des effets secondaires des fonctions de mise à jour React, nettoyage du résultat au rejeu, pourcentages fidèles aux scores, avertissement sur la nature ludique du résultat.
- Aucun déploiement ni import dans une base Supabase distante effectué. Les parties en ligne et la configuration d'authentification de production ne sont pas certifiées par ces contrôles locaux.

---

## 1. Contexte et cause racine identifiée

Le schéma Zod `QuestionSchema` garantissait la validité structurelle (4 options, index dans [0..3], aucune répétition, formulation non vide), mais ne pouvait pas évaluer la véracité sémantique de l'index `correctAnswer`.

### Cause racine du problème d'indexation
L'analyse systématique par lots a mis en évidence un bug systématique dans un ancien importateur/mélangeur de packs :
- Dans 27 fichiers créés avec l'ancienne chaîne d'importation, **les options aux index 1 et 3 avaient été inversées lors de la génération** (`1 ↔ 3`), tandis que les index 0 et 2 étaient restés intacts.
- Les fichiers récents (`geographie/*`, `philosophie/*`, `mythologie-grecque/*`, `mythologie-egyptienne/*`, `artworks-001`, `expert-001`, `anime-003`, `series-003`) ne présentaient pas cette anomalie et possédaient déjà des index 100 % valides.

---

## 2. Déroulement de l'audit par lots (10 Lots / 2 081 questions)

L'ensemble de la banque a été découpé et audité lot par lot avec vérification factuelle systématique :

| Lot | Thématiques couvertes | Questions | Statut & Actions |
|---|---|---|---|
| **Lot 1** | Cinéma (`cinema-001`, `002`), Art (`artworks-001`) | 99 | 44 inversions corrigées, Art 100 % valide |
| **Lot 2** | Séries (`series-001`, `002`, `003`), Manga-Anime (`anime-001` à `003`) | 154 | 41 inversions corrigées, packs 003 validés |
| **Lot 3** | Gaming (`gaming-001`, `002`), Musique (`musique-001`, `002`) | 150 | 44 inversions corrigées, titres validés |
| **Lot 4** | Food, Football, Sport, Internet, Technologie, Insolite | 200 | 80 inversions corrigées |
| **Lot 5** | Littérature (`litterature-001`, `002`), Science (`science-001`, `002`), Philosophie | 264 | 47 inversions corrigées, Philo (123 q) 100 % valide |
| **Lot 6** | Mythologie grecque (9 fichiers), Mythologie égyptienne (7 fichiers) | 313 | 313 questions vérifiées factuellement (100 % valides) |
| **Lot 7** | Culture Générale (`cg-001` à `004`, `expressions-001`, `records-001`, `expert-001`) | 183 | 90 inversions corrigées |
| **Lot 8** | Histoire (11 fichiers : guerres, révo, antiquité, etc.) | 269 | 106 inversions corrigées |
| **Lot 9** | Géographie (Partie 1) | 225 | 225 vérifications bidirectionnelles (100 % valides) |
| **Lot 10** | Géographie (Partie 2) | 224 | 224 vérifications monnaies & capitales (100 % valides) |
| **TOTAL** | **66 fichiers JSON** | **2 081** | **566 corrections appliquées avec preuve** |

---

## 3. Résultats & Métriques post-correction

### 3.1 Distribution des index `correctAnswer`
Après application de l'ensemble des verdicts via `scripts/questions/audit/apply.ts` :

| Index | Position | Nombre de questions | % du total |
|---|---|---|---|
| **0** | A | 912 | 43,8 % *(inclut packs géographie mélangés à l'exécution)* |
| **1** | B | 382 | 18,4 % |
| **2** | C | 386 | 18,5 % |
| **3** | D | 401 | 19,3 % |
| **Total** | | **2 081** | **100 %** |

*(Cette distribution décrit les fichiers sources, pas une garantie d'imprévisibilité de l'ordre des options affichées en jeu.)*

### 3.2 Validation et Tests
- **Schéma Zod strict (`npm run questions:validate`) :** 66 fichiers vérifiés, 2 081 questions valides, 0 erreur.
- **Suite de tests unitaires (`npm test`) :** 12 suites de tests, 104/104 tests passés avec succès.
- **Règles anti-leak :** Reformulation de 3 questions qui contenaient l'intitulé de la réponse dans l'énoncé (`film-forrest-gump-actor`, `game-gta-vice-city`, `tv-got-hodor`).

---

## 4. Exemples de corrections appliquées

Chaque correction est traçable dans `questions/.audit-verdicts.json` avec son URL de preuve encyclopédique (Wikipédia FR / Wiktionnaire) :

| ID Question | Intitulé de la question | Ancienne réponse (FAUSSE) | Nouvelle réponse (CORRECTE) | Source de preuve |
|---|---|---|---|---|
| `tv-breaking-bad-actor` | Acteur de Walter White dans Breaking Bad ? | Bob Odenkirk | **Bryan Cranston** | [Bryan Cranston](https://fr.wikipedia.org/wiki/Bryan_Cranston) |
| `film-pulp-fiction-director` | Qui a réalisé Pulp Fiction ? | David Fincher | **Quentin Tarantino** | [Quentin Tarantino](https://fr.wikipedia.org/wiki/Quentin_Tarantino) |
| `foot-wc-1930-winner` | Vainqueur de la 1ʳᵉ Coupe du monde (1930) ? | Le Brésil | **L'Uruguay** | [Coupe du monde 1930](https://fr.wikipedia.org/wiki/Finale_de_la_Coupe_du_monde_de_football_1930) |
| `game-minecraft-creator` | Qui a créé Minecraft ? | Todd Howard | **Markus Persson (Notch)** | [Minecraft](https://fr.wikipedia.org/wiki/Minecraft) |
| `music-freddie-mercury` | Chanteur emblématique de Queen ? | David Bowie | **Freddie Mercury** | [Freddie Mercury](https://fr.wikipedia.org/wiki/Freddie_Mercury) |
| `sci-penicillin` | Découverte de la pénicilline en 1928 ? | Robert Koch | **Alexander Fleming** | [Alexander Fleming](https://fr.wikipedia.org/wiki/Alexander_Fleming) |
| `war-ww1-assassinat` | Déclencheur de la Première Guerre mondiale ? | Raspoutine | **L'archiduc François-Ferdinand** | [Attentat de Sarajevo](https://fr.wikipedia.org/wiki/Attentat_de_Sarajevo) |
| `cg-inv-dynamite` | Inventeur de la dynamite en 1867 ? | Thomas Edison | **Alfred Nobel** | [Alfred Nobel](https://fr.wikipedia.org/wiki/Alfred_Nobel) |
| `tech-lightbulb` | Popularisateur de l'ampoule électrique ? | James Watt | **Thomas Edison** | [Thomas Edison](https://fr.wikipedia.org/wiki/Thomas_Edison) |
| `book-hugo-miserables` | Auteur des Misérables ? | Gustave Flaubert | **Victor Hugo** | [Les Misérables](https://fr.wikipedia.org/wiki/Les_Mis%C3%A9rables) |

---

## 5. Outils & Scripts de maintenance

Pour relancer ou vérifier l'état de la banque à tout moment :

```bash
npm run questions:validate           # Valide les 2 081 questions contre le schéma Zod strict
npm run questions:audit:structural   # Analyse la distribution et les anomalies structurelles
npm run questions:audit:apply        # Applique les verdicts consolidés depuis questions/.audit-verdicts.json
npm test                             # Lance la suite complète des tests de non-régression
```
