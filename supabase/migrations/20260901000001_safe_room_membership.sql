-- ============================================================
-- JOUXTA — Adhésion atomique aux salons et départ des joueurs
-- ============================================================

-- Ancienne policy des parties persistées : elle interroge public.games et
-- fait échouer les lectures PostgREST des salons en ligne. La policy
-- game_sessions_online_read couvre désormais l'accès des participants.
drop policy if exists "game_sessions_member_read" on public.game_sessions;

-- Les policies RLS ne suffisent pas : PostgREST exige aussi les privilèges de
-- table. Ils restent bornés par les policies définies dans les migrations.
grant select, insert, update on table public.game_sessions to authenticated;
grant select, insert, update, delete on table public.game_players to authenticated;
grant select, insert, update on table public.room_answers to authenticated;

-- Un joueur peut retirer uniquement sa propre présence du salon.
drop policy if exists "game_players_self_delete" on public.game_players;
create policy "game_players_self_delete"
  on public.game_players for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Les joueurs invités passent exclusivement par la fonction atomique ci-dessous.
-- L'hôte conserve une policy dédiée pour s'inscrire juste après la création.
drop policy if exists "game_players_join" on public.game_players;
drop policy if exists "game_players_host_insert" on public.game_players;
create policy "game_players_host_insert"
  on public.game_players for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and is_host = true
    and exists (
      select 1
      from public.game_sessions gs
      where gs.id = session_id
        and gs.host_id = (select auth.uid())
        and gs.phase = 'lobby'
    )
  );

-- L'adhésion doit verrouiller le salon pendant le contrôle de capacité.
-- Une simple policy COUNT(*) peut laisser entrer deux joueurs simultanément.
create or replace function public.join_game_session(
  p_room_code text,
  p_player_name text
)
returns table (session_id uuid, player_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_session public.game_sessions%rowtype;
  existing_player_id uuid;
  created_player_id uuid;
  current_user_id uuid := auth.uid();
  safe_name text := left(nullif(trim(p_player_name), ''), 20);
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  select gs.*
    into target_session
    from public.game_sessions gs
    where gs.room_code = upper(trim(p_room_code))
    for update;

  if not found or target_session.phase <> 'lobby' or target_session.host_id is null then
    raise exception using errcode = 'P0002', message = 'room_not_found';
  end if;

  select gp.id
    into existing_player_id
    from public.game_players gp
    where gp.session_id = target_session.id
      and gp.user_id = current_user_id
    limit 1;

  if existing_player_id is not null then
    return query select target_session.id, existing_player_id;
    return;
  end if;

  if (
    select count(*)
    from public.game_players gp
    where gp.session_id = target_session.id
  ) >= target_session.max_players then
    raise exception using errcode = 'P0001', message = 'room_capacity_reached';
  end if;

  insert into public.game_players (session_id, user_id, name, is_host)
  values (target_session.id, current_user_id, coalesce(safe_name, 'Joueur'), false)
  returning id into created_player_id;

  return query select target_session.id, created_player_id;
end;
$$;

revoke all on function public.join_game_session(text, text) from public;
grant execute on function public.join_game_session(text, text) to authenticated;

-- Quota IA partagé entre toutes les instances de l'application. La table est
-- volontairement inaccessible directement : seule la fonction contrôlée écrit.
create table if not exists public.ai_question_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  request_count int not null default 0 check (request_count >= 0)
);

alter table public.ai_question_usage enable row level security;

create or replace function public.consume_ai_question_quota(
  p_limit int default 3,
  p_window_minutes int default 10
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  updated_count int;
begin
  if current_user_id is null then
    return false;
  end if;

  insert into public.ai_question_usage (user_id, window_started_at, request_count)
  values (current_user_id, now(), 1)
  on conflict (user_id) do update
    set window_started_at = case
          when ai_question_usage.window_started_at + make_interval(mins => p_window_minutes) <= now()
            then now()
          else ai_question_usage.window_started_at
        end,
        request_count = case
          when ai_question_usage.window_started_at + make_interval(mins => p_window_minutes) <= now()
            then 1
          else ai_question_usage.request_count + 1
        end
  returning request_count into updated_count;

  return updated_count <= greatest(1, p_limit);
end;
$$;

revoke all on table public.ai_question_usage from anon, authenticated;
revoke all on function public.consume_ai_question_quota(int, int) from public;
grant execute on function public.consume_ai_question_quota(int, int) to authenticated;
