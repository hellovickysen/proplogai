import Link from 'next/link';

const gradientText = {
  background: 'linear-gradient(120deg,#a78bfa,#22d3ee)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-white/70">{children}</div>
    </section>
  );
}

function Ul({ items }) {
  return (
    <ul className="ml-4 list-disc space-y-1 text-white/70">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function TermsPage() {
  return (
    <div
      className="min-h-screen px-4 py-16 text-white"
      style={{ background: '#07070b', fontFamily: 'Poppins, sans-serif' }}
    >
      <div className="mx-auto max-w-3xl">
        {/* Back link */}
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-cyan-400 transition-opacity hover:opacity-80"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to PropJournal
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="mb-3 text-3xl font-bold" style={gradientText}>
            Terms of Service
          </h1>
          <p className="text-sm text-white/55">Last updated: June 23, 2026</p>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Please read these Terms of Service (&quot;Terms&quot;) carefully before using
            PropJournal (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), accessible at{' '}
            <a
              href="https://pipmind-sigma.vercel.app"
              className="text-cyan-400 hover:opacity-80"
              target="_blank"
              rel="noopener noreferrer"
            >
              pipmind-sigma.vercel.app
            </a>{' '}
            (the &quot;Service&quot;).
          </p>
        </div>

        {/* Divider */}
        <div className="mb-10 h-px bg-white/10" />

        {/* NOT FINANCIAL ADVICE — prominent banner */}
        <div className="mb-10 rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-5">
          <p className="mb-1 text-sm font-semibold text-amber-400">
            Important: Not Financial Advice
          </p>
          <p className="text-sm leading-relaxed text-white/70">
            PropJournal is an educational journaling and self-reflection tool. Nothing on this
            platform — including AI-generated coaching, pattern analysis, performance statistics,
            or any other content — constitutes financial advice, investment advice, trading
            recommendations, or any form of regulated financial service. You are solely
            responsible for your own trading decisions. Past journaled performance is not
            indicative of future results. Always conduct your own research and, where appropriate,
            consult a licensed financial professional.
          </p>
        </div>

        {/* 1. Acceptance */}
        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using the Service you confirm that you are at least 18 years old,
            have read and understood these Terms, and agree to be bound by them. If you are using
            the Service on behalf of an organisation, you represent that you have the authority
            to bind that organisation to these Terms.
          </p>
          <p>
            If you do not agree to these Terms, you must not access or use the Service.
          </p>
        </Section>

        {/* 2. Description of Service */}
        <Section title="2. Description of Service">
          <p>
            PropJournal is an AI-powered trading journal designed for prop firm traders and
            independent retail traders. The Service allows you to:
          </p>
          <Ul
            items={[
              'Log and review your trades, including entry/exit prices, P&L, and instrument details.',
              'Write journal entries and attach emotion tags, mistake tags, and screenshots to trades.',
              'Receive AI-generated coaching insights that analyse your journaled behaviour and highlight recurring patterns.',
              'View performance statistics, an equity curve, and a trade calendar.',
            ]}
          />
          <p>
            The Service is an educational self-improvement tool. All AI analysis is generated
            automatically based solely on the data you provide. It does not account for live
            market conditions, real-time risk, or your personal financial situation.
          </p>
        </Section>

        {/* 3. Not Financial Advice (full section) */}
        <Section title="3. Not Financial Advice">
          <p>
            PropJournal is not a financial adviser, broker, dealer, or investment adviser. The
            Service and all content within it — including but not limited to AI coaching
            responses, statistical summaries, pattern identifications, and any commentary — are
            provided purely for educational and informational purposes.
          </p>
          <p>
            Nothing in the Service should be construed as a solicitation, recommendation, or
            endorsement to buy, sell, or hold any financial instrument. Prop firm trading carries
            substantial risk of loss. You acknowledge that:
          </p>
          <Ul
            items={[
              'Trading decisions are made entirely at your own discretion and risk.',
              'AI coaching reflects patterns in your historical journal data only and is not forward-looking financial guidance.',
              'PropJournal bears no responsibility for trading losses incurred as a result of actions influenced by the Service.',
              'You should comply with all rules set by your prop firm and applicable financial regulations in your jurisdiction.',
            ]}
          />
        </Section>

        {/* 4. User Accounts */}
        <Section title="4. User Accounts and Responsibilities">
          <p>
            To use the Service you must create an account using an email address and password or
            via Google OAuth. You are responsible for:
          </p>
          <Ul
            items={[
              'Maintaining the confidentiality of your login credentials.',
              'All activity that occurs under your account.',
              'Providing accurate and current information when creating or updating your account.',
              'Notifying us immediately at support@propjournal.app if you suspect unauthorised access to your account.',
            ]}
          />
          <p>
            You must not share your account credentials with any other person. Each account is for
            the sole use of the individual who registered it. Account sharing — including sharing
            access with other traders, teammates, or third-party services acting on your behalf —
            is not permitted without our express written consent.
          </p>
          <p>
            We reserve the right to suspend or terminate accounts that we reasonably believe are
            being shared, compromised, or used in violation of these Terms.
          </p>
        </Section>

        {/* 5. Acceptable Use */}
        <Section title="5. Acceptable Use">
          <p>
            You agree to use the Service only for lawful purposes and in a manner consistent with
            these Terms. You must not:
          </p>
          <Ul
            items={[
              'Use the Service in any way that violates applicable local, national, or international law or regulation.',
              'Upload or transmit any content that is unlawful, harmful, threatening, abusive, defamatory, or otherwise objectionable.',
              'Attempt to gain unauthorised access to any part of the Service, its infrastructure, or other users\' data.',
              'Use automated scripts, bots, or scraping tools to extract data from the Service without our prior written consent.',
              'Abuse AI analysis endpoints by sending artificially constructed or synthetic data in an attempt to manipulate, overload, or exploit the AI system.',
              'Reverse-engineer, decompile, or attempt to extract the source code of the Service.',
              'Resell, sublicense, or commercially exploit the Service or its outputs without our express written permission.',
              'Impersonate any person or entity or misrepresent your affiliation with any person or entity.',
              'Introduce malicious code, viruses, or other harmful material into the Service.',
            ]}
          />
          <p>
            We reserve the right to investigate and take appropriate action — including suspending
            or terminating your account — if we determine, in our sole discretion, that you have
            violated this acceptable use policy.
          </p>
        </Section>

        {/* 6. User Content */}
        <Section title="6. Your Content">
          <p>
            You retain ownership of all trade data, journal entries, screenshots, and other
            content you submit to the Service (&quot;Your Content&quot;). By submitting content
            you grant PropJournal a limited, non-exclusive, royalty-free licence to store,
            process, and display Your Content solely for the purpose of providing the Service to
            you.
          </p>
          <p>
            You are solely responsible for Your Content. You represent and warrant that you have
            all rights necessary to submit Your Content and that it does not violate any
            applicable law or third-party rights.
          </p>
          <p>
            We do not use Your Content to train general-purpose AI models or share it with third
            parties for commercial purposes beyond what is described in our{' '}
            <Link href="/privacy" className="text-cyan-400 hover:opacity-80">
              Privacy Policy
            </Link>
            .
          </p>
        </Section>

        {/* 7. Intellectual Property */}
        <Section title="7. Intellectual Property">
          <p>
            The Service, including its design, codebase, AI prompting systems, branding, and all
            content created by PropJournal (excluding Your Content), is the exclusive property of
            PropJournal and is protected by applicable intellectual property laws.
          </p>
          <p>
            Nothing in these Terms transfers any intellectual property rights in the Service to
            you. You are granted a limited, revocable, non-exclusive, non-transferable licence to
            access and use the Service for personal, non-commercial purposes in accordance with
            these Terms.
          </p>
          <p>
            &quot;PropJournal&quot;, the PropJournal logo, and any other product or service names
            displayed on the Service are trademarks or trade dress of PropJournal. You may not use
            our trademarks without our prior written permission.
          </p>
        </Section>

        {/* 8. Limitation of Liability */}
        <Section title="8. Limitation of Liability">
          <p>
            To the fullest extent permitted by applicable law, PropJournal and its founders,
            employees, contractors, and affiliates shall not be liable for any indirect,
            incidental, special, consequential, punitive, or exemplary damages, including but not
            limited to:
          </p>
          <Ul
            items={[
              'Loss of profits or trading capital resulting from decisions influenced by the Service.',
              'Loss of data resulting from technical failures, accidental deletion, or third-party service outages.',
              'Unauthorized access to your account or data.',
              'Any interruption, suspension, or discontinuation of the Service.',
              'Errors or inaccuracies in AI-generated analysis or coaching outputs.',
            ]}
          />
          <p>
            In jurisdictions that do not allow the exclusion or limitation of certain damages,
            our liability is limited to the maximum extent permitted by law. In no event shall our
            total aggregate liability to you for all claims arising out of or relating to the
            Service exceed the greater of (a) the total amount you paid us in the 12 months
            preceding the claim or (b) USD $50.
          </p>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without
            warranties of any kind, either express or implied, including but not limited to
            warranties of merchantability, fitness for a particular purpose, and
            non-infringement.
          </p>
        </Section>

        {/* 9. Termination */}
        <Section title="9. Termination">
          <p>
            You may stop using the Service and delete your account at any time from your account
            settings. Upon account deletion, your data will be removed in accordance with our{' '}
            <Link href="/privacy" className="text-cyan-400 hover:opacity-80">
              Privacy Policy
            </Link>
            .
          </p>
          <p>
            We reserve the right to suspend or permanently terminate your access to the Service,
            with or without notice, if we determine that you have violated these Terms, engaged in
            fraudulent or abusive behaviour, or for any other reason at our sole discretion.
          </p>
          <p>
            Upon termination, all licences granted to you under these Terms will immediately cease.
            Sections that by their nature should survive termination — including Sections 3, 7, 8,
            10, and 11 — shall survive.
          </p>
        </Section>

        {/* 10. Changes to Terms */}
        <Section title="10. Changes to Terms">
          <p>
            We may revise these Terms at any time. When we make material changes we will update
            the &quot;Last updated&quot; date at the top of this page and notify you via email or
            a prominent in-app notice at least 14 days before the new Terms take effect.
          </p>
          <p>
            Your continued use of the Service after the effective date of any changes constitutes
            your acceptance of the revised Terms. If you do not agree to the revised Terms, you
            must stop using the Service before the changes take effect.
          </p>
        </Section>

        {/* 11. Governing Law */}
        <Section title="11. Governing Law and Disputes">
          <p>
            These Terms are governed by and construed in accordance with applicable law. Any
            disputes arising out of or relating to these Terms or the Service shall be resolved
            through good-faith negotiation between the parties. If the dispute cannot be resolved
            informally, it shall be submitted to the courts of competent jurisdiction under
            applicable law.
          </p>
          <p>
            If any provision of these Terms is found to be invalid or unenforceable, the remaining
            provisions will continue in full force and effect.
          </p>
        </Section>

        {/* 12. Contact */}
        <Section title="12. Contact Us">
          <p>
            If you have questions about these Terms or need to report a violation, please contact
            us at:
          </p>
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="font-semibold text-white">PropJournal</p>
            <p className="mt-1">
              Email:{' '}
              <a
                href="mailto:support@propjournal.app"
                className="text-cyan-400 hover:opacity-80"
              >
                support@propjournal.app
              </a>
            </p>
          </div>
        </Section>

        {/* Footer */}
        <div className="mt-12 border-t border-white/10 pt-8 text-center text-xs text-white/40">
          <p>
            &copy; {new Date().getFullYear()} PropJournal. All rights reserved.{' '}
            <Link href="/privacy" className="text-cyan-400 hover:opacity-80">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
