import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateEmail } from '@/lib/disposable-emails';

const supabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/* ── Rate limiter ──────────────────────────────────────────── */

const emailHits = new Map(); // email -> [timestamps]
const ipHits = new Map();    // ip -> [timestamps]
const HOUR = 60 * 60 * 1000;

function isLimited(map, key, max) {
  const now = Date.now();
  const list = (map.get(key) || []).filter((t) => now - t < HOUR);
  if (list.length >= max) return true;
  list.push(now);
  map.set(key, list);
  return false;
}

/* ── Generate 6-digit OTP ──────────────────────────────────── */

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/* ── Send email via Resend ─────────────────────────────────── */

async function sendOTPEmail(email, code) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('Email service not configured.');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'PropLogAI <noreply@proplogai.com>',
      to: [email],
      subject: 'Your PropLogAI Verification Code',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 400px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #111; margin-bottom: 8px;">Your Verification Code</h2>
          <p style="color: #666; margin-bottom: 24px;">Enter this code to reveal your Prop Test analysis results:</p>
          <div style="background: #f4f4f5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #111;">${code}</span>
          </div>
          <p style="color: #999; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #bbb; font-size: 12px;">PropLogAI — AI-powered trading journal for prop firm traders</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error('[send-otp] Resend error:', res.status, t.slice(0, 200));
    throw new Error('Failed to send verification email.');
  }
}

/* ── Handler ───────────────────────────────────────────────── */

export async function POST(request) {
  try {
    const { email } = await request.json();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    // Validate email
    const { valid, error } = validateEmail(email);
    if (!valid) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // Rate limits
    if (isLimited(emailHits, email.toLowerCase(), 3)) {
      return NextResponse.json({ error: 'Too many requests for this email. Try again in an hour.' }, { status: 429 });
    }
    if (isLimited(ipHits, ip, 10)) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const code = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Upsert into tool_leads
    const db = supabase();
    const { error: dbErr } = await db
      .from('tool_leads')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          otp_code: code,
          otp_expires: expires,
          otp_attempts: 0,
          ip_address: ip,
          verified: false,
        },
        { onConflict: 'email', ignoreDuplicates: false },
      );

    // If upsert fails (no unique constraint on email), try insert
    if (dbErr) {
      await db.from('tool_leads').insert({
        email: email.toLowerCase().trim(),
        otp_code: code,
        otp_expires: expires,
        otp_attempts: 0,
        ip_address: ip,
        verified: false,
      });
    }

    // Send OTP email
    await sendOTPEmail(email.trim(), code);

    return NextResponse.json({ success: true, message: 'Verification code sent.' });
  } catch (err) {
    console.error('[send-otp] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to send verification code.' }, { status: 500 });
  }
}
