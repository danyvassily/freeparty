-- ============================================================
-- FREE PARTY — Fix online rooms : colonnes manquantes
-- Le client insère is_host/ready sur game_players → colonnes
-- jamais créées (bug "column does not exist" à la création de salon).
-- ============================================================

alter table public.game_players
  add column if not exists is_host boolean not null default false,
  add column if not exists ready boolean not null default false;

-- Index pour la recherche rapide de salon par code (déjà présent via
-- idx_game_sessions_code) — rien d'autre à faire.
