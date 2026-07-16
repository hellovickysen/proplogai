"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveJournal } from '@/app/dashboard/trades/actions';
import { processImageFile } from '@/lib/imageUtils';
import { secureUpload } from '@/lib/secureUpload';
import Lightbox from '@/components/ui/Lightbox';
import { resolveEmotions } from '@/lib/emotions';
import { resolveTags } from '@/lib/tags';
import { useToast } from '@/components/ui/Toast';

/** Merge legacy screenshot_url + new screenshot_urls into one array. */
function mergeUrls(initial) {
  if (!initial) return [];
  const arr = Array.isArray(initial.screenshot_urls) ? initial.screenshot_urls.filter(Boolean) : [];
  if (arr.length > 0) return arr;
  if (initial.screenshot_url) return [initial.screenshot_url];
  return [];
}

export default function JournalForm({ tradeId, userId, initial, prefs = null, onSaved = null, screenshotLimit = 10 }) {
  const EMOTIONS = resolveEmotions(prefs);
  const TAGS = resolveTags(prefs);
  const toast = useToast();
  const router = useRouter();
  const [note, setNote] = useState((initial && initial.note) || '');
  const [lesson, setLesson] = useState((initial && initial.lesson) || '');
  const [tradeTags, setTradeTags] = useState((initial && Array.isArray(initial.tags)) ? initial.tags : []);
  const [emotions, setEmotions] = useState((initial && initial.emotions) || []);
  const [confidence, setConfidence] = useState((initial && initial.confidence) || 0);
  const [screenshotUrls, setScreenshotUrls] = useState(mergeUrls(initial));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [lightboxIdx, setLightboxIdx] = useState(null);

  function toggleEmotion(e) {
    setEmotions((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]));
  }

  function removeScreenshot(i) {
    setScreenshotUrls((cur) => cur.filter((_, idx) => idx !== i));
  }

  async function onFiles(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    // Validate file sizes (max 5MB per file, 10 files max)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const MAX_FILES = screenshotLimit || 10;
    if (screenshotUrls.length + files.length > MAX_FILES) {
      setError('Maximum ' + MAX_FILES + ' screenshots per trade.');
      return;
    }
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError('File "' + file.name + '" exceeds 5MB limit.');
        return;
      }
    }
    setUploading(true);
    setError(null);
    const newUrls = [];

    for (const file of files) {
      // Convert to WebP
      const processed = await processImageFile(file);
      if (processed.error) {
        setError(processed.error);
        setUploading(false);
        return;
      }

      const safe = processed.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = userId + '/' + tradeId + '/' + Date.now() + '_' + safe;
      const { url, error: uploadErr } = await secureUpload(processed.file, path);
      if (uploadErr) {
        setError('Upload failed: ' + uploadErr);
        setUploading(false);
        return;
      }
      newUrls.push(url);
    }

    setScreenshotUrls((cur) => [...cur, ...newUrls]);
    setUploading(false);
    e.target.value = '';
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    setMsg(null);
    const res = await saveJournal(tradeId, {
      note,
      lesson,
      emotions,
      tags: tradeTags,
      confidence,
      screenshot_urls: screenshotUrls,
    });
    if (res && res.error) {
      setError(res.error);
      if (toast) toast.error(res.error);
    } else {
      setMsg('Journal saved.');
      if (toast) toast.success('Journal saved!');
      router.refresh();
      if (onSaved) setTimeout(() => onSaved(), 500);
    }
    setSaving(false);
  }

  return (
    <div>

      <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55">How did you feel?</label>
      <div className="mb-5 flex flex-wrap gap-2">
        {EMOTIONS.map((e) => {
          const on = emotions.includes(e);
          return (
            <button
              key={e}
              type="button"
              onClick={() => toggleEmotion(e)}
              className={'rounded-full border px-3 py-2 text-xs ' + (on ? 'border-violet-400/50 bg-violet-500/15 text-violet-200' : 'border-white/10 bg-black/30 text-white/50 hover:text-white')}
            >
              {e}
            </button>
          );
        })}
      </div>

      <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55">Confidence at entry</label>
      <div className="mb-5 flex gap-1 text-2xl">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" onClick={() => setConfidence(i)} className={'p-1 ' + (i <= confidence ? 'text-amber-400' : 'text-white/40')}>
            &#9733;
          </button>
        ))}
      </div>

      <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55">Tags</label>
      <div className="mb-5 flex flex-wrap gap-2">
        {TAGS.map((tag) => {
          const on = tradeTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setTradeTags((cur) => cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag])}
              className={'rounded-full border px-3 py-2 text-xs ' + (on ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200' : 'border-white/10 bg-black/30 text-white/50 hover:text-white')}
            >
              {tag}
            </button>
          );
        })}
      </div>

      <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55">Notes — what happened &amp; why?</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={5}
        className="mb-5 w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-cyan-400/60"
        placeholder="Your reasoning, what went well, what you'd change..."
      />

      <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55">Lesson learned</label>
      <textarea
        value={lesson}
        onChange={(e) => setLesson(e.target.value)}
        rows={2}
        className="mb-5 w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-cyan-400/60"
        placeholder="What will you do differently next time?"
      />

      <div className="mb-1.5 flex items-center gap-2">
        <label className="block font-mono text-xs uppercase tracking-wider text-white/55">Chart screenshots</label>
        {screenshotLimit === 1 && (
          <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
            Basic: 1 per trade
          </span>
        )}
        {screenshotLimit > 1 && screenshotLimit < 10 && (
          <span className="font-mono text-[10px] text-white/30">max {screenshotLimit}</span>
        )}
      </div>
      {screenshotUrls.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {screenshotUrls.map((url, i) => (
            <div key={i} className="group relative cursor-pointer" onClick={() => setLightboxIdx(i)}>
              <img src={url} alt={`Screenshot ${i + 1}`} className="h-24 w-24 rounded-lg border border-white/10 object-cover transition-opacity hover:opacity-80" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeScreenshot(i);
                }}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        type="file"
        accept="image/*,application/pdf"
        multiple
        onChange={onFiles}
        className="mb-1 block w-full text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2.5 file:text-sm file:text-white"
      />
      {uploading ? <p className="text-xs text-cyan-400">Processing &amp; uploading…</p> : null}

      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      {msg ? <p className="mt-3 text-sm text-emerald-400">{msg}</p> : null}

      <button
        onClick={onSave}
        disabled={saving || uploading}
        className="mt-5 rounded-xl px-5 py-3 text-sm font-semibold text-[#08080f] disabled:opacity-60"
        style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
      >
        {saving ? 'Saving…' : 'Save journal'}
      </button>

      {lightboxIdx !== null && (
        <Lightbox images={screenshotUrls} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </div>
  );
}
