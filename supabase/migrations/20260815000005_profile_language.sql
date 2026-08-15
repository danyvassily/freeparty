-- ============================================================
-- FREE PARTY — Profile language (choix de langue sauvegardé)
-- ============================================================

alter table public.profiles
  add column if not exists language text not null default 'fr'
    check (language in ('fr','en','es','de','it','pt'));
