"use client";

const TABS = [
  { id: 'overview', label: 'Overview', icon: '◎' },
  { id: 'analysis', label: 'Trade Analysis', icon: '✦' },
  { id: 'review', label: 'Monthly Review', icon: '📊' },
  { id: 'playbook', label: 'Growth Plan', icon: '📋' },
];

export default function CoachTabs({ active, onChange }) {
  return (
    <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
      {TABS.map((tab) => {
        const className =
          'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ' +
          (active === tab.id
            ? 'bg-white/10 text-white'
            : 'text-white/45 hover:bg-white/[0.04] hover:text-white/70');
        const content = (
          <>
            <span className="text-xs">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </>
        );

        return (
          <button key={tab.id} type="button" onClick={() => onChange(tab.id)} className={className}>
            {content}
          </button>
        );
      })}
    </div>
  );
}
