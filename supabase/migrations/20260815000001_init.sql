-- ============================================================
-- FREE PARTY — Initial schema (spec §13–§15, §89)
-- DENY BY DEFAULT : RLS activée sur TOUTES les tables.
-- Seules les lectures de contenu public (questions verified,
-- prompts de débat) sont ouvertes à anon, en lecture seule.
-- ============================================================

-- ---------- Profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null default 'Joueur',
  avatar_color int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- Games ----------
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('classic','truefalse','rapidfire','timeline','teambattle','wyr','guess','debate')),
  category text,
  difficulty text,
  status text not null default 'created' check (status in ('created','active','finished','aborted')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  status text not null default 'setup' check (status in ('setup','active','finished')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.game_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  guest_name text,
  team text check (team in ('A','B')),
  score int not null default 0,
  created_at timestamptz not null default now(),
  check (user_id is not null or guest_name is not null)
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  player_id uuid not null references public.game_players(id) on delete cascade,
  round int not null default 1,
  points int not null default 0,
  answered_correctly boolean not null default false,
  response_time_ms int,
  created_at timestamptz not null default now()
);

-- ---------- Questions ----------
create table if not exists public.question_concepts (
  id text primary key, -- fact-id stable
  label text,
  created_at timestamptz not null default now()
);

create table if not exists public.question_families (
  id text primary key, -- family slug (ex: capital-spain)
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.question_categories (
  id text primary key, -- slug
  label_fr text not null,
  parent text references public.question_categories(id)
);

create table if not exists public.question_sources (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  url text,
  license text not null default 'CC0',
  commercial_use boolean not null default false,
  attribution_required boolean not null default false,
  enabled boolean not null default true,
  last_license_check date,
  last_ingestion timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, url)
);

create table if not exists public.questions (
  id text primary key,
  concept_id text references public.question_concepts(id) on delete set null,
  family_id text references public.question_families(id) on delete set null,
  type text not null default 'mcq' check (type in ('mcq','truefalse')),
  question text not null,
  answers jsonb not null,
  correct_answer int not null check (correct_answer between 0 and 3),
  category text not null,
  subcategory text not null default '',
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard','expert')),
  language text not null default 'fr' check (language in ('fr','en','es','de','it','pt')),
  tags text[] not null default '{}',
  source_provider text,
  source_id text,
  source_url text,
  source_license text default 'CC0',
  verification_status text not null default 'unverified' check (verification_status in ('verified','unverified','disputed')),
  verified_at date,
  confidence numeric(4,3) not null default 0.9 check (confidence between 0 and 1),
  quality_score numeric(4,3) not null default 0.9 check (quality_score between 0 and 1),
  state text not null default 'review' check (state in ('draft','review','verified','quarantined','rejected','expired')),
  version int not null default 1,
  explanation text,
  as_of date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_translations (
  id uuid primary key default gen_random_uuid(),
  question_id text not null references public.questions(id) on delete cascade,
  language text not null check (language in ('fr','en','es','de','it','pt')),
  question text not null,
  answers jsonb not null,
  correct_answer int not null,
  created_at timestamptz not null default now(),
  unique (question_id, language)
);

create table if not exists public.question_history (
  id uuid primary key default gen_random_uuid(),
  question_id text not null references public.questions(id) on delete cascade,
  family_id text,
  game_id uuid references public.games(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  group_id text,
  served_at timestamptz not null default now(),
  answered_correctly boolean not null default false,
  response_time_ms int
);

create table if not exists public.question_statistics (
  question_id text primary key references public.questions(id) on delete cascade,
  times_served int not null default 0,
  correct_answers int not null default 0,
  wrong_answers int not null default 0,
  average_response_time_ms numeric(10,2) not null default 0,
  report_count int not null default 0,
  last_served_at timestamptz
);

create table if not exists public.question_reports (
  id uuid primary key default gen_random_uuid(),
  question_id text not null references public.questions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  reason text not null check (reason in ('reponse-incorrecte','question-ambigue','question-obsolete','faute','mauvaise-categorie','contenu-inapproprie','autre')),
  details text,
  created_at timestamptz not null default now(),
  status text not null default 'open' check (status in ('open','reviewed','dismissed'))
);

-- ---------- Debates ----------
create table if not exists public.debate_topics (
  id text primary key,
  label_fr text not null
);

create table if not exists public.debate_prompts (
  id text primary key,
  category text not null check (category in ('politics','philosophy','history','ethics','current-issues')),
  topic text not null,
  prompt text not null,
  context text not null,
  perspectives jsonb not null,
  follow_ups jsonb not null default '[]',
  sources jsonb not null default '[]',
  difficulty text not null default 'intermediate' check (difficulty in ('accessible','intermediate','deep','expert')),
  sensitivity text not null default 'medium' check (sensitivity in ('low','medium','high')),
  assigned_positions jsonb,
  last_verified_at date,
  valid_until date,
  jurisdiction text,
  language text not null default 'fr',
  state text not null default 'review' check (state in ('draft','review','verified','quarantined','rejected','expired')),
  version int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.debates (
  id uuid primary key default gen_random_uuid(),
  prompt_id text references public.debate_prompts(id) on delete set null,
  mode text not null default 'standard' check (mode in ('standard','change-my-mind','devils-advocate','ethical-dilemma')),
  status text not null default 'created' check (status in ('created','active','finished')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.debate_sessions (
  id uuid primary key default gen_random_uuid(),
  debate_id uuid not null references public.debates(id) on delete cascade,
  duration_seconds int not null default 300,
  preparation_seconds int not null default 30,
  status text not null default 'setup' check (status in ('setup','active','finished')),
  started_at timestamptz,
  ended_at timestamptz
);

create table if not exists public.debate_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.debate_sessions(id) on delete cascade,
  player_id uuid references public.game_players(id) on delete cascade,
  phase text not null check (phase in ('reflection','speech','rebuttal')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_ms int
);

create table if not exists public.debate_votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.debate_sessions(id) on delete cascade,
  player_id uuid references public.game_players(id) on delete cascade,
  position text not null check (position in ('pour','contre','nuance','indecis')),
  vote_round text not null check (vote_round in ('before','after')),
  created_at timestamptz not null default now(),
  unique (session_id, player_id, vote_round)
);

-- ---------- Indexes ----------
create index if not exists idx_questions_state_lang on public.questions (state, language);
create index if not exists idx_questions_category on public.questions (category);
create index if not exists idx_questions_difficulty on public.questions (difficulty);
create index if not exists idx_questions_family on public.questions (family_id);
create index if not exists idx_questions_source on public.questions (source_provider);
create index if not exists idx_qhistory_question on public.question_history (question_id);
create index if not exists idx_qhistory_user on public.question_history (user_id);
create index if not exists idx_qhistory_served on public.question_history (served_at desc);
create index if not exists idx_qreports_question on public.question_reports (question_id);
create index if not exists idx_debate_prompts_cat on public.debate_prompts (category, language, state);
create index if not exists idx_debate_turns_session on public.debate_turns (session_id);
create index if not exists idx_debate_votes_session on public.debate_votes (session_id);
create index if not exists idx_scores_session on public.scores (session_id);
create index if not exists idx_game_players_session on public.game_players (session_id);
