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
  const [pendingNav, setPendingNav] = useState(null); // { args, type: 'push'|'replace'|'back' }
  const dirtyRef = useRef(false);
  const allowNavRef = useRef(false);
  const origPushRef = useRef(null);
  const origReplaceRef = useRef(null);

  const onJournalDirtyChange = useCallback((d) => setJournalDirty(d), []);

  // Track trade form changes — input/change for text fields, click for toggle buttons
  useEffect(() => {
    const form = document.getElementById('trade-form');
    if (!form) return;
    function markDirty() { setTradeDirty(true); }
    function onClickInForm(e) {
      if (e.target.closest('button[type="button"]')) markDirty();
    }
    form.addEventListener('input', markDirty);
    form.addEventListener('change', markDirty);
    form.addEventListener('click', onClickInForm);
    return () => {
      form.removeEventListener('input', markDirty);
      form.removeEventListener('change', markDirty);
      form.removeEventListener('click', onClickInForm);
    };
  }, []);

  const isDirty = tradeDirty || journalDirty;
  useEffect(() => { dirtyRef.current = isDirty; }, [isDirty]);

  // Intercept history.pushState/replaceState — catches Next.js App Router navigation
  useEffect(() => {
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    origPushRef.current = origPush;
    origReplaceRef.current = origReplace;

    history.pushState = function (...args) {
      if (dirtyRef.current && !allowNavRef.current) {
        setPendingNav({ args, type: 'push' });
        setShowLeaveModal(true);
        return;
      }
      return origPush(...args);
    };

    history.replaceState = function (...args) {
      if (dirtyRef.current && !allowNavRef.current) {
        setPendingNav({ args, type: 'replace' });
        setShowLeaveModal(true);
        return;
      }
      return origReplace(...args);
    };

    return () => {
      history.pushState = origPush;
      history.replaceState = origReplace;
    };
  }, []);

  // Browser back button
  useEffect(() => {
    window.history.pushState({ dirtyGuard: true }, '');
    function onPopState() {
      if (dirtyRef.current && !allowNavRef.current) {
        window.history.pushState({ dirtyGuard: true }, '');
        setPendingNav({ type: 'back' });
        setShowLeaveModal(true);
      }
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Tab close/refresh
  useEffect(() => {
    function onBeforeUnload(e) {
      if (dirtyRef.current) { e.preventDefault(); e.returnValue = ''; }
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  function executeNav(nav) {
    if (!nav) return;
    allowNavRef.current = true;
    if (nav.type === 'push' && origPushRef.current) {
      origPushRef.current(...nav.args);
      // Also trigger Next.js to sync with the new URL
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else if (nav.type === 'replace' && origReplaceRef.current) {
      origReplaceRef.current(...nav.args);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else if (nav.type === 'back') {
      window.history.go(-2);
    }
    setTimeout(() => { allowNavRef.current = false; }, 500);
  }

  function handleStay() {
    setShowLeaveModal(false);
    setPendingNav(null);
    setSaving(false);
  }

  function handleDiscard() {
    setSaving(false);
    setShowLeaveModal(false);
    const nav = pendingNav;
    setPendingNav(null);
    dirtyRef.current = false;
    executeNav(nav);
  }

  async function handleSaveAndLeave() {
    setSaving(true);
    try {
      if (journalDirty && window.__journalSave) {
        await window.__journalSave();
      }
      // Submit trade form — its onSubmit will navigate via router.push
      // which we need to allow through
      allowNavRef.current = true;
      const form = document.getElementById('trade-form');
      if (form) {
        setShowLeaveModal(false);
        setPendingNav(null);
        form.requestSubmit();
      }
    } catch (e) {
      setSaving(false);
      allowNavRef.current = false;
    }
  }

  async function handleSaveAll() {
    setSaving(true);
    try {
      if (journalDirty && window.__journalSave) {
        await window.__journalSave();
      }
      allowNavRef.current = true;
      const form = document.getElementById('trade-form');
      if (form) form.requestSubmit();
    } catch (e) {
      // ignore
    }
    setTimeout(() => { setSaving(false); allowNavRef.current = false; }, 3000);
  }

  return (
    <>
      <TradeForm mode="edit" tradeId={tradeId} initial={trade} prefs={prefs} setups={setups || []} accounts={accounts || []} activeAccountId={activeAccountId} hideButtons />

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

      <div className="mt-6 flex items-center gap-3">
        <Link href={'/dashboard/trades/' + tradeId} className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/70">
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

      {showLeaveModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={handleStay}>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-display font-semibold text-white mb-2">Unsaved changes</h3>
            <p className="text-sm text-white/55 mb-6">You have unsaved changes. Do you want to save before leaving?</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleSaveAndLeave}
                disabled={saving}
                className="rounded-xl py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-50 text-center"
                style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
              >
                {saving ? 'Saving...' : 'Save & leave'}
              </button>
              <button
                onClick={handleDiscard}
                className="rounded-xl border border-red-400/30 bg-red-500/10 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/20 transition-colors text-center"
              >
                Discard
              </button>
              <button
                onClick={handleStay}
                className="rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white/50 hover:text-white/70 transition-colors text-center"
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
