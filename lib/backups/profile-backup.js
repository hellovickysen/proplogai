import { createBackupZip, readBackupZip, sha256, BACKUP_LIMITS } from '@/lib/backups/archive';

export const BACKUP_FORMAT = 'proplogai-profile-backup';
export const BACKUP_VERSION = 1;
const PAGE_SIZE = 500;

const TABLE_SPECS = [
  { table: 'accounts', file: 'accounts', columns: 'id,user_id,broker,server,metaapi_id,balance,equity,currency,name,prop_firm,account_size,phase,status,color,starting_balance,is_archived,sort_order,is_primary,created_at', dependsOn: [] },
  { table: 'setups', file: 'setups', columns: 'id,user_id,name,direction,description,is_default,is_active,sort_order,reference_images,created_at,updated_at', dependsOn: [] },
  { table: 'trades', file: 'trades', columns: 'id,user_id,account_id,pair,direction,entry_price,exit_price,stop_loss,take_profit,lot_size,pnl,r_multiple,setup,timeframe,opened_at,closed_at,created_at,external_id,source,session,trade_date,setup_id,setup_ids,setup_follow_map,setup_followed,no_setup_reason,share_id,shared_until,is_favorite', dependsOn: ['accounts', 'setups'] },
  { table: 'journal_entries', file: 'journal_entries', columns: 'id,user_id,trade_id,note,emotions,confidence,screenshot_url,screenshot_urls,lesson,tags,created_at', dependsOn: ['trades'] },
  { table: 'ai_insights', file: 'ai_insights', columns: 'id,user_id,trade_id,type,summary,mistakes,severity,created_at', dependsOn: ['trades'] },
  { table: 'expenses', file: 'expenses', columns: 'id,user_id,firm_name,account_type,account_size,purchase_type,account_cost,num_accounts,total_cost,expense_date,notes,created_at', dependsOn: [] },
  { table: 'payouts', file: 'payouts', columns: 'id,user_id,firm_name,amount,payout_date,notes,created_at', dependsOn: [] },
  { table: 'trophies', file: 'trophies', columns: 'id,user_id,title,category,description,file_url,is_public,share_id,firm_name,trophy_date,created_at', dependsOn: [] },
  { table: 'rulebook_rules', file: 'rulebook_rules', columns: 'id,user_id,account_id,rule_key,category,title,value,unit,guidance,sort_order,rule_type,enabled,metadata,created_at,updated_at', dependsOn: ['accounts'] },
  { table: 'discipline_programs', file: 'discipline_programs', columns: 'id,user_id,account_id,status,started_at,completed_at,first_propol_reveal_unlocked_at,configured_at,created_at,updated_at', dependsOn: ['accounts'] },
  { table: 'discipline_rules', file: 'discipline_rules', columns: 'id,user_id,program_id,name,rule_type,metric,threshold,unit,account_id,instrument,effective_from,effective_until,version,is_active,created_at', dependsOn: ['discipline_programs', 'accounts'] },
  { table: 'discipline_program_focus_rules', file: 'discipline_program_focus_rules', columns: 'id,user_id,program_id,rule_id,sort_order,created_at', dependsOn: ['discipline_programs', 'discipline_rules'] },
  { table: 'discipline_program_trading_days', file: 'discipline_program_trading_days', columns: 'id,user_id,program_id,account_id,trade_date,created_at', dependsOn: ['discipline_programs', 'accounts'] },
  { table: 'trade_rule_breaks', file: 'trade_rule_breaks', columns: 'id,user_id,trade_id,program_id,rule_id,source,evidence,created_at', dependsOn: ['trades', 'discipline_programs', 'discipline_rules'] },
  { table: 'discipline_trade_reviews', file: 'discipline_trade_reviews', columns: 'id,user_id,trade_id,program_id,result,primary_reason,notes,completed_at,created_at,updated_at', dependsOn: ['trades', 'discipline_programs'] },
  { table: 'discipline_review_rule_checks', file: 'discipline_review_rule_checks', columns: 'id,user_id,review_id,rule_id,outcome,evidence_source,created_at', dependsOn: ['discipline_trade_reviews', 'discipline_rules'] },
  { table: 'discipline_score_snapshots', file: 'discipline_score_snapshots', columns: 'id,user_id,program_id,score,required_guardrail_score,focus_rule_score,evidence_coverage,calculated_at,metadata', dependsOn: ['discipline_programs'] },
  { table: 'discipline_weekly_reviews', file: 'discipline_weekly_reviews', columns: 'id,user_id,program_id,week_start,available_at,completed_at,summary,created_at', dependsOn: ['discipline_programs'] },
  { table: 'discipline_badge_events', file: 'discipline_badge_events', columns: 'id,user_id,program_id,badge_key,earned_at,metadata', dependsOn: ['discipline_programs'] },
  { table: 'trade_rule_evaluations', file: 'trade_rule_evaluations', columns: 'id,user_id,trade_id,account_id,trade_date,rule_key,rule_label,outcome,evidence,rule_snapshot,evaluated_at,created_at', dependsOn: ['trades', 'accounts'] },
  { table: 'challenges', file: 'challenges', columns: 'id,user_id,account_id,rule_key,label,target,status,start_trade_date,started_at,completed_at,created_at', dependsOn: ['accounts'] },
  { table: 'habits', file: 'habits', columns: 'id,user_id,name,is_custom,is_active,sort_order,created_at', dependsOn: [] },
  { table: 'habit_logs', file: 'habit_logs', columns: 'id,habit_id,user_id,log_date,completed,created_at', dependsOn: ['habits'] },
];

