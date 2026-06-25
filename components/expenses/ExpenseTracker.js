"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createExpense, updateExpense, deleteExpense, createPayout, updatePayout, deletePayout, renameFirm } from '@/app/dashboard/expenses/actions';
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
  const [f, setF] = useState({ firm_name: defaultFirmName || '', amount: '', payout_date: todayStr(), notes: '' });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setF((p) => ({ ...p, [k]: v })); }

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
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70">Cancel</button>
        <button type="submit" disabled={saving} className="flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#34d399,#22d3ee)' }}>
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
  firmName, expenses, payouts,
  onBack, onDeleteExpense, onDeletePayout,
  onEditExpense, onEditPayout,
  onAddExpense, onAddPayout,
  onRenameFirm
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(firmName);
  const [savingName, setSavingName] = useState(false);

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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">
            Expenses <span className="ml-1 font-mono text-xs text-white/40">({expenses.length})</span>
          </h2>
          <button onClick={onAddExpense} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
            + Add Expense
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <p className="text-sm text-white/40">No expenses for {firmName} yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono text-white/50">{e.num_accounts} Acct{e.num_accounts > 1 ? 's' : ''}</span>
                    {e.account_size && <span className="font-mono text-white/50">{e.account_size}</span>}
                    {e.account_type && <span className="font-mono uppercase text-white/35">{e.account_type}</span>}
                    {e.purchase_type && (
                      <span className={'rounded-full border px-2 py-0.5 text-[10px] font-semibold ' + (PURCHASE_COLORS[e.purchase_type] || '')}>
                        {PURCHASE_LABELS[e.purchase_type]}
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
          </div>
        )}
      </div>

      {/* Payouts Section */}
      <div>
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
            {payouts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[11px] text-white/40">{fmtDate(p.payout_date)}</div>
                  {p.notes && <p className="mt-0.5 text-xs text-white/50">{p.notes}</p>}
                </div>
                <div className="font-mono text-sm font-bold text-emerald-400">+{fmtCurrency(p.amount)}</div>
                <button onClick={() => onEditPayout(p)} className="grid h-8 w-8 place-items-center rounded text-white/30 hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors" title="Edit">
                  <PencilIcon className="h-3 w-3" />
                </button>
                <button onClick={() => onDeletePayout(p.id)} className="grid h-8 w-8 place-items-center rounded text-[10px] text-white/30 hover:bg-red-500/20 hover:text-red-400 transition-colors" title="Delete">&#10005;</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */

export default function ExpenseTracker({ expenses, payouts }) {
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
      if (!map[fn]) map[fn] = { name: fn, totalCost: 0, accounts: 0, expenses: [], lastUpdated: e.created_at, types: [] };
      map[fn].totalCost += Number(e.total_cost) || 0;
      if (e.purchase_type === 'new') map[fn].accounts += Number(e.num_accounts) || 0;
      if (e.account_type && !map[fn].types.includes(e.account_type)) map[fn].types.push(e.account_type);
      map[fn].expenses.push(e);
      if (new Date(e.created_at) > new Date(map[fn].lastUpdated)) map[fn].lastUpdated = e.created_at;
    });
    // Also check payouts for lastUpdated
    payouts.forEach((p) => {
      const fn = p.firm_name;
      if (map[fn] && new Date(p.created_at) > new Date(map[fn].lastUpdated)) map[fn].lastUpdated = p.created_at;
    });
    return map;
  }, [expenses, payouts]);

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

  async function handleAddPayout(data) {
    const res = await createPayout(data);
    if (res.error) { if (toast) toast.error(res.error); }
    else { if (toast) toast.success('Payout added!'); setShowPayoutForm(false); router.refresh(); }
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
                <div className="grid gap-3 sm:grid-cols-2">
                  {firms.map((firm) => (
                    <div key={firm.name}>
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
                            <div className="font-mono text-xs text-white/45">{firm.accounts} account{firm.accounts !== 1 ? 's' : ''}</div>
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
              <div className="flex items-center justify-between rounded-2xl border border-emerald-400/15 p-5" style={{ background: 'rgba(52,211,153,0.04)' }}>
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-white/45">Total Payouts</div>
                  <div className="mt-1 font-display text-3xl font-bold text-emerald-400">{fmtCurrency(totalPayout)}</div>
                </div>
                <button onClick={() => setShowPayoutForm(true)} className="rounded-xl px-4 py-2 text-sm font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#34d399,#22d3ee)' }}>
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
                  {payouts.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <button onClick={() => openFirmDashboard(p.firm_name)} className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-emerald-500/15 font-display text-sm font-bold text-emerald-300">
                        {firmInitial(p.firm_name)}
                      </button>
                      <div className="min-w-0 flex-1">
                        <button onClick={() => openFirmDashboard(p.firm_name)} className="font-display text-base font-semibold hover:text-cyan-300 transition-colors">{p.firm_name}</button>
                        <div className="font-mono text-[11px] text-white/40">{fmtDate(p.payout_date)}</div>
                        {p.notes && <p className="mt-1 text-xs text-white/50">{p.notes}</p>}
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-lg font-bold text-emerald-400">+{fmtCurrency(p.amount)}</div>
                      </div>
                      <button onClick={() => setEditingPayout(p)} className="grid h-8 w-8 place-items-center rounded text-white/30 hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors" title="Edit">
                        <PencilIcon className="h-3 w-3" />
                      </button>
                      <button onClick={() => handleDeletePayout(p.id)} className="grid h-8 w-8 place-items-center rounded text-[10px] text-white/30 hover:bg-red-500/20 hover:text-red-400 transition-colors" title="Delete">&#10005;</button>
                    </div>
                  ))}
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
