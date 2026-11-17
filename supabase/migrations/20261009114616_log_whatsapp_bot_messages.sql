begin;

alter table public.whatsapp_webhook_events
 add column if not exists message_type text,
 add column if not exists message_text text,
 add column if not exists response_text text,
 add column if not exists error_message text;

alter table public.visitors
 add column if not exists creation_channel text not null default 'web';

alter table public.visitors
 drop constraint if exists visitors_creation_channel_check;
alter table public.visitors
 add constraint visitors_creation_channel_check
 check (creation_channel in ('web', 'whatsapp'));

commit;
