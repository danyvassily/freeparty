# Free Party — Analyse concurrentielle (spec §10)

## Marché observé

| Application | Forces | Faiblesses | Opportunité Free Party |
|---|---|---|---|
| **QuizUp** | Bibliothèque massive, matchmaking | Abandonné (2019), trop compétitif, fatigue quiz | Jouer entre amis dans le canapé, pas contre des inconnus |
| **Kahoot!** | Fun en groupe, très simple | Nécessite un écran hôte + téléphones, orienté salle de classe, contenu superficiel | Mobile-first, une seule surface, catégories profondes |
| **Trivia Crack** | Progression, personnages | Micro-transactions agressives, répétition des questions | **Anti-répétition par design**, aucune monétisation intrusive |
| **Psych ! / Party games mobiles** | Bluff, rires | Fatigue rapide, contenu limité | Question Engine scalable + modes de débat |
| **Jackbox Games** | Premium, hilarant, téléphone = manette | Payant par pack, en anglais majoritairement, pas de débat sérieux | Gratuit, FR natif, débat profond |
| **Quiz Party / Jeux TV** | Faciles | Questions faibles, répétitives | Qualité > quantité, vérification factuelle |

## Points de douleur des utilisateurs (avis publics)

1. **Répétition des questions** → Free Party : sélection par score, familles, historique persistant
2. **Questions fausses ou ambiguës** → pipeline Zod + vérification + signalement en 1 tap
3. **Inscription forcée** → zéro compte : 5 secondes pour jouer
4. **Monétisation aggressive** → aucune pub, 100% jouable hors-ligne
5. **Pas de débat de qualité** → moteur de débat avec contexte factuel, neutralité auditée, 74 prompts

## Ce que Free Party fait différemment

1. **PLAY + KNOWLEDGE + DISCUSSION** : les trois registres dans une seule app de soirée
2. **Débat non-compétitif** : personne ne « gagne » un débat — on mesure les idées, pas les ego
3. **Neutralité par construction** : audit automatique des prompts, perspectives multiples, contexte factuel séparé des opinions
4. **Local-first** : une panne réseau ne ruine jamais une soirée
5. **FR d'abord** : contenu français natif et de qualité, là où les concurrents traduisent mal

## Positionnement cible

> « Le Jackbox du quiz intelligent et du débat respectueux, en français, gratuit et sans compte. »
