"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { changePassword, savePreferences } from '@/app/dashboard/settings/actions';
import { useToast } from '@/components/ui/Toast';
import { validatePassword } from '@/lib/security';
import { replayTour } from '@/components/ui/GuidedTour';

const DEFAULT_EMOTIONS = ['Disciplined', 'Calm', 'Confident', 'FOMO', 'Fear', 'Greed', 'Revenge', 'Boredom'];
const DEFAULT_TAGS = ['news', 'high impact', 'low volume', 'scalp', 'swing'];
const MAX_CUSTOM_TAGS = 10;

const field = 'w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400/60';
const labelCls = 'mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55';
const card = 'rounded-2xl border border-white/10 bg-white/[0.03] p-6';

function EyeIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        className={field + ' pr-10'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
        tabIndex={-1}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function ProfileTab({ user, prefs }) {
  const toast = useToast();
  const [pw, setPw] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [pwErr, setPwErr] = useState(null);

  const [fullName, setFullName] = useState((prefs && prefs.full_name) || '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState(null);
  const [nameErr, setNameErr] = useState(null);

  const [avatarUrl, setAvatarUrl] = useState((prefs && prefs.avatar_url) || '');
  const [uploading, setUploading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState(null);
  const [avatarErr, setAvatarErr] = useState(null);

  const pwStrength = validatePassword(pw);

  async function onPasswordSave() {
    setPwErr(null);
    setPwMsg(null);
    if (!pwStrength.isValid) { setPwErr('Password must be at least 8 characters with uppercase, lowercase, number, and special character.'); return; }
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
    if (file.size > 5 * 1024 * 1024) {
      setAvatarErr('File exceeds 5MB limit.');
      if (toast) toast.error('File exceeds 5MB limit.');
      return;
    }
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

  async function onNameSave() {
    setNameSaving(true);
    setNameErr(null);
    setNameMsg(null);
    const res = await savePreferences({
      full_name: fullName.trim(),
      custom_emotions: (prefs && prefs.custom_emotions) || [],
      custom_setups: (prefs && prefs.custom_setups) || [],
      default_confidence: (prefs && prefs.default_confidence) || 0,
      avatar_url: avatarUrl || null,
    });
    if (res.error) { setNameErr(res.error); if (toast) toast.error(res.error); }
    else { setNameMsg('Name saved!'); if (toast) toast.success('Name saved!'); }
    setNameSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className={card}>
        <div className="mb-4 font-display text-base font-semibold">Full Name</div>
        <div>
          <label className={labelCls}>Display name</label>
          <input
            type="text"
            className={field}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            maxLength={100}
          />
        </div>
        {nameErr && <p className="mt-3 text-sm text-red-400">{nameErr}</p>}
        {nameMsg && <p className="mt-3 text-sm text-emerald-400">{nameMsg}</p>}
        <button onClick={onNameSave} disabled={nameSaving} className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
          {nameSaving ? 'Saving...' : 'Save name'}
        </button>
      </div>

      <div className={card}>
        <div className="mb-4 font-display text-base font-semibold">Profile image</div>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
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
            {uploading && <p className="mt-1 text-xs text-cyan-400">Uploading...</p>}
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
            <PasswordInput value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Min 8 chars, mixed case + number + special" />
          </div>
          <div>
            <label className={labelCls}>Confirm password</label>
            <PasswordInput value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} placeholder="Retype password" />
          </div>
        </div>
        {pw && (
          <div className="mt-3">
            <div className="mb-1.5 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={'h-1 flex-1 rounded-full transition-all ' + (i <= pwStrength.score ? (pwStrength.score <= 1 ? 'bg-red-400' : pwStrength.score === 2 ? 'bg-amber-400' : pwStrength.score === 3 ? 'bg-emerald-400' : 'bg-cyan-400') : 'bg-white/10')} />
                ))}
              </div>
              <span className={'font-mono text-[10px] font-semibold ' + (pwStrength.score <= 1 ? 'text-red-400' : pwStrength.score === 2 ? 'text-amber-400' : pwStrength.score === 3 ? 'text-emerald-400' : 'text-cyan-400')}>{pwStrength.label}</span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {[{ key: 'minLength', label: '8+ characters' }, { key: 'hasUpper', label: 'Uppercase' }, { key: 'hasLower', label: 'Lowercase' }, { key: 'hasNumber', label: 'Number' }, { key: 'hasSpecial', label: 'Special char' }].map((r) => (
                <div key={r.key} className={'flex items-center gap-1 text-[10px] ' + (pwStrength.checks[r.key] ? 'text-emerald-400' : 'text-white/30')}>
                  <span>{pwStrength.checks[r.key] ? '✓' : '○'}</span>
                  <span>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {pwErr && <p className="mt-3 text-sm text-red-400">{pwErr}</p>}
        {pwMsg && <p className="mt-3 text-sm text-emerald-400">{pwMsg}</p>}
        <button onClick={onPasswordSave} disabled={pwSaving} className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
          {pwSaving ? 'Saving...' : 'Update password'}
        </button>
      </div>

      {/* Plan info */}
      <div className={card}>
        <div className="mb-2 font-display text-base font-semibold">Your Plan</div>
        <div className="flex items-center gap-3">
          <span className={'rounded-full border px-3 py-1 text-xs font-semibold ' +
            (prefs?.is_beta ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' :
             'border-white/15 bg-white/5 text-white/60')}>
            {prefs?.is_beta ? 'Beta Access' : 'Basic'}
          </span>
          {prefs?.is_beta && (
            <span className="text-xs text-white/40">All Elite features unlocked free during beta</span>
          )}
        </div>
        {!prefs?.is_beta && (
          <a href="/#pricing" className="mt-3 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
            Upgrade to Elite
          </a>
        )}
      </div>

      {/* Replay walkthrough */}
      <div className={card}>
        <div className="mb-2 font-display text-base font-semibold">Walkthrough</div>
        <p className="mb-3 text-sm text-white/55">Replay the guided tour to see how everything works.</p>
        <button
          onClick={replayTour}
          className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors"
        >
          Replay walkthrough
        </button>
      </div>
    </div>
  );
}

function JournalSettingsTab({ prefs, onSaved }) {
  const toast = useToast();
  const existingEmotions = (prefs && prefs.custom_emotions && prefs.custom_emotions.length > 0)
    ? prefs.custom_emotions : DEFAULT_EMOTIONS;
  const [emotions, setEmotions] = useState(existingEmotions);
  const [newEmotion, setNewEmotion] = useState('');
  const [defaultConfidence, setDefaultConfidence] = useState((prefs && prefs.default_confidence) || 0);
  const existingTags = (prefs && Array.isArray(prefs.custom_tags) && prefs.custom_tags.length > 0)
    ? prefs.custom_tags : [...DEFAULT_TAGS];
  const [tags, setTags] = useState(existingTags);
  const [newTag, setNewTag] = useState('');
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

  function addTag() {
    const t = newTag.trim().toLowerCase();
    if (!t || tags.includes(t)) return;
    if (tags.length >= MAX_CUSTOM_TAGS) return;
    setTags([...tags, t]);
    setNewTag('');
  }
  function removeTag(idx) { setTags(tags.filter((_, i) => i !== idx)); }
  function resetTagDefaults() { setTags([...DEFAULT_TAGS]); }

  async function onSave() {
    setSaving(true);
    setError(null);
    setMsg(null);
    const res = await savePreferences({
      custom_emotions: emotions,
      custom_tags: tags,
      custom_setups: (prefs && prefs.custom_setups) || [],
      default_confidence: defaultConfidence,
      avatar_url: (prefs && prefs.avatar_url) || null,
    });
    if (res.error) { setError(res.error); if (toast) toast.error(res.error); }
    else {
      setMsg('Settings saved!');
      if (toast) toast.success('Settings saved!');
      if (onSaved) onSaved({ custom_emotions: emotions, custom_tags: tags, default_confidence: defaultConfidence });
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Emotion tags */}
      <div className={card}>
        <div className="mb-1 font-display text-base font-semibold">Emotions</div>
        <p className="mb-4 text-xs text-white/55">Customize the feelings you track in your journal.</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {emotions.map((em, i) => (
            <span key={i} className="group flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-200">
              {em}
              <button type="button" onClick={() => removeEmotion(i)} className="inline text-red-400 hover:text-red-300">&#10005;</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input className={field + ' flex-1'} value={newEmotion} onChange={(e) => setNewEmotion(e.target.value)} placeholder="e.g. Anxious, Excited..." onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmotion())} />
          <button type="button" onClick={addEmotion} className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white/70 hover:text-white">Add</button>
        </div>
        <button type="button" onClick={resetEmotionDefaults} className="mt-3 text-xs text-white/50 underline hover:text-white/70">Reset to defaults</button>
      </div>

      {/* Tags */}
      <div className={card}>
        <div className="mb-1 font-display text-base font-semibold">Tags</div>
        <p className="mb-4 text-xs text-white/55">Context tags for your trades (e.g. NFP, News, Holiday). Up to {MAX_CUSTOM_TAGS}.</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <span key={i} className="group flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200">
              {tag}
              <button type="button" onClick={() => removeTag(i)} className="inline text-red-400 hover:text-red-300">&#10005;</button>
            </span>
          ))}
        </div>
        {tags.length < MAX_CUSTOM_TAGS && (
          <div className="flex gap-2">
            <input className={field + ' flex-1'} value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="e.g. CPI, Earnings..." onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} />
            <button type="button" onClick={addTag} className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white/70 hover:text-white">Add</button>
          </div>
        )}
        <button type="button" onClick={resetTagDefaults} className="mt-3 text-xs text-white/50 underline hover:text-white/70">Reset to defaults</button>
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
              <button key={i} type="button" onClick={() => setDefaultConfidence(i)} className={'p-1 ' + (i <= defaultConfidence ? 'text-amber-400' : 'text-white/40')}>&#9733;</button>
            )
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {msg && <p className="text-sm text-emerald-400">{msg}</p>}

      <button onClick={onSave} disabled={saving} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
        {saving ? 'Saving...' : 'Save settings'}
      </button>
    </div>
  );
}

export default function SettingsTabs({ user, prefs: initialPrefs }) {
  const [tab, setTab] = useState('profile');
  const [prefs, setPrefs] = useState(initialPrefs);

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'journal', label: 'Journal settings' },
  ];

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={'flex-1 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ' + (tab === t.id ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white/70')}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'profile' && <ProfileTab user={user} prefs={prefs} />}
      {tab === 'journal' && <JournalSettingsTab prefs={prefs} onSaved={(updated) => setPrefs((p) => ({ ...p, ...updated }))} />}
    </div>
  );
}
