"use client";

import { useState } from 'react';
import JournalView from '@/components/journal/JournalView';
import JournalForm from '@/components/journal/JournalForm';

export default function JournalSection({ tradeId, userId, journal, prefs, screenshotLimit = 10 }) {
  const [editing, setEditing] = useState(false);
  const hasJournal = journal && (journal.note || (journal.emotions && journal.emotions.length) || journal.confidence || journal.screenshot_url || (journal.screenshot_urls && journal.screenshot_urls.length));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-display text-base font-semibold">Journal</div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/50 hover:text-white"
          >
            {hasJournal ? 'Edit journal' : '+ Add journal'}
          </button>
        )}
        {editing && (
          <button
            onClick={() => setEditing(false)}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/50 hover:text-white"
          >
            Cancel
          </button>
        )}
      </div>

      {editing ? (
        <JournalForm tradeId={tradeId} userId={userId} initial={journal} prefs={prefs} screenshotLimit={screenshotLimit} onSaved={() => setEditing(false)} />
      ) : hasJournal ? (
        <JournalView journal={journal} />
      ) : (
        <p className="text-sm text-white/50">No journal entry yet. Click "Add journal" to record your emotions, notes, and screenshots.</p>
      )}
    </div>
  );
}
