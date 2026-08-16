export default function PhilosophySection() {
  return (
    <section className="px-4 py-24 sm:px-10" data-reveal>
      <div className="mx-auto max-w-4xl">

        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-semibold text-white/50">
            Our philosophy
          </div>
        </div>

        <h2 className="text-center font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl">
          Why we don&apos;t connect<br />to your broker.
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-center text-base leading-relaxed text-white/55">
          Every other journal wants to auto-import your trades. We deliberately don&apos;t — and that&apos;s what makes PropLogAI actually change behavior.
        </p>

        {/* The Mark Douglas anchor quote */}
        <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 sm:p-10">
          <blockquote className="border-l-2 border-violet-400/50 pl-5">
            <p className="text-lg italic leading-relaxed text-white/80">
              &ldquo;The winning trader knows that the real edge isn&apos;t in the strategy — it&apos;s in the self-awareness to execute it consistently.&rdquo;
            </p>
            <cite className="mt-3 block text-sm font-semibold text-violet-300/70">— Mark Douglas, Trading in the Zone</cite>
          </blockquote>
        </div>

        {/* Two pillars */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-2 text-xl">🧠</div>
            <h3 className="font-display text-sm font-bold">Manual logging forces reflection</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/50">When you type the trade yourself, you relive it — the emotion, the setup, the decision. That 30-second pause is where behavior change happens. Auto-import skips the only moment that matters.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-2 text-xl">🔒</div>
            <h3 className="font-display text-sm font-bold">Your broker credentials stay yours</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/50">We never ask for your MT4/MT5 login, API key, or broker password. No third-party sync touches your funded account. Zero attack surface. Zero risk.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
