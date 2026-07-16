"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TradeForm from '@/components/trades/TradeForm';
import JournalInlineEdit from '@/components/trades/JournalInlineEdit';

export default function EditTradeClient({ tradeId, trade, prefs, setups, journal, screenshots, userId, accounts, activeAccountId }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [journalDirty, setJournalDirty] = useState(false);
  const [tradeDirty, setTradeDirty] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingHref, setPendingHref] = useState(null);
  const dirtyRef = useRef(false);
  const navigatingRef = useRef(false);

  const onJournalDirtyChange = useCallback((d) => setJournalDirty(d), []);

  // Track trade form changes via input/change events
  useEffect(() => {
    const form = document.getElementById('trade-form');
    if (!form) return;
    function markDirty() { setTradeDirty(true); }
    form.addEventListener('input', markDirty);
    form.addEventListener('change', markDirty);
    return () => {
      form.removeEventListener('input', markDirty);
      form.removeEventListener('change', markDirty);
    };
  }, []);

  const isDirty = tradeDirty || journalDirty;

  // Keep ref in sync for event handlers
  useEffect(() => { dirtyRef.current = isDirty; }, [isDirty]);

  // Browser tab close/refresh — native popup (unavoidable for real page unload)
  useEffect(() => {
    function onBeforeUnload(e) {
      if (dirtyRef.current) { e.preventDefault(); e.returnValue = ''; }
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Intercept in-app link clicks — show custom modal instead of native popup
  useEffect(() => {
    function onClick(e) {
      if (!dirtyRef.current || navigatingRef.current) return;
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
      if (link.target === '_blank') return;
      if (href.startsWith('http') && !href.startsWith(window.location.origin)) return;
      if (link.dataset.skipDirtyCheck) return;
      e.preventDefault();
      e.stopPropagation();
      setPendingHref(href);
      setShowLeaveModal(true);
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // Browser back button — intercept with popstate
  useEffect(() => {
    window.history.pushState({ dirtyGuard: true }, '');
    function onPopState() {
      if (dirtyRef.current && !navigatingRef.current) {
        window.history.pushState({ dirtyGuard: true }, '');
        setPendingHref('__back__');
        setShowLeaveModal(true);
      }
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  function doNavigate(href) {
    navigatingRef.current = true;
    dirtyRef.current = false;
    setShowLeaveModal(false);
    setPendingHref(null);
    if (href === '__back__') {
      window.history.go(-2);
    } else if (href) {
      router.push(href);
    }
  }

  function handleDiscard() {
    doNavigate(pendingHref);
  }

  function handleStay() {
    setShowLeaveModal(false);
    setPendingHref(null);
  }

  async function handleSaveAndLeave() {
    setSaving(true);
    try {
      // Save journal first (it's a direct DB call)
      if (journalDirty && window.__journalSave) {
        await window.__journalSave();
      }
      // Submit trade form — this triggers onSubmit which navigates on success
      // So we don't need to navigate ourselves after
      const form = document.getElementById('trade-form');
      if (form) {
        form.requestSubmit();
        // TradeForm's onSubmit will handle navigation
      } else {
        // Fallback if form not found
        doNavigate(pendingHref);
      }
    } catch (e) {
      setSaving(false);
    }
  }

  async function handleSaveAll() {
    setSaving(true);
    try {
      // Save journal
      if (journalDirty && window.__journalSave) {
        await window.__journalSave();
      }
      // Submit trade form
      const form = document.getElementById('trade-form');
      if (form) form.requestSubmit();
    } catch (e) {
      // ignore
    }
    // Note: TradeForm's onSubmit navigates away on success,
    // so setSaving(false) may not run. That's fine — page is changing.
    // If it stays (validation error), TradeForm shows the error and we reset:
    setTimeout(() => setSaving(false), 3000);
  }

  return (
    <>
      <TradeForm mode="edit" tradeId={tradeId} initial={trade} prefs={prefs} setups={setups || []} accounts={accounts || []} activeAccountId={activeAccountId} hideButtons />

      {/* Journal — buttons hidden, save exposed via window ref */}
      <div className="mt-6 lg:pr-[324px]">
        <JournalInlineEdit
          tradeId={tradeId}
          journal={journal}
          userId={userId}
          prefs={prefs}
          screenshots={screenshots}
          startInEditMode
          hideButtons
          onDirtyChange={onJournalDirtyChange}
        />
      </div>

      {/* Single combined Save/Cancel at the bottom */}
      <div className="mt-6 flex items-center gap-3">
        <Link href={'/dashboard/trades/' + tradeId} data-skip-dirty-check className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/70">
          Cancel
        </Link>
        <button
          onClick={handleSaveAll}
          disabled={saving || !isDirty}
          className="rounded-xl px-5 py-3 text-sm font-semibold text-[#08080f] disabled:opacity-40"
          style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>

      {/* Custom unsaved changes modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={handleStay}>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-display font-semibold text-white mb-2">Unsaved changes</h3>
            <p className="text-sm text-white/55 mb-6">You have unsaved changes. Do you want to save before leaving?</p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveAndLeave}
                disabled={saving}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-50"
                style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
              >
                {saving ? 'Saving...' : 'Save & leave'}
              </button>
              <button
                onClick={handleDiscard}
                className="rounded-xl border border-red-400/30 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/20 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleStay}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/50 hover:text-white/70 transition-colors"
              >
                Stay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
