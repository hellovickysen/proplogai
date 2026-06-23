"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createTrophy, deleteTrophy, togglePublic } from '@/app/dashboard/trophies/actions';
import { useToast } from '@/components/Toast';
import { TrophyEmptyIcon } from '@/components/EmptyStates';


const gradientText = { background: 'linear-gradient(135deg,#ffc42d,#ff9f1c)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
const field = 'w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400/60';
const labelCls = 'mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55';

const CATEGORIES = [
  { value: 'payout', label: 'Payout Certificate', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30' },
  { value: 'challenge_pass', label: 'Challenge Pass', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30' },
  { value: 'funded', label: 'Funded Account', color: 'bg-violet-500/15 text-violet-300 border-violet-400/30' },
  { value: 'other', label: 'Other', color: 'bg-white/10 text-white/60 border-white/20' },
];

function getCategoryStyle(cat) {
  return CATEGORIES.find((c) => c.value === cat) || CATEGORIES[3];
}

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return ''; }
}

/* ─── Modal ──────────────────────────────────────────────────── */

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e0e18] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white">&#10005;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Lightbox ───────────────────────────────────────────────── */

function Lightbox({ trophy, onClose }) {
  if (!trophy) return null;
  const cat = getCategoryStyle(trophy.category);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={onClose}>
      <div className="mx-4 max-h-[90vh] max-w-4xl overflow-auto rounded-2xl border border-white/10 bg-[#0e0e18] p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold">{trophy.title}</h3>
            <div className="mt-1 flex items-center gap-2">
              <span className={'rounded-full border px-2 py-0.5 text-[10px] font-semibold ' + cat.color}>{cat.label}</span>
              <span className="font-mono text-[11px] text-white/40">{fmtDate(trophy.created_at)}</span>
            </div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white">&#10005;</button>
        </div>
        {trophy.description && <p className="mb-3 text-sm text-white/60">{trophy.description}</p>}
        <img src={trophy.file_url} alt={trophy.title} className="w-full rounded-xl" />
      </div>
    </div>
  );
}

/* ─── Upload Form ────────────────────────────────────────────── */

