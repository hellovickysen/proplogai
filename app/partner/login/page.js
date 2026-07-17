"use client";

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Logo from '@/components/Logo';

/**
 * Partner login — reuses the same Supabase auth as the main app (one identity).
 * On success, cookies scope to the partner subdomain and the user lands on the
 * affiliate dashboard.
 */
export default function PartnerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message || 'Sign-in failed.');
        setBusy(false);
        return;
      }
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo size={40} />
        <h1 className="mt-5 font-display text-2xl font-bold text-white">Affiliate login</h1>
        <p className="mt-1.5 text-sm text-white/55">
          Use your PropLogAI account to access your partner dashboard.
        </p>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
          placeholder="you@example.com"
        />
        <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
          placeholder="••••••••"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-[#08080f] disabled:opacity-60"
          style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-white/50">
        New here?{' '}
        <Link href="/apply" className="text-cyan-400 hover:underline">
          Apply to become an affiliate
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-white/35">
        Don&apos;t have a PropLogAI account yet?{' '}
        <a
          href="https://proplogai.com/login"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/55 hover:underline"
        >
          Create one first
        </a>
      </p>
    </div>
  );
}
