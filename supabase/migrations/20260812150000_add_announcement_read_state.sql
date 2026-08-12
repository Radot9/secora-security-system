begin;

create table public.announcement_read_state (
 user_id uuid primary key references auth.users(id) on delete cascade,
 last_read_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create trigger announcement_read_state_set_updated_at
before update on public.announcement_read_state
for each row execute function public.set_updated_at();

alter table public.announcement_read_state enable row level security;

create policy announcement_read_state_select_own
on public.announcement_read_state for select to authenticated
using (user_id = (select auth.uid()));

create policy announcement_read_state_insert_own
on public.announcement_read_state for insert to authenticated
with check (user_id = (select auth.uid()));

create policy announcement_read_state_update_own
on public.announcement_read_state for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

revoke all on public.announcement_read_state from anon, authenticated;
grant select, insert, update on public.announcement_read_state to authenticated;

commit;
