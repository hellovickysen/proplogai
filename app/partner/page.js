import Link from 'next/link';
import { DEFAULT_COMMISSION_RATE, MAX_COMMISSION_RATE } from '@/lib/affiliate';

export const dynamic = 'force-dynamic';

const AUDIENCES = [
  { icon: '📣', label: 'Influencers & creators' },
  { icon: '✈️', label: 'Telegram channel admins' },
  { icon: '💬', label: 'WhatsApp channel owners' },
  { icon: '▶️', label: 'YouTubers' },
  { icon: '🎮', label: 'Discord communities' },
  { icon: '🎓', label: 'Educators & mentors' },
];

const STEPS = [
  { n: '01', t: 'Apply', d: 'Tell us who you are and where your audience lives. Approval is manual and fast.' },
  { n: '02', t: 'Share your link', d: 'Get a unique referral link and tracking coupon the moment you are approved.' },
  { n: '03', t: 'Earn for life', d: 'Collect recurring commission every month a referred trader stays subscribed.' },
];

export default function PartnerLanding() {
  const pct = Math.round(DEFAULT_COMMISSION_RATE * 100);
  const maxPct = Math.round(MAX_COMMISSION_RATE * 100);

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      {/* Hero */}
      <section className="py-16 sm:py-24">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/45">
          PropLogAI Affiliate Program
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl">
          Earn{' '}
          <span
            style={{
              background: 'linear-gradient(120deg,#a78bfa,#22d3ee)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            lifetime recurring
          </span>{' '}
          commission on every trader you refer.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
          Promote the AI trading journal built for prop firm traders. Get paid {pct}% by default — up to {maxPct}% for
          top partners — for as long as your referrals keep their subscription.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/apply"
            className="rounded-xl px-6 py-3 text-sm font-semibold text-[#08080f]"
            style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
          >
            Become an affiliate
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white/80 hover:bg-white/[0.08]"
          >
            Affiliate login
          </Link>
        </div>
      </section>

      {/* Commission cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { big: pct + '%', small: 'Default commission', note: 'Applied to every approved affiliate.' },
          { big: maxPct + '%', small: 'Top-partner rate', note: 'Set by admins for high performers.' },
          { big: 'Lifetime', small: 'Recurring payouts', note: 'Monthly & yearly renewals both count.' },
        ].map((c) => (
          <div key={c.small} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div
              className="font-display text-4xl font-bold"
              style={{
                background: 'linear-gradient(120deg,#a78bfa,#22d3ee)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {c.big}
            </div>
            <p className="mt-2 font-mono text-xs uppercase tracking-wider text-white/55">{c.small}</p>
            <p className="mt-1 text-sm text-white/50">{c.note}</p>
          </div>
        ))}
      </section>

      {/* Who it's for */}
      <section className="py-16 sm:py-20">
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Built for every kind of creator</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCES.map((a) => (
            <div
              key={a.label}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4"
            >
              <span className="text-xl">{a.icon}</span>
              <span className="text-sm text-white/75">{a.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="pb-20">
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">How it works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <span className="font-mono text-sm text-cyan-400/70">{s.n}</span>
              <h3 className="mt-2 font-display text-lg font-semibold text-white">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <h3 className="font-display text-xl font-semibold text-white">Ready to start earning?</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/55">
            Apply in under a minute. Once approved, your link and coupon are live instantly.
          </p>
          <Link
            href="/apply"
            className="mt-5 inline-block rounded-xl px-6 py-3 text-sm font-semibold text-[#08080f]"
            style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
          >
            Apply now
          </Link>
        </div>
      </section>
    </div>
  );
}
