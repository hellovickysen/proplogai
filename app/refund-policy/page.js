import Link from 'next/link';
import LandingFooter from '@/components/landing/LandingFooter';
import LandingNav from '@/components/landing/LandingNav';

export const metadata = {
  title: 'Refund Policy — PropLogAI',
  description: 'Refund and cancellation policy for PropLogAI subscriptions.',
};

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

export default function RefundPolicyPage() {
  return (
    <>
    <LandingNav />
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Link href="/" className="mb-8 inline-block font-display text-lg font-bold" style={gradientText}>PropLogAI</Link>
        <h1 className="mb-2 text-3xl font-bold">Refund & Cancellation Policy</h1>
        <p className="mb-10 text-sm text-white/40">Last updated: July 2026</p>

        <div className="text-sm leading-relaxed text-white/70 space-y-1">
          <Section title="1. Free Trial">
            <p className="mb-3">
              All new Elite subscriptions begin with a <strong className="text-white">14-day free trial</strong>. During the trial period, you have full access to all Elite features at no charge.
            </p>
            <p className="mb-3">
              No payment is collected during the trial. If you cancel before the trial ends, you will not be charged.
            </p>
            <p>
              If you do not cancel, your subscription will automatically begin at the end of the trial period, and your chosen payment method will be charged.
            </p>
          </Section>

          <Section title="2. Cancellation">
            <p className="mb-3">
              You may cancel your Elite subscription at any time from <strong className="text-white">Settings → Billing</strong> in your PropLogAI dashboard.
            </p>
            <p className="mb-3">
              When you cancel:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-3">
              <li>Your Elite access continues until the end of your current billing period.</li>
              <li>After the billing period ends, your account reverts to the Basic (free) plan.</li>
              <li>Your trade data, journal entries, and AI insights are preserved — nothing is deleted.</li>
              <li>You can resubscribe at any time to regain Elite access.</li>
            </ul>
          </Section>

          <Section title="3. Refunds">
            <p className="mb-3">
              Because we offer a generous 14-day free trial, we generally <strong className="text-white">do not offer refunds</strong> for subscription payments after the trial period.
            </p>
            <p className="mb-3">
              However, we will consider refund requests on a case-by-case basis in the following situations:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-3">
              <li><strong className="text-white">Billing errors:</strong> If you were charged incorrectly (e.g., double charge, wrong amount), contact us and we will issue a full refund for the erroneous charge.</li>
              <li><strong className="text-white">Service unavailability:</strong> If PropLogAI experiences extended downtime (more than 48 consecutive hours) during your billing period, you may request a prorated refund.</li>
              <li><strong className="text-white">Accidental renewal:</strong> If you intended to cancel before renewal but missed the deadline, contact us within 7 days of the charge and we will review your request.</li>
            </ul>
            <p>
              Partial refunds for unused portions of a billing period are not provided. We recommend cancelling before your renewal date if you no longer wish to continue.
            </p>
          </Section>

          <Section title="4. How to Request a Refund">
            <p className="mb-3">
              To request a refund, contact us at:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-3">
              <li>Email: <a href="mailto:support@proplogai.com" className="text-cyan-400 hover:underline">support@proplogai.com</a></li>
              <li>In-app: <Link href="/dashboard/support" className="text-cyan-400 hover:underline">Support Tickets</Link> (requires login)</li>
            </ul>
            <p>
              Please include your account email, the date of the charge, and the reason for your request. We aim to respond within 2 business days.
            </p>
          </Section>

          <Section title="5. Payment Processing">
            <p className="mb-3">
              All payments are processed securely by <strong className="text-white">Razorpay</strong>, a PCI-DSS Level 1 compliant payment gateway. PropLogAI does not store your credit card or banking details.
            </p>
            <p>
              Refunds, once approved, are processed through Razorpay and typically appear in your account within 5–10 business days, depending on your bank or payment provider.
            </p>
          </Section>

          <Section title="6. Changes to This Policy">
            <p>
              We may update this refund policy from time to time. Changes will be posted on this page with an updated "Last updated" date. Continued use of PropLogAI after changes constitutes acceptance of the revised policy.
            </p>
          </Section>

          <Section title="7. Contact">
            <p>
              Questions about refunds or billing? Email us at{' '}
              <a href="mailto:support@proplogai.com" className="text-cyan-400 hover:underline">support@proplogai.com</a>{' '}
              or visit our <Link href="/contact" className="text-cyan-400 hover:underline">contact page</Link>.
            </p>
          </Section>
        </div>

<LandingFooter />
      </div>
    </div>
    </>
  );
}
