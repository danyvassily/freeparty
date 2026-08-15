-- ============================================================
-- FREE PARTY — Online rooms (multijoueur en ligne)
-- spec §54-55 (modes sociaux multijoueurs) + évolution produit :
-- jouer sur son appareil avec d'autres joueurs distants.
-- Host-authoritative : le créateur du salon pilote la partie.
-- ============================================================

-- Extension pour la liste de codes aléatoires
create extension if not exists pgcrypto;

-- Étendre game_sessions pour le mode en ligne
alter table public.game_sessions
  add column if not exists room_code text unique,
  add column if not exists host_id uuid references auth.users(id) on delete set null,
  add column if not exists phase text not null default 'lobby'
    check (phase in ('lobby','playing','finished')),
  add column if not exists question_index int not null default -1,
  add column if not exists current_question jsonb,
  add column if not exists answers_revealed boolean not null default false,
  add column if not exists state_version int not null default 0;

-- Réponses des joueurs distants
create table if not exists public.room_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  player_id uuid not null references public.game_players(id) on delete cascade,
  question_index int not null default 0,
  answer_index int,
  correct boolean,
  response_time_ms int,
  answered_at timestamptz not null default now(),
  unique (session_id, player_id, question_index)
);

create index if not exists idx_room_answers_session on public.room_answers (session_id, question_index);
create index if not exists idx_game_sessions_code on public.game_sessions (room_code);

-- RLS sur les nouvelles colonnes/tables
alter table public.room_answers enable row level security;

-- Un joueur peut créer un salon (host)
create policy "game_sessions_online_insert"
  on public.game_sessions for insert
  to authenticated
  with check (host_id = (select auth.uid()) and room_code is not null);

-- Lire un salon : si on en est membre (host ou joueur)
create or replace function public.is_session_member(s uuid)
returns boolean language sql security invoker stable as $$
  select exists (
    select 1 from public.game_players gp
    where gp.session_id = s and gp.user_id = (select auth.uid())
  ) or exists (
    select 1 from public.game_sessions gs
    where gs.id = s and gs.host_id = (select auth.uid())
  );
$$;

create policy "game_sessions_online_read"
  on public.game_sessions for select
  to authenticated
  using (public.is_session_member(id));

-- Le host met à jour l'état du jeu (phase, question courante)
create policy "game_sessions_online_update_host"
  on public.game_sessions for update
  to authenticated
  using (host_id = (select auth.uid()))
  with check (host_id = (select auth.uid()));

-- Rejoindre : insérer un joueur dans un salon en lobby
create policy "game_players_join"
  on public.game_players for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.game_sessions gs
      where gs.id = session_id
        and gs.phase = 'lobby'
        and gs.host_id is not null
    )
  );

-- Mise à jour de son propre joueur (ready)
create policy "game_players_self_update"
  on public.game_players for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Réponses : insertion si membre du salon
create policy "room_answers_insert_member"
  on public.room_answers for insert
  to authenticated
  with check (
    public.is_session_member(session_id)
    and exists (select 1 from public.game_players gp where gp.id = player_id and gp.user_id = (select auth.uid()))
  );

create policy "room_answers_read_member"
  on public.room_answers for select
  to authenticated
  using (public.is_session_member(session_id));

-- Mise à jour des réponses par le host (correction des scores)
create policy "room_answers_update_host"
  on public.room_answers for update
  to authenticated
  using (
    exists (select 1 from public.game_sessions gs where gs.id = session_id and gs.host_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.game_sessions gs where gs.id = session_id and gs.host_id = (select auth.uid()))
  );

-- Autoriser les game_players à être lus par les membres (déjà couvert par la policy membre)
drop policy if exists "game_players_member_read" on public.game_players;
create policy "game_players_member_read"
  on public.game_players for select
  to authenticated
  using (
    session_id in (select gs.id from public.game_sessions gs where public.is_session_member(gs.id))
  );

-- NB : Realtime doit être activé sur game_sessions, game_players, room_answers
-- via le dashboard (Database → Replication) ou : alter publication supabase_realtime add table ...
-- (fait par le CLI db push si configuré dans config.toml ; sinon à activer dans le dashboard)
