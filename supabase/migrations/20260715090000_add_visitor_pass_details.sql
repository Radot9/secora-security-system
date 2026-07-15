alter table public.visitors
add column if not exists purpose_of_visit text,
add column if not exists validity_duration_minutes integer;