const USER_PREFERENCES_COLUMNS = 'user_id,avatar_url,custom_emotions,default_confidence,onboarding_complete,custom_setups,calendar_mode,calendar_start,calendar_end,calendar_rolling_days,show_calendar,show_payouts,show_trophies,show_trades,full_name,custom_tags,active_account_id';

const IMPORT_ORDER = ['accounts', 'setups', 'trades', 'journal_entries', 'ai_insights', 'expenses', 'payouts', 'trophies', 'rulebook_rules', 'discipline_programs', 'discipline_rules', 'discipline_program_focus_rules', 'discipline_program_trading_days', 'trade_rule_breaks', 'discipline_trade_reviews', 'discipline_review_rule_checks', 'discipline_score_snapshots', 'discipline_weekly_reviews', 'discipline_badge_events', 'trade_rule_evaluations', 'challenges', 'habits', 'habit_logs'];

function utf8Json(value) {
  return Buffer.from(JSON.stringify(value), 'utf8');
}

function jsonFromEntry(files, path) {
  const content = files.get(path);
  if (!content) throw new Error(`Backup archive is missing ${path}.`);
  try { return JSON.parse(content.toString('utf8')); } catch { throw new Error(`Backup archive contains invalid JSON in ${path}.`); }
}

async function readAllRows(supabase, spec, userId) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(spec.table)
      .select(spec.columns)
      .eq('user_id', userId)
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Unable to export ${spec.table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

function getPublicStoragePath(url, bucket) {
  if (typeof url !== 'string') return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const raw = url.slice(index + marker.length);
  try {
    const path = decodeURIComponent(raw.split('?')[0]);
    if (!path || path.includes('..') || path.startsWith('/')) return null;
    return path;
  } catch { return null; }
}

function collectAssetReferences(preferences, records) {
  const assets = [];
  function add(bucket, url) {
    const path = getPublicStoragePath(url, bucket);
    if (path) assets.push({ bucket, path, originalUrl: url });
  }
  add('avatars', preferences?.avatar_url);
  for (const setup of records.setups || []) for (const url of setup.reference_images || []) add('screenshots', url);
  for (const journal of records.journal_entries || []) {
    add('screenshots', journal.screenshot_url);
    for (const url of journal.screenshot_urls || []) add('screenshots', url);
  }
  for (const trophy of records.trophies || []) add('trophies', trophy.file_url);
  const unique = new Map();
  assets.forEach((asset) => unique.set(`${asset.bucket}:${asset.path}`, asset));
  return [...unique.values()];
}

async function exportAssets(supabase, references) {
  const entries = [];
  const manifest = [];
  for (const asset of references) {
    const { data, error } = await supabase.storage.from(asset.bucket).download(asset.path);
    if (error || !data) throw new Error(`Unable to export an attached file from ${asset.bucket}.`);
    const content = Buffer.from(await data.arrayBuffer());
    if (content.length > BACKUP_LIMITS.maxEntryBytes) throw new Error('An attached file exceeds the 10MB backup limit.');
    const safePath = asset.path.replace(/[^a-zA-Z0-9_./-]/g, '_');
    const archivePath = `assets/${asset.bucket}/${safePath}`;
    entries.push({ path: archivePath, content });
    manifest.push({ bucket: asset.bucket, path: asset.path, originalUrl: asset.originalUrl, archivePath, sha256: sha256(content), bytes: content.length });
  }
  return { entries, manifest };
}

export async function createProfileBackup(supabase, user) {
  if (!user?.id) throw new Error('You must be signed in.');
  const { data: preferences, error: preferencesError } = await supabase
    .from('user_preferences')
    .select(USER_PREFERENCES_COLUMNS)
    .eq('user_id', user.id)
    .maybeSingle();
  if (preferencesError) throw new Error(`Unable to export preferences: ${preferencesError.message}`);

  const records = {};
  for (const spec of TABLE_SPECS) records[spec.file] = await readAllRows(supabase, spec, user.id);
  const entries = [];
  const files = {};
  for (const spec of TABLE_SPECS) {
    const archivePath = `data/${spec.file}.json`;
    const content = utf8Json(records[spec.file]);
    entries.push({ path: archivePath, content });
    files[archivePath] = { sha256: sha256(content), rows: records[spec.file].length };
  }
  const preferencesContent = utf8Json(preferences || {});
  entries.push({ path: 'data/user_preferences.json', content: preferencesContent });
  files['data/user_preferences.json'] = { sha256: sha256(preferencesContent), rows: preferences ? 1 : 0 };

  const { entries: assetEntries, manifest: assets } = await exportAssets(supabase, collectAssetReferences(preferences, records));
  for (const asset of assetEntries) {
    entries.push(asset);
    files[asset.path] = { sha256: sha256(asset.content), rows: null };
  }
  const manifest = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    source: 'PropLogAI',
    tables: TABLE_SPECS.map((spec) => ({ table: spec.table, file: `data/${spec.file}.json`, rows: records[spec.file].length, dependsOn: spec.dependsOn })),
    files,
    assets,
    exclusions: ['authentication identities and sessions', 'subscriptions and payment records', 'referral and affiliate financial records', 'admin state, support tickets, notifications and webhook events', 'Google Drive credentials'],
  };
  entries.unshift({ path: 'manifest.json', content: utf8Json(manifest) });
  return { archive: createBackupZip(entries), manifest };
}

