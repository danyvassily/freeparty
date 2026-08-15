-- ============================================================
-- FREE PARTY — Fix rejoindre : can_join_session (security definer)
-- Le EXISTS inline dans la policy était soumis à la RLS de
-- game_sessions → le 2e joueur ne pouvait jamais rejoindre.
-- Fonction definer avec check phase lobby + host, appelable par
-- les authenticated uniquement.
-- ============================================================

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
    where gs.id = s and gs.phase = 'lobby' and gs.host_id is not null
  );
end;
$$;

revoke all on function public.can_join_session(uuid) from public;
grant execute on function public.can_join_session(uuid) to authenticated;

drop policy if exists "game_players_join" on public.game_players;
create policy "game_players_join"
  on public.game_players for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and public.can_join_session(session_id)
  );
