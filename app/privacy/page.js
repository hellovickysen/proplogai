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

function SubSection({ title, children }) {
  return (
    <div className="mt-4">
      <h3 className="mb-2 text-sm font-semibold text-white/90">{title}</h3>
      <div className="space-y-2 text-sm leading-relaxed text-white/70">{children}</div>
    </div>
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

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-sm text-white/55">Last updated: June 23, 2026</p>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            PropJournal (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your
            personal information. This Privacy Policy explains what data we collect, how we use it,
            and your rights regarding that data when you use our AI-powered trading journal
            platform at{' '}
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
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            By using PropJournal you agree to the collection and use of information as described in
            this policy. If you do not agree, please discontinue use of the Service.
          </p>
        </div>

        {/* Divider */}
        <div className="mb-10 h-px bg-white/10" />

        {/* 1. Data We Collect */}
        <Section title="1. Data We Collect">
          <p>
            We collect information that is necessary to provide the Service and improve your
            experience. The categories of data we collect include:
          </p>

          <SubSection title="Account Information">
            <p>
              When you create an account we collect your email address and, where applicable, your
              name and profile avatar. If you sign in via Google OAuth, we receive your name, email
              address, and profile picture from Google in accordance with the permissions you grant.
            </p>
          </SubSection>

          <SubSection title="Trade Data">
            <p>
              When you log trades through the Service we collect information you enter, including
              but not limited to:
            </p>
            <Ul
              items={[
                'Currency pairs or instruments traded',
                'Entry and exit prices',
                'Profit and loss (P&L) figures',
                'Trade direction (long/short), lot sizes, and timestamps',
                'Prop firm account identifiers or labels you choose to provide',
              ]}
            />
          </SubSection>

          <SubSection title="Journal Entries">
            <p>
              The core of PropJournal is your trading journal. We store everything you write in
              your journal entries, including:
            </p>
            <Ul
              items={[
                'Free-form notes and trade narratives',
                'Emotion tags and self-assessments you attach to trades',
                'Mistake tags and rule-break flags',
                'Trade screenshots and chart images you upload',
              ]}
            />
          </SubSection>

          <SubSection title="AI Analysis Results">
            <p>
              When you request AI coaching or analysis, the Service sends relevant portions of your
              trade and journal data to our AI provider (see Third-Party Services below). The AI
              responses we return to you — including pattern identification, coaching notes, and
              behavioural insights — are stored in your account so you can review them later.
            </p>
          </SubSection>

          <SubSection title="Usage and Analytics Data">
            <p>
              We collect anonymised usage data to understand how the Service is used and to improve
              it. This includes page views, feature interactions, session duration, browser type,
              operating system, and approximate geographic region. This data is collected via
              PostHog (see Third-Party Services).
            </p>
          </SubSection>

          <SubSection title="Technical and Log Data">
            <p>
              Our hosting infrastructure automatically collects standard server logs including IP
              addresses, request timestamps, and HTTP status codes. This data is used for security
              monitoring and debugging and is not linked to your account for marketing purposes.
            </p>
          </SubSection>
        </Section>

        {/* 2. How We Use Your Data */}
        <Section title="2. How We Use Your Data">
          <p>We use the information we collect for the following purposes:</p>
          <Ul
            items={[
              'To create and manage your account and authenticate you securely.',
              'To display your trade history, equity curve, statistics, and calendar within the Service.',
              'To generate AI coaching insights and pattern analysis by passing your trade and journal data to our AI provider.',
              'To store and serve screenshots and avatars you upload.',
              'To send transactional emails such as email verification and password reset messages.',
              'To analyse aggregate, anonymised usage patterns so we can improve the Service.',
              'To detect and prevent fraud, abuse, or violations of our Terms of Service.',
              'To comply with applicable legal obligations.',
            ]}
          />
          <p className="mt-3">
            We do not sell your personal information to third parties. We do not use your trade
            data or journal entries to train general-purpose AI models without your explicit
            consent.
          </p>
        </Section>

        {/* 3. Data Storage and Security */}
        <Section title="3. Data Storage and Security">
          <p>
            All user data — including account details, trade records, journal entries, and AI
            analysis results — is stored in a Supabase-hosted PostgreSQL database. Supabase
            encrypts data at rest using AES-256 and in transit using TLS 1.2 or higher.
          </p>
          <p>
            Screenshots, chart images, and profile avatars are stored in Supabase Storage, which
            uses object-level encryption at rest.
          </p>
          <p>
            While we implement industry-standard safeguards, no method of electronic storage or
            transmission is 100% secure. We cannot guarantee absolute security of your data and
            you use the Service at your own risk in this regard.
          </p>
          <p>
            Access to your data within our systems is restricted to personnel who need it to
            operate and maintain the Service. We do not grant third parties broad access to your
            individual data.
          </p>
        </Section>

        {/* 4. Third-Party Services */}
        <Section title="4. Third-Party Services">
          <p>
            PropJournal relies on the following third-party services to operate. Each service has
            its own privacy policy which we encourage you to review:
          </p>

          <SubSection title="Supabase">
            <p>
              Provides our database (PostgreSQL), authentication infrastructure, and file storage.
              Your account credentials, trade data, journal entries, and uploaded files are stored
              on Supabase servers.{' '}
              <a
                href="https://supabase.com/privacy"
                className="text-cyan-400 hover:opacity-80"
                target="_blank"
                rel="noopener noreferrer"
              >
                Supabase Privacy Policy
              </a>
            </p>
          </SubSection>

          <SubSection title="OpenRouter / Anthropic">
            <p>
              When you request AI analysis, your trade data and journal content are transmitted to
              OpenRouter, which routes requests to large language model providers including
              Anthropic&apos;s Claude. Data sent to OpenRouter is subject to their data processing
              terms. We do not send your data to AI providers when you are simply browsing the
              Service — only when you explicitly trigger an AI analysis action.{' '}
              <a
                href="https://openrouter.ai/privacy"
                className="text-cyan-400 hover:opacity-80"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenRouter Privacy Policy
              </a>
            </p>
          </SubSection>

          <SubSection title="PostHog">
            <p>
              We use PostHog for product analytics. PostHog collects anonymised usage events
              (page views, button clicks, feature usage) and assigns a pseudonymous identifier to
              your browser session. This data helps us understand which features are used and where
              users encounter friction.{' '}
              <a
                href="https://posthog.com/privacy"
                className="text-cyan-400 hover:opacity-80"
                target="_blank"
                rel="noopener noreferrer"
              >
                PostHog Privacy Policy
              </a>
            </p>
          </SubSection>

          <SubSection title="Vercel">
            <p>
              PropJournal is hosted on Vercel&apos;s edge network. Vercel processes HTTP requests
              and may log IP addresses and request metadata for security and infrastructure
              purposes.{' '}
              <a
                href="https://vercel.com/legal/privacy-policy"
                className="text-cyan-400 hover:opacity-80"
                target="_blank"
                rel="noopener noreferrer"
              >
                Vercel Privacy Policy
              </a>
            </p>
          </SubSection>

          <SubSection title="Google OAuth">
            <p>
              If you choose to sign in with Google, Google authenticates you and shares your
              name, email address, and profile picture with us. We do not receive your Google
              password. Your use of Google Sign-In is governed by Google&apos;s Privacy Policy.{' '}
              <a
                href="https://policies.google.com/privacy"
                className="text-cyan-400 hover:opacity-80"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Privacy Policy
              </a>
            </p>
          </SubSection>
        </Section>

        {/* 5. Cookies */}
        <Section title="5. Cookies and Tracking Technologies">
          <p>PropJournal uses the following types of cookies and similar technologies:</p>

          <SubSection title="Session Cookies (Essential)">
            <p>
              Supabase Auth sets a session cookie to keep you logged in across page loads. This
              cookie is strictly necessary for the Service to function. It does not track you
              across third-party websites and cannot be opted out of while using the Service.
            </p>
          </SubSection>

          <SubSection title="Analytics Cookies (PostHog)">
            <p>
              PostHog sets a first-party analytics cookie to associate your browser session with
              usage events. This cookie is pseudonymous and does not contain personally
              identifiable information. You may opt out of PostHog analytics by enabling &quot;Do
              Not Track&quot; in your browser or by contacting us at{' '}
              <a href="mailto:support@propjournal.app" className="text-cyan-400 hover:opacity-80">
                support@propjournal.app
              </a>
              .
            </p>
          </SubSection>

          <p>
            We do not use advertising cookies, cross-site tracking cookies, or sell cookie data to
            third parties.
          </p>
        </Section>

        {/* 6. Data Retention and Deletion */}
        <Section title="6. Data Retention and Deletion">
          <p>
            We retain your data for as long as your account is active or as needed to provide the
            Service.
          </p>
          <p>
            You may delete your account at any time from your account settings. Upon account
            deletion we will permanently remove your profile information, trade data, journal
            entries, uploaded files, and AI analysis results from our active databases within 30
            days. Some data may persist in encrypted database backups for up to 90 days, after
            which it is purged automatically.
          </p>
          <p>
            If you would like to request deletion of specific data without closing your account,
            please contact us at{' '}
            <a href="mailto:support@propjournal.app" className="text-cyan-400 hover:opacity-80">
              support@propjournal.app
            </a>{' '}
            and we will respond within 30 days.
          </p>
          <p>
            We may retain anonymised, aggregated data (e.g. aggregate usage statistics) indefinitely
            as this data cannot be used to identify you.
          </p>
        </Section>

        {/* 7. Children */}
        <Section title="7. Children's Privacy">
          <p>
            PropJournal is intended for adults aged 18 and over. We do not knowingly collect
            personal information from anyone under the age of 18. If you believe a minor has
            created an account, please contact us immediately at{' '}
            <a href="mailto:support@propjournal.app" className="text-cyan-400 hover:opacity-80">
              support@propjournal.app
            </a>{' '}
            and we will delete the account and associated data promptly.
          </p>
        </Section>

        {/* 8. Your Rights */}
        <Section title="8. Your Rights">
          <p>
            Depending on your jurisdiction, you may have certain rights regarding your personal
            data, including the right to access, correct, export, or delete information we hold
            about you. To exercise any of these rights, please contact us at{' '}
            <a href="mailto:support@propjournal.app" className="text-cyan-400 hover:opacity-80">
              support@propjournal.app
            </a>
            . We will respond to verifiable requests within 30 days.
          </p>
          <p>
            For users in the European Economic Area (EEA) or United Kingdom, you have rights under
            the GDPR or UK GDPR including the right to lodge a complaint with your local data
            protection authority.
          </p>
        </Section>

        {/* 9. Changes */}
        <Section title="9. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. When we do, we will revise the
            &quot;Last updated&quot; date at the top of this page. For material changes we will
            notify you via email or a prominent notice within the Service at least 14 days before
            the change takes effect. Your continued use of the Service after a change becomes
            effective constitutes your acceptance of the updated policy.
          </p>
        </Section>

        {/* 10. Contact */}
        <Section title="10. Contact Us">
          <p>
            If you have questions, concerns, or requests regarding this Privacy Policy or our data
            practices, please reach out to us at:
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
            <Link href="/terms" className="text-cyan-400 hover:opacity-80">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
