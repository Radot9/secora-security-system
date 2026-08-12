begin;

create or replace function public.has_active_role(allowed_roles text[]) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists (
 select 1
 from public.profiles
 where id = (select auth.uid())
 and is_active = true
 and role = any(allowed_roles)
 );
$$;
revoke all on function public.has_active_role(text[]) from public, anon;
grant execute on function public.has_active_role(text[]) to authenticated;

create table public.announcements (
 id uuid primary key default gen_random_uuid(),
 title text not null check (char_length(btrim(title)) between 3 and 120),
 body text not null check (char_length(btrim(body)) between 3 and 4000),
 category text not null default 'community' check (category in ('community', 'security', 'maintenance', 'event')),
 is_published boolean not null default true,
 published_at timestamptz not null default now(),
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table public.forum_posts (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references auth.users(id) on delete cascade,
 author_name text not null check (char_length(btrim(author_name)) between 2 and 100),
 title text not null check (char_length(btrim(title)) between 3 and 160),
 body text not null check (char_length(btrim(body)) between 3 and 6000),
 category text not null default 'general' check (category in ('general', 'security', 'recommendations', 'events', 'lost-found')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table public.forum_comments (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.forum_posts(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 author_name text not null check (char_length(btrim(author_name)) between 2 and 100),
 body text not null check (char_length(btrim(body)) between 1 and 2000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create index announcements_published_idx on public.announcements (published_at desc) where is_published = true;
create index forum_posts_created_idx on public.forum_posts (created_at desc);
create index forum_posts_author_idx on public.forum_posts (author_id);
create index forum_comments_post_created_idx on public.forum_comments (post_id, created_at);
create index forum_comments_author_idx on public.forum_comments (author_id);

create trigger announcements_set_updated_at before update on public.announcements for each row execute function public.set_updated_at();
create trigger forum_posts_set_updated_at before update on public.forum_posts for each row execute function public.set_updated_at();
create trigger forum_comments_set_updated_at before update on public.forum_comments for each row execute function public.set_updated_at();

alter table public.announcements enable row level security;
alter table public.forum_posts enable row level security;
alter table public.forum_comments enable row level security;

create policy announcements_read_active_accounts on public.announcements for select to authenticated
using (is_published and public.has_active_role(array['resident','admin','super_admin','security']));
create policy announcements_create_administrators on public.announcements for insert to authenticated
with check (public.has_active_role(array['admin','super_admin']) and created_by = (select auth.uid()));
create policy announcements_update_administrators on public.announcements for update to authenticated
using (public.has_active_role(array['admin','super_admin']))
with check (public.has_active_role(array['admin','super_admin']));
create policy announcements_delete_administrators on public.announcements for delete to authenticated
using (public.has_active_role(array['admin','super_admin']));

create policy forum_posts_read_active_accounts on public.forum_posts for select to authenticated
using (public.has_active_role(array['resident','admin','super_admin','security']));
create policy forum_posts_create_residents on public.forum_posts for insert to authenticated
with check (author_id = (select auth.uid()) and public.has_active_role(array['resident']));
create policy forum_posts_update_owner_or_admin on public.forum_posts for update to authenticated
using (author_id = (select auth.uid()) or public.has_active_role(array['admin','super_admin']))
with check (author_id = (select auth.uid()) or public.has_active_role(array['admin','super_admin']));
create policy forum_posts_delete_owner_or_admin on public.forum_posts for delete to authenticated
using (author_id = (select auth.uid()) or public.has_active_role(array['admin','super_admin']));

create policy forum_comments_read_active_accounts on public.forum_comments for select to authenticated
using (public.has_active_role(array['resident','admin','super_admin','security']));
create policy forum_comments_create_residents on public.forum_comments for insert to authenticated
with check (author_id = (select auth.uid()) and public.has_active_role(array['resident']));
create policy forum_comments_update_owner_or_admin on public.forum_comments for update to authenticated
using (author_id = (select auth.uid()) or public.has_active_role(array['admin','super_admin']))
with check (author_id = (select auth.uid()) or public.has_active_role(array['admin','super_admin']));
create policy forum_comments_delete_owner_or_admin on public.forum_comments for delete to authenticated
using (author_id = (select auth.uid()) or public.has_active_role(array['admin','super_admin']));

revoke all on public.announcements, public.forum_posts, public.forum_comments from anon;
revoke all on public.announcements, public.forum_posts, public.forum_comments from authenticated;
grant select, insert, update, delete on public.announcements to authenticated;
grant select, insert, update, delete on public.forum_posts, public.forum_comments to authenticated;

commit;
