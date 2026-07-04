"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSetup, updateSetup, deleteSetup, seedDefaultSetups, resetToDefaultSetups } from '@/app/dashboard/rulebook/actions';
import { useToast } from '@/components/ui/Toast';
import { RulebookEmptyIcon } from '@/components/ui/EmptyStates';
import ConfirmDialog from '@/components/ui/ConfirmDialog';


const labelCls = 'mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55';
const field = 'w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400/60';
const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

function SetupCard({ setup, onEdit, onToggle, onDelete }) {
  const isNoSetup = setup.is_default;
  return (
    <div className={'rounded-2xl border p-5 transition-all ' + (setup.is_active ? 'border-white/10 bg-white/[0.03]' : 'border-white/5 bg-white/[0.01] opacity-60')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-semibold">{setup.name}</h3>
            {isNoSetup && (
              <span className="rounded-full bg-red-500/15 px-2 py-0.5 font-mono text-[10px] uppercase text-red-300">Always on</span>
            )}
            {!setup.is_active && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] uppercase text-white/50">Inactive</span>
            )}
          </div>
          {setup.direction && (
            <p className="mt-2 text-sm leading-relaxed text-white/60">{setup.direction}</p>
          )}
          {setup.description && (
            <p className="mt-1 text-xs text-white/40">{setup.description}</p>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => onEdit(setup)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 hover:text-white"
        >
          Edit
        </button>
        {!isNoSetup && (
          <>
            <button
              onClick={() => onToggle(setup.id, !setup.is_active)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 hover:text-white"
            >
              {setup.is_active ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={() => onDelete(setup.id)}
              className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300 hover:bg-red-500/20"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SetupForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial ? initial.name : '');
  const [direction, setDirection] = useState(initial ? (initial.direction || '') : '');
  const [description, setDescription] = useState(initial ? (initial.description || '') : '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({ name, direction, description });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-cyan-400/30 bg-[#12121a] p-6">
      <h3 className="mb-4 font-display text-base font-semibold">
        {initial ? 'Edit setup' : 'New setup'}
      </h3>
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Setup name *</label>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Breakout, Scalp, ChoCh..." maxLength={60} required />
        </div>
        <div>
          <label className={labelCls}>Rule direction</label>
          <textarea className={field + ' min-h-[80px]'} value={direction} onChange={(e) => setDirection(e.target.value)} placeholder="When should you take this setup? What conditions must be met?" rows={3} maxLength={500} />
          <p className="mt-1 text-xs text-white/30">{direction.length}/500 — This shows during trade logging to remind you of your rules.</p>
        </div>
        <div>
          <label className={labelCls}>Description (optional)</label>
          <input className={field} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Extra notes about this setup" maxLength={1000} />
        </div>
      </div>
      <div className="mt-5 flex gap-3">
        <button type="button" onClick={onCancel} className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/70">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-xl px-5 py-3 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
          {saving ? 'Saving...' : initial ? 'Save changes' : 'Create setup'}
        </button>
      </div>
    </form>
  );
}

export default function RulebookPage({ setups }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const activeSetups = setups.filter((s) => s.is_active);
  const inactiveSetups = setups.filter((s) => !s.is_active);

  async function handleSeed() {
    setSeeding(true);
    const res = await seedDefaultSetups();
    if (res.error) {
      if (toast) toast.error(res.error);
    } else {
      if (toast) toast.success('Default setups created!');
    }
    setSeeding(false);
    router.refresh();
  }

  async function handleCreate(data) {
    const res = await createSetup(data);
    if (res.error) {
      if (toast) toast.error(res.error);
    } else {
      if (toast) toast.success('Setup created!');
      setEditing(null);
      router.refresh();
    }
  }

  async function handleUpdate(data) {
    if (!editing || !editing.id) return;
    const res = await updateSetup(editing.id, data);
    if (res.error) {
      if (toast) toast.error(res.error);
    } else {
      if (toast) toast.success('Setup updated!');
      setEditing(null);
      router.refresh();
    }
  }

  async function handleToggle(id, active) {
    const res = await updateSetup(id, { is_active: active });
    if (res.error) {
      if (toast) toast.error(res.error);
    } else {
      router.refresh();
    }
  }

  function handleDelete(id) {
    setPendingDeleteId(id);
  }

  async function handleResetToDefaults() {
    setShowResetConfirm(false);
    setResetting(true);
    const res = await resetToDefaultSetups();
    if (res.error) {
      if (toast) toast.error(res.error);
    } else {
      if (toast) toast.success('Default setups restored!');
      router.refresh();
    }
    setResetting(false);
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    const res = await deleteSetup(id);
    if (res.error) {
      if (toast) toast.error(res.error);
    } else {
      if (toast) toast.warning('Setup deleted');
      router.refresh();
    }
  }

  // Empty state
  if (setups.length === 0) {
    return (
      <div className="px-4 sm:px-6 py-8">
        <h1 className="font-display text-2xl font-bold">Rulebook</h1>
        <p className="mt-1 text-sm text-white/55">Define your trading setups and rules. Each setup is a rule in your rulebook.</p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <RulebookEmptyIcon />
          <h2 className="font-display text-xl font-bold">Build your rulebook</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
            Your rulebook is your trading rulebook. Define the setups you trade, with clear rules for each one.
            When you log trades, you will select which setup you followed — and the AI Coach will track your discipline.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60"
              style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
            >
              {seeding ? 'Creating...' : 'Start with defaults'}
            </button>
            <button
              onClick={() => setEditing('new')}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70"
            >
              Create from scratch
            </button>
          </div>
        </div>

        {editing === 'new' && (
          <div className="mt-6">
            <SetupForm onSave={handleCreate} onCancel={() => setEditing(null)} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Rulebook</h1>
          <p className="mt-1 text-sm text-white/55">
            {activeSetups.length} active setup{activeSetups.length !== 1 ? 's' : ''} in your rulebook
          </p>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#08080f]"
          style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        >
          + New setup
        </button>
      </div>

      {/* Active setups */}
      <div className="grid gap-4 sm:grid-cols-2">
        {activeSetups.map((s) => (
          <SetupCard key={s.id} setup={s} onEdit={setEditing} onToggle={handleToggle} onDelete={handleDelete} />
        ))}
      </div>

      {/* Inactive setups */}
      {inactiveSetups.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-white/40">Inactive setups</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {inactiveSetups.map((s) => (
              <SetupCard key={s.id} setup={s} onEdit={setEditing} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* Setup modal — new or edit */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <SetupForm
              initial={editing === 'new' ? null : editing}
              onSave={editing === 'new' ? handleCreate : handleUpdate}
              onCancel={() => setEditing(null)}
            />
          </div>
        </div>
      )}

      {/* Restore defaults */}
      <div className="mt-8 border-t border-white/[0.06] pt-6">
        <button
          onClick={() => setShowResetConfirm(true)}
          disabled={resetting}
          className="text-xs text-white/40 underline hover:text-white/60 disabled:opacity-50"
        >
          {resetting ? 'Restoring...' : 'Restore default setups'}
        </button>
        <p className="mt-1 text-[10px] text-white/40">Replaces all your current setups with the 7 default setups.</p>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!pendingDeleteId}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete this setup?"
        message="This action can't be undone. Trades using this setup will keep their history."
      />

      {/* Reset confirmation */}
      <ConfirmDialog
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetToDefaults}
        title="Restore default setups?"
        message="This will remove all your current setups and replace them with the 7 defaults. This action can't be undone."
        confirmLabel="Restore"
      />
    </div>
  );
}
