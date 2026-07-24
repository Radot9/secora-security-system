alter table public.visitors
add column if not exists checked_in_by uuid references public.profiles(id) on delete set null,
add column if not exists checked_in_by_name text,
add column if not exists checked_out_by uuid references public.profiles(id) on delete set null,
add column if not exists checked_out_by_name text;

create index if not exists visitors_checked_in_by_idx
on public.visitors (checked_in_by);

create index if not exists visitors_checked_out_by_idx
on public.visitors (checked_out_by);
