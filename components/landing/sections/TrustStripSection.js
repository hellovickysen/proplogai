const CAPABILITIES = [
  'Trade Analytics',
  'AI Insights',
  'Rulebook',
  'Discipline Score',
  'Performance',
  'P&L Calendar',
  'Emotion Tracking',
  'Trader Evolution',
];

export default function TrustStripSection() {
  return (
    <section className="border-y border-white/[0.05] bg-[#06060c] px-4 py-8 sm:px-10" data-reveal>
      <p className="mb-6 text-center font-mono text-[11px] uppercase tracking-[0.24em] text-white/30">
        Built for traders who take improvement seriously
      </p>
      <div className="relative overflow-hidden" aria-hidden="true">
        <div className="capability-ticker">
          {[...CAPABILITIES, ...CAPABILITIES].map((cap, i) => (
            <span key={i} className="flex items-center gap-3 whitespace-nowrap text-sm text-white/45">
              <span className="h-1 w-1 rounded-full bg-violet-400/50" />
              {cap}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
