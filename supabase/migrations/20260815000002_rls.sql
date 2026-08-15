-- ============================================================
-- FREE PARTY — Row Level Security (spec §15, §89)
-- DENY BY DEFAULT : aucune table n'est lisible par défaut.
-- Policies minimales : contenu public en lecture seule,
-- utilisateurs authentifiés sur leurs propres données.
-- ============================================================

-- ---------- Activer RLS partout ----------
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_players enable row level security;
alter table public.scores enable row level security;
alter table public.question_concepts enable row level security;
alter table public.question_families enable row level security;
alter table public.question_categories enable row level security;
alter table public.question_sources enable row level security;
alter table public.questions enable row level security;
alter table public.question_translations enable row level security;
alter table public.question_history enable row level security;
alter table public.question_statistics enable row level security;
alter table public.question_reports enable row level security;
alter table public.debate_topics enable row level security;
alter table public.debate_prompts enable row level security;
alter table public.debates enable row level security;
alter table public.debate_sessions enable row level security;
alter table public.debate_turns enable row level security;
alter table public.debate_votes enable row level security;

-- ---------- Contenu public : LECTURE SEULE ----------
-- Questions vérifiées et familles/catégories/sources associées
create policy "questions_public_read"
  on public.questions for select
  to anon, authenticated
  using (state = 'verified' and verification_status = 'verified');

create policy "question_concepts_public_read"
  on public.question_concepts for select
  to anon, authenticated
  using (true);

create policy "question_families_public_read"
  on public.question_families for select
  to anon, authenticated
  using (true);

create policy "question_categories_public_read"
  on public.question_categories for select
  to anon, authenticated
  using (true);

create policy "question_sources_public_read"
  on public.question_sources for select
  to anon, authenticated
  using (enabled = true);

-- Prompts de débat vérifiés
create policy "debate_prompts_public_read"
  on public.debate_prompts for select
  to anon, authenticated
  using (state = 'verified');

create policy "debate_topics_public_read"
  on public.debate_topics for select
  to anon, authenticated
  using (true);

-- Statistiques agrégées (utiles pour l'UI)
create policy "question_statistics_public_read"
  on public.question_statistics for select
  to anon, authenticated
  using (true);

-- ---------- Profils ----------
create policy "profiles_public_read"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "profiles_self_update"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "profiles_self_insert"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- ---------- Historique & rapports : l'utilisateur et lui seul ----------
create policy "qhistory_self_read"
  on public.question_history for select
  to authenticated
  using (user_id = (select auth.uid()) or user_id is null);

create policy "qhistory_self_insert"
  on public.question_history for insert
  to authenticated
  with check (user_id = (select auth.uid()) or user_id is null);

create policy "qreports_insert"
  on public.question_reports for insert
  to authenticated
  with check (user_id = (select auth.uid()) or user_id is null);

create policy "qreports_self_read"
  on public.question_reports for select
  to authenticated
  using (user_id = (select auth.uid()) or user_id is null);

-- ---------- Parties : participants uniquement ----------
create policy "games_member_read"
  on public.games for select
  to authenticated
  using (created_by = (select auth.uid()));

create policy "games_member_insert"
  on public.games for insert
  to authenticated
  with check (created_by = (select auth.uid()));

create policy "game_sessions_member_read"
  on public.game_sessions for select
  to authenticated
  using (
    game_id in (
      select g.id from public.games g
      where g.created_by = (select auth.uid())
    )
  );

create policy "game_players_member_read"
  on public.game_players for select
  to authenticated
  using (
    session_id in (
      select s.id from public.game_sessions s
      join public.games g on g.id = s.game_id
      where g.created_by = (select auth.uid())
    )
  );

create policy "scores_member_read"
  on public.scores for select
  to authenticated
  using (
    session_id in (
      select s.id from public.game_sessions s
      join public.games g on g.id = s.game_id
      where g.created_by = (select auth.uid())
    )
  );

-- ---------- Débats : participants ----------
create policy "debates_member_read"
  on public.debates for select
  to authenticated
  using (created_by = (select auth.uid()));

create policy "debates_member_insert"
  on public.debates for insert
  to authenticated
  with check (created_by = (select auth.uid()));

create policy "debate_sessions_member_read"
  on public.debate_sessions for select
  to authenticated
  using (
    debate_id in (
      select d.id from public.debates d
      where d.created_by = (select auth.uid())
    )
  );

create policy "debate_turns_member_read"
  on public.debate_turns for select
  to authenticated
  using (
    session_id in (
      select s.id from public.debate_sessions s
      join public.debates d on d.id = s.debate_id
      where d.created_by = (select auth.uid())
    )
  );

create policy "debate_votes_member_read"
  on public.debate_votes for select
  to authenticated
  using (
    session_id in (
      select s.id from public.debate_sessions s
      join public.debates d on d.id = s.debate_id
      where d.created_by = (select auth.uid())
    )
  );

-- NB : les INSERT sur sessions/players/turns/votes sont volontairement
-- NON ouverts ici : les parties sont local-first (spec §27). Quand la
-- persistance multi-joueurs sera activée, ajouter des policies de
-- participation explicites (codes de partie) avec WITH CHECK strict.
