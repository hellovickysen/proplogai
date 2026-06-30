"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { isDisposableEmail, validatePassword } from '@/lib/security';
import Logo from '@/components/Logo';

function EyeIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const { score, label, checks } = validatePassword(password);

  const barColor = score <= 1 ? 'bg-red-400' : score === 2 ? 'bg-amber-400' : score === 3 ? 'bg-emerald-400' : 'bg-cyan-400';
  const labelColor = score <= 1 ? 'text-red-400' : score === 2 ? 'text-amber-400' : score === 3 ? 'text-emerald-400' : 'text-cyan-400';

  const reqs = [
    { key: 'minLength', label: '8+ characters' },
    { key: 'hasUpper', label: 'Uppercase letter' },
    { key: 'hasLower', label: 'Lowercase letter' },
    { key: 'hasNumber', label: 'Number' },
    { key: 'hasSpecial', label: 'Special character' },
  ];

  return (
    <div className="mt-2">
      {/* Strength bar */}
      <div className="mb-1.5 flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={'h-1 flex-1 rounded-full transition-all ' + (i <= score ? barColor : 'bg-white/10')} />
          ))}
        </div>
        <span className={'font-mono text-[10px] font-semibold ' + labelColor}>{label}</span>
      </div>

      {/* Requirements checklist */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {reqs.map((r) => (
          <div key={r.key} className={'flex items-center gap-1 text-[10px] ' + (checks[r.key] ? 'text-emerald-400' : 'text-white/30')}>
            <span>{checks[r.key] ? '✓' : '○'}</span>
            <span>{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('signup') === '1' || p.get('mode') === 'signup') setMode('signup');
      if (p.get('verified') === '1') setMsg('Email verified! You can now sign in.');
      if (p.get('error') === 'verification_failed') setError('Verification link expired or invalid. Please try signing up again.');
    } catch (e) {}
  }, []);

  function friendlyError(msg) {
    if (!msg) return 'Something went wrong.';
    if (msg.includes('rate') || msg.includes('too many')) return 'Too many attempts. Please wait a moment and try again.';
    if (msg.includes('Email not confirmed')) return 'Please verify your email before signing in. Check your inbox.';
    if (msg.includes('Invalid login')) return 'Invalid email or password.';
    return msg;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);
    const supabase = createClient();

    if (mode === 'signup') {
      // Disposable email check
      if (isDisposableEmail(email)) {
        setError('Please use a permanent email address. Temporary/disposable emails are not allowed.');
        setLoading(false);
        return;
      }

      // Password strength check
      const { isValid } = validatePassword(password);
      if (!isValid) {
        setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(friendlyError(error.message));
      } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        // Email already exists — Supabase returns user with empty identities array
        setError('This email is already registered. Please sign in.');
        setMode('signin');
      } else if (data.user && !data.session) {
        // Email verification required
        setShowVerify(true);
      } else if (data.session) {
        router.push('/dashboard');
        router.refresh();
        return;
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(friendlyError(error.message));
      } else {
        router.push('/dashboard');
        router.refresh();
        return;
      }
    }
    setLoading(false);
  }

  async function handleResendVerification() {
    setResending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) {
      setError(friendlyError(error.message));
    } else {
      setMsg('Verification email resent! Check your inbox.');
    }
    setResending(false);
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    });
    if (error) {
      setError(friendlyError(error.message));
      setGoogleLoading(false);
    }
  }

  // Email verification screen
  if (showVerify) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 sm:px-6">
        <div className="pointer-events-none absolute -left-24 -top-40 h-[55vw] w-[55vw] rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.18), transparent 62%)', filter: 'blur(40px)' }} />
        <div className="pointer-events-none absolute -bottom-40 -right-24 h-[55vw] w-[55vw] rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.14), transparent 62%)', filter: 'blur(40px)' }} />

        <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <div className="mx-auto mb-4 text-5xl">📧</div>
          <h1 className="font-display text-2xl font-bold">Check your email</h1>
          <p className="mt-3 text-sm text-white/55">
            We sent a verification link to <strong className="text-white/80">{email}</strong>. Click the link to verify your account, then come back and sign in.
          </p>

          {msg && <p className="mt-4 text-sm text-emerald-400">{msg}</p>}
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <button
            onClick={handleResendVerification}
            disabled={resending}
            className="mt-6 text-sm text-cyan-400 hover:underline disabled:opacity-50"
          >
            {resending ? 'Resending...' : "Didn't get it? Resend email"}
          </button>

          <div className="mt-4">
            <button
              onClick={() => { setShowVerify(false); setMode('signin'); setError(null); setMsg(null); }}
              className="text-sm text-white/50 hover:text-white/70"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 sm:px-6">
      <div className="pointer-events-none absolute -left-24 -top-40 h-[55vw] w-[55vw] rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.18), transparent 62%)', filter: 'blur(40px)' }} />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[55vw] w-[55vw] rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.14), transparent 62%)', filter: 'blur(40px)' }} />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <Link href="/" className="mb-6 inline-flex w-fit">
          <Logo size={32} rounded="rounded-lg" glow wordmarkClassName="font-display text-lg font-bold tracking-tight" />
        </Link>

        <h1 className="font-display text-2xl font-bold">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="mb-6 mt-1 text-sm text-white/55">
          {mode === 'signin' ? 'Sign in to your trading journal.' : 'Start journaling smarter today.'}
        </p>

        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.08] disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {googleLoading ? 'Redirecting...' : 'Continue with Google'}
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/30">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400/60"
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={mode === 'signup' ? 8 : undefined}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-cyan-400/60"
                placeholder={mode === 'signup' ? 'Min 8 chars, mixed case + number + special' : 'Your password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {mode === 'signup' && <PasswordStrength password={password} />}
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}

          <button type="submit" disabled={loading} className="mt-1 rounded-xl px-4 py-3 font-semibold text-[#08080f] transition-transform hover:-translate-y-0.5 disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/55">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setMsg(null); }} className="text-cyan-400 hover:underline">
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </main>
  );
}
