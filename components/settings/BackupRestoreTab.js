"use client";

import { useRef, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import BlurGate from '@/components/ui/BlurGate';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const card = 'rounded-2xl border border-white/10 bg-white/[0.03] p-6';
const secondaryButton = 'rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50';
const primaryButton = 'rounded-xl px-4 py-2.5 text-sm font-semibold text-[#08080f] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';

function countPreview(preview) {
  return Object.values(preview?.report?.tables || {}).reduce((total, item) => total + (item.proposed || 0), 0);
}

function startProgress(setProgress) {
  return window.setInterval(() => setProgress((value) => value < 92 ? value + Math.max(1, Math.ceil((92 - value) / 10)) : value), 180);
}

export default function BackupRestoreTab({ planAccess, backupStatus }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [driveBusy, setDriveBusy] = useState(false);
  const [cloudRestoreBusy, setCloudRestoreBusy] = useState(false);
  const [exportState, setExportState] = useState('idle');
  const [exportProgress, setExportProgress] = useState(0);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [lastRestore, setLastRestore] = useState(null);
  const [lastManualBackup, setLastManualBackup] = useState(backupStatus?.lastCompletedAt || null);
  const [unavailableAssets, setUnavailableAssets] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [driveConnected, setDriveConnected] = useState(Boolean(backupStatus?.driveConnected));
  const [lastCloudBackup, setLastCloudBackup] = useState(backupStatus?.lastCloudBackupAt || null);
  const [driveFolderId, setDriveFolderId] = useState(backupStatus?.driveFolderId || null);
  const [driveEmail] = useState(backupStatus?.driveEmail || null);
  const [cloudVersionCount, setCloudVersionCount] = useState(backupStatus?.cloudVersionCount || 0);

  async function downloadBackup() {
    if (exportState === 'preparing') return;
    setExportState('preparing'); setExportProgress(0); setError(null);
    const progressTimer = startProgress(setExportProgress);
    try {
      const response = await fetch('/api/backups/export');
      setExportProgress(70);
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Unable to create a backup.');
      }
      const blob = await response.blob();
      const filename = response.headers.get('Content-Disposition')?.match(/filename="?([^";]+)"?/)?.[1] || 'proplogai-backup.zip';
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
      setUnavailableAssets(Number(response.headers.get('X-Backup-Unavailable-Assets') || 0));
      setLastManualBackup(new Date().toISOString());
      window.clearInterval(progressTimer);
      setExportProgress(100);
      setExportState('complete');
      window.setTimeout(() => setExportState('idle'), 5000);
      toast?.success('Manual backup complete.');
    } catch (err) {
      window.clearInterval(progressTimer);
      setError(err.message || 'Unable to create a backup.');
      toast?.error(err.message || 'Unable to create a backup.');
      setExportState('idle');
    }
  }

  async function inspectSelectedFile(nextFile) {
    setFile(nextFile || null); setPreview(null); setResult(null); setError(null); setPreviewProgress(0);
    if (!nextFile) return;
    setPreviewBusy(true); setPreviewProgress(0);
    const progressTimer = startProgress(setPreviewProgress);
    try {
      const body = new FormData(); body.append('file', nextFile);
      const response = await fetch('/api/backups/import-preview', { method: 'POST', body });
      const payload = await response.json();
      setPreviewProgress(85);
      if (!response.ok) throw new Error(payload.error || 'Unable to inspect this backup.');
      window.clearInterval(progressTimer);
      setPreview(payload); setPreviewProgress(100);
    } catch (err) {
      window.clearInterval(progressTimer);
      setError(err.message || 'Unable to inspect this backup.');
    } finally { setPreviewBusy(false); }
  }

  async function uploadToDrive() {
    if (driveBusy) return;
    setDriveBusy(true); setError(null);
    try {
      const response = await fetch('/api/backups/google/upload', { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to back up to Google Drive.');
      setLastCloudBackup(payload.completedAt || new Date().toISOString());
      setDriveFolderId(payload.folderId || null);
      setCloudVersionCount((count) => Math.min(7, count + 1));
      toast?.success('Cloud backup complete.');
    } catch (err) {
      setError(err.message || 'Unable to back up to Google Drive.');
      toast?.error(err.message || 'Unable to back up to Google Drive.');
    } finally { setDriveBusy(false); }
  }

  async function restoreLatestCloudBackup() {
    if (cloudRestoreBusy || !lastCloudBackup) return;
    setCloudRestoreBusy(true); setError(null);
    try {
      const response = await fetch('/api/backups/google/restore-latest', { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to restore the latest cloud backup.');
      setLastRestore(payload.report); window.setTimeout(() => setLastRestore(null), 5000);
      toast?.success('Latest cloud backup restored.');
    } catch (err) {
      setError(err.message || 'Unable to restore the latest cloud backup.');
      toast?.error(err.message || 'Unable to restore the latest cloud backup.');
    } finally { setCloudRestoreBusy(false); }
  }

  function requestDisconnectDrive() {
    if (!driveBusy) setConfirmDisconnect(true);
  }

  async function revokeDrive() {
    setConfirmDisconnect(false);
    if (driveBusy) return;
    setDriveBusy(true); setError(null);
    try {
      const response = await fetch('/api/backups/google/revoke', { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to disconnect Google Drive.');
      setDriveConnected(false); toast?.success('Google Drive disconnected.');
    } catch (err) {
      setError(err.message || 'Unable to disconnect Google Drive.');
    } finally { setDriveBusy(false); }
  }

  function requestRestore() {
    if (!file || !preview || previewBusy || restoreBusy) return;
    setConfirmRestore(true);
  }

  async function restore() {
    setConfirmRestore(false);
    if (!file || !preview || previewBusy || restoreBusy) return;
    setRestoreBusy(true); setRestoreProgress(0); setError(null);
    const progressTimer = startProgress(setRestoreProgress);
    try {
      const body = new FormData(); body.append('file', file);
      const response = await fetch('/api/backups/import', { method: 'POST', body });
      const payload = await response.json();
      setRestoreProgress(90);
      if (!response.ok) throw new Error(payload.error || 'Unable to restore this backup.');
      window.clearInterval(progressTimer);
      setResult(payload.report); setLastRestore(payload.report); setFile(null); setPreview(null); setRestoreProgress(100);
      window.setTimeout(() => setLastRestore(null), 5000);
      toast?.success('Recovery complete.');
    } catch (err) {
      window.clearInterval(progressTimer);
      setError(err.message || 'Unable to restore this backup.');
      toast?.error(err.message || 'Unable to restore this backup.');
    } finally { setRestoreBusy(false); }
  }

  return (
    <div className="space-y-6">
      <section className={card + ' overflow-hidden'}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">Recovery centre</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white">Your account is recoverable.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">One owner-bound archive protects every account, trade, journal, discipline record and available attachment.</p>
          </div>
          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.15em] text-cyan-100/55">Last manual backup</p>
            <p className="mt-1 text-sm font-semibold text-cyan-50">{lastManualBackup ? new Date(lastManualBackup).toLocaleString() : 'Not created yet'}</p>
          </div>
        </div>
        {exportState === 'preparing' && <div className="mt-6"><div className="mb-2 flex justify-between text-xs text-cyan-100"><span>Preparing your archive</span><span>{exportProgress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-300 transition-all duration-300" style={{ width: `${exportProgress}%` }} /></div></div>}
        {exportState === 'complete' && <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5 text-sm text-emerald-300"><span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-400/15">✓</span><span>Manual backup complete.</span></div>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={downloadBackup} disabled={exportState === 'preparing'} className={primaryButton} style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>{exportState === 'preparing' ? 'Preparing backup…' : 'Create manual backup'}</button>
          <button type="button" className={secondaryButton} onClick={() => inputRef.current?.click()} disabled={previewBusy}>Restore an archive</button>
          <input ref={inputRef} type="file" accept=".zip,application/zip" className="hidden" onChange={(event) => inspectSelectedFile(event.target.files?.[0])} />
        </div>
        {unavailableAssets > 0 && <p className="mt-4 text-xs text-amber-200">{unavailableAssets} stale attachment reference{unavailableAssets === 1 ? '' : 's'} could not be included. Your account data and available files were backed up.</p>}
        <p className="mt-4 text-xs leading-5 text-white/35">Owner-bound backups never include login credentials, subscriptions, payment records, affiliate balances, support tickets or Drive credentials.</p>
      </section>

      {file && (
        <section className={card}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">Restore preview</p>
          {previewBusy && <div className="mt-4"><div className="mb-2 flex justify-between text-xs text-cyan-100"><span>Checking archive integrity</span><span>{previewProgress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-300 transition-all duration-300" style={{ width: `${previewProgress}%` }} /></div></div>}
          {!previewBusy && preview && (countPreview(preview) > 0 ? (
            <>
              <h3 className="mt-2 font-display text-lg font-semibold">{countPreview(preview).toLocaleString()} records ready for safe merge</h3>
              <p className="mt-1 text-sm text-white/55">Existing data stays in place. Only missing records will be restored.</p>
              <button type="button" onClick={requestRestore} disabled={restoreBusy} className={'mt-5 ' + primaryButton} style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>{restoreBusy ? 'Restoring…' : 'Restore now'}</button>
            </>
          ) : (
            <div className="mt-3 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] p-4"><p className="font-semibold text-emerald-100">Already up to date</p><p className="mt-1 text-sm text-emerald-100/70">No records need restoring. {preview.report?.duplicates || 0} known records are already present in this account.</p></div>
          ))}
          {restoreBusy && <div className="mt-4"><div className="mb-2 flex justify-between text-xs text-cyan-100"><span>Restoring safely</span><span>{restoreProgress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-300 transition-all duration-300" style={{ width: `${restoreProgress}%` }} /></div></div>}
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          {result && <p className="mt-3 text-sm text-emerald-300">Restored {result.inserted} records; skipped {result.skipped} known duplicates; {result.conflicts.length} conflicts need review.</p>}
        </section>
      )}

      {lastRestore && <section className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-6"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100/60">Recovery complete</p><div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-2"><span className="font-display text-2xl font-semibold text-emerald-50">{lastRestore.inserted} restored</span><span className="text-sm text-emerald-100/75">{lastRestore.skipped} known duplicates skipped</span><span className="text-sm text-emerald-100/75">{lastRestore.conflicts.length} conflicts</span></div></section>}

      <BlurGate feature="google_drive_backup" access={planAccess} message="Daily Google Drive backups are an Elite feature">
        <section className={card}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">Elite cloud continuity</p>
          <h3 className="mt-2 font-display text-lg font-semibold">Google Drive backup</h3>
          <p className="mt-1 max-w-xl text-sm text-white/55">{driveConnected ? `Connected as ${driveEmail || 'your Google account'} · ${cloudVersionCount} of 7 cloud versions protected` : 'Connect Google Drive for on-demand backup and a daily rolling window of seven protected versions.'}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="/api/backups/google/start" className={secondaryButton}>{driveConnected ? 'Reconnect Google Drive' : 'Connect Google Drive'}</a>
            <button type="button" onClick={uploadToDrive} className={primaryButton} style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }} disabled={!driveConnected || driveBusy}>{driveBusy ? 'Backing up…' : 'Back up to Drive'}</button>
            {lastCloudBackup && <button type="button" onClick={restoreLatestCloudBackup} className={secondaryButton} disabled={cloudRestoreBusy}>{cloudRestoreBusy ? 'Restoring latest…' : `Restore backup from ${new Date(lastCloudBackup).toLocaleDateString()}`}</button>}
            {driveFolderId && <a href={`https://drive.google.com/drive/folders/${driveFolderId}`} target="_blank" rel="noopener noreferrer" className={secondaryButton}>Open backup folder</a>}
            {driveConnected && <button type="button" onClick={requestDisconnectDrive} className={secondaryButton} disabled={driveBusy}>Disconnect</button>}
          </div>
          <p className="mt-3 text-xs text-white/40">{lastCloudBackup ? `Latest cloud backup: ${new Date(lastCloudBackup).toLocaleString()}` : 'Cloud copies will appear in your visible PropLogAI Backups Google Drive folder after the first backup.'}</p>
        </section>
      </BlurGate>

      <ConfirmDialog
        open={confirmRestore}
        onClose={() => setConfirmRestore(false)}
        onConfirm={restore}
        title="Restore this backup?"
        message="Your existing data stays in place. Only records missing from this account will be restored; known duplicates are skipped."
        confirmLabel="Restore safely"
        loadingLabel="Restoring…"
        loading={restoreBusy}
        variant="safe-restore"
      />
      <ConfirmDialog
        open={confirmDisconnect}
        onClose={() => setConfirmDisconnect(false)}
        onConfirm={revokeDrive}
        title="Disconnect Google Drive?"
        message="Scheduled cloud backups will stop. Your existing backup files stay in your PropLogAI Backups folder."
        confirmLabel="Disconnect"
        loadingLabel="Disconnecting…"
        loading={driveBusy}
      />
    </div>
  );
}
