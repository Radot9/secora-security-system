begin;

do $$
declare orphan_count integer;
begin
 select count(*) into orphan_count
 from public.profiles p
 where lower(p.email) = lower('ben.kin@test.com')
 and not exists (select 1 from auth.users u where u.id = p.id);
 if orphan_count <> 1 then raise exception 'Expected exactly one approved orphan profile; found %', orphan_count; end if;

 delete from public.profiles p
 where lower(p.email) = lower('ben.kin@test.com')
 and not exists (select 1 from auth.users u where u.id = p.id);

 if exists (select 1 from public.profiles where role is null or role not in ('admin','resident','security')) then
 raise exception 'Unexpected profile role found';
 end if;
 if exists (select 1 from public.profiles where email is null) then raise exception 'A profile without an email exists'; end if;
 if exists (select 1 from public.profiles group by lower(btrim(email)) having count(*) > 1) then
 raise exception 'Duplicate normalized profile emails exist';
 end if;
 if exists (select 1 from public.profiles p where not exists (select 1 from auth.users u where u.id = p.id)) then
 raise exception 'Unexpected orphan profiles remain';
 end if;
end $$;

update public.profiles set email = lower(btrim(email));

alter table public.profiles
 add column if not exists phone text,
 add column if not exists invited_by uuid,
 add column if not exists deactivated_at timestamptz,
 add column if not exists deactivated_by uuid,
 add column if not exists updated_at timestamptz not null default now(),
 add column if not exists onboarding_completed_at timestamptz;

update public.profiles
set onboarding_completed_at = coalesce(onboarding_completed_at, created_at)
where role = 'admin';

alter table public.profiles
 alter column email set not null,
 alter column role set not null,
 alter column is_active set default true,
 alter column is_active set not null;

alter table public.profiles add constraint profiles_role_check check (role in ('super_admin','admin','resident','security'));
alter table public.profiles add constraint profiles_email_normalized_check check (email = lower(btrim(email)));
alter table public.profiles add constraint profiles_auth_user_fkey foreign key (id) references auth.users(id) on delete cascade;
alter table public.profiles add constraint profiles_invited_by_fkey foreign key (invited_by) references public.profiles(id) on delete set null;
alter table public.profiles add constraint profiles_deactivated_by_fkey foreign key (deactivated_by) references public.profiles(id) on delete set null;

create unique index profiles_email_lower_key on public.profiles (lower(email));
create index profiles_role_active_idx on public.profiles (role, is_active);

create table public.admin_invitations (
 id uuid primary key default gen_random_uuid(),
 auth_user_id uuid unique references auth.users(id) on delete set null,
 email text not null,
 full_name text,
 phone text,
 intended_role text not null default 'admin',
 status text not null default 'pending',
 invited_by uuid references public.profiles(id) on delete set null,
 expires_at timestamptz not null default (now() + interval '72 hours'),
 profile_completed_at timestamptz,
 accepted_at timestamptz,
 revoked_at timestamptz,
 revoked_by uuid references public.profiles(id) on delete set null,
 revoke_reason text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint admin_invitations_email_normalized_check check (email = lower(btrim(email))),
 constraint admin_invitations_role_check check (intended_role in ('admin','super_admin')),
 constraint admin_invitations_status_check check (status in ('pending','accepted','revoked','expired'))
);

create unique index admin_invitations_pending_email_key on public.admin_invitations (lower(email)) where status = 'pending';
create index admin_invitations_status_expires_idx on public.admin_invitations (status, expires_at);

