-- ====================================================================
-- FREE PARTY — Anti-Repetition Engine & Persistent Social Multiplayer
-- 1. Anti-Repetition: PlayerProfile, PlayerDevice, QuestionFamily, QuestionSeen, QuestionReservation
-- 2. Persistent Social: Lobby, LobbyMember, UserPresence, Friendship, LobbyInvitation, LobbyJoinRequest, Party
-- ====================================================================

-- ---------- 1. Identité Joueur & Appareil ----------

create table if not exists public.player_profiles (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  is_anonymous boolean not null default true,
  nickname text not null default 'Joueur',
  avatar_color int not null default 0,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_devices (
  id text primary key,
  profile_id text not null references public.player_profiles(id) on delete cascade,
  device_token text not null unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- ---------- 2. Modèle QuestionFamily & Anti-Répétition ----------

-- Famille de connaissances (une connaissance unique = une famille)
create table if not exists public.question_families (
  id text primary key,
  knowledge_key text not null unique,
  category text not null,
  topic text not null default '',
  subcategory text,
  usage_count int not null default 0,
  created_at timestamptz not null default now()
);

-- question_families existe déjà dans le schéma initial. CREATE TABLE IF NOT
-- EXISTS n'ajoute pas les nouvelles colonnes : la migration doit les enrichir
-- explicitement avant de créer ses index et ses historiques.
alter table public.question_families
  add column if not exists knowledge_key text,
  add column if not exists category text,
  add column if not exists topic text not null default '',
  add column if not exists subcategory text,
  add column if not exists usage_count int not null default 0;

update public.question_families
set knowledge_key = id
where knowledge_key is null;

alter table public.question_families
  alter column knowledge_key set not null;

-- Table centrale des questions vues par profil
create table if not exists public.question_seen (
  id text primary key,
  profile_id text not null references public.player_profiles(id) on delete cascade,
  family_id text not null references public.question_families(id) on delete cascade,
  question_id text not null,
  session_id text,
  first_seen_at timestamptz not null default now(),
  answered_at timestamptz,
  correct boolean,
  unique (profile_id, family_id)
);

-- Réservations temporaires anti-collision concurrentielle
create table if not exists public.question_reservations (
  id text primary key,
  session_id text not null,
  profile_id text not null references public.player_profiles(id) on delete cascade,
  family_id text not null references public.question_families(id) on delete cascade,
  question_id text not null,
  expires_at bigint not null -- timestamp ms
);

-- ---------- 3. Salons Persistants (Lobbies) ----------

create table if not exists public.lobbies (
  id text primary key,
  code text not null unique,
  owner_profile_id text not null references public.player_profiles(id) on delete cascade,
  status text not null default 'WAITING' check (status in ('WAITING','CONFIGURING','STARTING','IN_GAME','POST_GAME','CLOSED')),
  current_game_session_id text,
  selected_game_mode text default 'classic',
  visibility text not null default 'friends' check (visibility in ('public','friends','private')),
  category text default 'mixed',
  question_count int not null default 10,
  max_players int not null default 8,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.lobby_members (
  id text primary key,
  lobby_id text not null references public.lobbies(id) on delete cascade,
  profile_id text not null references public.player_profiles(id) on delete cascade,
  role text not null default 'MEMBER' check (role in ('OWNER','MEMBER','MODERATOR')),
  status text not null default 'CONNECTED' check (status in ('CONNECTED','DISCONNECTED','LEFT','KICKED')),
  participation_status text not null default 'PLAYING' check (participation_status in ('PLAYING','SPECTATING','SITTING_OUT')),
  ready boolean not null default false,
  nickname text not null default 'Joueur',
  avatar_color int not null default 0,
  avatar_url text,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  last_seen_at timestamptz not null default now(),
  unique (lobby_id, profile_id)
);

-- ---------- 4. Sessions de Jeu (GameSessions sous Lobby) ----------

-- Adaptation de game_sessions pour lier à lobby_id si absent
alter table public.game_sessions
  add column if not exists lobby_id text references public.lobbies(id) on delete set null;

create table if not exists public.game_session_participants (
  game_session_id text not null,
  profile_id text not null references public.player_profiles(id) on delete cascade,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','DISCONNECTED','LEFT')),
  score int not null default 0,
  nickname text,
  joined_at timestamptz not null default now(),
  finished_at timestamptz,
  primary key (game_session_id, profile_id)
);

-- ---------- 5. Présence Temps Réel & Système Social ----------

create table if not exists public.user_presences (
  profile_id text primary key references public.player_profiles(id) on delete cascade,
  nickname text not null default 'Joueur',
  status text not null default 'ONLINE' check (status in ('ONLINE','IN_LOBBY','IN_GAME','AWAY','OFFLINE')),
  current_lobby_id text references public.lobbies(id) on delete set null,
  current_game_session_id text,
  last_seen_at timestamptz not null default now()
);

create table if not exists public.friendships (
  id text primary key,
  requester_profile_id text not null references public.player_profiles(id) on delete cascade,
  receiver_profile_id text not null references public.player_profiles(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING','ACCEPTED','DECLINED','BLOCKED')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (requester_profile_id, receiver_profile_id)
);

create table if not exists public.lobby_invitations (
  id text primary key,
  lobby_id text not null references public.lobbies(id) on delete cascade,
  sender_profile_id text not null references public.player_profiles(id) on delete cascade,
  receiver_profile_id text not null references public.player_profiles(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING','ACCEPTED','DECLINED','EXPIRED','CANCELLED')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz
);

create table if not exists public.lobby_join_requests (
  id text primary key,
  lobby_id text not null references public.lobbies(id) on delete cascade,
  requester_profile_id text not null references public.player_profiles(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING','ACCEPTED','DECLINED','EXPIRED')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ---------- 6. Groupes Permanents (Party) ----------

create table if not exists public.parties (
  id text primary key,
  leader_profile_id text not null references public.player_profiles(id) on delete cascade,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','DISBANDED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.party_members (
  party_id text not null references public.parties(id) on delete cascade,
  profile_id text not null references public.player_profiles(id) on delete cascade,
  role text not null default 'MEMBER' check (role in ('LEADER','MEMBER')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','LEFT')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (party_id, profile_id)
);

-- ---------- 7. Index de Performance (Spec §28 & §64) ----------

create index if not exists idx_player_devices_token on public.player_devices (device_token);
create index if not exists idx_question_seen_prof_fam on public.question_seen (profile_id, family_id);
create index if not exists idx_question_seen_first_seen on public.question_seen (first_seen_at desc);
create index if not exists idx_question_families_kkey on public.question_families (knowledge_key);
create index if not exists idx_question_reservations_lookup on public.question_reservations (profile_id, family_id);
create index if not exists idx_question_reservations_expires on public.question_reservations (expires_at);

create index if not exists idx_lobbies_code on public.lobbies (code);
create index if not exists idx_lobbies_status on public.lobbies (status);
create index if not exists idx_lobby_members_prof_status on public.lobby_members (profile_id, status);
create index if not exists idx_lobby_members_lobby_status on public.lobby_members (lobby_id, status);
create index if not exists idx_game_sess_parts_session on public.game_session_participants (game_session_id);

create index if not exists idx_friendships_requester on public.friendships (requester_profile_id);
create index if not exists idx_friendships_receiver on public.friendships (receiver_profile_id);
create index if not exists idx_lobby_invites_rec_status on public.lobby_invitations (receiver_profile_id, status);
create index if not exists idx_lobby_join_req_lobby_status on public.lobby_join_requests (lobby_id, status);
create index if not exists idx_user_presences_last_seen on public.user_presences (last_seen_at desc);
create index if not exists idx_party_members_prof_status on public.party_members (profile_id, status);

-- ---------- 8. Row Level Security (RLS) ----------

alter table public.player_profiles enable row level security;
alter table public.player_devices enable row level security;
alter table public.question_families enable row level security;
alter table public.question_seen enable row level security;
alter table public.question_reservations enable row level security;
alter table public.lobbies enable row level security;
alter table public.lobby_members enable row level security;
alter table public.game_session_participants enable row level security;
alter table public.user_presences enable row level security;
alter table public.friendships enable row level security;
alter table public.lobby_invitations enable row level security;
alter table public.lobby_join_requests enable row level security;
alter table public.parties enable row level security;
alter table public.party_members enable row level security;

-- Policies de lecture publique / authentifiée sur le catalogue de familles
create policy "question_families_read_all"
  on public.question_families for select
  to public
  using (true);

-- Profils : lecture publique (nécessaire pour voir pseudos et avatars des autres joueurs)
create policy "player_profiles_read_all"
  on public.player_profiles for select
  to public
  using (true);

create policy "player_profiles_insert_all"
  on public.player_profiles for insert
  to public
  with check (true);

create policy "player_profiles_update_self"
  on public.player_profiles for update
  to public
  using (true)
  with check (true);

-- Lobbies & Members : accès pour les participants du salon
create policy "lobbies_read_all"
  on public.lobbies for select
  to public
  using (true);

create policy "lobbies_insert_all"
  on public.lobbies for insert
  to public
  with check (true);

create policy "lobbies_update_all"
  on public.lobbies for update
  to public
  using (true)
  with check (true);

create policy "lobby_members_read_all"
  on public.lobby_members for select
  to public
  using (true);

create policy "lobby_members_insert_all"
  on public.lobby_members for insert
  to public
  with check (true);

create policy "lobby_members_update_all"
  on public.lobby_members for update
  to public
  using (true)
  with check (true);

create policy "lobby_members_delete_all"
  on public.lobby_members for delete
  to public
  using (true);

-- Présences : lecture et mise à jour
create policy "user_presences_read_all"
  on public.user_presences for select
  to public
  using (true);

create policy "user_presences_write_all"
  on public.user_presences for insert
  to public
  with check (true);

create policy "user_presences_update_all"
  on public.user_presences for update
  to public
  using (true)
  with check (true);

-- Question Seen : lecture et insertion
create policy "question_seen_read_all"
  on public.question_seen for select
  to public
  using (true);

create policy "question_seen_insert_all"
  on public.question_seen for insert
  to public
  with check (true);

create policy "question_seen_update_all"
  on public.question_seen for update
  to public
  using (true)
  with check (true);
