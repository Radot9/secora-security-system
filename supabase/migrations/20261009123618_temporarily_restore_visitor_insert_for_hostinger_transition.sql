begin;

-- Temporary compatibility bridge for the currently deployed Hostinger build.
-- Remove this grant and policy immediately after the server-authoritative build is live.
grant insert on public.visitors to authenticated;

drop policy if exists visitors_insert_authorized on public.visitors;
create policy visitors_insert_authorized
on public.visitors
for insert
to authenticated
with check (
 private.has_active_role(array['admin','super_admin']) or exists (
  select 1
  from public.residents r
  where r.id = visitors.resident_id
   and r.user_id = auth.uid()
   and r.is_active = true
 )
);

commit;
