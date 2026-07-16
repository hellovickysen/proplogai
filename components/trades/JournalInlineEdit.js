"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { processImageFile } from '@/lib/imageUtils';
import { useToast } from '@/components/ui/Toast';
import ScreenshotGallery from '@/components/ui/ScreenshotGallery';

export default function JournalInlineEdit({ tradeId, journal, userId, prefs, screenshots: initialScreenshots = [], editTradeHref = '', startInEditMode = false }) {
  const router = useRouter();
  const toast = useToast?.() || { success: () => {}, error: () => {} };
  const [editing, setEditing] = useState(startInEditMode);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);

  // Track unsaved changes — warn on navigation
  useEffect(() => { dirtyRef.current = dirty; }, [dirty]);
  useEffect(() => {
    function onBeforeUnload(e) {
      if (dirtyRef.current) { e.preventDefault(); e.returnValue = ''; }
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Emotion & tag options — use user's saved list; only fall back to defaults if never configured
  const defaultEmotions = ['Disciplined', 'Confident', 'FOMO', 'Greed', 'Boredom', 'Revenge'];
  const defaultTags = ['news', 'high-impact', 'low-volume', 'scalp', 'swing'];
  const allEmotions = Array.isArray(prefs?.custom_emotions) && prefs.custom_emotions.length > 0
    ? prefs.custom_emotions : defaultEmotions;
  const allTags = Array.isArray(prefs?.custom_tags) && prefs.custom_tags.length > 0
    ? prefs.custom_tags : defaultTags;

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
        setDirty(true);
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
    setDirty(true);
  }

  // Mutable options lists — start from prefs, grow when user adds inline
  const [emotionOptions, setEmotionOptions] = useState(allEmotions);
  const [tagOptions, setTagOptions] = useState(allTags);
  const [newEmotionInput, setNewEmotionInput] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [showAddEmotion, setShowAddEmotion] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);

  function toggleEmotion(e) {
    setEmotions(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
    setDirty(true);
  }
  function toggleTag(t) {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    setDirty(true);
  }

  async function addNewEmotion() {
    const val = newEmotionInput.trim();
    if (!val) return;
    if (emotionOptions.some(e => e.toLowerCase() === val.toLowerCase())) {
      // Already exists — just select it
      const match = emotionOptions.find(e => e.toLowerCase() === val.toLowerCase());
      if (!emotions.includes(match)) setEmotions(prev => [...prev, match]);
    } else {
      // Add to options and select it
      setEmotionOptions(prev => [...prev, val]);
      setEmotions(prev => [...prev, val]);
      // Persist to user_preferences
      try {
        const supabase = createClient();
        const { data: p } = await supabase.from('user_preferences').select('custom_emotions').eq('user_id', userId).maybeSingle();
        const existing = p?.custom_emotions || [];
        if (!existing.some(e => e.toLowerCase() === val.toLowerCase())) {
          await supabase.from('user_preferences').update({ custom_emotions: [...existing, val] }).eq('user_id', userId);
        }
      } catch (e) {}
    }
    setNewEmotionInput('');
    setShowAddEmotion(false);
  }

  async function addNewTag() {
    const val = newTagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!val) return;
    if (tagOptions.includes(val)) {
      // Already exists — just select it
      if (!tags.includes(val)) setTags(prev => [...prev, val]);
    } else {
      // Add to options and select it
      setTagOptions(prev => [...prev, val]);
      setTags(prev => [...prev, val]);
      // Persist to user_preferences
      try {
        const supabase = createClient();
        const { data: p } = await supabase.from('user_preferences').select('custom_tags').eq('user_id', userId).maybeSingle();
        const existing = p?.custom_tags || [];
        if (!existing.includes(val)) {
          await supabase.from('user_preferences').update({ custom_tags: [...existing, val] }).eq('user_id', userId);
        }
      } catch (e) {}
    }
    setNewTagInput('');
    setShowAddTag(false);
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
      setDirty(false);
      setEditing(startInEditMode); // stay in edit mode if started there
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
            ✎ Edit Journal
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

            {/* Screenshots — with carousel lightbox */}
            {screenshotUrls.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-white/50 mb-2">Screenshots</h3>
                <ScreenshotGallery urls={screenshotUrls} layout="grid" />
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
          {emotionOptions.map(e => (
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
          {showAddEmotion ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newEmotionInput}
                onChange={e => setNewEmotionInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNewEmotion(); } else if (e.key === 'Escape') setShowAddEmotion(false); }}
                placeholder="New emotion"
                autoFocus
                className="w-24 rounded-lg border border-violet-400/30 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-violet-400/60 placeholder:text-white/25"
              />
              <button type="button" onClick={addNewEmotion} className="rounded-lg border border-violet-400/30 bg-violet-400/10 px-2 py-1 text-xs text-violet-300 hover:bg-violet-400/20">Add</button>
              <button type="button" onClick={() => setShowAddEmotion(false)} className="text-xs text-white/30 hover:text-white/50">&times;</button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowAddEmotion(true)} className="px-2.5 py-1 rounded-lg border border-dashed border-white/15 text-xs text-white/30 hover:text-white/50 hover:border-white/25 transition-colors">+ Add</button>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-white/50 mb-2 block">Tags</label>
        <div className="flex flex-wrap gap-1.5">
          {tagOptions.map(t => (
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
          {showAddTag ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newTagInput}
                onChange={e => setNewTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNewTag(); } else if (e.key === 'Escape') setShowAddTag(false); }}
                placeholder="New tag"
                autoFocus
                className="w-24 rounded-lg border border-cyan-400/30 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-cyan-400/60 placeholder:text-white/25"
              />
              <button type="button" onClick={addNewTag} className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-300 hover:bg-cyan-400/20">Add</button>
              <button type="button" onClick={() => setShowAddTag(false)} className="text-xs text-white/30 hover:text-white/50">&times;</button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowAddTag(true)} className="px-2.5 py-1 rounded-lg border border-dashed border-white/15 text-xs text-white/30 hover:text-white/50 hover:border-white/25 transition-colors">+ Add</button>
          )}
        </div>
      </div>

      {/* Confidence — pill selector */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-white/50 mb-2 block">Confidence</label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => { setConfidence(n === confidence ? 0 : n); setDirty(true); }}
              className={`w-10 h-8 rounded-lg text-xs font-semibold transition-all ${
                n <= confidence
                  ? 'bg-violet-400/25 border border-violet-400/40 text-violet-300'
                  : 'bg-white/[0.04] border border-white/[0.08] text-white/30 hover:text-white/50'
              }`}
            >
              {n}
            </button>
          ))}
          {confidence > 0 && <span className="text-xs text-white/40 ml-1 self-center">{confidence}/5</span>}
        </div>
      </div>

      {/* Note */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-white/50 mb-2 block">Notes</label>
        <textarea
          value={note}
          onChange={e => { setNote(e.target.value); setDirty(true); }}
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
          onChange={e => { setLesson(e.target.value); setDirty(true); }}
          rows={2}
          placeholder="What's the key takeaway from this trade?"
          className="w-full rounded-xl bg-amber-400/[0.04] border border-amber-400/15 px-4 py-3 text-sm text-amber-200/80 placeholder:text-amber-200/25 outline-none focus:border-amber-400/30 resize-y"
        />
      </div>

      {/* Screenshots */}
      <div className="mb-5">
        <label className="text-xs font-semibold text-white/50 mb-2 block">Screenshots</label>
        {screenshotUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {screenshotUrls.map((url, i) => (
              <div key={i} className="relative group w-36 h-24 rounded-lg overflow-hidden border border-white/10 bg-black/30">
                <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
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

      {/* Save — secondary style when on edit page (startInEditMode) to avoid duplicate gradient buttons */}
      <div className="flex items-center gap-3">
        {startInEditMode ? (
          <button
            onClick={handleSave}
            disabled={saving || uploading || !dirty}
            className={'px-5 py-2 rounded-xl border text-sm font-semibold transition-colors disabled:opacity-40 ' + (dirty ? 'border-violet-400/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20' : 'border-white/10 bg-white/[0.03] text-white/40')}
          >
            {saving ? 'Saving...' : (dirty ? 'Save Journal' : 'Journal saved')}
          </button>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
