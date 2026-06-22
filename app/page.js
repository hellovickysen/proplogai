export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute -left-24 -top-40 h-[55vw] w-[55vw] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.20), transparent 62%)', filter: 'blur(40px)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-24 h-[55vw] w-[55vw] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.16), transparent 62%)', filter: 'blur(40px)' }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-7 flex items-center gap-3">
          <span
            className="grid h-10 w-10 place-items-center rounded-xl text-lg"
            style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', boxShadow: '0 0 24px rgba(139,92,246,0.5)' }}
          >
            &#9670;
          </span>
          <span className="font-display text-xl font-bold tracking-tight">PipMind</span>
        </div>

        <span className="mb-6 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 font-mono text-xs text-white/60">
          AI FOREX TRADING JOURNAL &middot; COMING SOON
        </span>

        <h1 className="font-display text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
          The journal that tells you{' '}
          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            why you lose.
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60">
          Log your forex trades and let AI find your costliest recurring mistake, decode how your
          emotions drive results, and coach you to fix it.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <button
            className="rounded-xl px-6 py-3 font-semibold text-[#08080f] transition-transform hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', boxShadow: '0 6px 24px rgba(139,92,246,0.35)' }}
          >
            Join the beta
          </button>
        </div>

        <p className="mt-10 font-mono text-xs text-white/40">v0.1 &middot; built with Next.js on Vercel</p>
      </div>
    </main>
  );
}
