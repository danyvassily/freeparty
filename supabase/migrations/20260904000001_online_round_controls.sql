-- JOUXTA — manches persistantes et buzzer en ligne atomique

alter table public.game_sessions
  add column if not exists buzzer_player_id uuid references public.game_players(id) on delete set null;

create or replace function public.reset_online_round(
  p_session_id uuid,
  p_mode text default null
)
returns public.game_sessions
language plpgsql
security definer
set search_path = public
as $$
declare target public.game_sessions%rowtype;
begin
  select * into target from public.game_sessions where id = p_session_id for update;
  if not found then raise exception 'room_not_found'; end if;
  if target.host_id <> auth.uid() then raise exception 'not_room_host'; end if;
  if p_mode is not null and p_mode not in ('classic', 'rapidfire', 'truefalse', 'teambattle', 'prism') then
    raise exception 'invalid_game_mode';
  end if;

  delete from public.room_answers where session_id = p_session_id;
  update public.game_players set score = 0 where session_id = p_session_id;
  update public.game_sessions
    set phase = 'lobby',
        mode = coalesce(nullif(p_mode, ''), mode),
        question_index = -1,
        current_question = null,
        answers_revealed = false,
        buzzer_player_id = null,
        state_version = state_version + 1
    where id = p_session_id
    returning * into target;
  return target;
end;
$$;

create or replace function public.claim_room_buzzer(
  p_session_id uuid,
  p_player_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare target public.game_sessions%rowtype;
begin
  select * into target from public.game_sessions where id = p_session_id for update;
  if not found or target.phase <> 'playing' or target.answers_revealed or target.mode <> 'prism' then return false; end if;
  if not exists (
    select 1 from public.game_players
    where id = p_player_id and session_id = p_session_id and user_id = auth.uid()
  ) then raise exception 'not_room_player'; end if;
  if target.buzzer_player_id is not null then return target.buzzer_player_id = p_player_id; end if;

  update public.game_sessions
    set buzzer_player_id = p_player_id, state_version = state_version + 1
    where id = p_session_id;
  return true;
end;
$$;

create or replace function public.submit_room_buzzer_answer(
  p_session_id uuid,
  p_player_id uuid,
  p_question_index integer,
  p_answer_index integer,
  p_response_time_ms integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.game_sessions%rowtype;
  inserted_count integer;
begin
  if p_answer_index < 0 or p_answer_index > 3 then raise exception 'invalid_answer'; end if;
  select * into target from public.game_sessions where id = p_session_id for update;
  if not found or target.buzzer_player_id <> p_player_id or target.question_index <> p_question_index then return false; end if;
  if not exists (
    select 1 from public.game_players
    where id = p_player_id and session_id = p_session_id and user_id = auth.uid()
  ) then raise exception 'not_room_player'; end if;

  insert into public.room_answers (session_id, player_id, question_index, answer_index, response_time_ms)
  values (p_session_id, p_player_id, p_question_index, p_answer_index, greatest(0, p_response_time_ms))
  on conflict (session_id, player_id, question_index) do nothing;
  get diagnostics inserted_count = row_count;
  return inserted_count = 1;
end;
$$;

revoke all on function public.reset_online_round(uuid, text) from public;
revoke all on function public.claim_room_buzzer(uuid, uuid) from public;
revoke all on function public.submit_room_buzzer_answer(uuid, uuid, integer, integer, integer) from public;
grant execute on function public.reset_online_round(uuid, text) to authenticated;
grant execute on function public.claim_room_buzzer(uuid, uuid) to authenticated;
grant execute on function public.submit_room_buzzer_answer(uuid, uuid, integer, integer, integer) to authenticated;
