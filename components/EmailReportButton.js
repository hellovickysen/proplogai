"use client";

import { useState } from 'react';
import { sendCoachReportEmail } from '@/app/dashboard/coach/actions';
import { useToast } from '@/components/Toast';

export default function EmailReportButton() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function handleSend() {
    setBusy(true);
    try {
      const res = await sendCoachReportEmail();
      if (res && res.error) {
        if (toast) toast.error(res.error);
      } else {
        if (toast) toast.success('Coach report sent to your email!');
      }
    } catch (e) {
      if (toast) toast.error('Failed to send email.');
    }
    setBusy(false);
  }

  return (
    <button
      onClick={handleSend}
      disabled={busy}
      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white disabled:opacity-60"
    >
      {busy ? 'Sending…' : '✉ Email Report'}
    </button>
  );
}
