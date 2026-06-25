"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createExpense, deleteExpense, createPayout, deletePayout } from '@/app/dashboard/expenses/actions';
import { useToast } from '@/components/ui/Toast';
import { ExpensesEmptyIcon } from '@/components/ui/EmptyStates';



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

/** Capitalize first letter of each word */
function capitalizeWords(str) {
  if (!str) return '';
  return str.trim().replace(/\b\w/g, (c) => c.toUpperCase());
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
        {icon && <span className="text-lg opacity-50">{icon}</span>}
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

function FirmNameInput({ value, onChange, existingFirms, placeholder }) {
  const [focused, setFocused] = useState(false);
  const suggestions = value.length >= 1
    ? existingFirms.filter((fn) => fn.toLowerCase().startsWith(value.toLowerCase()) && fn.toLowerCase() !== value.toLowerCase())
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
        placeholder={placeholder || 'e.g. FTMO, Topstep, Apex...'}
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

/* ─── Modal Overlay ──────────────────────────────────────────── */

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e0e18] p-4 sm:p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
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

function AddExpenseForm({ onSave, onCancel, existingFirms }) {
  const [f, setF] = useState({ firm_name: '', account_type: 'futures', account_size: '$50K', purchase_type: 'new', account_cost: '', num_accounts: 1, total_cost: '', expense_date: todayStr() });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setF((p) => ({ ...p, [k]: v })); }

  /** Update cost fields with auto-calculation */
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
        <FirmNameInput value={f.firm_name} onChange={(v) => set('firm_name', v)} existingFirms={existingFirms} placeholder="e.g. FTMO, Topstep, Apex..." />
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

      {/* Cost row — aligned 3 columns */}
      <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <div>
          <label className={labelCls}>Cost per acct ($) *</label>
          <input className={field} value={f.account_cost} onChange={(e) => setCostField('account_cost', e.target.value)} inputMode="decimal" placeholder="0.00" required />
        </div>
        <div>
          <label className={labelCls}>Accounts</label>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => adjustAccounts(-1)} className="grid h-[42px] w-10 place-items-center rounded-lg border border-white/10 bg-black/30 text-lg text-white/60 hover:text-white">−</button>
            <span className="grid h-[42px] w-10 place-items-center font-display text-lg font-bold">{f.num_accounts}</span>
            <button type="button" onClick={() => adjustAccounts(1)} className="grid h-[42px] w-10 place-items-center rounded-lg border border-white/10 bg-black/30 text-lg text-white/60 hover:text-white">+</button>
          </div>
        </div>
        <div>
          <label className={labelCls}>Total cost ($)</label>
          <input className={field + ' bg-white/[0.02] text-white/70'} value={f.total_cost} readOnly tabIndex={-1} placeholder="Auto" />
        </div>
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

/* ─── Add Payout Form ────────────────────────────────────────── */

