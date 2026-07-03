/**
 * Supabase Storage Orphan Cleanup Script
 *
 * Finds and deletes files in Supabase Storage buckets that have no
 * matching reference in the database.
 *
 * Buckets checked:
 *   - screenshots: referenced by journal_entries.screenshot_url and screenshot_urls
 *   - trophies: referenced by trophies.file_url
 *   - avatars: referenced by user_preferences.avatar_url
 *
 * Usage:
 *   DRY RUN (default):  node cleanup-orphans.js
 *   ACTUALLY DELETE:     node cleanup-orphans.js --delete
 *
 * Environment variables required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const DRY_RUN = !process.argv.includes('--delete');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

/* ─── Helpers ──────────────────────────────────────────────── */

async function supabaseRest(table, select, options = {}) {
  const params = new URLSearchParams({ select });
  if (options.limit) params.set('limit', options.limit);
  if (options.offset) params.set('offset', options.offset);
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;
  const res = await fetch(url, { headers: { ...headers, 'Prefer': 'return=representation' } });
  if (!res.ok) throw new Error(`REST ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function listStorageFiles(bucket, path = '', allFiles = []) {
  const url = `${SUPABASE_URL}/storage/v1/object/list/${bucket}`;
  const body = { prefix: path, limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } };
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Storage list ${bucket}/${path}: ${res.status}`);
  const items = await res.json();

  for (const item of items) {
    const fullPath = path ? `${path}/${item.name}` : item.name;
    if (item.id) {
      // It's a file
      allFiles.push(fullPath);
    } else {
      // It's a folder — recurse
      await listStorageFiles(bucket, fullPath, allFiles);
    }
  }
  return allFiles;
}

