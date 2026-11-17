begin;

create table if not exists public.whatsapp_identities (
 id uuid primary key default gen_random_uuid(),
 resident_id uuid not null references public.residents(id) on delete cascade,
 whatsapp_user_id text not null unique,
 identity_type text not null default 'resident',
 display_name text,
 permissions jsonb not null default '{"create_pass":true,"view_own_passes":true,"revoke_own_passes":true}'::jsonb,
 status text not null default 'active',
 verified_at timestamptz not null default now(),
 revoked_at timestamptz,
 created_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint whatsapp_identities_user_id_check check (whatsapp_user_id ~ '^[0-9]{10,15}$'),
 constraint whatsapp_identities_type_check check (identity_type in ('resident', 'delegate')),
 constraint whatsapp_identities_status_check check (status in ('active', 'revoked')),
 constraint whatsapp_identities_revocation_check check (
  (status = 'active' and revoked_at is null) or (status = 'revoked' and revoked_at is not null)
 )
);

create unique index if not exists whatsapp_identities_primary_resident_idx
 on public.whatsapp_identities (resident_id)
 where identity_type = 'resident' and status = 'active';
create index if not exists whatsapp_identities_resident_idx
 on public.whatsapp_identities (resident_id, status);

create table if not exists public.whatsapp_link_challenges (
 id uuid primary key default gen_random_uuid(),
 resident_id uuid not null references public.residents(id) on delete cascade,
 target_whatsapp_user_id text not null,
 token_hash text not null unique,
 expires_at timestamptz not null,
 consumed_at timestamptz,
 attempts integer not null default 0,
 max_attempts integer not null default 5,
 created_by uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 constraint whatsapp_link_challenges_phone_check check (target_whatsapp_user_id ~ '^[0-9]{10,15}$'),
 constraint whatsapp_link_challenges_attempts_check check (attempts >= 0 and max_attempts between 1 and 10),
 constraint whatsapp_link_challenges_expiry_check check (expires_at > created_at)
);

create index if not exists whatsapp_link_challenges_lookup_idx
 on public.whatsapp_link_challenges (target_whatsapp_user_id, expires_at desc)
 where consumed_at is null;

alter table public.whatsapp_conversations
 add column if not exists identity_id uuid references public.whatsapp_identities(id) on delete cascade,
 add column if not exists expires_at timestamptz,
 add column if not exists invalid_attempts integer not null default 0,
 add column if not exists version integer not null default 1;

alter table public.whatsapp_conversations
 drop constraint if exists whatsapp_conversations_state_check;
alter table public.whatsapp_conversations
 add constraint whatsapp_conversations_state_check check (
  state in (
   'idle', 'visitor_name', 'visitor_phone', 'purpose', 'vehicle_choice',
   'plate', 'duration', 'confirm', 'active_passes', 'revoke_select', 'revoke_confirm'
  )
 );
alter table public.whatsapp_conversations
 add constraint whatsapp_conversations_invalid_attempts_check check (invalid_attempts between 0 and 10);
create unique index if not exists whatsapp_conversations_identity_idx
 on public.whatsapp_conversations (identity_id)
 where identity_id is not null;

alter table public.whatsapp_webhook_events
 add column if not exists identity_id uuid references public.whatsapp_identities(id) on delete set null,
 add column if not exists action text,
 add column if not exists outcome text,
 add column if not exists available_at timestamptz not null default now(),
 add column if not exists processing_started_at timestamptz,
 add column if not exists attempt_count integer not null default 0;

alter table public.whatsapp_webhook_events
 drop constraint if exists whatsapp_webhook_events_status_check;
alter table public.whatsapp_webhook_events
 add constraint whatsapp_webhook_events_status_check check (
  status in ('queued', 'processing', 'processed', 'rejected', 'failed', 'dead_letter')
 );
create index if not exists whatsapp_webhook_events_queue_idx
 on public.whatsapp_webhook_events (status, available_at, received_at)
 where status in ('queued', 'failed');

