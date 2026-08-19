import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
const GOOGLE_DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')).replace(/\/$/, '');
}

function redirectUri() {
  const base = appUrl();
  if (!base) throw new Error('Backup Google Drive is not configured yet.');
  return `${base}/api/backups/google/callback`;
}

function config() {
  const clientId = process.env.GOOGLE_BACKUP_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_BACKUP_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Google Drive backup is not configured yet.');
  return { clientId, clientSecret };
}

function encryptionKey() {
  const raw = process.env.BACKUP_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error('Secure backup token storage is not configured yet.');
  const key = /^[a-f0-9]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('Secure backup token storage is misconfigured.');
  return key;
}

export function encryptToken(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return { ciphertext: encrypted.toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64') };
}

export function decryptToken(connection) {
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(connection.token_iv, 'base64'));
  decipher.setAuthTag(Buffer.from(connection.token_tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(connection.token_ciphertext, 'base64')), decipher.final()]).toString('utf8');
}

function hashState(state) {
  return createHash('sha256').update(state).digest('hex');
}

export async function startGoogleDriveConnection(supabase, user) {
  const state = randomBytes(32).toString('base64url');
  const { error } = await supabase.from('backup_oauth_states').insert({
    user_id: user.id,
    state_hash: hashState(state),
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
  if (error) throw new Error(`Unable to start Google Drive connection: ${error.message}`);
  const { clientId } = config();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: DRIVE_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function finishGoogleDriveConnection(supabase, user, code, state) {
  if (!code || !state) throw new Error('Google Drive did not return a valid connection response.');
  const { data: savedState, error: stateError } = await supabase
    .from('backup_oauth_states')
    .select('id, expires_at')
    .eq('user_id', user.id)
    .eq('state_hash', hashState(state))
    .maybeSingle();
  if (stateError || !savedState || new Date(savedState.expires_at) < new Date()) throw new Error('This Google Drive connection link has expired. Try again.');
  await supabase.from('backup_oauth_states').delete().eq('id', savedState.id).eq('user_id', user.id);

  const { clientId, clientSecret } = config();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri(), grant_type: 'authorization_code' }),
  });
  const tokens = await response.json();
  if (!response.ok || !tokens.refresh_token) throw new Error('Google Drive did not provide a reusable backup connection. Try connecting again.');
  const encrypted = encryptToken(JSON.stringify(tokens));
  const { error } = await supabase.from('backup_drive_connections').upsert({
    user_id: user.id,
    provider: 'google_drive',
    status: 'connected',
    token_ciphertext: encrypted.ciphertext,
    token_iv: encrypted.iv,
    token_tag: encrypted.tag,
    token_expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
    connected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    revoked_at: null,
  }, { onConflict: 'user_id' });
  if (error) throw new Error(`Unable to save the Google Drive connection: ${error.message}`);
}

async function accessToken(connection) {
  const tokens = JSON.parse(decryptToken(connection));
  if (tokens.access_token && connection.token_expires_at && new Date(connection.token_expires_at).getTime() > Date.now() + 60 * 1000) return { accessToken: tokens.access_token, tokens };
  const { clientId, clientSecret } = config();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: tokens.refresh_token, grant_type: 'refresh_token' }),
  });
  const refreshed = await response.json();
  if (!response.ok || !refreshed.access_token) throw new Error('Google Drive access expired. Reconnect Google Drive and try again.');
  return { accessToken: refreshed.access_token, tokens: { ...tokens, ...refreshed, refresh_token: tokens.refresh_token } };
}

async function persistTokens(supabase, userId, tokens) {
  const encrypted = encryptToken(JSON.stringify(tokens));
  const { error } = await supabase.from('backup_drive_connections').update({
    token_ciphertext: encrypted.ciphertext,
    token_iv: encrypted.iv,
    token_tag: encrypted.tag,
    token_expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId);
  if (error) throw new Error(`Unable to refresh the Google Drive backup connection: ${error.message}`);
}

export async function uploadGoogleDriveBackup(supabase, userId, connection, archive, filename) {
  const { accessToken, tokens } = await accessToken(connection);
  await persistTokens(supabase, userId, tokens);
  const boundary = `proplogai-${randomBytes(12).toString('hex')}`;
  const metadata = Buffer.from(JSON.stringify({ name: filename, parents: ['appDataFolder'], mimeType: 'application/zip' }));
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`), metadata,
    Buffer.from(`\r\n--${boundary}\r\nContent-Type: application/zip\r\n\r\n`), archive,
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  const response = await fetch(GOOGLE_DRIVE_UPLOAD_URL, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` }, body });
  const payload = await response.json();
  if (!response.ok || !payload.id) throw new Error('Google Drive could not save this backup.');
  return payload.id;
}

export async function downloadGoogleDriveBackup(supabase, userId, connection, providerFileId) {
  const { accessToken, tokens } = await accessToken(connection);
  await persistTokens(supabase, userId, tokens);
  const response = await fetch(`${GOOGLE_DRIVE_FILES_URL}/${encodeURIComponent(providerFileId)}?alt=media`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error('The latest Google Drive backup is unavailable. Create a new cloud backup and try again.');
  return Buffer.from(await response.arrayBuffer());
}

export async function retainLatestGoogleDriveBackups(supabase, userId, connection, keep = 7) {
  const { data: runs, error } = await supabase.from('backup_runs')
    .select('id, provider_file_id, completed_at')
    .eq('user_id', userId)
    .eq('destination', 'google_drive')
    .eq('status', 'completed')
    .not('provider_file_id', 'is', null)
    .order('completed_at', { ascending: false });
  if (error || !runs || runs.length <= keep) return;
  const { accessToken } = await accessToken(connection);
  for (const run of runs.slice(keep)) {
    const response = await fetch(`${GOOGLE_DRIVE_FILES_URL}/${encodeURIComponent(run.provider_file_id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
    if (response.ok || response.status === 404) await supabase.from('backup_runs').update({ provider_file_id: null }).eq('id', run.id).eq('user_id', userId);
  }
}

export async function revokeGoogleDriveConnection(supabase, userId) {
  const { error } = await supabase.from('backup_drive_connections').update({ status: 'revoked', token_ciphertext: '', token_iv: '', token_tag: '', revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('user_id', userId);
  if (error) throw new Error(`Unable to revoke the Google Drive connection: ${error.message}`);
}