async function deleteStorageFiles(bucket, paths) {
  if (paths.length === 0) return;
  // Supabase delete accepts max ~1000 at a time
  for (let i = 0; i < paths.length; i += 100) {
    const batch = paths.slice(i, i + 100);
    const url = `${SUPABASE_URL}/storage/v1/object/${bucket}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ prefixes: batch }),
    });
    if (!res.ok) {
      console.error(`  ⚠️ Delete batch failed: ${res.status}`);
    }
  }
}

function extractPath(url, bucket) {
  if (!url || typeof url !== 'string') return null;
  const marker = `/${bucket}/`;
  const idx = url.lastIndexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

/* ─── Main ─────────────────────────────────────────────────── */

async function main() {
  console.log(DRY_RUN ? '🔍 DRY RUN — no files will be deleted\n' : '🗑️  DELETE MODE — orphaned files WILL be deleted\n');

  let totalOrphans = 0;
  let totalFiles = 0;

  // ═══ 1. Screenshots bucket ═══
  console.log('═══ Screenshots bucket ═══');
  const storageScreenshots = await listStorageFiles('screenshots');
  console.log(`  Storage files: ${storageScreenshots.length}`);

  // Fetch ALL screenshot URLs from journal_entries (paginated)
  const dbScreenshotUrls = new Set();
  let offset = 0;
  while (true) {
    const rows = await supabaseRest('journal_entries', 'screenshot_url,screenshot_urls', { limit: 1000, offset });
    if (rows.length === 0) break;
    for (const row of rows) {
      if (row.screenshot_url) {
        const p = extractPath(row.screenshot_url, 'screenshots');
        if (p) dbScreenshotUrls.add(p);
      }
      if (Array.isArray(row.screenshot_urls)) {
        for (const url of row.screenshot_urls) {
          const p = extractPath(url, 'screenshots');
          if (p) dbScreenshotUrls.add(p);
        }
      }
    }
    offset += rows.length;
    if (rows.length < 1000) break;
  }
  console.log(`  DB references: ${dbScreenshotUrls.size}`);

  const orphanScreenshots = storageScreenshots.filter((f) => !dbScreenshotUrls.has(f));
  console.log(`  Orphaned: ${orphanScreenshots.length}`);
  if (orphanScreenshots.length > 0) {
    orphanScreenshots.slice(0, 10).forEach((f) => console.log(`    - ${f}`));
    if (orphanScreenshots.length > 10) console.log(`    ... and ${orphanScreenshots.length - 10} more`);
  }
  totalOrphans += orphanScreenshots.length;
  totalFiles += storageScreenshots.length;

  if (!DRY_RUN && orphanScreenshots.length > 0) {
    await deleteStorageFiles('screenshots', orphanScreenshots);
    console.log(`  ✅ Deleted ${orphanScreenshots.length} orphaned screenshots`);
  }

  // ═══ 2. Trophies bucket ═══
  console.log('\n═══ Trophies bucket ═══');
  const storageTrophies = await listStorageFiles('trophies');
  console.log(`  Storage files: ${storageTrophies.length}`);

  const dbTrophyUrls = new Set();
  offset = 0;
  while (true) {
    const rows = await supabaseRest('trophies', 'file_url', { limit: 1000, offset });
    if (rows.length === 0) break;
    for (const row of rows) {
      const p = extractPath(row.file_url, 'trophies');
      if (p) dbTrophyUrls.add(p);
    }
    offset += rows.length;
    if (rows.length < 1000) break;
  }
  console.log(`  DB references: ${dbTrophyUrls.size}`);

  const orphanTrophies = storageTrophies.filter((f) => !dbTrophyUrls.has(f));
  console.log(`  Orphaned: ${orphanTrophies.length}`);
  if (orphanTrophies.length > 0) {
    orphanTrophies.slice(0, 10).forEach((f) => console.log(`    - ${f}`));
    if (orphanTrophies.length > 10) console.log(`    ... and ${orphanTrophies.length - 10} more`);
  }
  totalOrphans += orphanTrophies.length;
  totalFiles += storageTrophies.length;

  if (!DRY_RUN && orphanTrophies.length > 0) {
    await deleteStorageFiles('trophies', orphanTrophies);
    console.log(`  ✅ Deleted ${orphanTrophies.length} orphaned trophies`);
  }

  // ═══ 3. Avatars bucket ═══
  console.log('\n═══ Avatars bucket ═══');
  const storageAvatars = await listStorageFiles('avatars');
  console.log(`  Storage files: ${storageAvatars.length}`);

  const dbAvatarUrls = new Set();
  offset = 0;
  while (true) {
    const rows = await supabaseRest('user_preferences', 'avatar_url', { limit: 1000, offset });
    if (rows.length === 0) break;
    for (const row of rows) {
      const p = extractPath(row.avatar_url, 'avatars');
      if (p) dbAvatarUrls.add(p);
    }
    offset += rows.length;
    if (rows.length < 1000) break;
  }
  console.log(`  DB references: ${dbAvatarUrls.size}`);

  const orphanAvatars = storageAvatars.filter((f) => !dbAvatarUrls.has(f));
  console.log(`  Orphaned: ${orphanAvatars.length}`);
  if (orphanAvatars.length > 0) {
    orphanAvatars.slice(0, 10).forEach((f) => console.log(`    - ${f}`));
    if (orphanAvatars.length > 10) console.log(`    ... and ${orphanAvatars.length - 10} more`);
  }
  totalOrphans += orphanAvatars.length;
  totalFiles += storageAvatars.length;

  if (!DRY_RUN && orphanAvatars.length > 0) {
    await deleteStorageFiles('avatars', orphanAvatars);
    console.log(`  ✅ Deleted ${orphanAvatars.length} orphaned avatars`);
  }

  // ═══ Summary ═══
  console.log('\n═══════════════════════════════════════');
  console.log(`Total storage files: ${totalFiles}`);
  console.log(`Total orphaned: ${totalOrphans}`);
  console.log(`Total referenced: ${totalFiles - totalOrphans}`);
  if (DRY_RUN && totalOrphans > 0) {
    console.log(`\n🔑 To actually delete orphans, run:\n   node cleanup-orphans.js --delete`);
  }
  if (!DRY_RUN && totalOrphans > 0) {
    console.log(`\n✅ All orphaned files deleted.`);
  }
  if (totalOrphans === 0) {
    console.log(`\n✨ No orphaned files found. Storage is clean!`);
  }
}

main().catch((err) => {
  console.error('❌ Script failed:', err.message);
  process.exit(1);
});
