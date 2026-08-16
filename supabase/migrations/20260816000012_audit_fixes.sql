-- ============================================================
-- FREE PARTY — Audit fixes (Lead Reviewer) : anti-double-join + Realtime
-- 1. game_players : contrainte unique (session_id, user_id) → un joueur
--    ne peut pas rejoindre 2× (double-clic) → joinRoom idempotent.
-- 2. Publication Realtime sur les tables du jeu (synchro instantanée
--    au lieu du seul polling 3 s).
-- ============================================================

alter table public.game_players
  drop constraint if exists game_players_session_user_unique,
  add constraint game_players_session_user_unique unique (session_id, user_id);

alter publication supabase_realtime add table public.game_sessions;
alter publication supabase_realtime add table public.game_players;
alter publication supabase_realtime add table public.room_answers;