function ensureAllowedArchive(files, manifest) {
  if (!manifest || manifest.format !== BACKUP_FORMAT || manifest.version !== BACKUP_VERSION) throw new Error('This file is not a supported PropLogAI backup.');
  if (!Array.isArray(manifest.tables) || !manifest.files || typeof manifest.files !== 'object') throw new Error('Backup manifest is incomplete.');
  const allowed = new Set(['manifest.json', 'data/user_preferences.json', ...TABLE_SPECS.map((spec) => `data/${spec.file}.json`)]);
  for (const asset of manifest.assets || []) allowed.add(asset.archivePath);
  for (const [path, content] of files.entries()) {
    if (!allowed.has(path)) throw new Error('Backup archive contains a file outside the supported allowlist.');
    const expected = manifest.files[path];
    if (!expected || expected.sha256 !== sha256(content)) throw new Error(`Backup checksum failed for ${path}.`);
  }
  for (const spec of TABLE_SPECS) {
    const rows = jsonFromEntry(files, `data/${spec.file}.json`);
    if (!Array.isArray(rows)) throw new Error(`Backup data for ${spec.table} must be an array.`);
  }
}

export function inspectProfileBackup(buffer) {
  const files = readBackupZip(buffer);
  const manifest = jsonFromEntry(files, 'manifest.json');
  ensureAllowedArchive(files, manifest);
  const tables = {};
  for (const spec of TABLE_SPECS) tables[spec.file] = jsonFromEntry(files, `data/${spec.file}.json`);
  const preferences = jsonFromEntry(files, 'data/user_preferences.json');
  return { files, manifest, tables, preferences };
}

