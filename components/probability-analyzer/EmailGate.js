'use client';

import { useState } from 'react';
import { validateEmail } from '@/lib/disposable-emails';

export default function EmailGate({ onVerified }) {
  const [step, setStep] = useState('email'); // email | otp | verified
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendOTP() {
    setError('');
    const { valid, error: valErr } = validateEmail(email);
    if (!valid) { setError(valErr); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/tools/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!code.trim() || code.length < 6) { setError('Enter the 6-digit code.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/tools/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.verified) {
        setStep('verified');
        onVerified(email.trim());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#07070b]/80 backdrop-blur-md">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b0b14] p-6 shadow-2xl">
        {step === 'email' && (
          <>
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 text-2xl">
                🔒
              </div>
              <h3 className="text-lg font-bold text-white">Reveal Your Results</h3>
              <p className="mt-1 text-sm text-white/40">
                Enter your email to see your full analysis
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                placeholder="your@email.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-white/25"
                autoFocus
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                onClick={handleSendOTP}
                disabled={loading || !email.trim()}
                className="w-full rounded-xl py-3 text-sm font-semibold text-[#08080f] disabled:opacity-50"
                style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </div>

            <p className="mt-4 text-center text-[10px] text-white/20">
              No spam. No temporary emails. We just need to verify you're real.
            </p>
          </>
        )}

        {step === 'otp' && (
          <>
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-2xl">
                ✉️
              </div>
              <h3 className="text-lg font-bold text-white">Check Your Email</h3>
              <p className="mt-1 text-sm text-white/40">
                We sent a 6-digit code to <span className="text-white/60">{email}</span>
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                placeholder="000000"
                maxLength={6}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-white outline-none focus:border-white/25"
                autoFocus
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                onClick={handleVerify}
                disabled={loading || code.length < 6}
                className="w-full rounded-xl py-3 text-sm font-semibold text-[#08080f] disabled:opacity-50"
                style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}
              >
                {loading ? 'Verifying...' : 'Verify & Reveal Results'}
              </button>
            </div>

            <button
              onClick={() => { setStep('email'); setCode(''); setError(''); }}
              className="mt-3 w-full text-center text-xs text-white/30 hover:text-white/50"
            >
              Use a different email
            </button>
          </>
        )}
      </div>
    </div>
  );
}
