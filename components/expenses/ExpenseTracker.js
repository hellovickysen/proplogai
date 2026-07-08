"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createExpense, updateExpense, deleteExpense, createPayout, updatePayout, deletePayout, renameFirm } from '@/app/dashboard/expenses/actions';
import { createTrophy } from '@/app/dashboard/trophies/actions';
import { createClient } from '@/lib/supabase/client';
import { processImageFile } from '@/lib/imageUtils';
import { useToast } from '@/components/ui/Toast';
import { ExpensesEmptyIcon } from '@/components/ui/EmptyStates';
import ConfirmDialog from '@/components/ui/ConfirmDialog';



function Spinner() {
  return (
    <svg className="inline-block h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
    </svg>
  );
}

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
const TABS = ['Dashboard', 'Accounts', 'Payouts'];
const ACCOUNT_SIZES = ['$5K', '$10K', '$25K', '$50K', '$100K', '$150K', '$200K', '$250K', '$300K', '$400K', '$500K'];
const PURCHASE_LABELS = { new: 'New Purchase', renewal: 'Renewal', activation: 'Activation' };
const PURCHASE_COLORS = { new: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30', renewal: 'bg-amber-500/15 text-amber-300 border-amber-400/30', activation: 'bg-violet-500/15 text-violet-300 border-violet-400/30' };
const field = 'w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400/60';
const labelCls = 'mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55';
const dateStyle = { colorScheme: 'dark' };

const TROPHY_CATS = {
  payout: { label: 'Payout', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30' },
  challenge_pass: { label: 'Challenge Pass', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30' },
  funded: { label: 'Funded', color: 'bg-violet-500/15 text-violet-300 border-violet-400/30' },
  other: { label: 'Other', color: 'bg-white/10 text-white/60 border-white/20' },
};

function fmtCurrency(v) {
  const n = Number(v) || 0;
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return '—'; }
}

function firmInitial(name) {
  return (name || '?').charAt(0).toUpperCase();
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function capitalizeWords(str) {
  if (!str) return '';
  return str.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─── Pencil Icon ────────────────────────────────────────────── */

function PencilIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" />
    </svg>
  );
}

/* ─── Stat Cards ─────────────────────────────────────────────── */

function HeroStat({ label, value, tone, icon }) {
  const border = tone === 'red' ? 'border-red-400/25' : tone === 'green' ? 'border-emerald-400/25' : tone === 'amber' ? 'border-amber-400/25' : 'border-white/10';
  const glow = tone === 'red' ? 'rgba(248,113,113,0.06)' : tone === 'green' ? 'rgba(52,211,153,0.06)' : tone === 'amber' ? 'rgba(251,191,36,0.06)' : 'transparent';
  const color = tone === 'red' ? 'text-red-400' : tone === 'green' ? 'text-emerald-400' : tone === 'amber' ? 'text-amber-400' : 'text-white';
  return (
    <div className={'rounded-2xl border p-5 ' + border} style={{ background: glow }}>
      <div className="flex items-center justify-between">
        <div className="font-mono text-xs uppercase tracking-wider text-white/50">{label}</div>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className={'mt-2 font-display text-2xl font-bold sm:text-3xl ' + color}>{value}</div>
    </div>
  );
}

function SecStat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/45">{label}</div>
    </div>
  );
}

/* ─── Autocomplete Input ─────────────────────────────────────── */

