"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteUser } from '@/app/admin/actions';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function AdminDeleteButton({ email }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setShowConfirm(false);
    setLoading(true);
    const res = await deleteUser(email);
    if (res.error) {
      alert('Error: ' + res.error);
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="rounded-lg border border-red-400/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
      >
        {loading ? '...' : 'Delete'}
      </button>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title={`Delete ${email}?`}
        message="This will permanently delete the user and all their data (trades, journal, insights, subscriptions). This cannot be undone."
        confirmLabel="Delete"
      />
    </>
  );
}
