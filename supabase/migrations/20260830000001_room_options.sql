-- ============================================================
-- FREE PARTY — Options de salon : nombre max de joueurs
-- + capacité vérifiée côté base dans can_join_session.
-- ============================================================

alter table public.game_sessions
  add column if not exists max_players int not null default 8;

-- can_join_session : lobby + host présent + salon non complet
create or replace function public.can_join_session(s uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1 from public.game_sessions gs
    where gs.id = s
      and gs.phase = 'lobby'
      and gs.host_id is not null
      and (
        select count(*) from public.game_players gp
        where gp.session_id = s
      ) < gs.max_players
  );
end;
$$;

revoke all on function public.can_join_session(uuid) from public;
grant execute on function public.can_join_session(uuid) to authenticated;
