-- ============================================================
-- FREE PARTY — Fix rejoindre : lookup des salons en lobby
-- Sans cette policy, un joueur ne peut PAS chercher un salon par
-- code (la policy membre l'exige avant d'avoir rejoint).
-- Exposé : uniquement les salons en phase lobby (l'essentiel pour
-- rejoindre) — jamais les parties en cours ou finies.
-- ============================================================

create policy "game_sessions_join_lookup"
  on public.game_sessions for select
  to authenticated
  using (phase = 'lobby');
