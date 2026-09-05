-- Classement ELO persistant, une seule attribution par profil et par partie.
alter table public.player_profiles
  add column if not exists elo_rating int not null default 1000,
  add column if not exists elo_games_played int not null default 0;

create table if not exists public.elo_game_results (
  session_id uuid not null,
  profile_id text not null references public.player_profiles(id) on delete cascade,
  score numeric not null,
  opponent_average numeric not null,
  rating_before int not null,
  rating_after int not null,
  created_at timestamptz not null default now(),
  primary key (session_id, profile_id)
);

alter table public.elo_game_results enable row level security;
create policy "elo_results_read_own" on public.elo_game_results
  for select using (profile_id in (select id from public.player_profiles where user_id = auth.uid()));

create or replace function public.record_elo_result(
  p_session_id uuid,
  p_profile_id text,
  p_score numeric,
  p_opponent_average numeric
) returns int
language plpgsql security definer set search_path = public
as $$
declare
  current_rating int;
  new_rating int;
  affected int;
begin
  if not exists (select 1 from player_profiles where id = p_profile_id and user_id = auth.uid()) then
    raise exception 'profile_not_owned';
  end if;
  select elo_rating into current_rating from player_profiles where id = p_profile_id for update;
  new_rating := greatest(100, round(current_rating + 32 * (p_score - (1 / (1 + power(10, (p_opponent_average - current_rating) / 400))))));
  insert into elo_game_results(session_id, profile_id, score, opponent_average, rating_before, rating_after)
  values (p_session_id, p_profile_id, p_score, p_opponent_average, current_rating, new_rating)
  on conflict (session_id, profile_id) do nothing;
  get diagnostics affected = row_count;
  if affected = 0 then return current_rating; end if;
  update player_profiles set elo_rating = new_rating, elo_games_played = elo_games_played + 1, updated_at = now() where id = p_profile_id;
  return new_rating;
end;
$$;
revoke all on function public.record_elo_result(uuid, text, numeric, numeric) from public;
grant execute on function public.record_elo_result(uuid, text, numeric, numeric) to authenticated;
