alter table public.residents
  add column if not exists close text;

alter table public.residents
  alter column street drop not null;
