begin;

create table if not exists public.whatsapp_conversations (
 sender_phone text primary key,
 resident_id uuid not null references public.residents(id) on delete cascade,
 state text not null default 'idle',
 draft jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint whatsapp_conversations_sender_phone_check check (sender_phone ~ '^[0-9]{10,15}$'),
 constraint whatsapp_conversations_state_check check (
  state in ('idle', 'visitor_name', 'visitor_phone', 'purpose', 'duration', 'plate', 'confirm')
 )
);

create table if not exists public.whatsapp_webhook_events (
 message_id text primary key,
 sender_phone text not null,
 resident_id uuid references public.residents(id) on delete set null,
 access_code text,
 status text not null default 'processing',
 received_at timestamptz not null default now(),
 processed_at timestamptz,
 constraint whatsapp_webhook_events_sender_phone_check check (sender_phone ~ '^[0-9]{10,15}$'),
 constraint whatsapp_webhook_events_status_check check (
  status in ('processing', 'processed', 'rejected', 'failed')
 )
);

create index if not exists whatsapp_webhook_events_received_at_idx
 on public.whatsapp_webhook_events (received_at desc);
create index if not exists whatsapp_webhook_events_resident_id_idx
 on public.whatsapp_webhook_events (resident_id, received_at desc);

alter table public.whatsapp_conversations enable row level security;
alter table public.whatsapp_webhook_events enable row level security;

revoke all on public.whatsapp_conversations from anon, authenticated;
revoke all on public.whatsapp_webhook_events from anon, authenticated;
grant select, insert, update, delete on public.whatsapp_conversations to service_role;
grant select, insert, update, delete on public.whatsapp_webhook_events to service_role;

commit;
