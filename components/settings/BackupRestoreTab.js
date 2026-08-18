"use client";

import { useRef, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import BlurGate from '@/components/ui/BlurGate';

const card = 'rounded-2xl border border-white/10 bg-white/[0.03] p-6';
const secondaryButton = 'rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50';
const primaryButton = 'rounded-xl px-4 py-2.5 text-sm font-semibold text-[#08080f] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';

function countPreview(preview) {
  return Object.values(preview?.report?.tables || {}).reduce((total, item) => total + (item.proposed || 0), 0);
}

export default function BackupRestoreTab({ planAccess, backupStatus }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [driveBusy, setDriveBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [driveConnected, setDriveConnected] = useState(Boolean(backupStatus?.driveConnected));

  async function inspectSelectedFile(nextFile) {
    setFile(nextFile || null); setPreview(null); setResult(null); setError(null);
    if (!nextFile) return;
    setPreviewBusy(true);
    try {
      const body = new FormData(); body.append('file', nextFile);
      const response = await fetch('/api/backups/import-preview', { method: 'POST', body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to inspect this backup.');
      setPreview(payload);
    } catch (err) {
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
      toast?.success('Backup saved to Google Drive.');
    } catch (err) {
      setError(err.message || 'Unable to back up to Google Drive.');
      toast?.error(err.message || 'Unable to back up to Google Drive.');
    } finally { setDriveBusy(false); }
  }

  async function revokeDrive() {
    if (driveBusy || !window.confirm('Disconnect Google Drive? Scheduled backups will stop.')) return;
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

  async function restore() {
    if (!file || !preview || previewBusy || restoreBusy) return;
    if (!window.confirm('Restore this backup with safe merge? Existing data will stay in place; exact duplicates will be skipped.')) return;
    setRestoreBusy(true); setError(null);
    try {
      const body = new FormData(); body.append('file', file);
      const response = await fetch('/api/backups/import', { method: 'POST', body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to restore this backup.');
      setResult(payload.report); toast?.success('Backup restored with safe merge.');
    } catch (err) {
      setError(err.message || 'Unable to restore this backup.');
      toast?.error(err.message || 'Unable to restore this backup.');
    } finally { setRestoreBusy(false); }
  }

  return (
    <div className="space-y-6">
      <section className={card}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">Whole profile backup</p>
        <h2 className="mt-2 font-display text-xl font-semibold text-white">Keep your discipline evidence portable.</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">One backup includes every trading account, trade, journal, setup, AI analysis, discipline record, chart input, preference, and owned attachment. Dashboards rebuild from the restored source evidence.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href="/api/backups/export" className={primaryButton} style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>Download backup</a>
          <button type="button" className={secondaryButton} onClick={() => inputRef.current?.click()} disabled={previewBusy}>Choose backup to restore</button>
          <input ref={inputRef} type="file" accept=".zip,application/zip" className="hidden" onChange={(event) => inspectSelectedFile(event.target.files?.[0])} />
        </div>
        <p className="mt-4 text-xs leading-5 text-white/35">For safety, backups never include login credentials, subscriptions, payment records, affiliate balances, support tickets, or Google Drive credentials.</p>
      </section>

      {file && (
        <section className={card}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">Restore preview</p>
          {previewBusy && <p className="mt-3 text-sm text-cyan-300">Checking archive integrity…</p>}
          {!previewBusy && preview && (
            <>
              <h3 className="mt-2 font-display text-lg font-semibold">{countPreview(preview).toLocaleString()} records ready for safe merge</h3>
              <p className="mt-1 text-sm text-white/55">Existing records are not deleted or silently overwritten. A repeated import skips items already mapped from this archive.</p>
              <button type="button" onClick={restore} disabled={restoreBusy} className={'mt-5 ' + primaryButton} style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>{restoreBusy ? 'Restoring with safe merge…' : 'Restore with safe merge'}</button>
            </>
          )}
          {restoreBusy && <p className="mt-3 text-sm text-cyan-300">Applying safe-merge mappings…</p>}
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          {result && <p className="mt-3 text-sm text-emerald-300">Restored {result.inserted} records; skipped {result.skipped} known duplicates; {result.conflicts.length} conflicts need review.</p>}
        </section>
      )}

      <BlurGate feature="google_drive_backup" access={planAccess} message="Daily Google Drive backups are an Elite feature">
        <section className={card}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">Elite cloud continuity</p>
          <h3 className="mt-2 font-display text-lg font-semibold">Google Drive backup</h3>
          <p className="mt-1 max-w-xl text-sm text-white/55">Connect your Google Drive for an on-demand cloud copy and a daily protected backup. The latest 30 are retained automatically.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="/api/backups/google/start" className={secondaryButton}>{driveConnected ? 'Reconnect Google Drive' : 'Connect Google Drive'}</a>
            <button type="button" onClick={uploadToDrive} className={primaryButton} style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }} disabled={!driveConnected || driveBusy}>{driveBusy ? 'Backing up…' : 'Back up to Drive'}</button>
            {driveConnected && <button type="button" onClick={revokeDrive} className={secondaryButton} disabled={driveBusy}>Disconnect</button>}
          </div>
          {backupStatus?.lastCompletedAt && <p className="mt-3 text-xs text-white/40">Last completed backup: {new Date(backupStatus.lastCompletedAt).toLocaleString()}</p>}
        </section>
      </BlurGate>
    </div>
  );
}
