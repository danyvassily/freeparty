-- ============================================================
-- JOUXTA — Anti-répétition par connaissance
-- Profils appareil/compte, familles canoniques, exposition au moment de
-- l'affichage et réservations transactionnelles.
-- ============================================================

create extension if not exists pgcrypto;

alter table public.question_families
  add column if not exists knowledge_key text,
  add column if not exists category text,
  add column if not exists topic text,
  add column if not exists subcategory text,
  add column if not exists usage_count bigint not null default 0,
  add column if not exists needs_family_review boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

update public.question_families
set knowledge_key = id
where knowledge_key is null;

alter table public.question_families
  alter column knowledge_key set not null;

create unique index if not exists idx_question_families_knowledge_key
  on public.question_families (knowledge_key);

alter table public.questions
  add column if not exists active boolean not null default true,
  add column if not exists usage_count bigint not null default 0,
  add column if not exists content_hash text,
  add column if not exists needs_family_review boolean not null default false;

-- Une question historique sans famille conserve sa propre famille : aucune
-- association hasardeuse n'est réalisée pendant la migration.
insert into public.question_families (id, knowledge_key, category, topic, needs_family_review)
select 'legacy.' || q.id, 'legacy.' || q.id, q.category, q.subcategory, true
from public.questions q
where q.family_id is null
on conflict do nothing;

update public.questions
set family_id = 'legacy.' || id,
    needs_family_review = true
where family_id is null;

update public.questions
set content_hash = encode(
  extensions.digest(
    trim(regexp_replace(lower(translate(question,
      'ÀÁÂÃÄÅàáâãäåÇçÈÉÊËèéêëÌÍÎÏìíîïÑñÒÓÔÕÖòóôõöÙÚÛÜùúûüÝŸýÿ',
      'AAAAAAaaaaaaCcEEEEeeeeIIIIiiiiNnOOOOOoooooUUUUuuuuYYyy')),
      '[^a-z0-9]+', ' ', 'g')),
    'sha256'
  ),
  'hex'
)
where content_hash is null;

create index if not exists idx_questions_content_hash on public.questions (content_hash);
create index if not exists idx_questions_active_language_filters
  on public.questions (active, language, category, difficulty, type);

-- Les tables d'identité ont été introduites par la migration sociale avec des
-- identifiants textuels. On enrichit ce schéma sans changer les identifiants
-- existants ni casser les lobbies déjà créés.
alter table public.player_profiles
  add column if not exists archived_at timestamptz;

alter table public.player_devices
  add column if not exists device_token_hash text;

update public.player_devices
set device_token_hash = encode(extensions.digest(device_token, 'sha256'), 'hex')
where device_token_hash is null;

-- Le jeton brut historique est remplacé par une valeur non réversible. Les
-- nouveaux appareils stockent également uniquement cette représentation.
update public.player_devices
set device_token = 'sha256:' || device_token_hash
where device_token <> 'sha256:' || device_token_hash;

alter table public.player_devices
  alter column device_token_hash set not null;

create unique index if not exists idx_player_devices_token_hash
  on public.player_devices (device_token_hash);

alter table public.question_reservations
  add column if not exists created_at timestamptz not null default now();

alter table public.question_reservations
  alter column expires_at type timestamptz
  using to_timestamp(expires_at::double precision / 1000.0);

create unique index if not exists idx_question_reservations_profile_family_unique
  on public.question_reservations (profile_id, family_id);

create table if not exists public.question_exposures (
  session_id text not null,
  family_id text not null references public.question_families(id) on delete cascade,
  question_id text references public.questions(id) on delete set null,
  displayed_at timestamptz not null default now(),
  primary key (session_id, family_id)
);

-- Table de travail transactionnelle. Les lignes sont supprimées avant le
-- commit; elle remplace une table temporaire afin que le linter SQL puisse
-- vérifier entièrement la fonction de sélection.
create table if not exists public.question_selection_work (
  request_id uuid not null,
  ordinal bigint not null,
  question_id text not null,
  family_id text not null,
  payload jsonb not null,
  usage_count bigint not null,
  category text,
  topic text,
  primary key (request_id, family_id)
);

