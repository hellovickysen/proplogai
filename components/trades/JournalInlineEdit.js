"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { processImageFile } from '@/lib/imageUtils';
import { useToast } from '@/components/ui/Toast';

export default function JournalInlineEdit({ tradeId, journal, userId, prefs, screenshots: initialScreenshots = [], editTradeHref = '' }) {
  const router = useRouter();
  const toast = useToast?.() || { success: () => {}, error: () => {} };
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Emotion & tag options
  const defaultEmotions = ['Disciplined', 'Calm', 'Confident', 'FOMO', 'Fear', 'Greedy', 'Impatient', 'Frustrated', 'Revenge', 'Anxious', 'Excited', 'Bored'];
  const customEmotions = prefs?.custom_emotions || [];
  const allEmotions = [...new Set([...defaultEmotions, ...customEmotions])];
  const defaultTags = ['news', 'high impact', 'low volume', 'scalp', 'swing'];
  const customTags = prefs?.custom_tags || [];
  const allTags = [...new Set([...defaultTags, ...customTags])];

  // Form state
  const [note, setNote] = useState(journal?.note || '');
  const [lesson, setLesson] = useState(journal?.lesson || '');
  const [emotions, setEmotions] = useState(journal?.emotions || []);
  const [tags, setTags] = useState(Array.isArray(journal?.tags) ? journal.tags : []);
  const [confidence, setConfidence] = useState(journal?.confidence || 0);

  // Screenshot state
  const [screenshotUrls, setScreenshotUrls] = useState(initialScreenshots);
  const [uploading, setUploading] = useState(false);

  async function handleScreenshotUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const supabase = createClient();
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error?.('Max 5MB per image');
        continue;
      }
      try {
        const processed = await processImageFile(file);
        if (processed.error || !processed.file) {
          toast.error?.(processed.error || 'Failed to process image');
          continue;
        }
        const ext = processed.file.name?.split('.').pop() || 'webp';
        const path = `${userId}/${tradeId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('screenshots').upload(path, processed.file);
        if (upErr) { toast.error?.('Upload failed'); continue; }
        const { data: { publicUrl } } = supabase.storage.from('screenshots').getPublicUrl(path);
        setScreenshotUrls(prev => [...prev, publicUrl]);
      } catch (err) {
        toast.error?.('Upload failed');
      }
    }
    setUploading(false);
    e.target.value = '';
  }

  async function removeScreenshot(url, idx) {
    // Extract path from public URL for deletion
    try {
      const supabase = createClient();
      const match = url.match(/screenshots\/(.+)$/);
      if (match) {
        await supabase.storage.from('screenshots').remove([match[1]]);
      }
    } catch (e) {}
    setScreenshotUrls(prev => prev.filter((_, i) => i !== idx));
  }

  function toggleEmotion(e) {
    setEmotions(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  }
  function toggleTag(t) {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = createClient();
      const data = {
        note: note.trim() || null,
        lesson: lesson.trim() || null,
        emotions,
        tags,
        confidence: confidence || null,
        screenshot_urls: screenshotUrls.length > 0 ? screenshotUrls : null,
      };

      if (journal?.id) {
        // Update existing journal entry
        const { error } = await supabase
          .from('journal_entries')
          .update(data)
          .eq('id', journal.id)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Create new journal entry
        const { error } = await supabase
          .from('journal_entries')
          .insert({ ...data, trade_id: tradeId, user_id: userId });
        if (error) throw error;
      }

      toast.success?.('Journal saved');
      setEditing(false);
      router.refresh();
    } catch (err) {
      console.error('Save journal error:', err);
      toast.error?.('Failed to save journal');
    }
    setSaving(false);
  }

  // View mode
  if (!editing) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-xs uppercase tracking-wider text-white/55">📝 Journal Entry</h2>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            ✎ Edit
          </button>
        </div>

        {!journal && !note ? (
          <div className="text-center py-6">
            <div className="text-2xl mb-2 opacity-30">📝</div>
            <p className="text-sm text-white/40 mb-3">No journal entry yet</p>
            <button onClick={() => setEditing(true)} className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
              + Add Journal Entry
            </button>
            {editTradeHref && (
              <div className="mt-3">
                <a href={editTradeHref} className="text-xs text-white/40 hover:text-white/60 transition-colors">
                  or edit trade details →
                </a>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Emotions & Tags */}
            {(emotions.length > 0 || tags.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {emotions.map((e, i) => (
                  <span key={`e-${i}`} className="px-2.5 py-1 rounded-lg bg-violet-400/[0.12] border border-violet-400/20 text-violet-300 text-xs font-medium">{e}</span>
                ))}
                {tags.map((t, i) => (
                  <span key={`t-${i}`} className="px-2.5 py-1 rounded-lg bg-cyan-400/[0.1] border border-cyan-400/20 text-cyan-300 text-xs font-medium">#{t}</span>
                ))}
              </div>
            )}

            {/* Confidence */}
            {confidence > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <span className="font-mono text-xs uppercase tracking-wider text-white/40">Confidence</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <div key={n} className={`w-5 h-2 rounded-full ${n <= confidence ? 'bg-violet-400' : 'bg-white/10'}`} />
                  ))}
                </div>
                <span className="text-xs text-white/40">{confidence}/5</span>
              </div>
            )}

            {/* Note */}
            {note && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-white/50 mb-2">Notes</h3>
                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{note}</p>
              </div>
            )}

            {/* Lesson */}
            {lesson && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-white/50 mb-2">Lesson Learned</h3>
                <div className="rounded-xl bg-amber-400/[0.06] border border-amber-400/15 px-4 py-3">
                  <p className="text-sm text-amber-200/80 leading-relaxed whitespace-pre-wrap">{lesson}</p>
                </div>
              </div>
            )}

            {/* Screenshots */}
            {screenshotUrls.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-white/50 mb-2">Screenshots</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {screenshotUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-white/10 hover:border-violet-400/30 transition-colors">
                      <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-auto max-h-80 object-contain bg-black/50" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Edit Trade button — only in view mode */}
            {editTradeHref && (
              <div className="pt-3 mt-3 border-t border-white/[0.06]">
                <a href={editTradeHref} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
                  ✎ Edit Trade Details
                </a>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Edit mode
  return (
    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/[0.03] p-5 sm:p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-xs uppercase tracking-wider text-violet-300/70">✎ Editing Journal</h2>
        <button onClick={() => setEditing(false)} className="text-xs text-white/40 hover:text-white/60 transition-colors">
          Cancel
        </button>
      </div>

      {/* Emotions */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-white/50 mb-2 block">Emotions</label>
        <div className="flex flex-wrap gap-1.5">
          {allEmotions.map(e => (
            <button
              key={e}
              type="button"
              onClick={() => toggleEmotion(e)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                emotions.includes(e)
                  ? 'bg-violet-400/20 border border-violet-400/40 text-violet-300'
                  : 'bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/60'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-white/50 mb-2 block">Tags</label>
        <div className="flex flex-wrap gap-1.5">
          {allTags.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTag(t)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                tags.includes(t)
                  ? 'bg-cyan-400/20 border border-cyan-400/40 text-cyan-300'
                  : 'bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/60'
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      </div>

      {/* Confidence — star rating */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-white/50 mb-2 block">Confidence</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setConfidence(n === confidence ? 0 : n)}
              className="text-xl transition-all hover:scale-110"
            >
              {n <= confidence ? '★' : '☆'}
            </button>
          ))}
          {confidence > 0 && <span className="text-xs text-white/40 ml-2">{confidence}/5</span>}
        </div>
      </div>

      {/* Note */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-white/50 mb-2 block">Notes</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={4}
          placeholder="What happened in this trade? What were you thinking?"
          className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-400/40 resize-y"
        />
      </div>

      {/* Lesson */}
      <div className="mb-5">
        <label className="text-xs font-semibold text-white/50 mb-2 block">Lesson Learned</label>
        <textarea
          value={lesson}
          onChange={e => setLesson(e.target.value)}
          rows={2}
          placeholder="What's the key takeaway from this trade?"
          className="w-full rounded-xl bg-amber-400/[0.04] border border-amber-400/15 px-4 py-3 text-sm text-amber-200/80 placeholder:text-amber-200/25 outline-none focus:border-amber-400/30 resize-y"
        />
      </div>

      {/* Screenshots */}
      <div className="mb-5">
        <label className="text-xs font-semibold text-white/50 mb-2 block">Screenshots</label>
        {screenshotUrls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            {screenshotUrls.map((url, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden border border-white/10">
                <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-24 object-cover" />
                <button
                  type="button"
                  onClick={() => removeScreenshot(url, i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-white/15 bg-white/[0.02] text-xs text-white/40 hover:text-white/60 hover:border-white/25 cursor-pointer transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
          {uploading ? 'Uploading...' : '+ Add Screenshots'}
          <input type="file" accept="image/*" multiple onChange={handleScreenshotUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-[#08080f] disabled:opacity-50"
          style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        >
          {saving ? 'Saving...' : (journal?.id ? 'Save Changes' : 'Add Journal')}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white/50 hover:text-white/70 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