function AddPayoutForm({ onSave, onCancel, existingFirms }) {
  const [f, setF] = useState({ firm_name: '', amount: '', payout_date: todayStr(), notes: '' });
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
        <FirmNameInput value={f.firm_name} onChange={(v) => set('firm_name', v)} existingFirms={existingFirms} placeholder="e.g. FTMO, Topstep..." />
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

/* ─── Main Component ─────────────────────────────────────────── */

export default function ExpenseTracker({ expenses, payouts }) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState('Dashboard');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [expandedFirm, setExpandedFirm] = useState(null);

  // Aggregates
  const totalExpense = expenses.reduce((a, e) => a + (Number(e.total_cost) || 0), 0);
  const totalPayout = payouts.reduce((a, p) => a + (Number(p.amount) || 0), 0);
  const netPL = totalPayout - totalExpense;
  const totalAccounts = expenses.reduce((a, e) => a + (Number(e.num_accounts) || 0), 0);

  // Firms
  const firmMap = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      const fn = e.firm_name;
      if (!map[fn]) map[fn] = { name: fn, totalCost: 0, accounts: 0, expenses: [] };
      map[fn].totalCost += Number(e.total_cost) || 0;
      map[fn].accounts += Number(e.num_accounts) || 0;
      map[fn].expenses.push(e);
    });
    return map;
  }, [expenses]);

  const firms = useMemo(() => Object.values(firmMap).sort((a, b) => b.totalCost - a.totalCost), [firmMap]);
  const firmNames = useMemo(() => [...new Set([...expenses.map((e) => e.firm_name), ...payouts.map((p) => p.firm_name)])].filter(Boolean).sort(), [expenses, payouts]);

  // Handlers
  async function handleAddExpense(data) {
    const res = await createExpense(data);
    if (res.error) { if (toast) toast.error(res.error); }
    else { if (toast) toast.success('Expense added!'); setShowExpenseForm(false); router.refresh(); }
  }

  async function handleDeleteExpense(id) {
    if (!confirm('Delete this expense?')) return;
    const res = await deleteExpense(id);
    if (res.error) { if (toast) toast.error(res.error); }
    else { router.refresh(); }
  }

  async function handleAddPayout(data) {
    const res = await createPayout(data);
    if (res.error) { if (toast) toast.error(res.error); }
    else { if (toast) toast.success('Payout added!'); setShowPayoutForm(false); router.refresh(); }
  }

  async function handleDeletePayout(id) {
    if (!confirm('Delete this payout?')) return;
    const res = await deletePayout(id);
    if (res.error) { if (toast) toast.error(res.error); }
    else { router.refresh(); }
  }

  return (
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
            <HeroStat label="Total Expense" value={fmtCurrency(totalExpense)} tone="red" icon="&#8595;" />
            <HeroStat label="Total Payout" value={fmtCurrency(totalPayout)} tone="green" icon="&#8593;" />
            <HeroStat label="Net P/L" value={(netPL >= 0 ? '+' : '-') + fmtCurrency(Math.abs(netPL))} tone={netPL >= 0 ? 'green' : 'amber'} icon="&#9651;" />
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
                {[...expenses.slice(0, 5).map((e) => ({ type: 'expense', ...e, date: e.expense_date, amt: e.total_cost })),
                  ...payouts.slice(0, 5).map((p) => ({ type: 'payout', ...p, date: p.payout_date, amt: p.amount }))
                ]
                  .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
                  .slice(0, 8)
                  .map((item, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                      <div className={'grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg font-display text-sm font-bold ' + (item.type === 'payout' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/[0.06] text-white/60')}>
                        {firmInitial(item.firm_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{item.firm_name}</span>
                          {item.type === 'expense' && item.purchase_type && (
                            <span className={'rounded-full border px-2 py-0.5 text-[10px] font-semibold ' + (PURCHASE_COLORS[item.purchase_type] || 'border-white/10 text-white/50')}>
                              {PURCHASE_LABELS[item.purchase_type] || item.purchase_type}
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-white/40">{fmtDate(item.date)}</div>
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

          {firms.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
              <div className="text-center"><ExpensesEmptyIcon /><p className="mt-4 text-sm text-white/40">No expenses yet. Add your first prop firm expense.</p></div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {firms.map((firm) => (
                <div key={firm.name}>
                  <button onClick={() => setExpandedFirm(expandedFirm === firm.name ? null : firm.name)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition-all hover:border-white/20 hover:bg-white/[0.05]">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl font-display text-base font-bold" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(34,211,238,0.15))' }}>
                        {firmInitial(firm.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-base font-semibold">{firm.name}</div>
                        <div className="font-mono text-xs text-white/45">{firm.accounts} account{firm.accounts !== 1 ? 's' : ''}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-base font-bold text-red-400">{fmtCurrency(firm.totalCost)}</div>
                      </div>
                    </div>
                  </button>

                  {expandedFirm === firm.name && (
                    <div className="mt-1 space-y-2 rounded-b-2xl border border-t-0 border-white/10 bg-white/[0.02] p-4">
                      {firm.expenses.map((e) => (
                        <div key={e.id} className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2.5">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-mono text-white/50">{e.num_accounts} Acct{e.num_accounts > 1 ? 's' : ''}</span>
                              {e.account_size && <span className="font-mono text-white/50">{e.account_size}</span>}
                              {e.purchase_type && (
                                <span className={'rounded-full border px-2 py-0.5 text-[10px] font-semibold ' + (PURCHASE_COLORS[e.purchase_type] || '')}>
                                  {PURCHASE_LABELS[e.purchase_type]}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 font-mono text-[11px] text-white/35">{fmtDate(e.expense_date)}</div>
                          </div>
                          <div className="font-mono text-sm font-bold text-red-400">{fmtCurrency(e.total_cost)}</div>
                          <button onClick={() => handleDeleteExpense(e.id)} className="grid h-8 w-8 place-items-center rounded text-[10px] text-white/30 hover:bg-red-500/20 hover:text-red-400">&#10005;</button>
                        </div>
                      ))}
                    </div>
                  )}
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
                  <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-emerald-500/15 font-display text-sm font-bold text-emerald-300">
                    {firmInitial(p.firm_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-base font-semibold">{p.firm_name}</div>
                    <div className="font-mono text-[11px] text-white/40">{fmtDate(p.payout_date)}</div>
                    {p.notes && <p className="mt-1 text-xs text-white/50">{p.notes}</p>}
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-emerald-400">+{fmtCurrency(p.amount)}</div>
                  </div>
                  <button onClick={() => handleDeletePayout(p.id)} className="grid h-8 w-8 place-items-center rounded text-[10px] text-white/30 hover:bg-red-500/20 hover:text-red-400">&#10005;</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Modals ─────────────────────────────────────── */}
      <Modal open={showExpenseForm} onClose={() => setShowExpenseForm(false)} title="Add Expense">
        <AddExpenseForm onSave={handleAddExpense} onCancel={() => setShowExpenseForm(false)} existingFirms={firmNames} />
      </Modal>

      <Modal open={showPayoutForm} onClose={() => setShowPayoutForm(false)} title="Add Payout">
        <AddPayoutForm onSave={handleAddPayout} onCancel={() => setShowPayoutForm(false)} existingFirms={firmNames} />
      </Modal>
    </div>
  );
}
