'use client';

import { useState, useEffect } from 'react';

export default function LeadsTab({ adminEmail }) {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, converted: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setStats(data.stats || { total: 0, verified: 0, converted: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    }
    setLoading(false);
  }

  function exportCSV() {
    const verified = leads.filter((l) => l.verified);
    const csv = ['Email,Verified,Converted,Source,Date']
      .concat(verified.map((l) => `${l.email},${l.verified},${l.converted || false},${l.source || ''},${l.created_at || ''}`))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proplogai-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Leads" value={stats.total} color="#60a5fa" />
        <StatCard label="Verified" value={stats.verified} color="#34d399" />
        <StatCard label="Converted" value={stats.converted} color="#a78bfa" />
      </div>

      {/* Funnel */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="font-mono text-[10px] uppercase tracking-wider text-white/35 mb-2">Conversion Funnel</div>
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span>{stats.total} visitors</span>
          <span className="text-white/20">→</span>
          <span>{stats.verified} verified ({stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%)</span>
          <span className="text-white/20">→</span>
          <span className="text-emerald-400">{stats.converted} converted ({stats.verified > 0 ? Math.round((stats.converted / stats.verified) * 100) : 0}%)</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={exportCSV} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/50 hover:text-white">
          Export Verified Leads (CSV)
        </button>
        <button onClick={fetchLeads} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/50 hover:text-white">
          Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-8 text-center text-sm text-white/30">Loading leads...</div>
      ) : leads.length === 0 ? (
        <div className="py-8 text-center text-sm text-white/30">No leads yet. They will appear here when users verify their email on the Probability Analyzer.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-white/35">Email</th>
                <th className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-white/35">Status</th>
                <th className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-white/35">Source</th>
                <th className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-white/35">Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-white/[0.03]">
                  <td className="px-4 py-2.5 text-white/70">{lead.email}</td>
                  <td className="px-4 py-2.5">
                    {lead.converted ? (
                      <span className="rounded bg-violet-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-400">Converted</span>
                    ) : lead.verified ? (
                      <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">Verified</span>
                    ) : (
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/30">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-white/30">{lead.source || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-white/30">{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
      <div className="font-mono text-[10px] uppercase tracking-wider text-white/35">{label}</div>
      <div className="mt-1 text-2xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
