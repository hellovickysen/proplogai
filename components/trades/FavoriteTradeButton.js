"use client";

import { useState, useTransition } from 'react';
import { toggleTradeFavorite } from '@/app/dashboard/trades/actions';

export default function FavoriteTradeButton({ tradeId, initialFavorite = false }) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const nextFavorite = !isFavorite;
    setIsFavorite(nextFavorite);

    startTransition(async () => {
      const result = await toggleTradeFavorite(tradeId, nextFavorite);
      if (result?.error) setIsFavorite(!nextFavorite);
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-pressed={isFavorite}
      className={'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 ' +
        (isFavorite
          ? 'border-amber-400/40 bg-amber-400/[0.12] text-amber-300 hover:bg-amber-400/[0.18]'
          : 'border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white/80')}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m12 3 2.75 5.57 6.15.89-4.45 4.33 1.05 6.12L12 17.02l-5.5 2.89 1.05-6.12L3.1 9.46l6.15-.89L12 3Z" />
      </svg>
      {isFavorite ? 'Favorited' : 'Add to favorites'}
    </button>
  );
}
