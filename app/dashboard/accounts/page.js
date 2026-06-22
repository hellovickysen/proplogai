import { createClient } from '@/lib/supabase/server';
import ConnectAccountForm from '@/components/ConnectAccountForm';
import SyncAccountButton from '@/components/SyncAccountButton';
import { getAccountStatus } from '@/lib/metaapi';

export const dynamic = 'force-dynamic';

function fmtDate(d) {
  if (!d) return 'never';
  try {
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return 'never';
  }
}

function statusBadge(st) {
  if (!st || !st.ok) return { text: 'status unknown', cls: 'bg-white/10 text-white/40' };
  if (st.connectionStatus === 'CONNECTED') return { text: 'Connected — ready to sync', cls: 'bg-emerald-500/15 text-emerald-300' };
  if (st.connectionStatus && /DISCONNECTED_FROM_BROKER/i.test(st.connectionStatus)) {
    return { text: 'Broker login failed — check server & investor password', cls: 'bg-red-500/15 text-red-300' };
  }
  if (st.state === 'DEPLOYED') return { text: 'Connecting to broker…', cls: 'bg-amber-500/15 text-amber-300' };
  if (st.state === 'DEPLOYING' || st.state === 'CREATED') return { text: 'Deploying…', cls: 'bg-amber-500/15 text-amber-300' };
  if (st.state === 'UNDEPLOYED') return { text: 'Not deployed — hit Sync to start', cls: 'bg-amber-500/15 text-amber-300' };
  return { text: ((st.state || '') + ' ' + (st.connectionStatus || '')).trim() || 'unknown', cls: 'bg-white/10 text-white/50' };
}

export default async function AccountsPage() {
  const supabase = createClient();
  const { data: accounts } = await supabase.from('accounts').select('*').order('created_at', { ascending: false });
  const list = accounts || [];

  const statuses = await Promise.all(
    list.map((a) => (a.metaapi_id ? getAccountStatus(a.metaapi_id) : Promise.resolve(null)))
  );

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Accounts</h1>
        <p className="mt-1 text-sm text-white/50">Connect MetaTrader 5 via MetaApi to auto-import your trades.</p>
      </div>

      {list.length ? (
        <div className="mb-6 space-y-3">
          {list.map((a, i) => {
            const b = statusBadge(statuses[i]);
            return (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base font-semibold">{a.name || a.server}</span>
                    <span className={'rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase ' + b.cls}>{b.text}</span>
                  </div>
                  <div className="mt-1 font-mono text-xs text-white/40">
                    {a.server} · #{a.login} · {a.region} · last sync {fmtDate(a.last_synced_at)}
                  </div>
                </div>
                <SyncAccountButton accountId={a.id} />
              </div>
            );
          })}
          <p className="px-1 font-mono text-[11px] leading-relaxed text-white/40">
            Connected = ready to Sync. If it sits on Deploying/Connecting for 5+ minutes or shows a broker-login failure, the broker server name or investor password is usually the issue.
          </p>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm text-white/50">
          No accounts connected yet. Connect one below to auto-import trades.
        </div>
      )}

      <ConnectAccountForm />
    </div>
  );
}
