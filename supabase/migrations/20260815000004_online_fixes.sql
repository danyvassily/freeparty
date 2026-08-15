-- ============================================================
-- FREE PARTY — Online rooms fixes (spec produit : multijoueur)
-- Colonnes de configuration du salon + fonction de score host-safe.
-- ============================================================

alter table public.game_sessions
  add column if not exists mode text,
  add column if not exists category text,
  add column if not exists question_count int not null default 10;

-- Fonction de score appelée par le host : vérifie que l'appelant EST le
-- host du salon (garde-fou même en SECURITY DEFINER — skill supabase).
create or replace function public.increment_player_score(p_player_id uuid, p_points int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.game_players gp
    join public.game_sessions gs on gs.id = gp.session_id
    where gp.id = p_player_id and gs.host_id = auth.uid()
  ) then
    update public.game_players set score = score + p_points where id = p_player_id;
  end if;
end;
$$;

revoke all on function public.increment_player_score(uuid, int) from public;
grant execute on function public.increment_player_score(uuid, int) to authenticated;
