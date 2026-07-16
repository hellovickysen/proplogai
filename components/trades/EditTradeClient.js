"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  const allowNavRef = useRef(false);
  const modalOpenRef = useRef(false); // prevent double-fire

  const onJournalDirtyChange = useCallback((d) => setJournalDirty(d), []);

  // Keep modalOpenRef in sync
  useEffect(() => { modalOpenRef.current = showLeaveModal; }, [showLeaveModal]);

  // Track trade form changes
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

  function shouldBlock() {
    return dirtyRef.current && !allowNavRef.current && !modalOpenRef.current;
  }

  // ── Click interceptor ──
  useEffect(() => {
    function handleClick(e) {
      if (!shouldBlock()) return;
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
      if (link.target === '_blank') return;
      if (href.startsWith('http') && !href.startsWith(window.location.origin)) return;

      e.preventDefault();
      e.stopImmediatePropagation();
      setPendingHref(href);
      setShowLeaveModal(true);
      return false;
    }
    document.addEventListener('click', handleClick, true);
    document.addEventListener('click', handleClick, false);
    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('click', handleClick, false);
    };
  }, []);

  // ── History API override ──
  useEffect(() => {
    const origPush = history.pushState;
    const origReplace = history.replaceState;

    history.pushState = function (...args) {
      if (shouldBlock()) {
        const url = args[2];
        if (url && typeof url === 'string' && url !== window.location.pathname) {
          setPendingHref(url);
          setShowLeaveModal(true);
          return;
        }
      }
      return origPush.apply(history, args);
    };

    history.replaceState = function (...args) {
      if (shouldBlock()) {
        const url = args[2];
        if (url && typeof url === 'string' && url !== window.location.pathname) {
          setPendingHref(url);
          setShowLeaveModal(true);
          return;
        }
      }
      return origReplace.apply(history, args);
    };

    return () => {
      history.pushState = origPush;
      history.replaceState = origReplace;
    };
  }, []);

  // ── Browser back ──
  useEffect(() => {
    history.pushState({ dirtyGuard: true }, '');
    function onPopState() {
      if (shouldBlock()) {
        history.pushState({ dirtyGuard: true }, '');
        setPendingHref('__back__');
        setShowLeaveModal(true);
      }
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // ── Tab close ──
  useEffect(() => {
    function onBeforeUnload(e) {
      if (dirtyRef.current && !allowNavRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // ── Modal actions ──
  function handleStay() {
    setShowLeaveModal(false);
    setPendingHref(null);
    setSaving(false);
  }

  function handleDiscard() {
    setSaving(false);
    dirtyRef.current = false;
    allowNavRef.current = true;
    setShowLeaveModal(false);
    const href = pendingHref;
    setPendingHref(null);
    if (href === '__back__') {
      history.go(-2);
    } else if (href) {
      router.push(href);
    }
    setTimeout(() => { allowNavRef.current = false; }, 1000);
  }

  async function handleSaveAndLeave() {
    setSaving(true);
    try {
      if (journalDirty && window.__journalSave) {
        await window.__journalSave();
      }
      allowNavRef.current = true;
      dirtyRef.current = false;
      setShowLeaveModal(false);
      setPendingHref(null);
      const form = document.getElementById('trade-form');
      if (form) {
        form.requestSubmit();
        // TradeForm validation might fail — reset saving after a delay
        // If validation passes, the form navigates away and this timeout is harmless
        setTimeout(() => {
          setSaving(false);
          allowNavRef.current = false;
        }, 1500);
      } else {
        setSaving(false);
        allowNavRef.current = false;
      }
    } catch (e) {
      setSaving(false);
      allowNavRef.current = false;
    }
  }

  // ── Bottom save button ──
  async function handleSaveAll() {
    setSaving(true);
    try {
      if (journalDirty && window.__journalSave) {
        await window.__journalSave();
      }
      allowNavRef.current = true;
      dirtyRef.current = false;
      const form = document.getElementById('trade-form');
      if (form) form.requestSubmit();
    } catch (e) {
      // ignore
    }
    // Reset after delay — if form validation fails, page stays and we need to unlock
    setTimeout(() => {
      setSaving(false);
      allowNavRef.current = false;
      dirtyRef.current = isDirty;
    }, 1500);
  }

  function handleCancel() {
    allowNavRef.current = true;
    dirtyRef.current = false;
    router.push('/dashboard/trades/' + tradeId);
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
        <button
          onClick={handleCancel}
          className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/70"
        >
          Cancel
        </button>
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