function FirmNameInput({ value, onChange, existingFirms, placeholder, disabled }) {
  const [focused, setFocused] = useState(false);
  const suggestions = value.length >= 1
    ? existingFirms.filter((fn) => fn.toLowerCase().startsWith(value.toLowerCase()) && fn.toLowerCase() !== value.toLowerCase())
    : [];
  const showDropdown = focused && suggestions.length > 0;

  return (
    <div className="relative">
      <input
        className={field + (disabled ? ' opacity-50 cursor-not-allowed' : '')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder={placeholder || 'e.g. FTMO, Topstep, Apex...'}
        required
        disabled={disabled}
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

/* ─── Modal Overlay ──────────────────────────────────────────── */

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e0e18] p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white">&#10005;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Add Expense Form ───────────────────────────────────────── */

function AddExpenseForm({ onSave, onCancel, existingFirms, defaultFirmName }) {
  const [f, setF] = useState({
    firm_name: defaultFirmName || '',
    account_type: 'futures',
    account_size: '$50K',
    purchase_type: 'new',
    account_cost: '',
    num_accounts: 1,
    total_cost: '',
    expense_date: todayStr(),
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setF((p) => ({ ...p, [k]: v })); }

  function setCostField(k, v) {
    setF((p) => {
      const next = { ...p, [k]: v };
      const cost = Number(next.account_cost) || 0;
      const count = Number(next.num_accounts) || 1;
      next.total_cost = cost > 0 ? (cost * count).toFixed(2) : '';
      return next;
    });
  }

  function adjustAccounts(delta) {
    setF((p) => {
      const count = Math.max(1, Math.min(100, (p.num_accounts || 1) + delta));
      const cost = Number(p.account_cost) || 0;
      return { ...p, num_accounts: count, total_cost: cost > 0 ? (cost * count).toFixed(2) : '' };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...f, firm_name: capitalizeWords(f.firm_name) });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Prop firm name *</label>
        <FirmNameInput value={f.firm_name} onChange={(v) => set('firm_name', v)} existingFirms={existingFirms} placeholder="e.g. FTMO, Topstep, Apex..." disabled={!!defaultFirmName} />
      </div>

      <div>
        <label className={labelCls}>Account type</label>
        <div className="flex gap-2">
          {['futures', 'cfd'].map((t) => (
            <button key={t} type="button" onClick={() => set('account_type', t)}
              className={'flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold capitalize ' + (f.account_type === t ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300' : 'border-white/10 bg-black/30 text-white/50')}>
              {t === 'cfd' ? 'CFD' : 'Futures'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Account size</label>
          <select className={field} value={f.account_size} onChange={(e) => set('account_size', e.target.value)}>
            {ACCOUNT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Date</label>
          <input type="date" className={field + ' cursor-pointer'} style={dateStyle} value={f.expense_date} onChange={(e) => set('expense_date', e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Purchase type</label>
        <div className="flex flex-wrap gap-2">
          {['new', 'renewal', 'activation'].map((t) => (
            <button key={t} type="button" onClick={() => set('purchase_type', t)}
              className={'flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ' + (f.purchase_type === t ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300' : 'border-white/10 bg-black/30 text-white/50')}>
              {PURCHASE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <div>
          <label className={labelCls}>Cost per acct ($) *</label>
          <input className={field} value={f.account_cost} onChange={(e) => setCostField('account_cost', e.target.value)} inputMode="decimal" placeholder="0.00" required />
        </div>
        <div>
          <label className={labelCls}>Accounts</label>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => adjustAccounts(-1)} className="grid h-[42px] w-10 place-items-center rounded-lg border border-white/10 bg-black/30 text-lg text-white/60 hover:text-white">&minus;</button>
            <span className="grid h-[42px] w-10 place-items-center font-display text-lg font-bold">{f.num_accounts}</span>
            <button type="button" onClick={() => adjustAccounts(1)} className="grid h-[42px] w-10 place-items-center rounded-lg border border-white/10 bg-black/30 text-lg text-white/60 hover:text-white">+</button>
          </div>
        </div>
        <div>
          <label className={labelCls}>Total cost ($)</label>
          <input className={field + ' bg-white/[0.02] text-white/70'} value={f.total_cost} readOnly tabIndex={-1} placeholder="Auto" />
        </div>
      </div>

      <div>
        <label className={labelCls}>Notes (optional)</label>
        <textarea className={field} rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="e.g. 2nd attempt, renewal after drawdown violation..." />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70">Cancel</button>
        <button type="submit" disabled={saving || !f.account_cost} className="flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
          {saving ? <><Spinner /> Saving...</> : 'Add Expense'}
        </button>
      </div>
    </form>
  );
}

/* ─── Edit Expense Form ──────────────────────────────────────── */

function EditExpenseForm({ expense, onSave, onCancel, existingFirms }) {
  const [f, setF] = useState({
    firm_name: expense.firm_name || '',
    account_type: expense.account_type || 'futures',
    account_size: expense.account_size || '$50K',
    purchase_type: expense.purchase_type || 'new',
    account_cost: expense.account_cost?.toString() || '',
    num_accounts: expense.num_accounts || 1,
    total_cost: expense.total_cost?.toString() || '',
    expense_date: expense.expense_date || todayStr(),
    notes: expense.notes || ''
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setF((p) => ({ ...p, [k]: v })); }

  function setCostField(k, v) {
    setF((p) => {
      const next = { ...p, [k]: v };
      const cost = Number(next.account_cost) || 0;
      const count = Number(next.num_accounts) || 1;
      next.total_cost = cost > 0 ? (cost * count).toFixed(2) : '';
      return next;
    });
  }

  function adjustAccounts(delta) {
    setF((p) => {
      const count = Math.max(1, Math.min(100, (p.num_accounts || 1) + delta));
      const cost = Number(p.account_cost) || 0;
      return { ...p, num_accounts: count, total_cost: cost > 0 ? (cost * count).toFixed(2) : '' };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave(expense.id, { ...f, firm_name: capitalizeWords(f.firm_name) });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Prop firm name *</label>
        <FirmNameInput value={f.firm_name} onChange={(v) => set('firm_name', v)} existingFirms={existingFirms} />
      </div>

      <div>
        <label className={labelCls}>Account type</label>
        <div className="flex gap-2">
          {['futures', 'cfd'].map((t) => (
            <button key={t} type="button" onClick={() => set('account_type', t)}
              className={'flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold capitalize ' + (f.account_type === t ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300' : 'border-white/10 bg-black/30 text-white/50')}>
              {t === 'cfd' ? 'CFD' : 'Futures'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Account size</label>
          <select className={field} value={f.account_size} onChange={(e) => set('account_size', e.target.value)}>
            {ACCOUNT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Date</label>
          <input type="date" className={field + ' cursor-pointer'} style={dateStyle} value={f.expense_date} onChange={(e) => set('expense_date', e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Purchase type</label>
        <div className="flex flex-wrap gap-2">
          {['new', 'renewal', 'activation'].map((t) => (
            <button key={t} type="button" onClick={() => set('purchase_type', t)}
              className={'flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ' + (f.purchase_type === t ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300' : 'border-white/10 bg-black/30 text-white/50')}>
              {PURCHASE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <div>
          <label className={labelCls}>Cost per acct ($) *</label>
          <input className={field} value={f.account_cost} onChange={(e) => setCostField('account_cost', e.target.value)} inputMode="decimal" placeholder="0.00" required />
        </div>
        <div>
          <label className={labelCls}>Accounts</label>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => adjustAccounts(-1)} className="grid h-[42px] w-10 place-items-center rounded-lg border border-white/10 bg-black/30 text-lg text-white/60 hover:text-white">&minus;</button>
            <span className="grid h-[42px] w-10 place-items-center font-display text-lg font-bold">{f.num_accounts}</span>
            <button type="button" onClick={() => adjustAccounts(1)} className="grid h-[42px] w-10 place-items-center rounded-lg border border-white/10 bg-black/30 text-lg text-white/60 hover:text-white">+</button>
          </div>
        </div>
        <div>
          <label className={labelCls}>Total cost ($)</label>
          <input className={field + ' bg-white/[0.02] text-white/70'} value={f.total_cost} readOnly tabIndex={-1} placeholder="Auto" />
        </div>
      </div>

      <div>
        <label className={labelCls}>Notes (optional)</label>
        <textarea className={field} rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="e.g. 2nd attempt, renewal after drawdown violation..." />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70">Cancel</button>
        <button type="submit" disabled={saving || !f.account_cost} className="flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
          {saving ? <><Spinner /> Saving...</> : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

/* ─── Add Payout Form ────────────────────────────────────────── */

function AddPayoutForm({ onSave, onCancel, existingFirms, defaultFirmName }) {
  const toast = useToast();
  const [f, setF] = useState({ firm_name: defaultFirmName || '', amount: '', payout_date: todayStr(), notes: '' });
  const [saving, setSaving] = useState(false);

  // Certificate (optional collapsible)
  const [showCert, setShowCert] = useState(false);
  const [certTitle, setCertTitle] = useState('');
  const [certDesc, setCertDesc] = useState('');
  const [certFileUrl, setCertFileUrl] = useState('');
  const [certPreview, setCertPreview] = useState(null);
  const [certUploading, setCertUploading] = useState(false);

  function set(k, v) { setF((p) => ({ ...p, [k]: v })); }

  async function handleCertFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error('File must be under 15MB');
      return;
    }
    setCertUploading(true);
    const processed = await processImageFile(file, { maxDimension: 1920 });
    if (processed.error) {
      toast.error(processed.error);
      setCertUploading(false);
      return;
    }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const safe = processed.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = user.id + '/' + Date.now() + '_' + safe;
    const { error } = await supabase.storage.from('trophies').upload(path, processed.file, { upsert: true });
    if (error) {
      toast.error('Upload failed: ' + error.message);
      setCertUploading(false);
      return;
    }
    const pub = supabase.storage.from('trophies').getPublicUrl(path);
    setCertFileUrl(pub.data.publicUrl);
    setCertPreview(processed.preview);
    setCertUploading(false);
    e.target.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (showCert && certFileUrl && !certTitle.trim()) {
      toast.error('Certificate title is required when uploading a certificate.');
      return;
    }
    setSaving(true);
    const certData = (showCert && certFileUrl) ? {
      file_url: certFileUrl,
      title: certTitle.trim(),
      description: certDesc.trim(),
    } : null;
    await onSave({ ...f, firm_name: capitalizeWords(f.firm_name) }, certData);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Prop firm name *</label>
        <FirmNameInput value={f.firm_name} onChange={(v) => set('firm_name', v)} existingFirms={existingFirms} placeholder="e.g. FTMO, Topstep..." disabled={!!defaultFirmName} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Amount ($) *</label>
          <input className={field} value={f.amount} onChange={(e) => set('amount', e.target.value)} inputMode="decimal" placeholder="0.00" required />
        </div>
        <div>
          <label className={labelCls}>Date</label>
          <input type="date" className={field + ' cursor-pointer'} style={dateStyle} value={f.payout_date} onChange={(e) => set('payout_date', e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Notes (optional)</label>
        <textarea className={field} rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="e.g. $1.5k requested, got $1.2k after 20% cut" />
      </div>

      {/* Collapsible certificate section */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02]">
        <button
          type="button"
          onClick={() => setShowCert(!showCert)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm"
        >
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" /></svg>
            <span className="text-white/70">Attach Payout Certificate</span>
            <span className="text-[11px] text-white/35">(optional)</span>
          </span>
          <svg className={'h-4 w-4 text-white/40 transition-transform ' + (showCert ? 'rotate-180' : '')} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
        </button>

        {showCert && (
          <div className="space-y-3 border-t border-white/10 px-4 py-4">
            <div>
              <label className={labelCls}>Upload certificate *</label>
              {certPreview && (
                <div className="mb-2">
                  <img src={certPreview} alt="Preview" className="h-28 w-full rounded-lg border border-white/10 object-cover" />
                </div>
              )}
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleCertFile}
                className="block w-full text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-white"
              />
              {certUploading && <p className="mt-1 text-xs text-cyan-400">Uploading...</p>}
            </div>
            <div>
              <label className={labelCls}>Title *</label>
              <input className={field} value={certTitle} onChange={(e) => setCertTitle(e.target.value)} placeholder="e.g. FTMO $100K Payout — March 2026" />
            </div>
            <div>
              <label className={labelCls}>Description (optional)</label>
              <textarea className={field} rows={2} value={certDesc} onChange={(e) => setCertDesc(e.target.value)} placeholder="Any details about this achievement..." />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70">Cancel</button>
        <button type="submit" disabled={saving || certUploading} className="flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#34d399,#22d3ee)' }}>
          {saving ? <><Spinner /> Saving...</> : 'Add Payout'}
        </button>
      </div>
    </form>
  );
}

/* ─── Edit Payout Form ───────────────────────────────────────── */

function EditPayoutForm({ payout, onSave, onCancel, existingFirms }) {
  const [f, setF] = useState({
    firm_name: payout.firm_name || '',
    amount: payout.amount?.toString() || '',
    payout_date: payout.payout_date || todayStr(),
    notes: payout.notes || ''
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setF((p) => ({ ...p, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave(payout.id, { ...f, firm_name: capitalizeWords(f.firm_name) });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Prop firm name *</label>
        <FirmNameInput value={f.firm_name} onChange={(v) => set('firm_name', v)} existingFirms={existingFirms} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Amount ($) *</label>
          <input className={field} value={f.amount} onChange={(e) => set('amount', e.target.value)} inputMode="decimal" placeholder="0.00" required />
        </div>
        <div>
          <label className={labelCls}>Date</label>
          <input type="date" className={field + ' cursor-pointer'} style={dateStyle} value={f.payout_date} onChange={(e) => set('payout_date', e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Notes (optional)</label>
        <textarea className={field} rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="e.g. $1.5k requested, got $1.2k after 20% cut" />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70">Cancel</button>
        <button type="submit" disabled={saving} className="flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#34d399,#22d3ee)' }}>
          {saving ? <><Spinner /> Saving...</> : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

/* ─── Firm Dashboard ─────────────────────────────────────────── */

function FirmDashboard({
  firmName, expenses, payouts, trophies,
  onBack, onDeleteExpense, onDeletePayout,
  onEditExpense, onEditPayout,
  onAddExpense, onAddPayout,
  onRenameFirm
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(firmName);
  const [savingName, setSavingName] = useState(false);
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [showAllPayouts, setShowAllPayouts] = useState(false);
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('all');
  const [trophyCategoryFilter, setTrophyCategoryFilter] = useState('all');
  const PAGE_SIZE = 5;

  const filteredExpenses = expenseTypeFilter === 'all' ? expenses : expenses.filter((e) => e.purchase_type === expenseTypeFilter);
  const totalExpenses = expenses.reduce((a, e) => a + (Number(e.total_cost) || 0), 0);
  const totalPayouts = payouts.reduce((a, p) => a + (Number(p.amount) || 0), 0);
  const netPL = totalPayouts - totalExpenses;
  const totalAccounts = expenses.reduce((a, e) => a + (e.purchase_type === 'new' ? (Number(e.num_accounts) || 0) : 0), 0);

  async function handleSaveName() {
    const trimmed = capitalizeWords(editName);
    if (!trimmed) { setIsEditingName(false); return; }
    if (trimmed === firmName) { setIsEditingName(false); return; }
    setSavingName(true);
    await onRenameFirm(firmName, trimmed);
    setSavingName(false);
    setIsEditingName(false);
  }

  function handleNameKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); handleSaveName(); }
    if (e.key === 'Escape') { setIsEditingName(false); setEditName(firmName); }
  }

  return (
    <div className="px-4 sm:px-6 py-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/50 transition-colors hover:bg-white/[0.05] hover:text-white/80"
      >
        <span className="text-lg">&larr;</span> Back to Expenses
      </button>

      {/* Firm Header */}
      <div className="mb-8 flex items-center gap-4 sm:gap-5">
        {/* Letter Avatar */}
        <div
          className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-2xl font-display text-2xl font-bold sm:h-20 sm:w-20 sm:text-3xl"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(34,211,238,0.2))' }}
        >
          <span style={gradientText}>{firmInitial(firmName)}</span>
        </div>

        {/* Firm name — inline edit */}
        <div className="min-w-0 flex-1">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                className="rounded-lg border border-cyan-400/50 bg-black/40 px-3 py-2 font-display text-xl font-bold outline-none sm:text-2xl"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={handleNameKeyDown}
                autoFocus
                disabled={savingName}
              />
              {savingName && <Spinner />}
            </div>
          ) : (
            <button
              onClick={() => { setIsEditingName(true); setEditName(firmName); }}
              className="group flex items-center gap-2 text-left"
            >
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{firmName}</h1>
              <PencilIcon className="h-4 w-4 text-white/30 transition-colors group-hover:text-cyan-400" />
            </button>
          )}
          <div className="mt-1 flex items-center gap-3 font-mono text-xs text-white/45">
            <span>{totalAccounts} account{totalAccounts !== 1 ? 's' : ''}</span>
            <span>&middot;</span>
            <span>{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</span>
            <span>&middot;</span>
            <span>{payouts.length} payout{payouts.length !== 1 ? 's' : ''}</span>
            {trophies.length > 0 && (
              <>
                <span>&middot;</span>
                <span>{trophies.length} troph{trophies.length !== 1 ? 'ies' : 'y'}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <HeroStat label="Total Expenses" value={fmtCurrency(totalExpenses)} tone="red" icon="💸" />
        <HeroStat label="Total Payouts" value={fmtCurrency(totalPayouts)} tone="green" icon="💰" />
        <HeroStat label="Net P/L" value={(netPL >= 0 ? '+' : '-') + fmtCurrency(Math.abs(netPL))} tone={netPL >= 0 ? 'green' : 'amber'} icon={<span className={'inline-block h-3 w-3 rounded-full ' + (netPL >= 0 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]')} />} />
      </div>

      {/* Expenses Section */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">
            Expenses <span className="ml-1 font-mono text-xs text-white/40">({expenses.length})</span>
          </h2>
          <button onClick={onAddExpense} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
            + Add Expense
          </button>
        </div>

        {expenses.length > 0 && (
          <div className="mb-3 flex items-center gap-1">
            {[{ key: 'all', label: 'All' }, { key: 'new', label: 'New' }, { key: 'renewal', label: 'Renewal' }, { key: 'activation', label: 'Activation' }].map((f) => (
              <button key={f.key} onClick={() => { setExpenseTypeFilter(f.key); setShowAllExpenses(false); }}
                className={'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ' + (expenseTypeFilter === f.key ? 'bg-white/[0.08] text-white' : 'text-white/35 hover:text-white/60')}>
                {f.label}
              </button>
            ))}
          </div>
        )}

        {filteredExpenses.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <p className="text-sm text-white/40">{expenses.length === 0 ? `No expenses for ${firmName} yet.` : 'No expenses match this filter.'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(showAllExpenses ? filteredExpenses : filteredExpenses.slice(0, PAGE_SIZE)).map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono text-white/50">{e.num_accounts} Acct{e.num_accounts > 1 ? 's' : ''}</span>
                    {e.account_size && <span className="font-mono text-white/50">{e.account_size}</span>}
                    {e.account_type && <span className="font-mono uppercase text-white/35">{e.account_type}</span>}
                    {e.purchase_type && (
                      <span className={'rounded-full border px-2 py-0.5 text-[10px] font-semibold ' + (PURCHASE_COLORS[e.purchase_type] || '')}>
                        {PURCHASE_LABELS[e.purchase_type] || e.purchase_type}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-white/35">{fmtDate(e.expense_date)}</div>
                  {e.notes && <p className="mt-0.5 text-[11px] text-white/35">{e.notes}</p>}
                </div>
                <div className="font-mono text-sm font-bold text-red-400">{fmtCurrency(e.total_cost)}</div>
                <button onClick={() => onEditExpense(e)} className="grid h-8 w-8 place-items-center rounded text-white/30 hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors" title="Edit">
                  <PencilIcon className="h-3 w-3" />
                </button>
                <button onClick={() => onDeleteExpense(e.id)} className="grid h-8 w-8 place-items-center rounded text-[10px] text-white/30 hover:bg-red-500/20 hover:text-red-400 transition-colors" title="Delete">&#10005;</button>
              </div>
            ))}
            {!showAllExpenses && filteredExpenses.length > PAGE_SIZE && (
              <button onClick={() => setShowAllExpenses(true)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-xs font-medium text-white/50 hover:bg-white/[0.06] hover:text-white/70">
                Show all {filteredExpenses.length} expenses
              </button>
            )}
          </div>
        )}
      </div>

      {/* Payouts Section */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">
            Payouts <span className="ml-1 font-mono text-xs text-white/40">({payouts.length})</span>
          </h2>
          <button onClick={onAddPayout} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#34d399,#22d3ee)' }}>
            + Add Payout
          </button>
        </div>

        {payouts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <p className="text-sm text-white/40">No payouts from {firmName} yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(showAllPayouts ? payouts : payouts.slice(0, PAGE_SIZE)).map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="whitespace-nowrap font-mono text-[11px] text-white/40">{fmtDate(p.payout_date)}</div>
                  {p.notes && <p className="mt-0.5 text-xs text-white/50">{p.notes}</p>}
                </div>
                <div className="font-mono text-sm font-bold text-emerald-400">+{fmtCurrency(p.amount)}</div>
                <button onClick={() => onEditPayout(p)} className="grid h-8 w-8 place-items-center rounded text-white/30 hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors" title="Edit">
                  <PencilIcon className="h-3 w-3" />
                </button>
                <button onClick={() => onDeletePayout(p.id)} className="grid h-8 w-8 place-items-center rounded text-[10px] text-white/30 hover:bg-red-500/20 hover:text-red-400 transition-colors" title="Delete">&#10005;</button>
              </div>
            ))}
            {!showAllPayouts && payouts.length > PAGE_SIZE && (
              <button onClick={() => setShowAllPayouts(true)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-xs font-medium text-white/50 hover:bg-white/[0.06] hover:text-white/70">
                Show all {payouts.length} payouts
              </button>
            )}
          </div>
        )}
      </div>

      {/* Trophies Section */}
      {trophies.length > 0 && (() => {
        const filteredTrophies = trophyCategoryFilter === 'all' ? trophies : trophies.filter((t) => t.category === trophyCategoryFilter);
        return (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">
              Trophies <span className="ml-1 font-mono text-xs text-white/40">({trophies.length})</span>
            </h2>
          </div>
          {trophies.length > 1 && (
            <div className="mb-3 flex items-center gap-1">
              {[{ key: 'all', label: 'All' }, { key: 'payout', label: 'Payout' }, { key: 'challenge_pass', label: 'Challenge' }, { key: 'funded', label: 'Funded' }, { key: 'other', label: 'Other' }].map((f) => (
                <button key={f.key} onClick={() => setTrophyCategoryFilter(f.key)}
                  className={'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ' + (trophyCategoryFilter === f.key ? 'bg-white/[0.08] text-white' : 'text-white/35 hover:text-white/60')}>
                  {f.label}
                </button>
              ))}
            </div>
          )}
          {filteredTrophies.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <p className="text-sm text-white/40">No trophies match this filter.</p>
            </div>
          ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredTrophies.map((t) => {
              const cat = TROPHY_CATS[t.category] || TROPHY_CATS.other;
              return (
                <div key={t.id} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                  <div className="relative aspect-[4/3] overflow-hidden bg-black/40">
                    <img src={t.file_url} alt={t.title} className="h-full w-full object-cover" />
                    <div className="absolute left-2 top-2">
                      <span className={'rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ' + cat.color}>{cat.label}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold">{t.title}</h3>
                    {t.description && <p className="mt-0.5 text-xs text-white/45 line-clamp-1">{t.description}</p>}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
        );
      })()}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */

export default function ExpenseTracker({ expenses, payouts, trophies }) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState('Dashboard');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [expandedFirm, setExpandedFirm] = useState(null);
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingPayout, setEditingPayout] = useState(null);
  const [accountsSort, setAccountsSort] = useState('recent');
  const [accountTypeFilter, setAccountTypeFilter] = useState('all');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [payoutsVisible, setPayoutsVisible] = useState(5);

  const allTrophies = trophies || [];

  // Aggregates
  const totalExpense = expenses.reduce((a, e) => a + (Number(e.total_cost) || 0), 0);
  const totalPayout = payouts.reduce((a, p) => a + (Number(p.amount) || 0), 0);
  const netPL = totalPayout - totalExpense;
  const totalAccounts = expenses.reduce((a, e) => a + (e.purchase_type === 'new' ? (Number(e.num_accounts) || 0) : 0), 0);

  // Firms
  const firmMap = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      const fn = e.firm_name;
      if (!map[fn]) map[fn] = { name: fn, totalCost: 0, accounts: 0, expenseCount: 0, payoutCount: 0, trophyCount: 0, expenses: [], lastUpdated: e.created_at, types: [] };
      map[fn].totalCost += Number(e.total_cost) || 0;
      map[fn].expenseCount++;
      if (e.purchase_type === 'new') map[fn].accounts += Number(e.num_accounts) || 0;
      if (e.account_type && !map[fn].types.includes(e.account_type)) map[fn].types.push(e.account_type);
      map[fn].expenses.push(e);
      if (new Date(e.created_at) > new Date(map[fn].lastUpdated)) map[fn].lastUpdated = e.created_at;
    });
    // Count payouts per firm
    payouts.forEach((p) => {
      const fn = p.firm_name;
      if (map[fn]) {
        map[fn].payoutCount++;
        if (new Date(p.created_at) > new Date(map[fn].lastUpdated)) map[fn].lastUpdated = p.created_at;
      }
    });
    // Count trophies per firm
    allTrophies.forEach((t) => {
      const fn = t.firm_name;
      if (map[fn]) map[fn].trophyCount++;
    });
    return map;
  }, [expenses, payouts, allTrophies]);

  const firms = useMemo(() => {
    let arr = Object.values(firmMap);
    if (accountTypeFilter !== 'all') arr = arr.filter((f) => f.types.includes(accountTypeFilter));
    if (accountsSort === 'az') return arr.sort((a, b) => a.name.localeCompare(b.name));
    if (accountsSort === 'highest') return arr.sort((a, b) => b.totalCost - a.totalCost);
    return arr.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
  }, [firmMap, accountsSort, accountTypeFilter]);
  const firmNames = useMemo(() => [...new Set([...expenses.map((e) => e.firm_name), ...payouts.map((p) => p.firm_name)])].filter(Boolean).sort(), [expenses, payouts]);

  // Handlers
  async function handleAddExpense(data) {
    const res = await createExpense(data);
    if (res.error) { if (toast) toast.error(res.error); }
    else { if (toast) toast.success('Expense added!'); setShowExpenseForm(false); router.refresh(); }
  }

  async function handleUpdateExpense(id, data) {
    const res = await updateExpense(id, data);
    if (res.error) { if (toast) toast.error(res.error); }
    else { if (toast) toast.success('Expense updated!'); setEditingExpense(null); router.refresh(); }
  }

  function handleDeleteExpense(id) {
    setPendingDelete({ type: 'expense', id });
  }

  async function handleAddPayout(data, certData) {
    const res = await createPayout(data);
    if (res.error) { if (toast) toast.error(res.error); return; }
    // If certificate was attached, create trophy entry
    if (certData && certData.file_url) {
      const trophyRes = await createTrophy({
        firm_name: data.firm_name,
        title: certData.title,
        category: 'payout',
        description: certData.description || '',
        file_url: certData.file_url,
      });
      if (trophyRes.error) {
        if (toast) toast.warning('Payout added, but certificate failed: ' + trophyRes.error);
      } else {
        if (toast) toast.success('Payout + certificate added!');
      }
    } else {
      if (toast) toast.success('Payout added!');
    }
    setShowPayoutForm(false);
    router.refresh();
  }

  async function handleUpdatePayout(id, data) {
    const res = await updatePayout(id, data);
    if (res.error) { if (toast) toast.error(res.error); }
    else { if (toast) toast.success('Payout updated!'); setEditingPayout(null); router.refresh(); }
  }

  function handleDeletePayout(id) {
    setPendingDelete({ type: 'payout', id });
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    const { type, id } = pendingDelete;
    setPendingDelete(null);
    if (type === 'expense') {
      const res = await deleteExpense(id);
      if (res.error) { if (toast) toast.error(res.error); }
      else { if (toast) toast.warning('Expense deleted'); router.refresh(); }
    } else {
      const res = await deletePayout(id);
      if (res.error) { if (toast) toast.error(res.error); }
      else { if (toast) toast.warning('Payout deleted'); router.refresh(); }
    }
  }

  async function handleRenameFirm(oldName, newName) {
    const res = await renameFirm(oldName, newName);
    if (res.error) { if (toast) toast.error(res.error); }
    else {
      if (toast) toast.success('Firm renamed!');
      setSelectedFirm(newName);
      router.refresh();
    }
  }

  function openFirmDashboard(name) {
    setSelectedFirm(name);
  }

  // ─── Render ────────────────────────────────────────────
  return (
    <div>
      {selectedFirm ? (
        <FirmDashboard
          firmName={selectedFirm}
          expenses={expenses.filter((e) => e.firm_name === selectedFirm)}
          payouts={payouts.filter((p) => p.firm_name === selectedFirm)}
          trophies={allTrophies.filter((t) => t.firm_name === selectedFirm)}
          onBack={() => { setSelectedFirm(null); router.refresh(); }}
          onDeleteExpense={handleDeleteExpense}
          onDeletePayout={handleDeletePayout}
          onEditExpense={setEditingExpense}
          onEditPayout={setEditingPayout}
          onAddExpense={() => setShowExpenseForm(true)}
          onAddPayout={() => setShowPayoutForm(true)}
          onRenameFirm={handleRenameFirm}
        />
      ) : (
        <div className="px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold">Expenses</h1>
              <p className="mt-1 text-sm text-white/55">Track your prop firm costs and payouts</p>
            </div>
            <button onClick={() => setShowExpenseForm(true)} className="rounded-xl px-4 py-2 text-sm font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
              + Add Expense
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={'flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ' + (tab === t ? 'bg-white/[0.08] text-white' : 'text-white/45 hover:text-white/70')}>
                {t}
              </button>
            ))}
          </div>

          {/* ─── Dashboard Tab ──────────────────────────────── */}
          {tab === 'Dashboard' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <HeroStat label="Total Expense" value={fmtCurrency(totalExpense)} tone="red" icon="💸" />
                <HeroStat label="Total Payout" value={fmtCurrency(totalPayout)} tone="green" icon="💰" />
                <HeroStat label="Net P/L" value={(netPL >= 0 ? '+' : '-') + fmtCurrency(Math.abs(netPL))} tone={netPL >= 0 ? 'green' : 'amber'} icon={<span className={'inline-block h-3 w-3 rounded-full ' + (netPL >= 0 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]')} />} />
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <SecStat label="Total Firms" value={firms.length} />
                <SecStat label="Total Accounts" value={totalAccounts} />
                <SecStat label="Payouts" value={payouts.length} />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 font-display text-base font-semibold">Recent activity</div>
                {expenses.length === 0 && payouts.length === 0 ? (
                  <div className="py-4 text-center"><ExpensesEmptyIcon /><p className="mt-4 text-sm text-white/40">No activity yet. Add your first expense or payout.</p></div>
                ) : (
                  <div className="space-y-3">
                    {[...[...expenses].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5).map((e) => ({ type: 'expense', ...e, date: e.expense_date, amt: e.total_cost })),
                      ...[...payouts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5).map((p) => ({ type: 'payout', ...p, date: p.payout_date, amt: p.amount }))
                    ]
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                      .slice(0, 8)
                      .map((item) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                          <div className={'grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg font-display text-sm font-bold ' + (item.type === 'payout' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/[0.06] text-white/60')}>
                            {firmInitial(item.firm_name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openFirmDashboard(item.firm_name)} className="text-sm font-semibold hover:text-cyan-300 transition-colors">{item.firm_name}</button>
                              {item.type === 'expense' && item.purchase_type && (
                                <span className={'rounded-full border px-2 py-0.5 text-[10px] font-semibold ' + (PURCHASE_COLORS[item.purchase_type] || 'border-white/10 text-white/50')}>
                                  {PURCHASE_LABELS[item.purchase_type] || item.purchase_type}
                                </span>
                              )}
                              {item.type === 'payout' && (
                                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                  Payout
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[11px] text-white/40">{fmtDate(item.date)}</div>
                            {item.notes && <p className="mt-0.5 text-xs text-white/40">{item.notes}</p>}
                          </div>
                          <div className={'font-mono text-sm font-bold ' + (item.type === 'payout' ? 'text-emerald-400' : 'text-red-400')}>
                            {item.type === 'payout' ? '+' : '-'}{fmtCurrency(item.amt)}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Accounts Tab ───────────────────────────────── */}
          {tab === 'Accounts' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-red-400/15 p-5" style={{ background: 'rgba(248,113,113,0.04)' }}>
                <div className="font-mono text-xs uppercase tracking-wider text-white/45">Total Expense</div>
                <div className="mt-1 font-display text-3xl font-bold text-red-400">{fmtCurrency(totalExpense)}</div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {[{ key: 'all', label: 'All' }, { key: 'futures', label: 'Futures' }, { key: 'cfd', label: 'CFD' }].map((f) => (
                    <button key={f.key} onClick={() => setAccountTypeFilter(f.key)}
                      className={'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ' + (accountTypeFilter === f.key ? 'bg-white/[0.08] text-white' : 'text-white/35 hover:text-white/60')}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-white/35">Sort</span>
                  {[{ key: 'recent', label: 'Recent' }, { key: 'highest', label: 'Highest' }, { key: 'az', label: 'A–Z' }].map((s) => (
                    <button key={s.key} onClick={() => setAccountsSort(s.key)}
                      className={'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ' + (accountsSort === s.key ? 'bg-white/[0.08] text-white' : 'text-white/35 hover:text-white/60')}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {firms.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
                  <div className="text-center"><ExpensesEmptyIcon /><p className="mt-4 text-sm text-white/40">No expenses yet. Add your first prop firm expense.</p></div>
                </div>
              ) : (
                <div className="columns-1 gap-3 sm:columns-2">
                  {firms.map((firm) => (
                    <div key={firm.name} className="mb-3 break-inside-avoid">
                      <button onClick={() => openFirmDashboard(firm.name)}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition-all hover:border-cyan-400/30 hover:bg-white/[0.05]">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl font-display text-base font-bold" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(34,211,238,0.15))' }}>
                            {firmInitial(firm.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-display text-base font-semibold">{firm.name}</span>
                              {firm.types.map((t) => (
                                <span key={t} className={'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ' + (t === 'futures' ? 'bg-violet-500/15 text-violet-300' : 'bg-cyan-500/15 text-cyan-300')}>
                                  {t === 'cfd' ? 'CFD' : 'Futures'}
                                </span>
                              ))}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-xs text-white/45">
                              <span>{firm.accounts} acct{firm.accounts !== 1 ? 's' : ''}</span>
                              <span className="text-white/35">&middot;</span>
                              <span>{firm.expenseCount} expense{firm.expenseCount !== 1 ? 's' : ''}</span>
                              {firm.payoutCount > 0 && <><span className="text-white/35">&middot;</span><span className="text-emerald-400/60">{firm.payoutCount} payout{firm.payoutCount !== 1 ? 's' : ''}</span></>}
                              {firm.trophyCount > 0 && <><span className="text-white/35">&middot;</span><span className="text-amber-400/60">{firm.trophyCount} troph{firm.trophyCount !== 1 ? 'ies' : 'y'}</span></>}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-base font-bold text-red-400">{fmtCurrency(firm.totalCost)}</div>
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Payouts Tab ────────────────────────────────── */}
          {tab === 'Payouts' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-2xl border border-emerald-400/15 p-5 sm:flex-row sm:items-center sm:justify-between" style={{ background: 'rgba(52,211,153,0.04)' }}>
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-white/45">Total Payouts</div>
                  <div className="mt-1 font-display text-3xl font-bold text-emerald-400">{fmtCurrency(totalPayout)}</div>
                </div>
                <button onClick={() => setShowPayoutForm(true)} className="w-fit flex-shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#34d399,#22d3ee)' }}>
                  + Add Payout
                </button>
              </div>

              {payouts.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
                  <ExpensesEmptyIcon />
                  <p className="text-sm text-white/40">No payouts recorded yet. Add your first payout!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payouts.slice(0, payoutsVisible).map((p) => (
                    <div key={p.id} className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:gap-3 sm:p-5">
                      <button onClick={() => openFirmDashboard(p.firm_name)} className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-emerald-500/15 font-display text-sm font-bold text-emerald-300">
                        {firmInitial(p.firm_name)}
                      </button>
                      <div className="min-w-0 flex-1">
                        <button onClick={() => openFirmDashboard(p.firm_name)} className="font-display text-base font-semibold hover:text-cyan-300 transition-colors">{p.firm_name}</button>
                        <div className="whitespace-nowrap font-mono text-[11px] text-white/40">{fmtDate(p.payout_date)}</div>
                        {p.notes && <p className="mt-1 text-xs text-white/50">{p.notes}</p>}
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold text-emerald-400 sm:text-lg">+{fmtCurrency(p.amount)}</div>
                      </div>
                      <button onClick={() => setEditingPayout(p)} className="grid h-8 w-8 place-items-center rounded text-white/30 hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors" title="Edit">
                        <PencilIcon className="h-3 w-3" />
                      </button>
                      <button onClick={() => handleDeletePayout(p.id)} className="grid h-8 w-8 place-items-center rounded text-[10px] text-white/30 hover:bg-red-500/20 hover:text-red-400 transition-colors" title="Delete">&#10005;</button>
                    </div>
                  ))}
                  {payoutsVisible < payouts.length && (
                    <button onClick={() => setPayoutsVisible((v) => v + 5)} className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 text-xs font-medium text-white/50 hover:bg-white/[0.06] hover:text-white/70">
                      Show more ({payouts.length - payoutsVisible} remaining)
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Modals (always available) ──────────────────── */}
      <Modal open={showExpenseForm} onClose={() => setShowExpenseForm(false)} title={selectedFirm ? `Add Expense — ${selectedFirm}` : 'Add Expense'}>
        <AddExpenseForm onSave={handleAddExpense} onCancel={() => setShowExpenseForm(false)} existingFirms={firmNames} defaultFirmName={selectedFirm} />
      </Modal>

      <Modal open={showPayoutForm} onClose={() => setShowPayoutForm(false)} title={selectedFirm ? `Add Payout — ${selectedFirm}` : 'Add Payout'}>
        <AddPayoutForm onSave={handleAddPayout} onCancel={() => setShowPayoutForm(false)} existingFirms={firmNames} defaultFirmName={selectedFirm} />
      </Modal>

      <Modal open={!!editingExpense} onClose={() => setEditingExpense(null)} title="Edit Expense">
        {editingExpense && (
          <EditExpenseForm expense={editingExpense} onSave={handleUpdateExpense} onCancel={() => setEditingExpense(null)} existingFirms={firmNames} />
        )}
      </Modal>

      <Modal open={!!editingPayout} onClose={() => setEditingPayout(null)} title="Edit Payout">
        {editingPayout && (
          <EditPayoutForm payout={editingPayout} onSave={handleUpdatePayout} onCancel={() => setEditingPayout(null)} existingFirms={firmNames} />
        )}
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title={pendingDelete?.type === 'expense' ? 'Delete expense?' : 'Delete payout?'}
        message="This action can't be undone."
      />
    </div>
  );
}
