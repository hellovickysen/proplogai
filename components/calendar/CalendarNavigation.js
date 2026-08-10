'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function Spinner() {
  return <span aria-hidden="true" className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}

export default function CalendarNavigation({ prevHref, nextHref, todayHref, prevLabel, nextLabel, currentLabel }) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState(null);

  useEffect(() => {
    setPendingHref(null);
  }, [currentLabel]);

  function navigate(href) {
    if (pendingHref || window.location.pathname + window.location.search === href) return;
    setPendingHref(href);
    router.push(href, { scroll: false });
  }

  function navigationButton(href, label, align) {
    const isPending = pendingHref === href;
    return (
      <button
        type="button"
        onClick={() => navigate(href)}
        disabled={!!pendingHref}
        aria-busy={isPending}
        className={'inline-flex min-w-[58px] items-center gap-1 text-xs text-white/40 transition-colors hover:text-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 disabled:cursor-wait disabled:opacity-70 ' + (align === 'right' ? 'justify-end' : '')}
      >
        {isPending ? <Spinner /> : null}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-2">
      {navigationButton(prevHref, '← ' + prevLabel)}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white">{currentLabel}</span>
        <button
          type="button"
          onClick={() => navigate(todayHref)}
          disabled={!!pendingHref}
          className="rounded-md border border-white/10 px-2 py-1 text-[11px] font-medium text-white/55 transition-colors hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 disabled:cursor-wait disabled:opacity-70"
        >
          Today
        </button>
      </div>
      {navigationButton(nextHref, nextLabel + ' →', 'right')}
    </div>
  );
}
