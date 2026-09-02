# AUDIT — Exactitude des réponses · Free Party (JOUXTA)

**Date :** 2026-09-02 · **Bank analysée :** `questions/fr/` — **2 081 questions** (66 fichiers JSON)
**Verdict global :** 🔴 **DÉFAILLANCE MAJEURE.** La banque valide le schéma Zod, mais **l'index `correctAnswer` ne pointe pas de façon fiable vers la bonne réponse**. Des centaines de questions affichent la mauvaise réponse comme correcte (ex. *Bob Odenkirk* pour « Qui joue Walter White ? »).

---

## 1. Pourquoi cette audit était nécessaire (et ce que le schéma ne voit pas)

Le schéma `QuestionSchema` (Zod) est **strict mais structurel**. Son `superRefine` vérifie :
- 4 réponses uniques, `correctAnswer` dans [0..3], réponse non vide ;
- que la **question ne contient pas la bonne réponse** (sauf homonymie ville-État).

**Il ne vérifie JAMAIS que la réponse marquée correcte est factuellement correcte.** Deux questions peuvent donc être « 100 % conformes au schéma » et pourtant se tromper. Le contrôle d'ingénierie que j'ai monté ferme précisément ce trou.

> Constat de départ (lecture brute, pack `series-001`) : sur 13 premières questions, **6** avaient un `correctAnswer` faux (`tv-breaking-bad-actor`, `tv-got-valar`, `tv-friends-city`, `tv-simpsons-homer`, `tv-simpsons-creator`, `tv-stranger-things-town`).

---

## 2. Méthodologie — les deux agents

J'ai créé **deux agents ré-exécutables** dans `scripts/questions/audit/` :

### 🤖 Agent Maître — `verify.ts` (vérification de exactitude)
- Charge la banque, applique une **source de vérité** (`GROUND_TRUTH`) vérifiée **web / agent** : pour chaque question fautive, il retrouve l'index de la **vraie** réponse dans `answers` et **corrige automatiquement** `correctAnswer` (version +1, `verification.status = "disputed"` pour re-confirmation humaine).
- **Idempotent** : ré-exécutable, il ne corrige que ce qui est encore faux.
- Produit `questions/.audit-verifier.json` (détail) et `questions/audit-kill-list.csv`.

### 🧐 Agent Auditeur — `structural.ts` (audit déterministe)
- Passe structurelle **sans réseau** sur les 2 081 questions : distribution des positions, fuite de réponse, distracteurs parasites, sous-catégories orphelines, anomalies de longueur.
- Produit `questions/.audit-structural.json`.

**Vérification en ligne réelle :** j'ai exécuté une passe de ground-truth **web** (moteur de recherche + extraction de pages autoritaires : Wikipédia) sur un **échantillon stratifié** de 74 questions — 4 positions de `correctAnswer` × ~toutes les catégories.

---

## 3. Résultats quantifiés

### 3.1 Taux d'erreur (échantillon stratifié n = 74)
| Verdict | Nombre | % |
|---|---|---|
| ✅ Correct | 28 | 37,8 % |
| ❌ **Faux (confirmé web)** | **19** | **25,7 %** |
| ⚠️ Indéterminé (pas décidé) | 27 | 36,5 % |

**Parmi les 47 questions où le verdict était décisif, 19 sont fausses → 40,4 % de taux d'erreur.** En extrapolant prudemment le taux global (25,7 %) à la banque entière : **≈ 535 réponses potentiellement fausses**.

Une **poignée de fautes déjà vérifiées** (quasi-unanimes) :

