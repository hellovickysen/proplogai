'use client';

import { useState } from 'react';

export default function AdminTabs({ firmsContent, leadsContent }) {
  const [tab, setTab] = useState('firms');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-1 w-fit">
        <button
          onClick={() => setTab('firms')}
          className={`rounded-md px-4 py-2 text-xs font-semibold transition-colors ${
            tab === 'firms' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
          }`}
        >
          Prop Firms
        </button>
        <button
          onClick={() => setTab('leads')}
          className={`rounded-md px-4 py-2 text-xs font-semibold transition-colors ${
            tab === 'leads' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
          }`}
        >
          Lead Gen
        </button>
      </div>

      {tab === 'firms' && firmsContent}
      {tab === 'leads' && leadsContent}
    </div>
  );
}
