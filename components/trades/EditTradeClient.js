"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TradeForm from '@/components/trades/TradeForm';
import JournalInlineEdit from '@/components/trades/JournalInlineEdit';
import { LogoMark } from '@/components/Logo';

export default function EditTradeClient({ tradeId, trade, prefs, setups, journal, screenshots, userId, accounts, activeAccountId }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [journalDirty, setJournalDirty] = useState(false);
  const [tradeDirty, setTradeDirty] = useState(false);
  const [journalPreview, setJournalPreview] = useState({
    emotions: journal?.emotions || [],
    tags: Array.isArray(journal?.tags) ? journal.tags : [],
  });

  const onJournalDirtyChange = useCallback((d) => setJournalDirty(d), []);
  const onJournalPreviewChange = useCallback((preview) => setJournalPreview(preview), []);

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

  // Browser tab close/refresh warning
  useEffect(() => {
    function onBeforeUnload(e) {
      if (isDirty) { e.preventDefault(); e.returnValue = ''; }
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  async function handleSaveAll() {
    setSaving(true);
    try {
      if (journalDirty && window.__journalSave) {
        const journalResult = await window.__journalSave();
        if (journalResult?.error) {
          setSaving(false);
          return;
        }
      }
      const form = document.getElementById('trade-form');
      if (form) form.requestSubmit();
      else setSaving(false);
    } catch (e) {
      setSaving(false);
    }
    // Reset only if form validation prevents navigation.
    setTimeout(() => setSaving(false), 4000);
  }

  function handleCancel() {
    router.push('/dashboard/trades/' + tradeId);
  }

  return (
    <>
      {saving && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#07070b]/35 px-6 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-3">
            <LogoMark size={34} glow />
            <div className="h-1 w-24 overflow-hidden rounded-full bg-white/15">
              <div className="h-full w-2/3 animate-pulse rounded-full" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }} />
            </div>
          </div>
        </div>
      )}
      <TradeForm mode="edit" tradeId={tradeId} initial={trade} prefs={prefs} setups={setups || []} accounts={accounts || []} activeAccountId={activeAccountId} previewJournal={journalPreview} hideButtons />

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
          onPreviewChange={onJournalPreviewChange}
          skipRefresh
        />
      </div>

      {/* Unsaved indicator + Save/Cancel */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleCancel}
          className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors"
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
        {isDirty && !saving && (
          <span className="flex items-center gap-1.5 text-xs text-amber-400/70">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Unsaved changes
          </span>
        )}
      </div>
    </>
  );
}