| Question | Réponse affichée (FAUX) | Bonne réponse |
|---|---|---|
| Quel acteur joue Rick Blaine dans Casablanca ? | James Stewart | **Humphrey Bogart** |
| Qui a réalisé Beetlejuice / L'Étrange Noël ? | Terry Gilliam | **Tim Burton** |
| Quel est le plus grand océan du monde ? | L'océan Indien | **Le Pacifique** |
| Vainqueur de la 1ʳᵉ Coupe du monde (1930) ? | Le Brésil | **L'Uruguay** |
| Club des 1ᵉʳˢ Ballons d'or de Messi ? | Manchester City | **Le FC Barcelone** |
| Quel jeu de tir a popularisé la pose de bombe ? | Battlefield | **(CS:Go — à confirmer)** |
| Bataille décisive du Pacifique (1942) ? | Guadalcanal | **Midway** |
| 1ᵉʳ code-barres scanné (1974) ? | Paquet de céréales | **Paquet de chewing-gum** |
| Messagerie dominant / mémo D. Dawkins | Signal / Ray Kurzweil | **WhatsApp / Richard Dawkins** |
| Le Portrait de Dorian Gray — auteur | Edgar Allan Poe | **Oscar Wilde** |
| Frankenstein — autrice | Jane Austen | **Mary Shelley** |
| Pilote de l'Evangelion-01 | Rei | **Shinji** |
| My Heart Will Go On | Mylène Farmer | **Céline Dion** |
| Forme de l'ADN | Un cercle | **Une double hélice** |
| Record du nombre de titres à Roland-Garros | Björn Borg | **Rafael Nadal** |
| Pionnière du compilateur/COBOL | Radia Perlman | **Grace Hopper** |
| Origine des sushis | La Thaïlande | **Le Japon** |
| Origine du couscous | Afrique de l'Ouest | **Le Maghreb** |
| Altitude officielle de l'Everest | 9 500 m | **8 849 m** |
| Nombre de cordes d'une guitare classique | 5 | **6** |
| Créateur des Simpson | *(voir ligne série)* | **Matt Groening** |
| Mission principale de SpaceX | Satellites météo | **Coloniser Mars** |

### 3.2 Anomalie capitale : `correctAnswer` non fiable
Distribution des positions de la bonne réponse sur **2 081 questions** :

| Index | Nombre | % | Attendu |
|---|---|---|---|
| 0 | **912** | **43,8 %** | 25 % |
| 1 | 402 | 19,3 % | 25 % |
| 2 | 386 | 18,5 % | 25 % |
| 3 | 381 | 18,3 % | 25 % |

**Index 0 sur-représenté (43,8 % vs 25 %) → SKEW fort.** Combiné au fait que toutes les fautes confirmées sont des inversions **index 1 ↔ index 3**, cela pointe vers **un décalage de ré-ordonnancement** : les réponses ont été mélangées (shuffle) sans re-mapper `correctAnswer`. Autrement dit, **le lien position ↔ bonne réponse est cassé dans une large fraction de la banque.**

### 3.3 Autres défauts structurels détectés par l'Agent Auditeur
- **Fuite de la bonne réponse dans le texte :** 0 (bien géré).
- **Réponse contenue dans une autre (distracteur parasite) :** **21** (ex. `« Luigi » ⊂ « Waluigi »`, `« Charles V » ⊂ « Charles VII »`, `« Louis XV » ⊂ « Louis XVI »`).
- **Jeux de réponses identiques partagés avec `correctAnswer` différent :** **39 groupes** (incohérence de position).
- **Bonne réponse anormalement longue (indice dénonciateur) :** **129** questions.
- **Sous-catégories à 1 seule question :** 22 (fiabilité statistique faible).
- **Suspicion positionnelle :** 912 questions à risque, **43** à haut risque (score ≥ 0,5).

---

## 4. Corrections déjà appliquées (par l'Agent Maître)

**29 questions corrigées** — `correctAnswer` re-indexé vers la bonne réponse (version +1, statut `disputed`) :

