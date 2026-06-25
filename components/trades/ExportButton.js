"use client";

import { useState } from 'react';
import { exportTradesCSV } from '@/app/dashboard/trades/export-actions';
import { useToast } from '@/components/ui/Toast';

export default function ExportButton() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const res = await exportTradesCSV();
      if (res.error) {
        if (toast) toast.error(res.error);
        setBusy(false);
        return;
      }

      // Trigger browser download
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (toast) toast.success('Exported ' + res.count + ' trades.');
    } catch (e) {
      if (toast) toast.error('Export failed. Please try again.');
    }
    setBusy(false);
  }

  return (
    <button
      onClick={handleExport}
      disabled={busy}
      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:text-white disabled:opacity-60"
    >
      {busy ? 'Exporting…' : '↓ Export CSV'}
    </button>
  );
}