create table public.admin_audit_logs (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid references public.profiles(id) on delete set null,
 target_profile_id uuid references public.profiles(id) on delete set null,
 target_email text,
 action text not null,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

create index admin_audit_logs_target_idx on public.admin_audit_logs (target_profile_id, created_at desc);
create index admin_audit_logs_actor_idx on public.admin_audit_logs (actor_id, created_at desc);

create or replace function public.set_updated_at() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger admin_invitations_set_updated_at before update on public.admin_invitations for each row execute function public.set_updated_at();

create or replace function public.has_active_role(allowed_roles text[]) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists (select 1 from public.profiles where id = auth.uid() and is_active = true and role = any(allowed_roles));
$$;
revoke all on function public.has_active_role(text[]) from public;
grant execute on function public.has_active_role(text[]) to authenticated;

-- Atomic protection for self-lockout and the final active Super Admin.
create or replace function public.super_admin_update_administrator(
 p_target_id uuid,
 p_role text,
 p_is_active boolean,
 p_reason text default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
 v_actor_id uuid := auth.uid();
 v_actor public.profiles%rowtype;
 v_target public.profiles%rowtype;
 v_active_super_admins integer;
 v_action text;
begin
 select * into v_actor from public.profiles where id = v_actor_id;
 if not found or not v_actor.is_active or v_actor.role <> 'super_admin' then raise exception 'Only an active Super Admin can perform this action'; end if;
 if p_role not in ('admin','super_admin') then raise exception 'Invalid administrator role'; end if;

 select * into v_target from public.profiles where id = p_target_id for update;
 if not found or v_target.role not in ('admin','super_admin') then raise exception 'Administrator not found'; end if;
 if v_actor_id = p_target_id and (v_target.role <> p_role or v_target.is_active <> p_is_active) then
 raise exception 'You cannot change your own role or active status';
 end if;

 if v_target.role = 'super_admin' and (p_role <> 'super_admin' or not p_is_active) then
 select count(*) into v_active_super_admins from public.profiles where role = 'super_admin' and is_active = true;
 if v_active_super_admins <= 1 then raise exception 'The last active Super Admin cannot be demoted or deactivated'; end if;
 end if;

 v_action := case
 when v_target.role <> p_role and p_role = 'super_admin' then 'administrator_promoted'
 when v_target.role <> p_role then 'administrator_demoted'
 when v_target.is_active and not p_is_active then 'administrator_deactivated'
 when not v_target.is_active and p_is_active then 'administrator_activated'
 else 'administrator_access_reviewed' end;

 update public.profiles set
 role = p_role,
 is_active = p_is_active,
 deactivated_at = case when p_is_active then null else now() end,
 deactivated_by = case when p_is_active then null else v_actor_id end
 where id = p_target_id;

 insert into public.admin_audit_logs(actor_id,target_profile_id,target_email,action,metadata)
 values(v_actor_id,p_target_id,v_target.email,v_action,jsonb_build_object('previous_role',v_target.role,'new_role',p_role,'previous_active',v_target.is_active,'new_active',p_is_active,'reason',p_reason));
end;
$$;
revoke all on function public.super_admin_update_administrator(uuid,text,boolean,text) from public;
grant execute on function public.super_admin_update_administrator(uuid,text,boolean,text) to authenticated;

do $$ declare policy_record record;
begin
 for policy_record in select tablename, policyname from pg_policies where schemaname='public' and tablename in ('profiles','residents','security_personnel','visitors','admin_invitations','admin_audit_logs') loop
 execute format('drop policy if exists %I on public.%I', policy_record.policyname, policy_record.tablename);
 end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.residents enable row level security;
alter table public.security_personnel enable row level security;
alter table public.visitors enable row level security;
alter table public.admin_invitations enable row level security;
alter table public.admin_audit_logs enable row level security;

create policy profiles_select_own_or_super_admin on public.profiles for select to authenticated
using (id = auth.uid() or public.has_active_role(array['super_admin']));

create policy residents_select_authorized on public.residents for select to authenticated
using (user_id = auth.uid() or public.has_active_role(array['admin','super_admin']));

create policy security_personnel_select_authorized on public.security_personnel for select to authenticated
using (user_id = auth.uid() or public.has_active_role(array['admin','super_admin']));

create policy visitors_select_authorized on public.visitors for select to authenticated using (
 public.has_active_role(array['admin','super_admin','security']) or exists (
 select 1 from public.residents r where r.id = visitors.resident_id and r.user_id = auth.uid() and r.is_active = true));
create policy visitors_insert_authorized on public.visitors for insert to authenticated with check (
 public.has_active_role(array['admin','super_admin']) or exists (
 select 1 from public.residents r where r.id = visitors.resident_id and r.user_id = auth.uid() and r.is_active = true));
create policy visitors_update_authorized on public.visitors for update to authenticated using (
 public.has_active_role(array['admin','super_admin','security']) or exists (
 select 1 from public.residents r where r.id = visitors.resident_id and r.user_id = auth.uid() and r.is_active = true)) with check (
 public.has_active_role(array['admin','super_admin','security']) or exists (
 select 1 from public.residents r where r.id = visitors.resident_id and r.user_id = auth.uid() and r.is_active = true));
create policy visitors_delete_administrators on public.visitors for delete to authenticated
using (public.has_active_role(array['admin','super_admin']));

create policy admin_invitations_select_authorized on public.admin_invitations for select to authenticated
using (auth_user_id = auth.uid() or public.has_active_role(array['super_admin']));
create policy admin_audit_logs_select_super_admin on public.admin_audit_logs for select to authenticated
using (public.has_active_role(array['super_admin']));

revoke insert, update, delete on public.profiles from anon, authenticated;
revoke insert, update, delete on public.residents from anon, authenticated;
revoke insert, update, delete on public.security_personnel from anon, authenticated;
revoke all on public.admin_invitations from anon, authenticated;
revoke all on public.admin_audit_logs from anon, authenticated;
grant select on public.admin_invitations to authenticated;
grant select on public.admin_audit_logs to authenticated;

commit;
