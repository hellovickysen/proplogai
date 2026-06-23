"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { connectAccount } from '@/app/dashboard/accounts/actions';

const REGIONS = ['new-york', 'london', 'singapore'];

export default function ConnectAccountForm() {
  const router = useRouter();
  const [form, setForm] = useState({ broker: '', server: '', login: '', password: '', name: '', region: 'new-york' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(false);
    const res = await connectAccount(form);
    if (res && res.error) {
      setError(res.error);
      setBusy(false);
    } else {
      setOk(true);
      setBusy(false);
      setForm({ broker: '', server: '', login: '', password: '', name: '', region: form.region });
      router.refresh();
    }
  }

  const field = 'w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400/60';
  const label = 'mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-white/40';

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-4 font-display text-base font-semibold">Connect an MT5 account</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={label}>Broker name</label><input className={field} value={form.broker} onChange={(e) => set('broker', e.target.value)} placeholder="e.g. IC Markets" /></div>
        <div><label className={label}>Broker server *</label><input className={field} value={form.server} onChange={(e) => set('server', e.target.value)} placeholder="e.g. ICMarketsSC-Demo" /></div>
        <div><label className={label}>Account login *</label><input className={field} value={form.login} onChange={(e) => set('login', e.target.value)} inputMode="numeric" placeholder="e.g. 51049288" /></div>
        <div><label className={label}>Investor (read-only) password *</label><input type="password" className={field} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="read-only password" /></div>
        <div><label className={label}>Label (optional)</label><input className={field} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. FTMO Challenge" /></div>
        <div>
          <label className={label}>MetaApi region</label>
          <select className={field} value={form.region} onChange={(e) => set('region', e.target.value)}>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <p className="mt-4 font-mono text-[11px] text-white/40">🔒 Use your INVESTOR (read-only) password — it can view trades but never trade or withdraw. It is stored by MetaApi, not in PropJournal.</p>

      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      {ok ? <p className="mt-3 text-sm text-emerald-400">Account connected. Give MetaApi a couple of minutes, then hit Sync.</p> : null}

      <button type="submit" disabled={busy} className="mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#ffc42d,#ff9f1c)' }}>
        {busy ? 'Connecting…' : 'Connect account'}
      </button>
    </form>
  );
}
