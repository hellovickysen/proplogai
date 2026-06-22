"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { changePassword, savePreferences } from '@/app/dashboard/settings/actions';
import { useToast } from '@/components/Toast';

const DEFAULT_EMOTIONS = ['Disciplined', 'Calm', 'Confident', 'FOMO', 'Fear', 'Greed', 'Revenge', 'Boredom'];
const DEFAULT_SETUPS = ['Fib Level', 'London Low Sweep', 'London High Sweep', 'ChoCh On Line'];

const field = 'w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400/60';
const labelCls = 'mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55';
const card = 'rounded-2xl border border-white/10 bg-white/[0.03] p-6';

function ProfileTab({ user, prefs }) {
  const toast = useToast();
  const [pw, setPw] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [pwErr, setPwErr] = useState(null);

  const [avatarUrl, setAvatarUrl] = useState((prefs && prefs.avatar_url) || '');
  const [uploading, setUploading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState(null);
  const [avatarErr, setAvatarErr] = useState(null);

  async function onPasswordSave() {
    setPwErr(null);
    setPwMsg(null);
    if (pw.length < 6) { setPwErr('Password must be at least 6 characters.'); return; }
    if (pw !== pwConfirm) { setPwErr('Passwords do not match.'); return; }
    setPwSaving(true);
    const res = await changePassword(pw);
    if (res.error) { setPwErr(res.error); if (toast) toast.error(res.error); }
    else { setPwMsg('Password updated!'); setPw(''); setPwConfirm(''); if (toast) toast.success('Password updated!'); }
    setPwSaving(false);
  }

  async function onAvatarFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    setAvatarErr(null);
    setAvatarMsg(null);
    const supabase = createClient();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = user.id + '/avatar_' + Date.now() + '_' + safe;
    const up = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (up.error) {
      setAvatarErr('Upload failed: ' + up.error.message);
      setUploading(false);
      return;
    }
    const pub = supabase.storage.from('avatars').getPublicUrl(path);
    const url = pub.data.publicUrl;
    setAvatarUrl(url);

    const res = await savePreferences({
      avatar_url: url,
      custom_emotions: (prefs && prefs.custom_emotions) || [],
      custom_setups: (prefs && prefs.custom_setups) || [],
      default_confidence: (prefs && prefs.default_confidence) || 0,
    });
    if (res.error) setAvatarErr(res.error);
    else setAvatarMsg('Avatar saved!');
    setUploading(false);
  }

  return (
    <div className="space-y-6">
      <div className={card}>
        <div className="mb-4 font-display text-base font-semibold">Profile image</div>
        <div className="flex items-center gap-5">
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-2 border-white/10 bg-white/5">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-white/50">
                {(user.email || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <input type="file" accept="image/*" onChange={onAvatarFile} className="block w-full text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-white" />
            {uploading && <p className="mt-1 text-xs text-cyan-400">Uploading…</p>}
            {avatarMsg && <p className="mt-1 text-xs text-emerald-400">{avatarMsg}</p>}
            {avatarErr && <p className="mt-1 text-xs text-red-400">{avatarErr}</p>}
          </div>
        </div>
      </div>

      <div className={card}>
        <div className="mb-4 font-display text-base font-semibold">Email</div>
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3.5 py-2.5">
          <span className="text-sm text-white/70">{user.email}</span>
          <span className="ml-auto rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-xs text-emerald-300">verified</span>
        </div>
      </div>

      <div className={card}>
        <div className="mb-4 font-display text-base font-semibold">Change password</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>New password</label>
            <input type="password" className={field} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <div>
            <label className={labelCls}>Confirm password</label>
            <input type="password" className={field} value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} placeholder="Retype password" />
          </div>
        </div>
        {pwErr && <p className="mt-3 text-sm text-red-400">{pwErr}</p>}
        {pwMsg && <p className="mt-3 text-sm text-emerald-400">{pwMsg}</p>}
        <button onClick={onPasswordSave} disabled={pwSaving} className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
          {pwSaving ? 'Saving…' : 'Update password'}
        </button>
      </div>
    </div>
  );
}

function JournalSettingsTab({ prefs, onSaved }) {
  const toast = useToast();
  const existingEmotions = (prefs && prefs.custom_emotions && prefs.custom_emotions.length > 0)
    ? prefs.custom_emotions : DEFAULT_EMOTIONS;
  const existingSetups = (prefs && prefs.custom_setups && prefs.custom_setups.length > 0)
    ? prefs.custom_setups : DEFAULT_SETUPS;

  const [emotions, setEmotions] = useState(existingEmotions);
  const [newEmotion, setNewEmotion] = useState('');
  const [setups, setSetups] = useState(existingSetups);
  const [newSetup, setNewSetup] = useState('');
  const [defaultConfidence, setDefaultConfidence] = useState((prefs && prefs.default_confidence) || 0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  function addEmotion() {
    const t = newEmotion.trim();
    if (!t || emotions.map((e) => e.toLowerCase()).includes(t.toLowerCase())) return;
    setEmotions([...emotions, t]);
    setNewEmotion('');
  }
  function removeEmotion(idx) { setEmotions(emotions.filter((_, i) => i !== idx)); }
  function resetEmotionDefaults() { setEmotions([...DEFAULT_EMOTIONS]); }

  function addSetup() {
    const t = newSetup.trim();
    if (!t || setups.map((s) => s.toLowerCase()).includes(t.toLowerCase())) return;
    setSetups([...setups, t]);
    setNewSetup('');
  }
  function removeSetup(idx) { setSetups(setups.filter((_, i) => i !== idx)); }
  function resetSetupDefaults() { setSetups([...DEFAULT_SETUPS]); }

  async function onSave() {
    setSaving(true);
    setError(null);
    setMsg(null);
    const res = await savePreferences({
      custom_emotions: emotions,
      custom_setups: setups,
      default_confidence: defaultConfidence,
      avatar_url: (prefs && prefs.avatar_url) || null,
    });
    if (res.error) { setError(res.error); if (toast) toast.error(res.error); }
    else {
      setMsg('Settings saved!');
      if (toast) toast.success('Settings saved!');
      if (onSaved) onSaved({ custom_emotions: emotions, custom_setups: setups, default_confidence: defaultConfidence });
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Emotion tags */}
      <div className={card}>
        <div className="mb-1 font-display text-base font-semibold">Emotion tags</div>
        <p className="mb-4 text-xs text-white/55">Customize the feelings you track in your journal.</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {emotions.map((em, i) => (
            <span key={i} className="group flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-200">
              {em}
              <button type="button" onClick={() => removeEmotion(i)} className="hidden text-red-400 hover:text-red-300 group-hover:inline">✕</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input className={field + ' max-w-xs'} value={newEmotion} onChange={(e) => setNewEmotion(e.target.value)} placeholder="e.g. Anxious, Excited…" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmotion())} />
          <button type="button" onClick={addEmotion} className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white/70 hover:text-white">Add</button>
        </div>
        <button type="button" onClick={resetEmotionDefaults} className="mt-3 text-xs text-white/50 underline hover:text-white/70">Reset to defaults</button>
      </div>

      {/* Trade setups */}
      <div className={card}>
        <div className="mb-1 font-display text-base font-semibold">Trade setups</div>
        <p className="mb-4 text-xs text-white/55">Your saved trading setups. These appear as a dropdown when logging trades.</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {setups.map((s, i) => (
            <span key={i} className="group flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200">
              {s}
              <button type="button" onClick={() => removeSetup(i)} className="hidden text-red-400 hover:text-red-300 group-hover:inline">✕</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input className={field + ' max-w-xs'} value={newSetup} onChange={(e) => setNewSetup(e.target.value)} placeholder="e.g. Order Block, Break & Retest…" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSetup())} />
          <button type="button" onClick={addSetup} className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white/70 hover:text-white">Add</button>
        </div>
        <button type="button" onClick={resetSetupDefaults} className="mt-3 text-xs text-white/50 underline hover:text-white/70">Reset to defaults</button>
      </div>

      {/* Default confidence */}
      <div className={card}>
        <div className="mb-1 font-display text-base font-semibold">Default confidence</div>
        <p className="mb-4 text-xs text-white/55">Pre-fill confidence rating when logging a new trade.</p>
        <div className="flex gap-1 text-2xl">
          {[0, 1, 2, 3, 4, 5].map((i) =>
            i === 0 ? (
              <button key={i} type="button" onClick={() => setDefaultConfidence(0)} className={'rounded-lg border px-2 py-1 text-xs ' + (defaultConfidence === 0 ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300' : 'border-white/10 text-white/30')}>None</button>
            ) : (
              <button key={i} type="button" onClick={() => setDefaultConfidence(i)} className={i <= defaultConfidence ? 'text-amber-400' : 'text-white/40'}>&#9733;</button>
            )
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {msg && <p className="text-sm text-emerald-400">{msg}</p>}

      <button onClick={onSave} disabled={saving} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
        {saving ? 'Saving…' : 'Save settings'}
      </button>
    </div>
  );
}

export default function SettingsTabs({ user, prefs: initialPrefs }) {
  const [tab, setTab] = useState('profile');
  const [prefs, setPrefs] = useState(initialPrefs);

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'journal', label: 'Journal & Trade settings' },
  ];

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={'flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ' + (tab === t.id ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white/70')}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'profile' && <ProfileTab user={user} prefs={prefs} />}
      {tab === 'journal' && <JournalSettingsTab prefs={prefs} onSaved={(updated) => setPrefs((p) => ({ ...p, ...updated }))} />}
    </div>
  );
}
