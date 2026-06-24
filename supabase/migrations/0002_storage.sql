-- PropLogAI storage for trade screenshots (Sprint 3)
insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true)
on conflict (id) do nothing;

-- Authenticated users can upload into their own folder: <user_id>/...
drop policy if exists "screenshots upload own" on storage.objects;
create policy "screenshots upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "screenshots update own" on storage.objects;
create policy "screenshots update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "screenshots delete own" on storage.objects;
create policy "screenshots delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

-- Public read (bucket is public; this makes the intent explicit)
drop policy if exists "screenshots public read" on storage.objects;
create policy "screenshots public read" on storage.objects
  for select using (bucket_id = 'screenshots');
