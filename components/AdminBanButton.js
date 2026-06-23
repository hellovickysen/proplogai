"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { banUser, unbanUser } from '@/app/admin/actions';

export default function AdminBanButton({ userId, isBanned, email }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const action = isBanned ? 'unban' : 'ban';
    const confirmed = window.confirm(
      isBanned
        ? `Unban ${email}? They will be able to log in again.`
        : `Ban ${email}? They will be immediately logged out and unable to access the platform.`
    );
    if (!confirmed) return;

    setLoading(true);
    const res = isBanned ? await unbanUser(userId) : await banUser(userId);
    if (res.error) {
      alert('Error: ' + res.error);
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={
        'rounded-lg border px-2.5 py-1 text-[10px] font-semibold disabled:opacity-50 ' +
        (isBanned
          ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
          : 'border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20')
      }
    >
      {loading ? '...' : isBanned ? 'Unban' : 'Ban'}
    </button>
  );
}
