'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { addFirm, updateFirm, deleteFirm, reorderFirms } from './actions';

const field = 'w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-cyan-400/60';
const label = 'mb-1 block font-mono text-[10px] uppercase tracking-wider text-white/40';

const EMPTY_FORM = {
  name: '', profit_target: '', daily_drawdown: '', overall_drawdown: '',
  min_trading_days: '', challenge_days: '', max_risk_per_trade: '',
  consistency_requirement: '', affiliate_link: '', logo_url: '',
};

export default function PropFirmAdmin({ initialFirms, leadStats, adminEmail }) {
  const [firms, setFirms] = useState(initialFirms);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleAdd() {
    if (!form.name.trim()) return;
    setSaving(true); setError('');
    const res = await addFirm(adminEmail, form);
    if (res.error) { setError(res.error); setSaving(false); return; }
    setShowAdd(false); setForm(EMPTY_FORM); setSaving(false);
    router.refresh();
  }

  async function handleUpdate(id) {
    setSaving(true); setError('');
    const res = await updateFirm(adminEmail, id, form);
    if (res.error) { setError(res.error); setSaving(false); return; }
    setEditId(null); setForm(EMPTY_FORM); setSaving(false);
    router.refresh();
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await deleteFirm(adminEmail, id);
    if (res.error) { setError(res.error); return; }
    router.refresh();
  }

  async function handleToggle(id, active) {
    await updateFirm(adminEmail, id, { active: !active });
    router.refresh();
  }

  async function moveUp(idx) {
    if (idx === 0) return;
    const ids = firms.map((f) => f.id);
    [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
    await reorderFirms(adminEmail, ids);
    router.refresh();
  }

  async function moveDown(idx) {
    if (idx >= firms.length - 1) return;
    const ids = firms.map((f) => f.id);
    [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    await reorderFirms(adminEmail, ids);
    router.refresh();
  }

  function startEdit(firm) {
    setEditId(firm.id);
    setForm({
      name: firm.name || '', profit_target: firm.profit_target ?? '', daily_drawdown: firm.daily_drawdown ?? '',
      overall_drawdown: firm.overall_drawdown ?? '', min_trading_days: firm.min_trading_days ?? '',
      challenge_days: firm.challenge_days ?? '', max_risk_per_trade: firm.max_risk_per_trade ?? '',
      consistency_requirement: firm.consistency_requirement ?? '',
      affiliate_link: firm.affiliate_link || '', logo_url: firm.logo_url || '',
    });
    setShowAdd(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Prop Firms</h1>
          <p className="mt-1 text-sm text-white/40">Manage challenge profiles shown in the Probability Analyzer</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            <span className="text-white/40">Leads: </span>
            <span className="font-semibold text-emerald-400">{leadStats?.verified || 0}</span>
            <span className="text-white/30"> / {leadStats?.total || 0}</span>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Firm list */}
      <div className="space-y-3">
        {firms.map((firm, idx) => {
          if (editId === firm.id) {
            return <EditForm key={firm.id} form={form} set={set} onSave={() => handleUpdate(firm.id)} onCancel={() => { setEditId(null); setForm(EMPTY_FORM); }} saving={saving} />;
          }

          return (
            <div key={firm.id} className={`rounded-xl border p-4 ${firm.active ? 'border-white/10 bg-white/[0.03]' : 'border-white/5 bg-white/[0.01] opacity-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {firm.logo_url ? (
                    <img src={firm.logo_url} alt="" className="h-8 w-8 rounded-lg object-contain" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-sm">🏢</div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{firm.name}</span>
                      <span className="font-mono text-[10px] text-white/25">{firm.slug}</span>
                      {!firm.active && <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/30">Inactive</span>}
                    </div>
                    <div className="mt-0.5 flex gap-3 font-mono text-[10px] text-white/35">
                      {firm.profit_target != null && <span>Target: {firm.profit_target}%</span>}
                      {firm.daily_drawdown != null && <span>DD: {firm.daily_drawdown}%/{firm.overall_drawdown}%</span>}
                      {firm.min_trading_days != null && <span>Days: {firm.min_trading_days}+</span>}
                      {firm.affiliate_link && <span className="text-cyan-400/50">Affiliate ✓</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => moveUp(idx)} disabled={idx === 0} className="rounded p-1 text-white/20 hover:text-white/60 disabled:opacity-20">↑</button>
                  <button onClick={() => moveDown(idx)} disabled={idx >= firms.length - 1} className="rounded p-1 text-white/20 hover:text-white/60 disabled:opacity-20">↓</button>
                  <button onClick={() => handleToggle(firm.id, firm.active)} className="rounded px-2 py-1 text-xs text-white/30 hover:text-white/60">
                    {firm.active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => startEdit(firm)} className="rounded px-2 py-1 text-xs text-white/40 hover:text-white">Edit</button>
                  <button onClick={() => handleDelete(firm.id, firm.name)} className="rounded px-2 py-1 text-xs text-red-400/50 hover:text-red-400">Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add new */}
      {!showAdd ? (
        <button onClick={() => { setShowAdd(true); setEditId(null); setForm(EMPTY_FORM); }}
          className="flex items-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-3 text-sm text-white/40 hover:text-white/70">
          + Add Prop Firm
        </button>
      ) : (
        <EditForm form={form} set={set} onSave={handleAdd} onCancel={() => { setShowAdd(false); setForm(EMPTY_FORM); }} saving={saving} isNew />
      )}
    </div>
  );
}

/* ── Edit / Add Form ───────────────────────────────────────── */

function EditForm({ form, set, onSave, onCancel, saving, isNew }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(form.logo_url || '');
  const fileRef = useRef(null);

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert('Logo must be under 500KB.');
      return;
    }

    setUploading(true);
    try {
      // Convert to WebP using canvas
      const webpBlob = await convertToWebP(file);
      const slug = (form.name || 'firm').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'logo';
      const fileName = `${slug}-${Date.now()}.webp`;

      // Upload to Supabase Storage via API
      const formData = new FormData();
      formData.append('file', webpBlob, fileName);
      formData.append('bucket', 'prop-firm-logos');
      formData.append('path', fileName);

      const res = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      set('logo_url', data.url);
      setPreview(data.url);
    } catch (err) {
      alert('Logo upload failed: ' + err.message);
    }
    setUploading(false);
    e.target.value = '';
  }

  return (
    <div className="rounded-xl border border-violet-400/20 bg-violet-500/[0.03] p-5 space-y-4">
      <h3 className="text-sm font-semibold text-white">{isNew ? 'Add Prop Firm' : 'Edit Prop Firm'}</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={label}>Firm Name *</label>
          <input className={field} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. FTMO" />
        </div>
        <div>
          <label className={label}>Profit Target %</label>
          <input className={field} type="number" value={form.profit_target} onChange={(e) => set('profit_target', e.target.value)} placeholder="e.g. 8" />
        </div>
        <div>
          <label className={label}>Daily Drawdown %</label>
          <input className={field} type="number" value={form.daily_drawdown} onChange={(e) => set('daily_drawdown', e.target.value)} placeholder="e.g. 2" />
        </div>
        <div>
          <label className={label}>Overall Drawdown %</label>
          <input className={field} type="number" value={form.overall_drawdown} onChange={(e) => set('overall_drawdown', e.target.value)} placeholder="e.g. 4" />
        </div>
        <div>
          <label className={label}>Min Trading Days</label>
          <input className={field} type="number" value={form.min_trading_days} onChange={(e) => set('min_trading_days', e.target.value)} placeholder="e.g. 5" />
        </div>
        <div>
          <label className={label}>Challenge Days</label>
          <input className={field} type="number" value={form.challenge_days} onChange={(e) => set('challenge_days', e.target.value)} placeholder="e.g. 30" />
        </div>
        <div>
          <label className={label}>Max Risk/Trade %</label>
          <input className={field} type="number" value={form.max_risk_per_trade} onChange={(e) => set('max_risk_per_trade', e.target.value)} placeholder="Optional" />
        </div>
        <div className="col-span-2">
          <label className={label}>Affiliate Link</label>
          <input className={field} value={form.affiliate_link} onChange={(e) => set('affiliate_link', e.target.value)} placeholder="https://..." />
        </div>

        {/* Logo upload */}
        <div className="col-span-2">
          <label className={label}>Logo</label>
          <div className="flex items-center gap-3">
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Logo" className="h-12 w-12 rounded-lg border border-white/10 object-contain bg-white/5 p-1" />
                <button
                  onClick={() => { set('logo_url', ''); setPreview(''); }}
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.02] text-lg text-white/20">
                🏢
              </div>
            )}
            <div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/50 hover:text-white/80 disabled:opacity-50"
              >
                {uploading ? 'Converting to WebP...' : preview ? 'Replace Logo' : 'Upload Logo'}
              </button>
              <p className="mt-1 text-[10px] text-white/25">PNG or WebP, max 500KB. Auto-converted to WebP.</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".png,.webp,.jpg,.jpeg"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70">Cancel</button>
        <button onClick={onSave} disabled={saving || !form.name.trim()}
          className="rounded-xl px-4 py-2 text-xs font-semibold text-[#08080f] disabled:opacity-50"
          style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}>
          {saving ? 'Saving...' : isNew ? 'Add Firm' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

/* ── WebP conversion via canvas ────────────────────────────── */

function convertToWebP(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Cap at 200x200 for logos
      const max = 200;
      let w = img.width, h = img.height;
      if (w > max || h > max) {
        const ratio = Math.min(max / w, max / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('WebP conversion failed'))),
        'image/webp',
        0.85,
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}
