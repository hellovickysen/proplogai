import Link from 'next/link';
import LandingFooter from '@/components/landing/LandingFooter';
import LandingNav from '@/components/landing/LandingNav';

export const metadata = {
  title: 'Contact Us — PropLogAI',
  description: 'Get in touch with the PropLogAI team. Support, feedback, and general inquiries.',
};

const gradientBtn = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' };

export default function ContactPage() {
  return (
    <>
    <LandingNav />
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="mb-2 text-3xl font-bold">Contact Us</h1>
        <p className="mb-10 text-sm text-white/50">
          Have a question, feedback, or need help? We're here for you.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Email */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-400/20">
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-white mb-1">Email Support</h2>
            <p className="text-sm text-white/50 mb-3">For any questions, bug reports, or feedback.</p>
            <a href="mailto:support@proplogai.com" className="text-sm text-cyan-400 hover:underline font-medium">
              support@proplogai.com
            </a>
            <p className="mt-2 text-xs text-white/30">We typically respond within 24 hours.</p>
          </div>

          {/* In-app support */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-400/20">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-white mb-1">In-App Support</h2>
            <p className="text-sm text-white/50 mb-3">Submit a support ticket from your dashboard.</p>
            <Link href="/login" className="text-sm text-cyan-400 hover:underline font-medium">
              Sign in → Support
            </Link>
            <p className="mt-2 text-xs text-white/30">Track your tickets and get updates in-app.</p>
          </div>
        </div>

        {/* FAQ / Quick links */}
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-base font-semibold text-white mb-4">Common topics</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Pricing & Plans', href: '/pricing', desc: 'Compare Basic and Elite plans' },
              { label: 'Refund Policy', href: '/refund-policy', desc: 'Trial, cancellation, and refund details' },
              { label: 'Privacy Policy', href: '/privacy', desc: 'How we handle your data' },
              { label: 'Terms of Service', href: '/terms', desc: 'Usage terms and conditions' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 hover:bg-white/[0.05] transition-colors block">
                <div className="text-sm font-medium text-white/80">{item.label}</div>
                <div className="text-xs text-white/40 mt-0.5">{item.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Business info */}
        <div className="mt-10 text-center">
          <p className="text-xs text-white/30">PropLogAI — AI Trading Performance Coach</p>
          <p className="text-xs text-white/20 mt-1">
            <a href="mailto:support@proplogai.com" className="hover:text-white/40">support@proplogai.com</a>
          </p>
        </div>

      </div>
    </div>
    <LandingFooter />
    </>
  );
}
