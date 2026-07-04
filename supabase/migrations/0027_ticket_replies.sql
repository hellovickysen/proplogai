-- Migration 0027: Ticket conversation system (multi-reply)
-- Replaces single admin_reply with a ticket_replies table for threaded conversations.

-- 1. Create ticket_replies table
create table if not exists ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('user', 'admin')),
  message text not null,
  screenshot_urls jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

alter table ticket_replies enable row level security;

-- Users can read replies on their own tickets
create policy "Users can read replies on own tickets"
  on ticket_replies for select
  using (
    exists (
      select 1 from support_tickets
      where support_tickets.id = ticket_replies.ticket_id
        and support_tickets.user_id = auth.uid()
    )
  );

-- Users can insert replies on their own tickets
create policy "Users can reply to own tickets"
  on ticket_replies for insert
  with check (
    auth.uid() = user_id
    and sender_role = 'user'
    and exists (
      select 1 from support_tickets
      where support_tickets.id = ticket_replies.ticket_id
        and support_tickets.user_id = auth.uid()
    )
  );

-- Indexes
create index if not exists idx_ticket_replies_ticket on ticket_replies(ticket_id);
create index if not exists idx_ticket_replies_created on ticket_replies(created_at);

-- 2. Drop admin_reply column from support_tickets (no longer needed)
alter table support_tickets drop column if exists admin_reply;

-- 3. Add reply_count cache column for list views
alter table support_tickets add column if not exists reply_count int default 0;

-- 4. Allow users to update their own tickets (for reply_count, updated_at)
create policy "Users can update own tickets"
  on support_tickets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. Allow users to delete their own tickets (for close action)
create policy "Users can delete own tickets"
  on support_tickets for delete
  using (auth.uid() = user_id);
