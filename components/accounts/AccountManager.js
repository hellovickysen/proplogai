'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAccount, updateAccount, archiveAccount, restoreAccount } from '@/app/dashboard/accounts/actions';

const PHASES = [
  { value: '', label: 'No phase' },
  { value: 'challenge', label: 'Challenge' },
  { value: 'funded', label: 'Funded' },
  { value: 'payout', label: 'Payout' },
];

const COLORS = ['#a78bfa', '#22d3ee', '#34d399', '#f59e0b', '#f87171', '#818cf8', '#fb923c', '#e879f9', '#38bdf8', '#4ade80'];

const PHASE_BADGES = {
  challenge: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
  funded: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  payout: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30',
};

function fmtMoney(v) {
  const n = Number(v) || 0;
  const sign = n >= 0 ? '+' : '-';
  return sign + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const gradientBtn = { background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' };
const field = 'w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400/60';
const labelCls = 'mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55';

export default function AccountManager({ accounts = [], archivedAccounts = [], stats = {}, allAccountsStats = {} }) {
  const [tab, setTab] = useState('active');
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [archiveModal, setArchiveModal] = useState(null); // { id, name }
  const router = useRouter();

  // Create form state
  const [form, setForm] = useState({
    name: '', prop_firm: '', account_size: '', phase: '', color: '#a78bfa', starting_balance: '',
  });

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  function resetForm() { setForm({ name: '', prop_firm: '', account_size: '', phase: '', color: '#a78bfa', starting_balance: '' }); }

  async function handleCreate() {
    setSaving(true);
    setError(null);
    const res = await createAccount(form);
    if (res.error) { setError(res.error); setSaving(false); return; }
    resetForm();
    setShowCreate(false);
    setSaving(false);
    router.refresh();
  }

  async function handleUpdate(id) {
    setSaving(true);
    setError(null);
    const res = await updateAccount(id, form);
    if (res.error) { setError(res.error); setSaving(false); return; }
    setEditId(null);
    resetForm();
    setSaving(false);
    router.refresh();
  }

  async function handleArchive() {
    if (!archiveModal) return;
    setSaving(true);
    const res = await archiveAccount(archiveModal.id);
    if (res.error) { setError(res.error); setSaving(false); return; }
    setArchiveModal(null);
    setSaving(false);
    router.refresh();
  }

  async function handleRestore(id) {
    setSaving(true);
    setError(null);
    const res = await restoreAccount(id);
    if (res.error) { setError(res.error); setSaving(false); return; }
    setSaving(false);
    router.refresh();
  }

  function startEdit(account) {
    setEditId(account.id);
    setForm({
      name: account.name || '',
      prop_firm: account.prop_firm || '',
      account_size: account.account_size || '',
      phase: account.phase || '',
      color: account.color || '#a78bfa',
      starting_balance: account.starting_balance || '',
    });
    setShowCreate(false);
    setError(null);
  }

  return (
    <div className="space-y-6">
      {/* All Accounts summary card — always visible */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-violet-500/[0.06] to-cyan-500/[0.04] p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="h-3 w-3 rounded-full bg-white/30 flex-shrink-0" />
          <div className="font-display text-base font-semibold text-white">All Accounts</div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
            <div className="font-mono text-[10px] uppercase text-white/35">Total P&L</div>
            <div className={'mt-1 font-mono text-sm font-semibold ' + ((allAccountsStats.totalPnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {fmtMoney(allAccountsStats.totalPnl || 0)}
            </div>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
            <div className="font-mono text-[10px] uppercase text-white/35">Trades</div>
            <div className="mt-1 font-mono text-sm font-semibold text-white">{allAccountsStats.tradeCount || 0}</div>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
            <div className="font-mono text-[10px] uppercase text-white/35">Accounts</div>
            <div className="mt-1 font-mono text-sm font-semibold text-white">{accounts.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs: Active / Archived */}
      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-1 w-fit">
        <button
          onClick={() => setTab('active')}
          className={'rounded-md px-4 py-2 text-xs font-semibold transition-colors ' +
            (tab === 'active' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70')}
        >
          Active ({accounts.length})
        </button>
        <button
          onClick={() => setTab('archived')}
          className={'rounded-md px-4 py-2 text-xs font-semibold transition-colors ' +
            (tab === 'archived' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70')}
        >
          Archived ({archivedAccounts.length})
        </button>
      </div>

      {/* Active tab */}
      {tab === 'active' && (
        <>
          {/* Account cards */}
          {accounts.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.map((acc) => {
                const s = stats[acc.id] || {};
                const isEditing = editId === acc.id;

                if (isEditing) {
                  return (
                    <div key={acc.id} className="rounded-2xl border border-violet-400/30 bg-violet-500/[0.03] p-5 space-y-4">
                      <div>
                        <label className={labelCls}>Account name *</label>
                        <input className={field} value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={60} autoFocus />
                      </div>
                      <div>
                        <label className={labelCls}>Prop firm</label>
                        <input className={field} value={form.prop_firm} onChange={(e) => set('prop_firm', e.target.value)} placeholder="e.g. FTMO, TFT, MyFundedFX" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Account size</label>
                          <input className={field} value={form.account_size} onChange={(e) => set('account_size', e.target.value)} inputMode="decimal" placeholder="e.g. 100000" />
                        </div>
                        <div>
                          <label className={labelCls}>Starting balance</label>
                          <input className={field} value={form.starting_balance} onChange={(e) => set('starting_balance', e.target.value)} inputMode="decimal" />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Phase</label>
                        <div className="flex gap-2">
                          {PHASES.map((p) => (
                            <button key={p.value} type="button" onClick={() => set('phase', p.value)}
                              className={'rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ' +
                                (form.phase === p.value ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300' : 'border-white/10 bg-black/30 text-white/50')}>
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Color</label>
                        <div className="flex gap-2">
                          {COLORS.map((c) => (
                            <button key={c} type="button" onClick={() => set('color', c)}
                              className={'h-6 w-6 rounded-full border-2 transition-transform ' + (form.color === c ? 'border-white scale-110' : 'border-transparent')}
                              style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>
                      {error && <p className="text-sm text-red-400">{error}</p>}
                      <div className="flex gap-2">
                        <button onClick={() => { setEditId(null); resetForm(); setError(null); }} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70">Cancel</button>
                        <button onClick={() => handleUpdate(acc.id)} disabled={saving} className="rounded-xl px-4 py-2 text-xs font-semibold text-[#08080f] disabled:opacity-50" style={gradientBtn}>
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={acc.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: acc.color || '#a78bfa', boxShadow: `0 0 8px ${acc.color || '#a78bfa'}30` }} />
                        <div>
                          <div className="font-display text-base font-semibold text-white">{acc.name}</div>
                          {acc.prop_firm && <div className="text-xs text-white/40">{acc.prop_firm}</div>}
                        </div>
                      </div>
                      {acc.phase && PHASE_BADGES[acc.phase] && (
                        <span className={'rounded-full border px-2 py-0.5 text-[10px] font-semibold ' + PHASE_BADGES[acc.phase]}>
                          {acc.phase.charAt(0).toUpperCase() + acc.phase.slice(1)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                        <div className="font-mono text-[10px] uppercase text-white/35">Total P&L</div>
                        <div className={'mt-1 font-mono text-sm font-semibold ' + ((s.totalPnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                          {fmtMoney(s.totalPnl || 0)}
                        </div>
                      </div>
                      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                        <div className="font-mono text-[10px] uppercase text-white/35">Trades</div>
                        <div className="mt-1 font-mono text-sm font-semibold text-white">{s.tradeCount || 0}</div>
                      </div>
                    </div>

                    {acc.account_size && (
                      <div className="mb-4 text-xs text-white/40">
                        Account size: ${Number(acc.account_size).toLocaleString()}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button onClick={() => startEdit(acc)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:text-white/90 transition-colors">
                        Edit
                      </button>
                      <button onClick={() => setArchiveModal({ id: acc.id, name: acc.name })} className="rounded-lg border border-red-400/20 bg-red-500/[0.04] px-3 py-1.5 text-xs text-red-400/70 hover:text-red-400 transition-colors">
                        Archive
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Create new account */}
          {!showCreate ? (
            <button
              onClick={() => { setShowCreate(true); setEditId(null); resetForm(); setError(null); }}
              className="flex items-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-4 text-sm text-white/50 hover:text-white/80 hover:border-white/30 transition-colors w-full sm:w-auto"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Add account
            </button>
          ) : (
            <div className="rounded-2xl border border-violet-400/20 bg-violet-500/[0.03] p-5 max-w-lg space-y-4">
              <h3 className="font-display text-base font-semibold">New account</h3>
              <div>
                <label className={labelCls}>Account name *</label>
                <input className={field} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. FTMO 100k Challenge" maxLength={60} autoFocus />
              </div>
              <div>
                <label className={labelCls}>Prop firm</label>
                <input className={field} value={form.prop_firm} onChange={(e) => set('prop_firm', e.target.value)} placeholder="e.g. FTMO, TFT, MyFundedFX" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Account size</label>
                  <input className={field} value={form.account_size} onChange={(e) => set('account_size', e.target.value)} inputMode="decimal" placeholder="e.g. 100000" />
                </div>
                <div>
                  <label className={labelCls}>Starting balance</label>
                  <input className={field} value={form.starting_balance} onChange={(e) => set('starting_balance', e.target.value)} inputMode="decimal" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Phase</label>
                <div className="flex gap-2">
                  {PHASES.map((p) => (
                    <button key={p.value} type="button" onClick={() => set('phase', p.value)}
                      className={'rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ' +
                        (form.phase === p.value ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300' : 'border-white/10 bg-black/30 text-white/50')}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Color</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => set('color', c)}
                      className={'h-6 w-6 rounded-full border-2 transition-transform ' + (form.color === c ? 'border-white scale-110' : 'border-transparent')}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setShowCreate(false); resetForm(); setError(null); }} className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70">Cancel</button>
                <button onClick={handleCreate} disabled={saving || !form.name.trim()} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-50" style={gradientBtn}>
                  {saving ? 'Creating...' : 'Create account'}
                </button>
              </div>
            </div>
          )}

          {/* Empty state for active accounts */}
          {accounts.length === 0 && !showCreate && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-4 opacity-30">📂</div>
              <h2 className="text-lg font-semibold text-white/80 mb-2">No active accounts</h2>
              <p className="text-sm text-white/40 max-w-sm">
                Create your first prop firm account to start grouping trades.
              </p>
            </div>
          )}
        </>
      )}

      {/* Archived tab */}
      {tab === 'archived' && (
        <>
          {archivedAccounts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {archivedAccounts.map((acc) => {
                const s = stats[acc.id] || {};
                return (
                  <div key={acc.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 opacity-70">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-3 w-3 rounded-full flex-shrink-0 opacity-40" style={{ backgroundColor: acc.color || '#a78bfa' }} />
                        <div>
                          <div className="font-display text-base font-semibold text-white/70">{acc.name}</div>
                          {acc.prop_firm && <div className="text-xs text-white/30">{acc.prop_firm}</div>}
                        </div>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/40">
                        Archived
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-2.5">
                        <div className="font-mono text-[10px] uppercase text-white/25">Total P&L</div>
                        <div className={'mt-1 font-mono text-sm font-semibold ' + ((s.totalPnl || 0) >= 0 ? 'text-emerald-400/60' : 'text-red-400/60')}>
                          {fmtMoney(s.totalPnl || 0)}
                        </div>
                      </div>
                      <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-2.5">
                        <div className="font-mono text-[10px] uppercase text-white/25">Trades</div>
                        <div className="mt-1 font-mono text-sm font-semibold text-white/60">{s.tradeCount || 0}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRestore(acc.id)}
                      disabled={saving}
                      className="rounded-lg border border-emerald-400/20 bg-emerald-500/[0.06] px-3 py-1.5 text-xs text-emerald-400/80 hover:text-emerald-400 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Restoring...' : 'Restore'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-4 opacity-20">&#128451;</div>
              <h2 className="text-lg font-semibold text-white/60 mb-2">No archived accounts</h2>
              <p className="text-sm text-white/30 max-w-sm">
                Archived accounts will appear here. You can restore them anytime.
              </p>
            </div>
          )}
        </>
      )}

      {/* Themed archive confirmation modal */}
      {archiveModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" onClick={() => setArchiveModal(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b0b14] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-500/10 border border-red-400/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-1 0v12a2 2 0 01-2 2H9a2 2 0 01-2-2V6h10z" />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-white">Archive account</h3>
                <p className="text-xs text-white/40">This can be undone</p>
              </div>
            </div>

            <p className="text-sm text-white/70 mb-6">
              Archive <span className="font-semibold text-white">{archiveModal.name}</span>? Trades will remain in your journal but won't appear under this account. You can restore it anytime from the Archived tab.
            </p>

            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => { setArchiveModal(null); setError(null); }}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-semibold text-white/70"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                disabled={saving}
                className="flex-1 rounded-xl border border-red-400/30 bg-red-500/10 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {saving ? 'Archiving...' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
