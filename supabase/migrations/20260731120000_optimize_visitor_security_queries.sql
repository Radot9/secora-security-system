create index if not exists visitors_access_code_idx
on public.visitors (access_code);

create index if not exists visitors_status_idx
on public.visitors (status);

create index if not exists visitors_entry_time_idx
on public.visitors (entry_time desc)
where entry_time is not null;

create index if not exists visitors_exit_time_idx
on public.visitors (exit_time desc)
where exit_time is not null;

create index if not exists visitors_pending_expires_at_idx
on public.visitors (expires_at)
where status = 'pending';