create table if not exists public.whatsapp_outbound_messages (
 id uuid primary key default gen_random_uuid(),
 inbound_message_id text references public.whatsapp_webhook_events(message_id) on delete set null,
 identity_id uuid references public.whatsapp_identities(id) on delete set null,
 recipient_whatsapp_user_id text not null,
 meta_message_id text unique,
 message_kind text not null,
 status text not null default 'reserved',
 error_code text,
 created_at timestamptz not null default now(),
 sent_at timestamptz,
 delivered_at timestamptz,
 read_at timestamptz,
 failed_at timestamptz,
 constraint whatsapp_outbound_recipient_check check (recipient_whatsapp_user_id ~ '^[0-9]{10,15}$'),
 constraint whatsapp_outbound_kind_check check (message_kind in ('text', 'interactive', 'template', 'media')),
 constraint whatsapp_outbound_status_check check (status in ('reserved', 'sent', 'delivered', 'read', 'failed'))
);
create index if not exists whatsapp_outbound_created_idx
 on public.whatsapp_outbound_messages (created_at desc);
create unique index if not exists whatsapp_outbound_inbound_message_idx
 on public.whatsapp_outbound_messages (inbound_message_id)
 where inbound_message_id is not null;

create table if not exists public.visitor_audit_events (
 id uuid primary key default gen_random_uuid(),
 resident_id uuid references public.residents(id) on delete set null,
 visitor_id uuid references public.visitors(id) on delete set null,
 actor_user_id uuid references public.profiles(id) on delete set null,
 whatsapp_identity_id uuid references public.whatsapp_identities(id) on delete set null,
 action text not null,
 source text not null,
 outcome text not null,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 constraint visitor_audit_source_check check (source in ('web', 'whatsapp', 'security', 'admin', 'system')),
 constraint visitor_audit_outcome_check check (outcome in ('success', 'denied', 'failed'))
);
create index if not exists visitor_audit_resident_idx
 on public.visitor_audit_events (resident_id, created_at desc);
create index if not exists visitor_audit_visitor_idx
 on public.visitor_audit_events (visitor_id, created_at desc);

alter table public.visitors
 add column if not exists public_pass_token text,
 add column if not exists created_by_user_id uuid references public.profiles(id) on delete set null,
 add column if not exists created_by_whatsapp_identity_id uuid references public.whatsapp_identities(id) on delete set null,
 add column if not exists creation_request_id text;

update public.visitors
 set public_pass_token = encode(gen_random_bytes(24), 'hex')
 where public_pass_token is null;

alter table public.visitors alter column public_pass_token set not null;
alter table public.visitors alter column public_pass_token set default encode(gen_random_bytes(24), 'hex');
create unique index if not exists visitors_public_pass_token_idx on public.visitors (public_pass_token);
create unique index if not exists visitors_creation_request_id_idx
 on public.visitors (creation_request_id)
 where creation_request_id is not null;

alter table public.visitors
 add constraint visitors_resident_id_fkey
 foreign key (resident_id) references public.residents(id) on delete restrict not valid;
alter table public.visitors
 add constraint visitors_access_code_format_check check (access_code ~ '^[0-9]{6}$') not valid;
alter table public.visitors
 add constraint visitors_validity_range_check
 check (validity_duration_minutes between 30 and 1440) not valid;
alter table public.visitors
 add constraint visitors_status_check
 check (status in ('pending', 'entered', 'exited', 'revoked', 'expired')) not valid;

drop policy if exists visitors_insert_authorized on public.visitors;
revoke insert, update, delete on public.visitors from anon, authenticated;
grant select, insert, update, delete on public.visitors to service_role;

alter table public.whatsapp_identities enable row level security;
alter table public.whatsapp_link_challenges enable row level security;
alter table public.whatsapp_outbound_messages enable row level security;
alter table public.visitor_audit_events enable row level security;