function mapId(mappings, table, id) {
  if (!id) return null;
  return mappings[table]?.get(id) || id;
}

function removeId(row) {
  const copy = { ...row };
  delete copy.id;
  delete copy.user_id;
  return copy;
}

function setForeignKeys(table, row, mappings) {
  const next = removeId(row);
  const map = (column, target) => { if (next[column]) next[column] = mapId(mappings, target, next[column]); };
  if (table === 'trades') {
    map('account_id', 'accounts'); map('setup_id', 'setups');
    if (Array.isArray(next.setup_ids)) next.setup_ids = next.setup_ids.map((id) => mapId(mappings, 'setups', id));
    delete next.share_id; delete next.shared_until;
  }
  if (table === 'journal_entries' || table === 'ai_insights' || table === 'trade_rule_evaluations') map('trade_id', 'trades');
  if (table === 'rulebook_rules' || table === 'discipline_programs' || table === 'discipline_rules' || table === 'discipline_program_trading_days' || table === 'trade_rule_evaluations' || table === 'challenges') map('account_id', 'accounts');
  if (table === 'discipline_rules' || table === 'discipline_program_focus_rules' || table === 'discipline_program_trading_days' || table === 'trade_rule_breaks' || table === 'discipline_trade_reviews' || table === 'discipline_score_snapshots' || table === 'discipline_weekly_reviews' || table === 'discipline_badge_events') map('program_id', 'discipline_programs');
  if (table === 'discipline_program_focus_rules' || table === 'trade_rule_breaks' || table === 'discipline_review_rule_checks') map('rule_id', 'discipline_rules');
  if (table === 'trade_rule_breaks' || table === 'discipline_trade_reviews') map('trade_id', 'trades');
  if (table === 'discipline_review_rule_checks') map('review_id', 'discipline_trade_reviews');
  if (table === 'habit_logs') map('habit_id', 'habits');
  return next;
}

function applyAssetUrlMap(value, urlMap) {
  if (typeof value === 'string') return urlMap.get(value) || value;
  if (Array.isArray(value)) return value.map((item) => applyAssetUrlMap(item, urlMap));
  if (value && typeof value === 'object') {
    const output = {};
    for (const [key, item] of Object.entries(value)) output[key] = applyAssetUrlMap(item, urlMap);
    return output;
  }
  return value;
}

async function restoreAssets(supabase, userId, inspected) {
  const urlMap = new Map();
  for (const asset of inspected.manifest.assets || []) {
    const content = inspected.files.get(asset.archivePath);
    if (!content) throw new Error('Backup asset is missing.');
    const destination = `${userId}/restored/${inspected.manifest.exportedAt.replace(/[^0-9]/g, '').slice(0, 14)}/${asset.path.replace(/[^a-zA-Z0-9_./-]/g, '_')}`;
    const { error } = await supabase.storage.from(asset.bucket).upload(destination, content, { upsert: true, contentType: 'application/octet-stream' });
    if (error) throw new Error(`Unable to restore an attached file: ${error.message}`);
    const { data } = supabase.storage.from(asset.bucket).getPublicUrl(destination);
    urlMap.set(asset.originalUrl, data.publicUrl);
  }
  return urlMap;
}

