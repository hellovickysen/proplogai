"use client";

import { useState } from 'react';
import ReferralDashboard from '@/components/referrals/ReferralDashboard';
import PartnersTab from '@/components/rewards/PartnersTab';

export default function RewardsTabs({ initialTab, referral, affiliate, userEmail }) {
  const [tab, setTab] = useState(initialTab === 'partners' ? 'partners' : 'refer');

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold">Rewards</h1>
        <p className="mt-1 text-sm text-white/55">
          Earn platform credit by referring friends — or earn recurring cash as a partner.
        </p>
      </div>

      <div className="mb-6 flex gap-1 border-b border-white/10">
        <TabBtn active={tab === 'refer'} onClick={() => setTab('refer')}>Refer a friend</TabBtn>
        <TabBtn active={tab === 'partners'} onClick={() => setTab('partners')}>
          Partners
          <span
            className="ml-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-[#08080f]"
            style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
          >
            EARN CASH
          </span>
        </TabBtn>
      </div>

      {tab === 'refer' ? (
        <ReferralDashboard embedded code={referral.code} referrals={referral.referrals} balance={referral.balance} />
      ) : (
        <PartnersTab affiliate={affiliate} userEmail={userEmail} />
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={
        'flex items-center border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ' +
        (active ? 'border-cyan-400 text-white' : 'border-transparent text-white/50 hover:text-white/75')
      }
    >
      {children}
    </button>
  );
}
