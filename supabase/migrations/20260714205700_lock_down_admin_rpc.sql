create schema if not exists private;

create or replace function private.has_active_role(allowed_roles text[]) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists (
 select 1 from public.profiles
 where id = auth.uid()
 and is_active = true
 and role = any(allowed_roles)
 );
$$;

revoke all on function private.has_active_role(text[]) from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.has_active_role(text[]) to authenticated;

drop policy if exists profiles_select_own_or_super_admin on public.profiles;
drop policy if exists residents_select_authorized on public.residents;
drop policy if exists security_personnel_select_authorized on public.security_personnel;
drop policy if exists visitors_select_authorized on public.visitors;
drop policy if exists visitors_insert_authorized on public.visitors;
drop policy if exists visitors_update_authorized on public.visitors;
drop policy if exists visitors_delete_administrators on public.visitors;
drop policy if exists admin_invitations_select_authorized on public.admin_invitations;
drop policy if exists admin_audit_logs_select_super_admin on public.admin_audit_logs;

create policy profiles_select_own_or_super_admin on public.profiles for select to authenticated
using (id = auth.uid() or private.has_active_role(array['super_admin']));

create policy residents_select_authorized on public.residents for select to authenticated
using (user_id = auth.uid() or private.has_active_role(array['admin','super_admin']));

create policy security_personnel_select_authorized on public.security_personnel for select to authenticated
using (user_id = auth.uid() or private.has_active_role(array['admin','super_admin']));

create policy visitors_select_authorized on public.visitors for select to authenticated using (
 private.has_active_role(array['admin','super_admin','security']) or exists (
 select 1 from public.residents r where r.id = visitors.resident_id and r.user_id = auth.uid() and r.is_active = true));
create policy visitors_insert_authorized on public.visitors for insert to authenticated with check (
 private.has_active_role(array['admin','super_admin']) or exists (
 select 1 from public.residents r where r.id = visitors.resident_id and r.user_id = auth.uid() and r.is_active = true));
create policy visitors_update_authorized on public.visitors for update to authenticated using (
 private.has_active_role(array['admin','super_admin','security']) or exists (
 select 1 from public.residents r where r.id = visitors.resident_id and r.user_id = auth.uid() and r.is_active = true)) with check (
 private.has_active_role(array['admin','super_admin','security']) or exists (
 select 1 from public.residents r where r.id = visitors.resident_id and r.user_id = auth.uid() and r.is_active = true));
create policy visitors_delete_administrators on public.visitors for delete to authenticated
using (private.has_active_role(array['admin','super_admin']));

create policy admin_invitations_select_authorized on public.admin_invitations for select to authenticated
using (auth_user_id = auth.uid() or private.has_active_role(array['super_admin']));
create policy admin_audit_logs_select_super_admin on public.admin_audit_logs for select to authenticated
using (private.has_active_role(array['super_admin']));

drop function if exists public.has_active_role(text[]);

drop function if exists public.super_admin_update_administrator(uuid,text,boolean,text);
create or replace function public.super_admin_update_administrator(
 p_actor_id uuid,
 p_target_id uuid,
 p_role text,
 p_is_active boolean,
 p_reason text default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
 v_actor public.profiles%rowtype;
 v_target public.profiles%rowtype;
 v_active_super_admins integer;
 v_action text;
begin
 select * into v_actor from public.profiles where id = p_actor_id;
 if not found or not v_actor.is_active or v_actor.role <> 'super_admin' then raise exception 'Only an active Super Admin can perform this action'; end if;
 if p_role not in ('admin','super_admin') then raise exception 'Invalid administrator role'; end if;

 select * into v_target from public.profiles where id = p_target_id for update;
 if not found or v_target.role not in ('admin','super_admin') then raise exception 'Administrator not found'; end if;
 if p_actor_id = p_target_id and (v_target.role <> p_role or v_target.is_active <> p_is_active) then
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
 deactivated_by = case when p_is_active then null else p_actor_id end
 where id = p_target_id;

 insert into public.admin_audit_logs(actor_id,target_profile_id,target_email,action,metadata)
 values(p_actor_id,p_target_id,v_target.email,v_action,jsonb_build_object('previous_role',v_target.role,'new_role',p_role,'previous_active',v_target.is_active,'new_active',p_is_active,'reason',p_reason));
end;
$$;

revoke all on function public.super_admin_update_administrator(uuid,uuid,text,boolean,text) from public, anon, authenticated;
grant execute on function public.super_admin_update_administrator(uuid,uuid,text,boolean,text) to service_role;
