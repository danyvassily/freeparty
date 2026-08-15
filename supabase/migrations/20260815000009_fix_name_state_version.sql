-- ============================================================
-- FREE PARTY — Fix online : colonne name + state_version bigint
-- 1. game_players.name : le client utilise name (colonne absente)
-- 2. state_version : Date.now() dépasse int (max 2,147,483,647)
-- ============================================================

alter table public.game_players
  add column if not exists name text not null default 'Joueur';

alter table public.game_sessions
  alter column state_version type bigint;
