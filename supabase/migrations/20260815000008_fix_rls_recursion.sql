-- ============================================================
-- FREE PARTY — Fix récursion RLS : is_session_member
-- La version security invoker requêtait game_sessions depuis une
-- policy de game_sessions → stack depth limit exceeded.
-- Version security definer avec check auth.uid() explicite
-- (pattern recommandé : jamais de SECURITY DEFINER sans check d'identité).
-- ============================================================

create or replace function public.is_session_member(s uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  -- Le membre est un joueur de la session (identité vérifiée)
  if exists (
    select 1 from public.game_players gp
    where gp.session_id = s and gp.user_id = auth.uid()
  ) then
    return true;
  end if;
  -- … ou le host de la session
  if exists (
    select 1 from public.game_sessions gs
    where gs.id = s and gs.host_id = auth.uid()
  ) then
    return true;
  end if;
  return false;
end;
$$;

revoke all on function public.is_session_member(uuid) from public;
grant execute on function public.is_session_member(uuid) to authenticated, anon;