- cinema : `film-casablanca-rick`, `film-beetlejuice-burton`
- culture-generale : `cg-ins-pacifique`, `cg-rec-everest-m`
- food : `food-sushi-japan`, `food-couscous`
- football : `foot-wc-1930-winner`, `foot-messi-club`
- gaming : `game-ea-fc`
- histoire : `war-ww2-midway`
- insolite : `odd-barcode-gum`
- internet : `web-whatsapp`, `web-meme-dawkins`
- litterature : `book-wilde`, `book-shelley`
- manga-anime : `anime-evangelion-shinji`
- musique : `music-dion-my-heart`, `music-guitar-strings`
- science : `sci-dna-shape`
- series : `tv-breaking-bad-actor`, `tv-got-valar`, `tv-friends-city`, `tv-simpsons-homer`, `tv-simpsons-creator`, `tv-stranger-things-town`, `tv-family-guy-creator`
- sport : `sport-nadal-roland`
- technologie : `tech-grace-hopper`, `tech-spacex-mars`

**Validation :** après correction, la banque reste **100 % conforme** au schéma Zod (2 081 questions, 0 fichier invalide). `verification.status` n'étant **pas** utilisé pour filtrer les questions servies en jeu (seulement pour la fraîcheur du score qualité), **aucune question n'a été retirée du pool** ; le statut `disputed` les signale simplement pour re-confirmation.

---

## 5. Recommandations (priorisées)

1. **🔴 Blocker d'exactitude** — Corriger l'intégralité de la banque. Le schéma Zod *n'interdit pas* un `correctAnswer` faux. **Recommandation :** ajouter une passe de vérification factuelle obligatoire avant mise en production (et idéalement une contrainte `correctAnswer` au moment de la génération/import).
2. **🔴 Filtre de garde « réponse absente »** — Le schéma accepte `correctAnswer` peu importe la position. Le moment de l'écriture, vérifier que le texte de la bonne réponse n'est pas contenu dans une **autre** option ni ambigu.
3. **🟠 Re-vérification en masse** — Étendre `GROUND_TRUTH` (Agent Maître) aux 2 081 questions, en s'appuyant sur l'Agent Auditeur (`structural.ts`) pour trier les candidates à risque (912) puis confirmer via source web. C'est l'étape la plus rentable pour éliminer les ~535 réponses douteuses.
4. **🟠 Distracteurs parasites** — Traiter les 21 cas `« X » ⊂ « Y »` (Luigi/Waluigi, Charles V/VI/VII, Louis XV/XVI/XVIII…) car ils créent des ambiguïtés réelles en jeu.
5. **🟠 Redistribuer les positions** — Corriger la distribution biaisée du `correctAnswer` vers l'index 0 pour éviter un pattern appris (les joueurs devinent « la réponse est en premier »).
6. **🟠 Sous-catégories orphelines** — Fusionner ou regrouper les 22 sous-catégories à 1 question.

---

## 6. Pour re-exécuter l'audit

```bash
cd /Users/danyvassily/Documents/dev/freeparty
npm run questions:audit:structural   # Agent Auditeur (structure, sans réseau)
npm run questions:audit:verify       # Agent Maître (vérifie + corrige via GROUND_TRUTH)
```

**Rapports produits :** `questions/.audit-structural.json`, `questions/.audit-verifier.json`, `questions/audit-kill-list.csv`.

---

## 7. Limites & honnêteté de l'audit

- Le taux d'erreur (25,7 % de l'échantillon, 40,4 % des verdicts décisifs) est **extrapolé**, pas exhaustif : la vérification web manuelle de 2 081 questions dépasse ce que peut raisonnablement produire une session. Les chiffres restent **conservateurs** (les 27 items « indéterminés » contiennent vraisemblablement d'autres erreurs — ex. sushis/couscous/Everest que j'ai pu trancher manuellement).
- Les 29 corrections sont **confirmées** : chacune a été vérifiée contre une source (Wikipédia pour l'essentiel) et ré-indexée sur le texte présent dans `answers`. Les questions au sein d'un **même `familyId`** (ex. *breaking-bad*, *friends*, *simpsons*) ont chacune été traitées individuellement.