revoke all on public.whatsapp_identities from anon, authenticated;
revoke all on public.whatsapp_link_challenges from anon, authenticated;
revoke all on public.whatsapp_outbound_messages from anon, authenticated;
revoke all on public.visitor_audit_events from anon, authenticated;
grant select, insert, update, delete on public.whatsapp_identities to service_role;
grant select, insert, update, delete on public.whatsapp_link_challenges to service_role;
grant select, insert, update, delete on public.whatsapp_outbound_messages to service_role;
grant select, insert, update, delete on public.visitor_audit_events to service_role;

create or replace function public.create_visitor_pass(
 p_resident_id uuid,
 p_actor_user_id uuid,
 p_whatsapp_identity_id uuid,
 p_request_id text,
 p_visitor_name text,
 p_visitor_phone text,
 p_purpose text,
 p_plate_number text,
 p_validity_minutes integer,
 p_creation_channel text
)
returns table (
 id uuid,
 access_code text,
 public_pass_token text,
 expires_at timestamptz,
 created_at timestamptz
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
 v_resident_name text;
 v_resident_user_id uuid;
 v_code text;
 v_random bytea;
 v_token text;
 v_expires_at timestamptz;
 v_created public.visitors%rowtype;
 v_attempt integer;
begin
 if p_request_id is null or length(p_request_id) < 6 or length(p_request_id) > 255 then
  raise exception 'invalid_request_id';
 end if;

 select r.full_name, r.user_id into v_resident_name, v_resident_user_id
 from public.residents r
 where r.id = p_resident_id and r.is_active = true
 for update;

 if not found then raise exception 'resident_inactive'; end if;

 select v.* into v_created
 from public.visitors v
 where v.creation_request_id = p_request_id;
 if found then
  return query select v_created.id, v_created.access_code, v_created.public_pass_token,
   v_created.expires_at, v_created.created_at;
  return;
 end if;

 if p_creation_channel = 'web' then
  if p_actor_user_id is null or p_actor_user_id <> v_resident_user_id or p_whatsapp_identity_id is not null then
   raise exception 'actor_not_authorized';
  end if;
 elsif p_creation_channel = 'whatsapp' then
  if p_whatsapp_identity_id is null or not exists (
   select 1 from public.whatsapp_identities wi
   where wi.id = p_whatsapp_identity_id
    and wi.resident_id = p_resident_id
    and wi.status = 'active'
    and coalesce((wi.permissions ->> 'create_pass')::boolean, false)
  ) then
   raise exception 'actor_not_authorized';
  end if;
 else
  raise exception 'invalid_creation_channel';
 end if;

 if p_visitor_name is null or length(btrim(p_visitor_name)) not between 2 and 100 then
  raise exception 'invalid_visitor_name';
 end if;
 if p_visitor_phone is null or p_visitor_phone !~ '^[0-9]{10,15}$' then
  raise exception 'invalid_visitor_phone';
 end if;
 if p_purpose is null or length(btrim(p_purpose)) not between 2 and 100 then
  raise exception 'invalid_purpose';
 end if;
 if p_plate_number is not null and length(btrim(p_plate_number)) > 20 then
  raise exception 'invalid_plate_number';
 end if;
 if p_validity_minutes is null or p_validity_minutes not between 30 and 1440 then
  raise exception 'invalid_validity';
 end if;

 if (
  select count(*) from public.visitors v
  where v.resident_id = p_resident_id and v.status = 'pending' and v.expires_at > now()
 ) >= 10 then
  raise exception 'active_pass_limit';
 end if;
 if (
  select count(*) from public.visitors v
  where v.resident_id = p_resident_id and v.created_at >= now() - interval '1 hour'
 ) >= 10 then
  raise exception 'hourly_pass_limit';
 end if;

 v_expires_at := now() + make_interval(mins => p_validity_minutes);
 for v_attempt in 1..12 loop
  v_random := gen_random_bytes(4);
  v_code := (
   100000 + (
    get_byte(v_random, 0)::bigint * 16777216 +
    get_byte(v_random, 1)::bigint * 65536 +
    get_byte(v_random, 2)::bigint * 256 +
    get_byte(v_random, 3)::bigint
   ) % 900000
  )::text;
  v_token := encode(gen_random_bytes(24), 'hex');
  begin
   insert into public.visitors (
    visitor_name, visitor_phone, purpose_of_visit, plate_number,
    resident_id, resident_name, access_code, status,
    validity_duration_minutes, expires_at, creation_channel,
    public_pass_token, created_by_user_id, created_by_whatsapp_identity_id,
    creation_request_id
   ) values (
    btrim(p_visitor_name), p_visitor_phone, btrim(p_purpose), nullif(upper(btrim(p_plate_number)), ''),
    p_resident_id, coalesce(v_resident_name, 'Resident'), v_code, 'pending',
    p_validity_minutes, v_expires_at, p_creation_channel,
    v_token, p_actor_user_id, p_whatsapp_identity_id,
    p_request_id
   ) returning * into v_created;
   exit;
  exception when unique_violation then
   if exists (select 1 from public.visitors v where v.creation_request_id = p_request_id) then
    select v.* into v_created from public.visitors v where v.creation_request_id = p_request_id;
    exit;
   end if;
  end;
 end loop;

 if v_created.id is null then raise exception 'access_code_unavailable'; end if;

 insert into public.visitor_audit_events (
  resident_id, visitor_id, actor_user_id, whatsapp_identity_id,
  action, source, outcome, metadata
 ) values (
  p_resident_id, v_created.id, p_actor_user_id, p_whatsapp_identity_id,
  'visitor_pass_created', p_creation_channel, 'success',
  jsonb_build_object('validity_minutes', p_validity_minutes)
 );

 return query select v_created.id, v_created.access_code, v_created.public_pass_token,
  v_created.expires_at, v_created.created_at;
end;
$$;

revoke all on function public.create_visitor_pass(uuid,uuid,uuid,text,text,text,text,text,integer,text)
 from public, anon, authenticated;
grant execute on function public.create_visitor_pass(uuid,uuid,uuid,text,text,text,text,text,integer,text)
 to service_role;

create or replace function public.reserve_whatsapp_outbound_message(
 p_inbound_message_id text,
 p_identity_id uuid,
 p_recipient_whatsapp_user_id text,
 p_message_kind text,
 p_monthly_limit integer
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
 v_id uuid;
begin
 if p_monthly_limit not between 1 and 1000 then raise exception 'invalid_monthly_message_limit'; end if;
 if p_recipient_whatsapp_user_id !~ '^[0-9]{10,15}$' then raise exception 'invalid_recipient'; end if;
 if p_message_kind not in ('text', 'interactive', 'template', 'media') then raise exception 'invalid_message_kind'; end if;

 perform pg_advisory_xact_lock(hashtextextended('entriseq_whatsapp_monthly_budget', 0));
 if (
  select count(*) from public.whatsapp_outbound_messages
  where created_at >= date_trunc('month', now())
 ) >= p_monthly_limit then
  raise exception 'whatsapp_monthly_message_limit';
 end if;

 insert into public.whatsapp_outbound_messages (
  inbound_message_id, identity_id, recipient_whatsapp_user_id, message_kind, status
 ) values (
  p_inbound_message_id, p_identity_id, p_recipient_whatsapp_user_id, p_message_kind, 'reserved'
 ) returning id into v_id;
 return v_id;
end;
$$;

revoke all on function public.reserve_whatsapp_outbound_message(text,uuid,text,text,integer)
 from public, anon, authenticated;
grant execute on function public.reserve_whatsapp_outbound_message(text,uuid,text,text,integer)
 to service_role;

commit;
