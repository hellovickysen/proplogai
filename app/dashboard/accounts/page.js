import { createClient } from '@/lib/supabase/server';
import ConnectAccountForm from '@/components/ConnectAccountForm';
import SyncAccountButton from '@/components/SyncAccountButton';

export const dynamic = 'force-dynamic';

function fmtDate(d) {
  if (!d) return 'never';
  try {
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return 'never';
  }
}

export default async function AccountsPage() {
  const supabase = createClient();
  const { data: accounts } = await supabase.from('accounts').select('*').order('created_at', { ascending: false });
  const list = accounts || [];

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Accounts</h1>
        <p className="mt-1 text-sm text-white/50">Connect MetaTrader 5 via MetaApi to auto-import your trades.</p>
      </div>

      {list.length ? (
        <div className="mb-6 space-y-3">
          {list.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div>
                <div className="font-display text-base font-semibold">{a.name || a.server}</div>
                <div className="mt-1 font-mono text-xs text-white/40">
                  {a.server} · #{a.login} · {a.region} · last sync {fmtDate(a.last_synced_at)}
                </div>
              </div>
              <SyncAccountButton accountId={a.id} />
            </div>
          ))}
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
