-- ============================================================
-- FREE PARTY — Fix salons en ligne : game_id devient nullable
-- Les salons (rooms) n'ont pas de game parent : la contrainte
-- NOT NULL bloquait la création ("null value in column game_id").
-- ============================================================

alter table public.game_sessions
  alter column game_id drop not null;