async function findExistingBySourceId(supabase, table, sourceId, userId) {
  const { data, error } = await supabase
    .from('backup_import_mappings')
    .select('destination_id')
    .eq('user_id', userId)
    .eq('source_table', table)
    .eq('source_id', sourceId)
    .maybeSingle();
  if (error) throw new Error(`Unable to verify an existing restored record: ${error.message}`);
  return data?.destination_id || null;
}

async function saveMapping(supabase, userId, table, sourceId, destinationId) {
  const { error } = await supabase.from('backup_import_mappings').upsert({ user_id: userId, source_table: table, source_id: sourceId, destination_id: destinationId }, { onConflict: 'user_id,source_table,source_id' });
  if (error) throw new Error(`Unable to save import mapping: ${error.message}`);
}

export async function restoreProfileBackup(supabase, user, buffer, { dryRun = false } = {}) {
  if (!user?.id) throw new Error('You must be signed in.');
  const inspected = inspectProfileBackup(buffer);
  const report = { inserted: 0, skipped: 0, conflicts: [], tables: {}, assets: 0 };
  if (dryRun) {
    for (const table of IMPORT_ORDER) {
      const rows = inspected.tables[table] || [];
      let alreadyImported = 0;
      for (const row of rows) {
        if (row?.id && await findExistingBySourceId(supabase, table, row.id, user.id)) alreadyImported += 1;
      }
      report.tables[table] = { proposed: rows.length, alreadyImported };
    }
    return { report, manifest: inspected.manifest };
  }

  const urlMap = await restoreAssets(supabase, user.id, inspected);
  report.assets = urlMap.size;
  const mappings = {};
  for (const table of IMPORT_ORDER) mappings[table] = new Map();

  for (const table of IMPORT_ORDER) {
    const rows = inspected.tables[table] || [];
    report.tables[table] = { inserted: 0, skipped: 0 };
    for (const row of rows) {
      if (!row?.id || typeof row.id !== 'string') throw new Error(`Backup ${table} contains an invalid source id.`);
      const existing = await findExistingBySourceId(supabase, table, row.id, user.id);
      if (existing) {
        mappings[table].set(row.id, existing);
        report.skipped += 1; report.tables[table].skipped += 1;
        continue;
      }
      const payload = applyAssetUrlMap(setForeignKeys(table, row, mappings), urlMap);
      payload.user_id = user.id;
      const { data, error } = await supabase.from(table).insert(payload).select('id').single();
      if (error || !data?.id) {
        report.conflicts.push({ table, sourceId: row.id, reason: error?.message || 'Insert failed' });
        continue;
      }
      await saveMapping(supabase, user.id, table, row.id, data.id);
      mappings[table].set(row.id, data.id);
      report.inserted += 1; report.tables[table].inserted += 1;
    }
  }

  const preferences = applyAssetUrlMap(inspected.preferences || {}, urlMap);
  const preferencePayload = { ...preferences, user_id: user.id };
  delete preferencePayload.id; delete preferencePayload.referral_balance; delete preferencePayload.referred_by; delete preferencePayload.share_code; delete preferencePayload.is_admin; delete preferencePayload.is_beta;
  if (preferencePayload.active_account_id) preferencePayload.active_account_id = mapId(mappings, 'accounts', preferencePayload.active_account_id);
  const { error: preferenceError } = await supabase.from('user_preferences').upsert(preferencePayload, { onConflict: 'user_id' });
  if (preferenceError) report.conflicts.push({ table: 'user_preferences', reason: preferenceError.message });

  return { report, manifest: inspected.manifest };
}
