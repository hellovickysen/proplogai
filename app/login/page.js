"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('signup') === '1' || p.get('mode') === 'signup') setMode('signup');
    } catch (e) {}
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);
    const supabase = createClient();
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push('/dashboard');
        router.refresh();
        return;
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        router.push('/dashboard');
        router.refresh();
        return;
      } else {
        setMsg('Account created. Check your email to confirm, then sign in.');
        setMode('signin');
      }
    }
    setLoading(false);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute -left-24 -top-40 h-[55vw] w-[55vw] rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.18), transparent 62%)', filter: 'blur(40px)' }} />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[55vw] w-[55vw] rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.14), transparent 62%)', filter: 'blur(40px)' }} />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <Link href="/" className="mb-6 flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg text-sm" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', boxShadow: '0 0 18px rgba(139,92,246,0.5)' }}>&#9670;</span>
          <span className="font-display text-lg font-bold tracking-tight">PipMind</span>
        </Link>

        <h1 className="font-display text-2xl font-bold">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="mb-6 mt-1 text-sm text-white/50">
          {mode === 'signin' ? 'Sign in to your trading journal.' : 'Start journaling smarter today.'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-white/40">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400/60" placeholder="you@email.com" />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-white/40">Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400/60" placeholder="At least 6 characters" />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}

          <button type="submit" disabled={loading} className="mt-1 rounded-xl px-4 py-2.5 font-semibold text-[#08080f] transition-transform hover:-translate-y-0.5 disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/50">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setMsg(null); }} className="text-cyan-400 hover:underline">
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </main>
  );
}
