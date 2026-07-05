import Link from 'next/link';
import LandingFooter from '@/components/landing/LandingFooter';
import LandingNav from '@/components/landing/LandingNav';

export const metadata = {
  title: 'About — PropLogAI',
  description: 'PropLogAI is an AI-powered trading journal built for prop firm traders. Learn about our mission and what we do.',
};

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
const gradientBtn = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' };

export default function AboutPage() {
  return (
    <>
    <LandingNav />
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
{/* Hero */}
        <h1 className="text-3xl font-bold sm:text-4xl leading-tight">
          Built for traders who want to{' '}
          <span style={gradientText}>stop repeating the same mistakes.</span>
        </h1>
        <p className="mt-6 text-base leading-relaxed text-white/55 max-w-2xl">
          PropLogAI is an AI-powered trading journal designed specifically for prop firm traders.
          It helps you log trades, track your emotions and discipline, and receive personalized
          coaching from Propol AI — all in one place.
        </p>

        {/* Mission */}
        <div className="mt-16">
          <h2 className="text-xl font-bold mb-4">Our Mission</h2>
          <p className="text-sm leading-relaxed text-white/60 mb-4">
            Most traders fail not because they lack a strategy — but because they keep making
            the same behavioral mistakes without realizing it. Revenge trading after a loss.
            Moving stop losses. Ignoring their own rules when emotions run high.
          </p>
          <p className="text-sm leading-relaxed text-white/60 mb-4">
            PropLogAI exists to make those patterns visible. By combining structured journaling
            with AI analysis, we help traders see what they can&apos;t see in the moment — the
            recurring habits that cost them funded accounts.
          </p>
          <p className="text-sm leading-relaxed text-white/60">
            Our goal is simple: help you become a better, more consistent trader by understanding
            your own behavior — not by giving you trading signals or financial advice.
          </p>
        </div>

        {/* What we do */}
        <div className="mt-16">
          <h2 className="text-xl font-bold mb-6">What PropLogAI Does</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: '📓', title: 'Trade Journaling', desc: 'Log trades with emotions, confidence, screenshots, and lessons learned. Build a complete record of your trading behavior.' },
              { icon: '🤖', title: 'AI Coaching (Propol)', desc: 'Get personalized trade analysis and monthly reviews that identify your recurring mistakes and psychology patterns.' },
              { icon: '📊', title: 'Performance Analytics', desc: 'P&L calendar, equity curve, discipline scores, streaks, and achievement badges to track your progress.' },
              { icon: '💰', title: 'Expense Tracking', desc: 'Track prop firm costs, challenge fees, payouts, and net profitability across all your funded accounts.' },
              { icon: '📋', title: 'Trading Rulebook', desc: 'Define your setups, track which ones you follow, and see how setup discipline impacts your results.' },
              { icon: '🏆', title: 'Trophy Wall', desc: 'Celebrate milestones — upload payout certificates, challenge passes, and funded account wins.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-xs text-white/45 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Not financial advice */}
        <div className="mt-16 rounded-2xl border border-amber-400/15 bg-amber-500/[0.04] p-6">
          <h2 className="text-lg font-bold text-amber-300 mb-3">Important Disclaimer</h2>
          <p className="text-sm text-white/55 leading-relaxed mb-3">
            PropLogAI is an <strong className="text-white/80">educational tool</strong> for trading journal analysis.
            It analyzes your own journal, behavior, emotions, and adherence to your trading plan.
          </p>
          <p className="text-sm text-white/55 leading-relaxed mb-3">
            PropLogAI does <strong className="text-white/80">not</strong> provide financial, investment, or trading advice.
            It does not give buy/sell signals, market predictions, or position sizing recommendations.
          </p>
          <p className="text-sm text-white/55 leading-relaxed">
            Trading involves substantial risk of loss. Past performance is not indicative of future results.
            Always do your own research and consult a qualified financial advisor before making trading decisions.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-2">Ready to journal smarter?</h2>
          <p className="text-white/50 text-sm mb-6">Start free. 14-day Elite trial included.</p>
          <Link
            href="/login?mode=signup"
            className="inline-block rounded-xl px-8 py-3 text-sm font-bold text-[#08080f]"
            style={gradientBtn}
          >
            Get started free →
          </Link>
        </div>

        {/* Contact */}
        <div className="mt-16 text-center text-sm text-white/30">
          <p>Questions? Reach us at{' '}
            <a href="mailto:support@proplogai.com" className="text-cyan-400 hover:underline">support@proplogai.com</a>
          </p>
        </div>
      </div>
    </div>
    <LandingFooter />
    </>
  );
}