function UploadTrophyForm({ onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('payout');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File must be under 10MB');
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = user.id + '/' + Date.now() + '_' + safe;
    const { error } = await supabase.storage.from('trophies').upload(path, file, { upsert: true });
    if (error) {
      alert('Upload failed: ' + error.message);
      setUploading(false);
      return;
    }
    const pub = supabase.storage.from('trophies').getPublicUrl(path);
    setFileUrl(pub.data.publicUrl);
    setPreview(pub.data.publicUrl);
    setUploading(false);
    e.target.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!fileUrl) return;
    setSaving(true);
    await onSave({ title, category, description, file_url: fileUrl });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Upload certificate / proof *</label>
        {preview ? (
          <div className="mb-3">
            <img src={preview} alt="Preview" className="h-32 rounded-xl border border-white/10 object-cover" />
          </div>
        ) : null}
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFile}
          className="block w-full text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-white"
        />
        {uploading && <p className="mt-1 text-xs text-cyan-400">Uploading...</p>}
      </div>

      <div>
        <label className={labelCls}>Title *</label>
        <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. FTMO $100K Payout — March 2026" required />
      </div>

      <div>
        <label className={labelCls}>Category</label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => (
            <button key={c.value} type="button" onClick={() => setCategory(c.value)}
              className={'rounded-lg border px-3 py-2 text-xs font-semibold ' + (category === c.value ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300' : 'border-white/10 bg-black/30 text-white/50')}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Description (optional)</label>
        <textarea className={field} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Any details about this achievement..." />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70">Cancel</button>
        <button type="submit" disabled={saving || uploading || !fileUrl} className="flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#ffc42d,#ff9f1c)' }}>
          {saving ? 'Saving...' : 'Add Trophy'}
        </button>
      </div>
    </form>
  );
}

/* ─── Trophy Card ────────────────────────────────────────────── */

function TrophyCard({ trophy, onView, onTogglePublic, onDelete, onCopyLink }) {
  const cat = getCategoryStyle(trophy.category);
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden transition-all hover:border-white/20 hover:bg-white/[0.05]">
      {/* Image */}
      <button onClick={() => onView(trophy)} className="block w-full">
        <div className="relative aspect-[4/3] overflow-hidden bg-black/40">
          <img src={trophy.file_url} alt={trophy.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
          <div className="absolute left-2 top-2">
            <span className={'rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ' + cat.color}>{cat.label}</span>
          </div>
        </div>
      </button>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-display text-sm font-semibold leading-tight">{trophy.title}</h3>
        {trophy.description && <p className="mt-1 text-xs text-white/45 line-clamp-2">{trophy.description}</p>}
        <div className="mt-2 font-mono text-[11px] text-white/35">{fmtDate(trophy.created_at)}</div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3">
          <button
            onClick={() => onTogglePublic(trophy.id, !trophy.is_public)}
            className={'rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ' + (trophy.is_public ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-white/5 text-white/50')}
          >
            {trophy.is_public ? '&#127760; Public' : '&#128274; Private'}
          </button>
          {trophy.is_public && trophy.share_id && (
            <button
              onClick={() => onCopyLink(trophy.share_id)}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-white/50 hover:text-cyan-300"
            >
              Copy link
            </button>
          )}
          <button
            onClick={() => onDelete(trophy.id)}
            className="ml-auto rounded-lg border border-red-400/20 bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-300 hover:bg-red-500/20"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */

export default function TrophyWall({ trophies }) {
  const router = useRouter();
  const toast = useToast();
  const [showUpload, setShowUpload] = useState(false);
  const [viewing, setViewing] = useState(null);

  async function handleUpload(data) {
    const res = await createTrophy(data);
    if (res.error) { if (toast) toast.error(res.error); }
    else { if (toast) toast.success('Trophy added!'); setShowUpload(false); router.refresh(); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this trophy?')) return;
    const res = await deleteTrophy(id);
    if (res.error) { if (toast) toast.error(res.error); }
    else { if (toast) toast.success('Trophy deleted.'); router.refresh(); }
  }

  async function handleTogglePublic(id, isPublic) {
    const res = await togglePublic(id, isPublic);
    if (res.error) { if (toast) toast.error(res.error); }
    else {
      if (isPublic && res.share_id) {
        if (toast) toast.success('Trophy is now public!');
      } else {
        if (toast) toast.success('Trophy is now private.');
      }
      router.refresh();
    }
  }

  function handleCopyLink(shareId) {
    const url = window.location.origin + '/trophy/' + shareId;
    navigator.clipboard.writeText(url);
    if (toast) toast.success('Link copied!');
  }

  // Empty state
  if (trophies.length === 0 && !showUpload) {
    return (
      <div className="px-6 py-8">
        <h1 className="font-display text-2xl font-bold">Trophy Wall</h1>
        <p className="mt-1 text-sm text-white/55">Showcase your trading achievements</p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <TrophyEmptyIcon />
          <h2 className="font-display text-xl font-bold">No trophies yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
            Upload your payout certificates, challenge passes, and funded account proofs.
            Show the world what you have achieved.
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="mt-6 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f]"
            style={{ background: 'linear-gradient(135deg,#ffc42d,#ff9f1c)' }}
          >
            + Upload your first trophy
          </button>
        </div>

        <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Upload Trophy">
          <UploadTrophyForm onSave={handleUpload} onCancel={() => setShowUpload(false)} />
        </Modal>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Trophy Wall</h1>
          <p className="mt-1 text-sm text-white/55">
            {trophies.length} achievement{trophies.length !== 1 ? 's' : ''} earned
          </p>
        </div>
        <button onClick={() => setShowUpload(true)} className="rounded-xl px-4 py-2 text-sm font-semibold text-[#08080f]" style={{ background: 'linear-gradient(135deg,#ffc42d,#ff9f1c)' }}>
          + Upload Trophy
        </button>
      </div>

      {/* Gallery grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {trophies.map((t) => (
          <TrophyCard
            key={t.id}
            trophy={t}
            onView={setViewing}
            onTogglePublic={handleTogglePublic}
            onDelete={handleDelete}
            onCopyLink={handleCopyLink}
          />
        ))}
      </div>

      {/* Lightbox */}
      <Lightbox trophy={viewing} onClose={() => setViewing(null)} />

      {/* Upload modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Upload Trophy">
        <UploadTrophyForm onSave={handleUpload} onCancel={() => setShowUpload(false)} />
      </Modal>
    </div>
  );
}