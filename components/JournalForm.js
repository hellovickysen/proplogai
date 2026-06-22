"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { saveJournal } from '@/app/dashboard/trades/actions';

const EMOTIONS = ['Disciplined', 'Calm', 'Confident', 'FOMO', 'Fear', 'Greed', 'Revenge', 'Boredom'];

export default function JournalForm({ tradeId, userId, initial }) {
  const router = useRouter();
  const [note, setNote] = useState((initial && initial.note) || '');
  const [emotions, setEmotions] = useState((initial && initial.emotions) || []);
  const [confidence, setConfidence] = useState((initial && initial.confidence) || 0);
  const [screenshotUrl, setScreenshotUrl] = useState((initial && initial.screenshot_url) || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  function toggleEmotion(e) {
    setEmotions((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]));
  }

  async function onFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = userId + '/' + tradeId + '/' + Date.now() + '_' + safe;
    const up = await supabase.storage.from('screenshots').upload(path, file, { upsert: true });
    if (up.error) {
      setError('Upload failed: ' + up.error.message);
      setUploading(false);
      return;
    }
    const pub = supabase.storage.from('screenshots').getPublicUrl(path);
    setScreenshotUrl(pub.data.publicUrl);
    setUploading(false);
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    setMsg(null);
    const res = await saveJournal(tradeId, { note, emotions, confidence, screenshot_url: screenshotUrl });
    if (res && res.error) {
      setError(res.error);
    } else {
      setMsg('Journal saved.');
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-4 font-display text-base font-semibold">Journal</div>

      <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-white/40">How did you feel?</label>
      <div className="mb-5 flex flex-wrap gap-2">
        {EMOTIONS.map((e) => {
          const on = emotions.includes(e);
          return (
            <button
              key={e}
              type="button"
              onClick={() => toggleEmotion(e)}
              className={'rounded-full border px-3 py-1.5 text-xs ' + (on ? 'border-violet-400/50 bg-violet-500/15 text-violet-200' : 'border-white/10 bg-black/30 text-white/50 hover:text-white')}
            >
              {e}
            </button>
          );
        })}
      </div>

      <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-white/40">Confidence at entry</label>
      <div className="mb-5 flex gap-1 text-2xl">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" onClick={() => setConfidence(i)} className={i <= confidence ? 'text-amber-400' : 'text-white/20'}>
            &#9733;
          </button>
        ))}
      </div>

      <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-white/40">Notes — what happened &amp; why?</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={5}
        className="mb-5 w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-cyan-400/60"
        placeholder="Your reasoning, what went well, what you'd change..."
      />

      <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-white/40">Chart screenshot</label>
      {screenshotUrl ? (
        <div className="mb-3">
          <img src={screenshotUrl} alt="trade screenshot" className="max-h-64 w-full rounded-lg border border-white/10 object-contain" />
        </div>
      ) : null}
      <input type="file" accept="image/*" onChange={onFile} className="mb-1 block w-full text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-white" />
      {uploading ? <p className="text-xs text-cyan-400">Uploading…</p> : null}

      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      {msg ? <p className="mt-3 text-sm text-emerald-400">{msg}</p> : null}

      <button
        onClick={onSave}
        disabled={saving || uploading}
        className="mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60"
        style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
      >
        {saving ? 'Saving…' : 'Save journal'}
      </button>
    </div>
  );
}
