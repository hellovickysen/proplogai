import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required.' }, { status: 400 });
    }

    const db = supabase();
    const normalEmail = email.toLowerCase().trim();

    // Find the lead
    const { data: leads, error: findErr } = await db
      .from('tool_leads')
      .select('id, otp_code, otp_expires, otp_attempts, verified')
      .eq('email', normalEmail)
      .order('created_at', { ascending: false })
      .limit(1);

    if (findErr || !leads || leads.length === 0) {
      return NextResponse.json({ error: 'No verification code found. Please request a new one.' }, { status: 404 });
    }

    const lead = leads[0];

    // Already verified
    if (lead.verified) {
      return NextResponse.json({ success: true, verified: true });
    }

    // Too many attempts
    if (lead.otp_attempts >= 5) {
      return NextResponse.json({ error: 'Too many attempts. Please request a new code.' }, { status: 429 });
    }

    // Expired
    if (new Date(lead.otp_expires) < new Date()) {
      return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 410 });
    }

    // Wrong code
    if (lead.otp_code !== code.trim()) {
      await db
        .from('tool_leads')
        .update({ otp_attempts: lead.otp_attempts + 1 })
        .eq('id', lead.id);

      return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 });
    }

    // Correct — mark verified
    await db
      .from('tool_leads')
      .update({ verified: true, otp_code: null, otp_expires: null })
      .eq('id', lead.id);

    return NextResponse.json({ success: true, verified: true });
  } catch (err) {
    console.error('[verify-otp] Error:', err);
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 });
  }
}
