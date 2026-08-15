# Free Party — Project Constitution

## 1. Mission

Free Party est un jeu social web/mobile-first : quiz, culture générale, jeux entre amis, équipes, débats, philosophie, histoire, politique, mythologies, défis intellectuels. Produit grand public premium, pas un prototype.

## 2. Non-négociables (dans l'ordre)

1. **Intégrité des données** — aucune question invalide en prod, schéma Zod strict, vérification des faits, états de questions.
2. **Stabilité** — les parties ne dépendent d'aucune API externe ; une panne externe ne casse jamais une partie.
3. **Gameplay core** — jouer en < 10 secondes : OPEN → MODE → CATÉGORIE → JOUEURS → PLAY. Pas d'inscription forcée.
4. **Qualité des questions** — QUALITY > QUANTITY. Distracteurs même type sémantique. 10 000 excellentes > 100 000 douteuses.
5. **Anti-répétition** — jamais `ORDER BY RANDOM()` seul ; score de sélection (novelty + équilibre catégorie/difficulté + fraîcheur − pénalité répétition).
6. **Qualité des débats** — prompts profonds, équilibrés, multi-perspectives, contexte factuel séparé des opinions, non propagandistes.
7. **UX premium mobile-first** — design system propriétaire, animations justes, WCAG 2.2 AA visé, zéro écran noir.
8. **Sécurité** — Supabase RLS deny-by-default, jamais de secrets exposés, `.env.example` sans valeurs.
9. **Performance** — LCP/CLS/INP maîtrisés, bundles légers, index SQL.
10. **Extensibilité** — architecture compatible 100 000+ questions, localisation fr/en/es/de/it/pt par séparation concept/translation.

## 3. Contraintes

- Stack : Next.js (App Router) + TypeScript strict + Tailwind CSS + Zod + Vitest. Backend : Supabase (PostgreSQL, RLS, migrations reproductibles).
- Local-first : les modes de jeu tournent sur datasets JSON embarqués ; Supabase est la couche de persistance optionnelle.
- Nom du produit centralisé (`src/lib/brand.ts`) — aucune chaîne de branding dispersée.
- Pas de profil politique utilisateur (`user.political_orientation` interdit).
- Résultats de débat non-compétitifs par défaut (points discutés, arguments, questions restantes, temps de parole).
- Commits Conventional Commits, push vers le repo officiel `danyvassily/freeparty`.
- Pas de fausse validation : tout ce qui n'est pas prouvé est marqué `NOT VERIFIED`.

## 4. Définition de done

Lint + typecheck + tests Vitest + build passent réellement ; question engine et debate engine testés ; anti-répétition testée ; RLS écrites ; push GitHub réellement réussi ; rapport final avec preuves.
