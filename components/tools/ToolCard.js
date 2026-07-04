'use client';
import Link from 'next/link';

export default function ToolCard({
  title,
  subtitle,
  icon,
  href,
  color = 'linear-gradient(120deg, #a78bfa, #22d3ee)',
}) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]"
    >
      {/* Glow accent on hover */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-20"
        style={{ background: color }}
        aria-hidden="true"
      />

      <div className="relative flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-2xl transition-transform duration-300 group-hover:scale-105"
          aria-hidden="true"
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold text-white">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-snug text-white/55">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between">
        <span
          className="font-mono text-xs uppercase tracking-wider text-white/40 transition-colors duration-300 group-hover:text-white/60"
        >
          Calculator
        </span>
        <span
          className="inline-flex items-center gap-1 font-mono text-sm font-medium text-transparent bg-clip-text transition-transform duration-300 group-hover:translate-x-0.5"
          style={{ backgroundImage: color }}
        >
          Open →
        </span>
      </div>
    </Link>
  );
}
