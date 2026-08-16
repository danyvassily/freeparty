-- ============================================================
-- PRISM / Free Party — Schema Extension (spec §2–§15, §28)
--
-- Ajout des structures de données pour le mode PRISM :
-- 1. Profils : spécialité, ligue, points de saison, statistiques
-- 2. Parties & Salons : mode 'prism', durée express/classique, finale La Ligne, buzzer
-- 3. Joueurs : spécialité, statut finaliste/éliminé/spectateur
-- 4. Questions : mode de saisie (mcq/typed), indices progressifs, œuvres d'art (CC0)
-- 5. Catalogue d'art & Saisons
-- ============================================================

-- ---------- 1. Profils ----------
alter table public.profiles
  add column if not exists specialty text not null default 'cinema',
  add column if not exists league text not null default 'bronze',
  add column if not exists season_points int not null default 0,
  add column if not exists wins int not null default 0,
  add column if not exists finals_reached int not null default 0,
  add column if not exists losses int not null default 0,
  add column if not exists current_streak int not null default 0,
  add column if not exists best_streak int not null default 0;

-- ---------- 2. Mode 'prism' sur games ----------
alter table public.games drop constraint if exists games_mode_check;
alter table public.games add constraint games_mode_check
  check (mode in ('prism','classic','truefalse','rapidfire','timeline','teambattle','wyr','guess','debate'));

-- ---------- 3. Game Sessions : PRISM & La Ligne ----------
alter table public.game_sessions
  add column if not exists duration text not null default 'express' check (duration in ('express','classic')),
  add column if not exists thematic_category text,
  add column if not exists line_position int not null default 5 check (line_position between 0 and 10),
  add column if not exists line_double boolean not null default false,
  add column if not exists finalist1_id uuid,
  add column if not exists finalist2_id uuid,
  add column if not exists buzzer_locked_by uuid,
  add column if not exists buzzer_lockouts jsonb not null default '[]'::jsonb;

-- ---------- 4. Game Players : Spécialités & Statuts ----------
alter table public.game_players
  add column if not exists specialty text not null default 'cinema',
  add column if not exists is_finalist boolean not null default false,
  add column if not exists is_eliminated boolean not null default false,
  add column if not exists is_spectator boolean not null default false,
  add column if not exists steals_count int not null default 0,
  add column if not exists fast_bonus_total int not null default 0;

-- ---------- 5. Questions : Modalités & Artworks ----------
alter table public.questions
  add column if not exists input_mode text not null default 'mcq' check (input_mode in ('mcq','typed')),
  add column if not exists accepted_typed_answers jsonb,
  add column if not exists progressive_clues jsonb,
  add column if not exists artwork jsonb;

-- ---------- 6. Catalogue d'Art & Musées ----------
create table if not exists public.artwork_catalog (
  id text primary key,
  title text not null,
  artist text not null,
  artist_birth int,
  artist_death int,
  year_start int,
  year_end int,
  movement text,
  country text,
  museum text,
  image_url text not null,
  image_license text not null default 'Public Domain / CC0',
  source_url text,
  created_at timestamptz not null default now()
);

alter table public.artwork_catalog enable row level security;
create policy "artwork_catalog_read_all"
  on public.artwork_catalog for select
  to anon, authenticated
  using (true);

-- ---------- 7. Saisons (Cycles de 2 mois) ----------
create table if not exists public.seasons (
  id serial primary key,
  season_number int not null unique,
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.seasons enable row level security;
create policy "seasons_read_all"
  on public.seasons for select
  to anon, authenticated
  using (true);