alter table public.game_players
  add column if not exists profile_id text references public.player_profiles(id) on delete set null;

create index if not exists idx_player_devices_profile on public.player_devices (profile_id);
create index if not exists idx_question_seen_profile_family on public.question_seen (profile_id, family_id);
create index if not exists idx_question_seen_family_profile on public.question_seen (family_id, profile_id);
create index if not exists idx_question_reservations_profile_family on public.question_reservations (profile_id, family_id);
create index if not exists idx_question_reservations_expires on public.question_reservations (expires_at);
create index if not exists idx_game_session_participants_profile on public.game_session_participants (profile_id);
create index if not exists idx_game_players_profile on public.game_players (profile_id);

alter table public.player_profiles enable row level security;
alter table public.player_devices enable row level security;
alter table public.question_seen enable row level security;
alter table public.question_reservations enable row level security;
alter table public.game_session_participants enable row level security;
alter table public.question_exposures enable row level security;
alter table public.question_selection_work enable row level security;

create or replace function public.canonical_knowledge_key(p_key text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_key text;
  v_entity text;
begin
  v_key := trim(both '.' from regexp_replace(
    replace(replace(replace(lower(coalesce(p_key, '')),
      'geography', 'geo'), 'countries', 'country'), 'géographie', 'geo'),
    '[^a-z0-9]+', '.', 'g'
  ));
  if v_key ~ '(^|\.)capital(\.|$)' then
    select part into v_entity
    from unnest(string_to_array(v_key, '.')) part
    where part <> all(array['geo', 'country', 'capital'])
    limit 1;
    v_entity := case v_entity
      when 'france' then 'fr' when 'japan' then 'jp' when 'japon' then 'jp'
      when 'spain' then 'es' when 'espagne' then 'es' when 'germany' then 'de'
      when 'allemagne' then 'de' when 'italy' then 'it' when 'italie' then 'it'
      when 'portugal' then 'pt' when 'china' then 'cn' when 'chine' then 'cn'
      when 'australia' then 'au' when 'australie' then 'au'
      when 'brazil' then 'br' when 'bresil' then 'br' else v_entity end;
    if v_entity is not null then return 'geo.country.' || v_entity || '.capital'; end if;
  end if;
  return v_key;
end;
$$;

create or replace function public.resolve_player_profiles(p_device_tokens text[])
returns table (device_token text, profile_id text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
  v_hash text;
  v_profile text;
  v_account_profile text;
  v_user uuid := auth.uid();
  v_is_account boolean := not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
  v_index integer := 0;
begin
  if v_user is null then
    raise exception 'authentication_required';
  end if;
  if coalesce(array_length(p_device_tokens, 1), 0) = 0 or array_length(p_device_tokens, 1) > 8 then
    raise exception 'invalid_device_tokens';
  end if;

  if v_is_account then
    perform pg_advisory_xact_lock(hashtextextended(v_user::text, 1));
    select pp.id into v_account_profile
    from public.player_profiles pp
    where pp.user_id = v_user and pp.archived_at is null
    order by pp.created_at
    limit 1
    for update;
    if v_account_profile is null then
      v_account_profile := 'prof_' || encode(extensions.gen_random_bytes(12), 'hex');
      insert into public.player_profiles (id, user_id, is_anonymous)
      values (v_account_profile, v_user, false);
    else
      update public.player_profiles
      set is_anonymous = false, updated_at = now()
      where id = v_account_profile;
    end if;
  end if;

  foreach v_token in array p_device_tokens loop
    v_index := v_index + 1;
    if length(v_token) < 12 or length(v_token) > 200 then
      raise exception 'invalid_device_token';
    end if;
    v_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');
    select pd.profile_id into v_profile
    from public.player_devices pd
    where pd.device_token_hash = v_hash
    for update;

    if v_profile is null then
      if v_is_account and v_index = 1 then
        v_profile := v_account_profile;
      else
        v_profile := 'prof_' || encode(extensions.gen_random_bytes(12), 'hex');
        insert into public.player_profiles (id, is_anonymous)
        values (v_profile, true);
      end if;
      insert into public.player_devices (id, profile_id, device_token, device_token_hash)
      values (
        'dev_' || encode(extensions.gen_random_bytes(12), 'hex'),
        v_profile,
        'sha256:' || v_hash,
        v_hash
      )
      on conflict (device_token_hash) do update set last_seen_at = now()
      returning player_devices.profile_id into v_profile;
    elsif v_is_account and v_index = 1 and v_profile <> v_account_profile then
      -- Fusion non destructive : l'unicité profile/family réalise l'union.
      insert into public.question_seen
        (id, profile_id, family_id, question_id, session_id, first_seen_at, answered_at, correct)
      select
        'seen_' || encode(extensions.gen_random_bytes(12), 'hex'),
        v_account_profile, qs.family_id, qs.question_id, qs.session_id,
        qs.first_seen_at, qs.answered_at, qs.correct
      from public.question_seen qs
      where qs.profile_id = v_profile
      on conflict on constraint question_seen_profile_id_family_id_key do update
      set first_seen_at = least(question_seen.first_seen_at, excluded.first_seen_at),
          answered_at = coalesce(question_seen.answered_at, excluded.answered_at),
          correct = coalesce(question_seen.correct, excluded.correct);

      delete from public.question_reservations qr where qr.profile_id = v_profile;
      update public.player_devices pd set profile_id = v_account_profile where pd.profile_id = v_profile;
      update public.game_players gp set profile_id = v_account_profile where gp.profile_id = v_profile;
      insert into public.game_session_participants (game_session_id, profile_id)
      select gsp.game_session_id, v_account_profile
      from public.game_session_participants gsp
      where gsp.profile_id = v_profile
      on conflict do nothing;
      delete from public.game_session_participants gsp where gsp.profile_id = v_profile;
      update public.player_profiles pp
      set archived_at = now(), is_anonymous = true, updated_at = now()
      where pp.id = v_profile;
      v_profile := v_account_profile;
    end if;

    update public.player_devices set last_seen_at = now() where device_token_hash = v_hash;
    device_token := v_token;
    profile_id := v_profile;
    return next;
  end loop;
end;
$$;

create or replace function public.attach_game_player_profile(
  p_player_id uuid,
  p_device_token text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile text;
  v_session uuid;
begin
  select resolved.profile_id into v_profile
  from public.resolve_player_profiles(array[p_device_token]) resolved
  limit 1;
  update public.game_players gp
  set profile_id = v_profile
  where gp.id = p_player_id and gp.user_id = auth.uid()
  returning gp.session_id into v_session;
  if v_session is null then raise exception 'player_not_owned'; end if;
  insert into public.game_session_participants (game_session_id, profile_id)
  values (v_session::text, v_profile)
  on conflict do nothing;
  return v_profile;
end;
$$;

create or replace function public.reserve_unseen_questions(
  p_session_id uuid,
  p_device_tokens text[],
  p_online_session_id uuid,
  p_candidates jsonb,
  p_count integer,
  p_local_history jsonb,
  p_ttl_seconds integer default 900
)
returns table (question jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate jsonb;
  v_key text;
  v_family text;
  v_hash text;
  v_existing_family text;
  v_profiles text[];
  v_request_id uuid := gen_random_uuid();
  v_history_group jsonb;
  v_history_entry jsonb;
  v_history_profile text;
  v_history_family text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_count < 1 or p_count > 60 then raise exception 'invalid_count'; end if;
  if jsonb_typeof(p_candidates) <> 'array' or jsonb_array_length(p_candidates) > 4000 then
    raise exception 'invalid_candidates';
  end if;

  select array_agg(distinct resolved.profile_id) into v_profiles
  from public.resolve_player_profiles(p_device_tokens) resolved;

  if p_online_session_id is not null then
    if not exists (
      select 1 from public.game_players gp
      where gp.session_id = p_online_session_id and gp.user_id = auth.uid()
    ) then raise exception 'not_a_session_member'; end if;
    select array_agg(distinct profile) into v_profiles
    from unnest(coalesce(v_profiles, '{}'::text[]) || coalesce((
      select array_agg(gp.profile_id) from public.game_players gp
      where gp.session_id = p_online_session_id and gp.profile_id is not null
    ), '{}'::text[])) profile;
  end if;
  if coalesce(array_length(v_profiles, 1), 0) = 0 then raise exception 'no_player_profile'; end if;

  perform pg_advisory_xact_lock(hashtextextended(array_to_string(v_profiles, ','), 0));
  delete from public.question_reservations
  where profile_id = any(v_profiles) and expires_at <= now();

  for v_candidate in select value from jsonb_array_elements(p_candidates) loop
    if length(coalesce(v_candidate ->> 'id', '')) < 3
       or length(coalesce(v_candidate ->> 'familyId', '')) < 2
       or length(coalesce(v_candidate ->> 'question', '')) < 10 then
      continue;
    end if;
    v_key := public.canonical_knowledge_key(coalesce(v_candidate ->> 'knowledgeKey', v_candidate ->> 'familyId'));
    if length(v_key) < 3 then continue; end if;
    v_family := v_candidate ->> 'familyId';
    select qf.id into v_existing_family from public.question_families qf where qf.knowledge_key = v_key;
    if v_existing_family is not null then
      v_family := v_existing_family;
    else
      insert into public.question_families
        (id, knowledge_key, category, topic, subcategory, needs_family_review)
      values (
        v_family, v_key, v_candidate ->> 'category', v_candidate ->> 'subcategory',
        v_candidate ->> 'subcategory', not (v_candidate ? 'knowledgeKey')
      )
      on conflict (id) do update set updated_at = now()
      returning id into v_family;
    end if;

    v_hash := encode(extensions.digest(trim(regexp_replace(lower(v_candidate ->> 'question'), '[^[:alnum:]]+', ' ', 'g')), 'sha256'), 'hex');
    select q.family_id into v_existing_family
    from public.questions q where q.content_hash = v_hash limit 1;
    if v_existing_family is not null then v_family := v_existing_family; end if;

    insert into public.question_concepts (id, label)
    values (coalesce(v_candidate ->> 'conceptId', v_family), v_candidate ->> 'question')
    on conflict do nothing;
    insert into public.questions (
      id, concept_id, family_id, type, question, answers, correct_answer,
      category, subcategory, difficulty, language, tags, source_provider,
      source_license, verification_status, confidence, quality_score, state,
      explanation, active, content_hash, needs_family_review
    ) values (
      v_candidate ->> 'id', coalesce(v_candidate ->> 'conceptId', v_family), v_family,
      coalesce(v_candidate ->> 'type', 'mcq'), v_candidate ->> 'question',
      coalesce(v_candidate -> 'answers', '[]'::jsonb), coalesce((v_candidate ->> 'correctAnswer')::integer, 0),
      coalesce(v_candidate ->> 'category', 'culture-generale'), coalesce(v_candidate ->> 'subcategory', 'general'),
      coalesce(v_candidate ->> 'difficulty', 'medium'), coalesce(v_candidate ->> 'language', 'fr'),
      coalesce((select array_agg(value #>> '{}') from jsonb_array_elements(coalesce(v_candidate -> 'tags', '[]'::jsonb))), '{}'::text[]),
      coalesce(v_candidate #>> '{source,provider}', 'database'), coalesce(v_candidate #>> '{source,license}', 'CC0'),
      coalesce(v_candidate #>> '{verification,status}', 'unverified'),
      coalesce((v_candidate ->> 'confidence')::numeric, 0.9), coalesce((v_candidate ->> 'qualityScore')::numeric, 0.9),
      case when coalesce(v_candidate #>> '{verification,status}', 'unverified') = 'verified' then 'verified' else 'review' end,
      v_candidate ->> 'explanation', true, v_hash, not (v_candidate ? 'knowledgeKey')
    )
    on conflict (id) do update set
      family_id = excluded.family_id,
      content_hash = coalesce(public.questions.content_hash, excluded.content_hash),
      updated_at = now();

    insert into public.question_selection_work
      (request_id, ordinal, question_id, family_id, payload, usage_count, category, topic)
    values (
      v_request_id,
      (select count(*) from public.question_selection_work where request_id = v_request_id),
      v_candidate ->> 'id', v_family,
      v_candidate || jsonb_build_object('familyId', v_family, 'knowledgeKey', v_key, 'contentHash', v_hash),
      coalesce((select usage_count from public.questions where id = v_candidate ->> 'id'), 0),
      v_candidate ->> 'category', v_candidate ->> 'subcategory'
    ) on conflict (request_id, family_id) do nothing;
  end loop;

  -- Reprise non destructive de l'historique local des versions précédentes.
  -- Elle se déroule après l'ingestion des familles afin de respecter les FK.
  if jsonb_typeof(p_local_history) = 'array' then
    for v_history_group in select value from jsonb_array_elements(p_local_history) loop
      select pd.profile_id into v_history_profile
      from public.player_devices pd
      where pd.device_token_hash = encode(extensions.digest(v_history_group ->> 'profileId', 'sha256'), 'hex')
      limit 1;
      if v_history_profile is null or jsonb_typeof(v_history_group -> 'entries') <> 'array' then continue; end if;
      for v_history_entry in select value from jsonb_array_elements(v_history_group -> 'entries') loop
        select qf.id into v_history_family
        from public.question_families qf
        where qf.id = v_history_entry ->> 'familyId'
           or qf.knowledge_key = public.canonical_knowledge_key(v_history_entry ->> 'familyId')
        order by (qf.id = v_history_entry ->> 'familyId') desc
        limit 1;
        if v_history_family is null then continue; end if;
        insert into public.question_seen (id, profile_id, family_id, question_id, first_seen_at, answered_at, correct)
        values (
          'seen_' || encode(extensions.gen_random_bytes(12), 'hex'),
          v_history_profile,
          v_history_family,
          case when exists (select 1 from public.questions q where q.id = v_history_entry ->> 'questionId')
            then v_history_entry ->> 'questionId' else null end,
          now(),
          case when (v_history_entry ->> 'answeredCorrectly') is null then null else now() end,
          case when (v_history_entry ->> 'answeredCorrectly') is null then null
            else (v_history_entry ->> 'answeredCorrectly')::boolean end
        )
        on conflict on constraint question_seen_profile_id_family_id_key do nothing;
      end loop;
    end loop;
  end if;

  return query
  with available as (
    select distinct on (c.family_id) c.*
    from public.question_selection_work c
    where c.request_id = v_request_id
    and not exists (
      select 1 from public.question_seen qs
      where qs.family_id = c.family_id and qs.profile_id = any(v_profiles)
    )
    and not exists (
      select 1 from public.question_reservations qr
      where qr.family_id = c.family_id and qr.profile_id = any(v_profiles) and qr.expires_at > now()
    )
    order by c.family_id, c.usage_count, c.ordinal
  ), chosen as (
    select a.* from available a
    order by a.usage_count,
      hashtextextended(a.family_id || p_session_id::text, 0),
      a.category, a.topic
    limit p_count
  ), reserved as (
    insert into public.question_reservations
      (id, session_id, profile_id, family_id, question_id, expires_at)
    select
      'res_' || encode(extensions.gen_random_bytes(12), 'hex'),
      p_session_id::text, profile, chosen.family_id, chosen.question_id,
      now() + make_interval(secs => greatest(60, least(p_ttl_seconds, 3600)))
    from chosen cross join unnest(v_profiles) profile
    on conflict (profile_id, family_id) do nothing
    returning family_id
  )
  select chosen.payload || jsonb_build_object('usageCount', chosen.usage_count)
  from chosen
  where exists (select 1 from reserved where reserved.family_id = chosen.family_id)
  order by chosen.usage_count, hashtextextended(chosen.family_id || p_session_id::text, 0);

  delete from public.question_selection_work where request_id = v_request_id;
end;
$$;

create or replace function public.mark_question_seen(
  p_session_id uuid,
  p_device_tokens text[],
  p_online_session_id uuid,
  p_question_id text,
  p_family_id text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profiles text[];
  v_inserted integer := 0;
  v_exposure integer := 0;
begin
  select array_agg(distinct resolved.profile_id) into v_profiles
  from public.resolve_player_profiles(p_device_tokens) resolved;
  if p_online_session_id is not null then
    if not exists (select 1 from public.game_players where session_id = p_online_session_id and user_id = auth.uid()) then
      raise exception 'not_a_session_member';
    end if;
    select array_agg(distinct profile) into v_profiles
    from unnest(coalesce(v_profiles, '{}'::text[]) || coalesce((
      select array_agg(profile_id) from public.game_players
      where session_id = p_online_session_id and profile_id is not null
    ), '{}'::text[])) profile;
  end if;

  insert into public.question_seen (id, profile_id, family_id, question_id, session_id)
  select
    'seen_' || encode(extensions.gen_random_bytes(12), 'hex'),
    profile, p_family_id, p_question_id, p_session_id::text
  from unnest(v_profiles) profile
  on conflict (profile_id, family_id) do nothing;
  get diagnostics v_inserted = row_count;

  delete from public.question_reservations
  where profile_id = any(v_profiles) and family_id = p_family_id;

  insert into public.question_exposures (session_id, family_id, question_id)
  values (p_session_id::text, p_family_id, p_question_id)
  on conflict do nothing;
  get diagnostics v_exposure = row_count;
  if v_exposure > 0 then
    update public.questions set usage_count = usage_count + 1 where id = p_question_id;
    update public.question_families set usage_count = usage_count + 1 where id = p_family_id;
  end if;
  return v_inserted;
end;
$$;

create or replace function public.mark_question_answered(
  p_session_id uuid,
  p_device_token text,
  p_family_id text,
  p_correct boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_profile text;
begin
  select profile_id into v_profile
  from public.resolve_player_profiles(array[p_device_token]) limit 1;
  update public.question_seen
  set answered_at = now(), correct = p_correct
  where profile_id = v_profile and family_id = p_family_id and session_id = p_session_id::text;
end;
$$;

drop policy if exists "player_profiles_insert_all" on public.player_profiles;
drop policy if exists "player_profiles_update_self" on public.player_profiles;
drop policy if exists "question_seen_read_all" on public.question_seen;
drop policy if exists "question_seen_insert_all" on public.question_seen;
drop policy if exists "question_seen_update_all" on public.question_seen;

create policy "player_profiles_update_account"
  on public.player_profiles for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select on public.player_profiles to anon, authenticated;
grant update (nickname, avatar_color, avatar_url, updated_at)
  on public.player_profiles to authenticated;

revoke execute on function public.resolve_player_profiles(text[]) from public;
revoke execute on function public.attach_game_player_profile(uuid, text) from public;
revoke execute on function public.reserve_unseen_questions(uuid, text[], uuid, jsonb, integer, jsonb, integer) from public;
revoke execute on function public.mark_question_seen(uuid, text[], uuid, text, text) from public;
revoke execute on function public.mark_question_answered(uuid, text, text, boolean) from public;

grant execute on function public.resolve_player_profiles(text[]) to authenticated;
grant execute on function public.attach_game_player_profile(uuid, text) to authenticated;
grant execute on function public.reserve_unseen_questions(uuid, text[], uuid, jsonb, integer, jsonb, integer) to authenticated;
grant execute on function public.mark_question_seen(uuid, text[], uuid, text, text) to authenticated;
grant execute on function public.mark_question_answered(uuid, text, text, boolean) to authenticated;

revoke all on public.player_devices, public.question_seen,
  public.question_reservations, public.game_session_participants, public.question_exposures,
  public.question_selection_work
  from anon, authenticated;

-- Les services sociaux actuels passent par les routes serveur et ne lisent pas
-- directement ces tables. Les anciennes politiques publiques permettaient à
-- n'importe quel client de modifier un salon ou une amitié arbitraire.
revoke all on public.lobbies, public.lobby_members, public.user_presences,
  public.friendships, public.lobby_invitations, public.lobby_join_requests,
  public.parties, public.party_members
  from anon, authenticated;

create or replace view public.question_pool_metrics
with (security_invoker = true)
as
select
  q.category,
  q.language,
  count(distinct q.family_id) as family_count,
  count(*) as question_count,
  avg(q.usage_count)::numeric(12,2) as average_question_usage,
  count(*) filter (where q.needs_family_review) as needs_family_review_count
from public.questions q
where q.active
group by q.category, q.language;
