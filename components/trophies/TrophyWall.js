"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createTrophy, deleteTrophy, togglePublic } from '@/app/dashboard/trophies/actions';
import { processImageFile } from '@/lib/imageUtils';
import { useToast } from '@/components/ui/Toast';
import { TrophyEmptyIcon } from '@/components/ui/EmptyStates';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { UpgradeModal } from '@/components/ui/BlurGate';


const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
const field = 'w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400/60';
const labelCls = 'mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55';

const CATEGORIES = [
  { value: 'payout', label: 'Payout Certificate', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30' },
  { value: 'challenge_pass', label: 'Challenge Pass', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30' },
  { value: 'funded', label: 'Funded Certificate', color: 'bg-violet-500/15 text-violet-300 border-violet-400/30' },
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

/* --- Firm Name Autocomplete ----------------------------------------- */

function FirmNameInput({ value, onChange, firmNames }) {
  const [focused, setFocused] = useState(false);
  const suggestions = value.length >= 1
    ? firmNames.filter((fn) => fn.toLowerCase().startsWith(value.toLowerCase()) && fn.toLowerCase() !== value.toLowerCase())
    : [];
  const showDropdown = focused && suggestions.length > 0;

  return (
    <div className="relative">
      <input
        className={field}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="e.g. FTMO, Topstep, Apex..."
        required
      />
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded-lg border border-white/10 bg-[#12121a] shadow-xl">
          {suggestions.map((fn) => (
            <button
              key={fn}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange(fn); setFocused(false); }}
              className="block w-full px-3.5 py-2 text-left text-sm text-white/70 hover:bg-white/[0.06] hover:text-white"
            >
              {fn}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* --- Modal ---------------------------------------------------------- */

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e0e18] p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white">&#10005;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* --- Lightbox ------------------------------------------------------- */

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
              {trophy.firm_name && <span className="font-mono text-[11px] text-white/50">{trophy.firm_name}</span>}
              <span className="font-mono text-[11px] text-white/40">{fmtDate(trophy.created_at)}</span>
            </div>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white">&#10005;</button>
        </div>
        {trophy.description && <p className="mb-3 text-sm text-white/60">{trophy.description}</p>}
        <img src={trophy.file_url} alt={trophy.title} className="w-full rounded-xl" />
      </div>
    </div>
  );
}

/* --- Upload Form ---------------------------------------------------- */

function UploadTrophyForm({ onSave, onCancel, firmNames }) {
  const toast = useToast();
  const [firmName, setFirmName] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('payout');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [preview, setPreview] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }
    setUploading(true);

    // Convert to WebP
    const processed = await processImageFile(file);
    if (processed.error) {
      toast.error(processed.error);
      setUploading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const safe = processed.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = user.id + '/' + Date.now() + '_' + safe;
    const { error } = await supabase.storage.from('trophies').upload(path, processed.file, { upsert: true });
    if (error) {
      toast.error('Upload failed: ' + error.message);
      setUploading(false);
      return;
    }
    const pub = supabase.storage.from('trophies').getPublicUrl(path);
    setFileUrl(pub.data.publicUrl);
    setPreview(processed.preview);
    setUploading(false);
    e.target.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!fileUrl) return;
    setSaving(true);
    await onSave({ firm_name: firmName.trim(), title, category, description, file_url: fileUrl });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Prop firm name *</label>
        <FirmNameInput value={firmName} onChange={setFirmName} firmNames={firmNames || []} />
      </div>

      <div>
        <label className={labelCls}>Upload certificate / proof *</label>
        {preview ? (
          <div className="mb-3">
            <img src={preview} alt="Preview" className="h-32 w-full rounded-xl border border-white/10 object-cover" />
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
        <button type="submit" disabled={saving || uploading || !fileUrl || !firmName.trim()} className="flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
          {saving ? 'Saving...' : 'Add Trophy'}
        </button>
      </div>
    </form>
  );
}

/* --- Trophy Card ---------------------------------------------------- */

function TrophyCard({ trophy, onView, onTogglePublic, onDelete, onCopyLink }) {
  const cat = getCategoryStyle(trophy.category);
  return (
    <div className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden transition-all hover:border-white/20 hover:bg-white/[0.05]">
      {/* Image */}
      <button onClick={() => onView(trophy)} className="block w-full">
        <div className="relative aspect-[4/3] overflow-hidden bg-black/40">
          <img src={trophy.file_url} alt={trophy.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
          <div className="absolute left-2 right-2 top-2 flex flex-wrap gap-1">
            <span className={'max-w-full truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ' + cat.color}>{cat.label}</span>
            {trophy.firm_name && (
              <span className="max-w-full truncate rounded-full border border-white/20 bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-sm">{trophy.firm_name}</span>
            )}
          </div>
        </div>
      </button>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-sm font-semibold leading-tight line-clamp-2">{trophy.title}</h3>
        {trophy.description && <p className="mt-1 text-xs text-white/45 line-clamp-2">{trophy.description}</p>}
        <div className="mt-2 font-mono text-[11px] text-white/35">{fmtDate(trophy.created_at)}</div>

        {/* Actions -- pinned to bottom */}
        <div className="mt-auto flex items-center gap-1.5 border-t border-white/5 pt-3">
          <button
            onClick={() => onTogglePublic(trophy.id, !trophy.is_public)}
            className={'rounded-lg border px-2 py-1.5 text-[11px] font-semibold ' + (trophy.is_public ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-white/5 text-white/50')}
          >
            {trophy.is_public ? 'Public' : 'Private'}
          </button>
          {trophy.is_public && trophy.share_id && (
            <button
              onClick={() => onCopyLink(trophy.share_id)}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-white/50 hover:text-cyan-300"
            >
              Link
            </button>
          )}
          <button
            onClick={() => onDelete(trophy.id)}
            className="ml-auto rounded-lg border border-red-400/20 bg-red-500/10 px-2 py-1.5 text-[11px] text-red-300 hover:bg-red-500/20"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- Main Component ------------------------------------------------- */

const BASIC_TROPHY_LIMIT = 5;

export default function TrophyWall({ trophies, firmNames, planAccess }) {
  const hasUnlimited = planAccess && (planAccess.isAdmin || planAccess.isBeta || planAccess.effectivePlan === 'elite');
  const atLimit = !hasUnlimited && trophies.length >= BASIC_TROPHY_LIMIT;
  const router = useRouter();
  const toast = useToast();
  const [showUpload, setShowUpload] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [firmFilter, setFirmFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Filter options built from trophies data
  const firmOptions = useMemo(() => {
    return [...new Set(trophies.map((t) => t.firm_name).filter(Boolean))].sort();
  }, [trophies]);

  // Filtered trophies
  const filtered = useMemo(() => {
    return trophies.filter((t) => {
      if (firmFilter && t.firm_name !== firmFilter) return false;
      if (categoryFilter && t.category !== categoryFilter) return false;
      return true;
    });
  }, [trophies, firmFilter, categoryFilter]);

  const hasFilters = firmFilter || categoryFilter;

  async function handleUpload(data) {
    const res = await createTrophy(data);
    if (res.error) { if (toast) toast.error(res.error); }
    else { if (toast) toast.success('Trophy added!'); setShowUpload(false); router.refresh(); }
  }

  function handleDelete(id) {
    setPendingDeleteId(id);
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    const res = await deleteTrophy(id);
    if (res.error) { if (toast) toast.error(res.error); }
    else { if (toast) toast.warning('Trophy deleted'); router.refresh(); }
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
      <div className="px-4 sm:px-6 py-8">
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
            style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
          >
            + Upload your first trophy
          </button>
        </div>

        <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Upload Trophy">
          <UploadTrophyForm onSave={handleUpload} onCancel={() => setShowUpload(false)} firmNames={firmNames} />
        </Modal>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Trophy Wall</h1>
          <p className="mt-1 text-sm text-white/55">
            {trophies.length} achievement{trophies.length !== 1 ? 's' : ''} earned
            {!hasUnlimited && <span className="ml-2 font-mono text-xs text-white/40">({trophies.length}/{BASIC_TROPHY_LIMIT})</span>}
          </p>
        </div>
        {atLimit ? (
          <button onClick={() => setShowUpgradeModal(true)} className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors">
            Limit reached — Upgrade to Elite
          </button>
        ) : (
          <button onClick={() => setShowUpload(true)} className="rounded-xl px-4 py-2 text-sm font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
            + Upload Trophy
          </button>
        )}
      </div>

      {/* Filter bar */}
      {trophies.length > 1 && (
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-white/50">Firm</label>
            <select className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-cyan-400/60" value={firmFilter} onChange={(e) => setFirmFilter(e.target.value)}>
              <option value="">All firms</option>
              {firmOptions.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-white/50">Category</label>
            <select className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-cyan-400/60" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          {hasFilters && (
            <button
              onClick={() => { setFirmFilter(''); setCategoryFilter(''); }}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/55 hover:text-white"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Filtered count */}
      {hasFilters && (
        <p className="mb-3 font-mono text-xs text-white/55">
          Showing {filtered.length} of {trophies.length} trophies
        </p>
      )}

      {/* Gallery grid */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filtered.map((t) => (
          <TrophyCard
            key={t.id}
            trophy={t}
            onView={setViewing}
            onTogglePublic={handleTogglePublic}
            onDelete={handleDelete}
            onCopyLink={handleCopyLink}
          />
        ))}
        {filtered.length === 0 && hasFilters && (
          <div className="col-span-full py-8 text-center text-sm text-white/40">No trophies match your filters.</div>
        )}
      </div>

      {/* Lightbox */}
      <Lightbox trophy={viewing} onClose={() => setViewing(null)} />

      {/* Upload modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Upload Trophy">
        <UploadTrophyForm onSave={handleUpload} onCancel={() => setShowUpload(false)} firmNames={firmNames} />
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!pendingDeleteId}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete this trophy?"
        message="This action can't be undone. The trophy will be permanently removed."
      />
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} feature="trophy_uploads" />}
    </div>
  );
}
