-- Staging-only Storage compatibility for existing PropLogAI upload flows.
-- Apply only to Supabase project floggzxiitesfpkptwqc. Safe to re-run.

insert into storage.buckets (id, name, public)
values
  ('screenshots', 'screenshots', true),
  ('trophies', 'trophies', true),
  ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

-- Existing clients write every user-owned file under <auth.uid()>/... .
-- Public reads preserve the public URLs currently stored in product records.
DO $$
DECLARE
  bucket text;
BEGIN
  FOREACH bucket IN ARRAY ARRAY['screenshots', 'trophies', 'avatars']
  LOOP
    EXECUTE format('drop policy if exists %I on storage.objects', bucket || '_insert_own');
    EXECUTE format('drop policy if exists %I on storage.objects', bucket || '_update_own');
    EXECUTE format('drop policy if exists %I on storage.objects', bucket || '_delete_own');
    EXECUTE format('drop policy if exists %I on storage.objects', bucket || '_public_read');

    EXECUTE format(
      'create policy %I on storage.objects for insert to authenticated with check (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text)',
      bucket || '_insert_own', bucket
    );
    EXECUTE format(
      'create policy %I on storage.objects for update to authenticated using (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text)',
      bucket || '_update_own', bucket, bucket
    );
    EXECUTE format(
      'create policy %I on storage.objects for delete to authenticated using (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text)',
      bucket || '_delete_own', bucket
    );
    EXECUTE format(
      'create policy %I on storage.objects for select using (bucket_id = %L)',
      bucket || '_public_read', bucket
    );
  END LOOP;
END $$;

notify pgrst, 'reload schema';
