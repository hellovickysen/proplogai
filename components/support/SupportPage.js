"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createTicket, replyToTicket, closeTicket, bulkDeleteTickets } from '@/app/dashboard/support/actions';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { processImageFile } from '@/lib/imageUtils';

const field = 'w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400/60';
const labelCls = 'mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55';

const CATEGORIES = [
  { value: 'bug', label: 'Bug Report', icon: '🐛', color: 'border-red-400/30 bg-red-500/15 text-red-300' },
  { value: 'platform_issue', label: 'Platform Issue', icon: '⚠️', color: 'border-amber-400/30 bg-amber-500/15 text-amber-300' },
  { value: 'feature_request', label: 'Feature Request', icon: '💡', color: 'border-cyan-400/30 bg-cyan-500/15 text-cyan-300' },
  { value: 'general_support', label: 'General Support', icon: '💬', color: 'border-violet-400/30 bg-violet-500/15 text-violet-300' },
  { value: 'account_billing', label: 'Account / Billing', icon: '💳', color: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300' },
];

const STATUS_STYLES = {
  open: 'border-amber-400/30 bg-amber-500/15 text-amber-300',
  in_progress: 'border-cyan-400/30 bg-cyan-500/15 text-cyan-300',
  resolved: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300',
};
const STATUS_LABELS = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' };

function fmtTicketNum(n) {
  return n ? `#${String(n).padStart(3, '0')}` : '';
}

function daysRemaining(resolvedAt) {
  if (!resolvedAt) return 0;
  const expiresAt = new Date(resolvedAt).getTime() + 7 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
}

function getCat(val) { return CATEGORIES.find((c) => c.value === val) || CATEGORIES[3]; }

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

function getScreenshots(ticket) {
  const urls = [];
  if (ticket.screenshot_urls && Array.isArray(ticket.screenshot_urls)) urls.push(...ticket.screenshot_urls);
  if (ticket.screenshot_url && !urls.includes(ticket.screenshot_url)) urls.push(ticket.screenshot_url);
  return urls;
}

/* ─── Conversation Message Bubble ───────────────────────────── */

function MessageBubble({ reply }) {
  const isAdmin = reply.sender_role === 'admin';
  const screenshots = reply.screenshot_urls && Array.isArray(reply.screenshot_urls) ? reply.screenshot_urls : [];

  return (
    <div className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 ${
        isAdmin
          ? 'border border-cyan-400/20 bg-cyan-500/[0.05]'
          : 'border border-violet-400/20 bg-violet-500/[0.05]'
      }`}>
        <div className="mb-1.5 flex items-center gap-2">
          {isAdmin ? (
            <span className="grid h-5 w-5 place-items-center rounded text-[10px]" style={{ background: 'linear-gradient(135deg,#f87171,#fbbf24)' }}>⚙</span>
          ) : (
            <span className="grid h-5 w-5 place-items-center rounded bg-violet-500/20 text-[10px] text-violet-300">U</span>
          )}
          <span className={`font-mono text-[10px] uppercase tracking-wider ${isAdmin ? 'text-cyan-400/70' : 'text-violet-400/70'}`}>
            {isAdmin ? 'Support' : 'You'}
          </span>
          <span className="font-mono text-[10px] text-white/25">{fmtDate(reply.created_at)}</span>
        </div>
        <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">{reply.message}</p>
        {screenshots.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {screenshots.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-lg border border-white/10">
                <img src={url} alt={'Attachment ' + (i + 1)} className="h-16 w-20 object-cover transition-transform group-hover:scale-105" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Close Ticket Modal ─────────────────────────────────────── */

function CloseTicketModal({ open, onClose, onConfirm, closing }) {
  const [sendTranscript, setSendTranscript] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60" />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg font-semibold text-white">Close this ticket?</h3>
        <p className="mt-2 text-sm text-white/50">The ticket and all replies will be permanently deleted.</p>

        <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]">
          <input
            type="checkbox"
            checked={sendTranscript}
            onChange={(e) => setSendTranscript(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-black/30 text-cyan-400 accent-cyan-400"
          />
          <div>
            <div className="text-sm font-medium text-white/80">Send transcript to email</div>
            <div className="text-xs text-white/40">Receive a copy of the conversation before deletion</div>
          </div>
        </label>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} disabled={closing} className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-semibold text-white/70">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(sendTranscript)}
            disabled={closing}
            className="flex-1 rounded-xl border border-red-400/30 bg-red-500/15 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/25 disabled:opacity-50"
          >
            {closing ? 'Closing...' : 'Close Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Ticket Detail View ─────────────────────────────────────── */

function TicketDetail({ ticket, onBack }) {
  const router = useRouter();
  const toast = useToast();
  const cat = getCat(ticket.category);
  const screenshots = getScreenshots(ticket);
  const replies = ticket.replies || [];
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const ticketNum = fmtTicketNum(ticket.ticket_number);
  const isResolved = ticket.status === 'resolved';
  const daysLeft = isResolved ? daysRemaining(ticket.resolved_at) : 0;

  async function handleReply(e) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    const res = await replyToTicket(ticket.id, replyText);
    if (res.error) { if (toast) toast.error(res.error); }
    else {
      if (toast) toast.success(isResolved ? 'Reply sent — ticket re-opened!' : 'Reply sent!');
      setReplyText('');
      router.refresh();
    }
    setSending(false);
  }

  async function handleClose(sendTranscript) {
    setClosing(true);
    const res = await closeTicket(ticket.id, sendTranscript);
    if (res.error) { if (toast) toast.error(res.error); }
    else {
      const msg = sendTranscript ? 'Ticket closed. Transcript sent to your email.' : 'Ticket closed.';
      if (toast) toast.success(msg);
      onBack();
      router.refresh();
    }
    setClosing(false);
    setShowCloseModal(false);
  }

  return (
    <div className="px-4 sm:px-6 py-8">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/50 transition-colors hover:bg-white/[0.05] hover:text-white/80">
        <span className="text-lg">&larr;</span> Back to Tickets
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {ticketNum && <span className="font-mono text-xs text-white/30">{ticketNum}</span>}
            <span className={'rounded-full border px-2.5 py-1 text-xs font-semibold ' + cat.color}>{cat.icon} {cat.label}</span>
            <span className={'rounded-full border px-2.5 py-1 text-xs font-semibold ' + (STATUS_STYLES[ticket.status] || STATUS_STYLES.open)}>{STATUS_LABELS[ticket.status] || ticket.status}</span>
          </div>
          <h1 className="font-display text-xl font-bold sm:text-2xl">{ticket.subject}</h1>
          <div className="mt-1 font-mono text-xs text-white/40">{fmtDate(ticket.created_at)}</div>
        </div>
        <button
          onClick={() => setShowCloseModal(true)}
          disabled={closing}
          className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
        >
          Close Ticket
        </button>
      </div>

      {/* Resolved banner */}
      {isResolved && (
        <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] p-5">
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 text-xl mt-0.5">✔️</span>
            <div>
              <p className="text-sm font-semibold text-emerald-300">Your ticket has been resolved</p>
              <p className="mt-2 text-sm text-white/55 leading-relaxed">
                If you still need help, reply below to <strong className="text-white/70">re-open</strong> this ticket.
                Otherwise, you can close it now or it will be <strong className="text-white/70">automatically deleted in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Original Description */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="grid h-5 w-5 place-items-center rounded bg-violet-500/20 text-[10px] text-violet-300">U</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-violet-400/70">You</span>
          <span className="font-mono text-[10px] text-white/25">{fmtDate(ticket.created_at)}</span>
        </div>
        <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
      </div>

      {screenshots.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/40">Attachments ({screenshots.length})</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {screenshots.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-xl border border-white/10 transition-all hover:border-white/20">
                <img src={url} alt={'Screenshot ' + (i + 1)} className="w-full object-cover transition-transform group-hover:scale-105" style={{ maxHeight: 240 }} />
              </a>
            ))}
          </div>
        </div>
      )}

      {replies.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/40">Conversation ({replies.length})</div>
          <div className="space-y-3">
            {replies.map((r) => (
              <MessageBubble key={r.id} reply={r} />
            ))}
          </div>
        </div>
      )}

      {/* Reply Form */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <form onSubmit={handleReply}>
          <textarea className={field} rows={3} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={isResolved ? 'Reply to re-open this ticket...' : 'Write a reply...'} maxLength={5000} />
          <div className="mt-3 flex items-center justify-between">
            <p className="font-mono text-[10px] text-white/25">{replyText.length}/5000</p>
            <button type="submit" disabled={sending || !replyText.trim()} className="rounded-lg px-5 py-2 text-xs font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
              {sending ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </form>
      </div>

      <CloseTicketModal open={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleClose} closing={closing} />
    </div>
  );
}

/* ─── Ticket List Card ───────────────────────────────────────── */

function TicketCard({ ticket, onClick, selectMode, selected, onToggle }) {
  const cat = getCat(ticket.category);
  const replies = ticket.replies || [];
  const lastReply = replies.length > 0 ? replies[replies.length - 1] : null;
  const ticketNum = fmtTicketNum(ticket.ticket_number);

  return (
    <div className="flex items-start gap-3">
      {selectMode && (
        <label className="mt-5 flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggle(ticket.id)}
            className="h-4 w-4 rounded border-white/20 bg-black/30 accent-cyan-400"
          />
        </label>
      )}
      <button onClick={selectMode ? () => onToggle(ticket.id) : onClick} className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition-all hover:border-cyan-400/20 hover:bg-white/[0.05]">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {ticketNum && <span className="font-mono text-[10px] text-white/25">{ticketNum}</span>}
              <h3 className="font-display text-sm font-semibold">{ticket.subject}</h3>
              <span className={'rounded-full border px-2 py-0.5 text-[10px] font-semibold ' + cat.color}>{cat.icon} {cat.label}</span>
              <span className={'rounded-full border px-2 py-0.5 text-[10px] font-semibold ' + (STATUS_STYLES[ticket.status] || STATUS_STYLES.open)}>{STATUS_LABELS[ticket.status] || ticket.status}</span>
            </div>
            <p className="mt-1 text-xs text-white/40 line-clamp-1">{ticket.description}</p>
            <div className="mt-2 flex items-center gap-3">
              {replies.length > 0 && (
                <span className="font-mono text-[10px] text-white/30">💬 {replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
              )}
              {lastReply && lastReply.sender_role === 'admin' && (
                <span className="font-mono text-[10px] text-cyan-400/50">Support replied</span>
              )}
              {ticket.status === 'resolved' && (
                <span className="font-mono text-[10px] text-emerald-400/60">✔ Resolved — {daysRemaining(ticket.resolved_at)}d left</span>
              )}
            </div>
          </div>
          <div className="font-mono text-[11px] text-white/30">{fmtDate(ticket.updated_at || ticket.created_at)}</div>
        </div>
      </button>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */

export default function SupportPage({ tickets }) {
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const hasOpenTicket = tickets.some((t) => t.status === 'open' || t.status === 'in_progress');
  const [category, setCategory] = useState('general_support');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [screenshots, setScreenshots] = useState([]);
  const [saving, setSaving] = useState(false);

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === tickets.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(tickets.map((t) => t.id)));
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    const res = await bulkDeleteTickets([...selectedIds]);
    if (res.error) { if (toast) toast.error(res.error); }
    else {
      if (toast) toast.success(`${res.deleted} ticket${res.deleted === 1 ? '' : 's'} deleted.`);
      exitSelectMode();
      router.refresh();
    }
    setBulkDeleting(false);
    setShowBulkConfirm(false);
  }

  async function handleScreenshots(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { if (toast) toast.error('Not signed in'); return; }
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { if (toast) toast.error(file.name + ' is over 5MB'); continue; }
      const tempId = Date.now() + Math.random();
      setScreenshots((prev) => [...prev, { id: tempId, url: null, uploading: true }]);
      try {
        const processed = await processImageFile(file);
        if (processed.error) { if (toast) toast.error(processed.error); setScreenshots((prev) => prev.filter((s) => s.id !== tempId)); continue; }
        const uploadFile = processed.file;
        const safe = uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = user.id + '/support_' + Date.now() + '_' + safe;
        const { error } = await supabase.storage.from('screenshots').upload(path, uploadFile, { cacheControl: '3600', upsert: true });
        if (error) { if (toast) toast.error('Upload failed: ' + error.message); setScreenshots((prev) => prev.filter((s) => s.id !== tempId)); continue; }
        const { data: { publicUrl } } = supabase.storage.from('screenshots').getPublicUrl(path);
        setScreenshots((prev) => prev.map((s) => s.id === tempId ? { ...s, url: publicUrl, uploading: false } : s));
      } catch { if (toast) toast.error('Upload failed'); setScreenshots((prev) => prev.filter((s) => s.id !== tempId)); }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeScreenshot(id) { setScreenshots((prev) => prev.filter((s) => s.id !== id)); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const urls = screenshots.filter((s) => s.url).map((s) => s.url);
    const res = await createTicket({ category, subject, description, screenshot_urls: urls, screenshot_url: urls[0] || null });
    if (res.error) { if (toast) toast.error(res.error); }
    else {
      if (toast) toast.success('Ticket submitted!');
      setShowForm(false); setCategory('general_support'); setSubject(''); setDescription(''); setScreenshots([]);
      router.refresh();
    }
    setSaving(false);
  }

  const anyUploading = screenshots.some((s) => s.uploading);

  // Detail view
  if (selectedTicket) {
    const ticket = tickets.find((t) => t.id === selectedTicket);
    if (ticket) return <TicketDetail ticket={ticket} onBack={() => setSelectedTicket(null)} />;
    setSelectedTicket(null);
  }

  // List view
  return (
    <div className="px-4 sm:px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Support</h1>
          <p className="mt-1 text-sm text-white/55">Submit a ticket or report an issue</p>
        </div>
        <div className="flex items-center gap-2">
          {tickets.length > 0 && (
            <button
              onClick={selectMode ? exitSelectMode : () => setSelectMode(true)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${selectMode ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300' : 'border-white/15 bg-white/5 text-white/70'}`}
            >
              {selectMode ? 'Cancel' : 'Select'}
            </button>
          )}
          {!selectMode && (
            <button
              onClick={() => {
                if (hasOpenTicket && !showForm) {
                  if (toast) toast.error('You already have an open ticket. Close or resolve it first.');
                  return;
                }
                setShowForm(!showForm);
              }}
              disabled={hasOpenTicket && !showForm}
              className={'rounded-xl px-4 py-2 text-sm font-semibold ' + (hasOpenTicket && !showForm ? 'opacity-50 cursor-not-allowed text-[#08080f]' : 'text-[#08080f]')}
              style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
            >
              {showForm ? 'Cancel' : '+ New Ticket'}
            </button>
          )}
        </div>
      </div>

      {/* Open ticket warning */}
      {hasOpenTicket && !selectMode && !selectedTicket && (
        <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-500/[0.05] p-4 flex items-center gap-3">
          <span className="text-amber-400 text-lg">⚠️</span>
          <p className="text-sm text-amber-300/80">You have an open ticket. Please wait until it&apos;s resolved or close it before creating a new one.</p>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-red-400/20 bg-red-500/[0.05] p-4">
          <div className="flex items-center gap-3">
            <button onClick={toggleSelectAll} className="text-xs font-semibold text-white/60 hover:text-white/80">
              {selectedIds.size === tickets.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="font-mono text-xs text-white/40">{selectedIds.size} selected</span>
          </div>
          <button
            onClick={() => setShowBulkConfirm(true)}
            disabled={bulkDeleting}
            className="rounded-lg border border-red-400/30 bg-red-500/15 px-4 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/25 disabled:opacity-50"
          >
            {bulkDeleting ? 'Deleting...' : `Delete ${selectedIds.size} Ticket${selectedIds.size === 1 ? '' : 's'}`}
          </button>
        </div>
      )}

      {showForm && !selectMode && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="mb-5 font-display text-base font-semibold">Submit a ticket</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Category *</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {CATEGORIES.map((c) => (
                  <button key={c.value} type="button" onClick={() => setCategory(c.value)}
                    className={'rounded-lg border px-3 py-2.5 text-xs font-semibold transition-all ' + (category === c.value ? c.color : 'border-white/10 bg-black/30 text-white/50')}>
                    <span className="mr-1">{c.icon}</span> {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Subject *</label>
              <input className={field} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary of your issue" maxLength={200} required />
            </div>
            <div>
              <label className={labelCls}>Description *</label>
              <textarea className={field} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue in detail. Include steps to reproduce if it's a bug." maxLength={5000} required />
              <p className="mt-1 text-right font-mono text-[10px] text-white/30">{description.length}/5000</p>
            </div>
            <div>
              <label className={labelCls}>Screenshots (optional)</label>
              {screenshots.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {screenshots.map((s) => (
                    <div key={s.id} className="relative group">
                      {s.uploading ? (
                        <div className="grid h-20 w-24 place-items-center rounded-lg border border-white/10 bg-black/30">
                          <svg className="h-5 w-5 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" /></svg>
                        </div>
                      ) : (
                        <>
                          <img src={s.url} alt="Screenshot" className="h-20 w-24 rounded-lg border border-white/10 object-cover" />
                          <button type="button" onClick={() => removeScreenshot(s.id)} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">&#10005;</button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-xs text-white/50 transition-colors hover:border-white/30 hover:text-white/70">+ Add screenshots</button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleScreenshots} className="hidden" />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70">Cancel</button>
            <button type="submit" disabled={saving || anyUploading} className="flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
              {saving ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      )}

      <div>
        <h2 className="mb-4 font-display text-base font-semibold">
          My Tickets <span className="ml-1 font-mono text-xs text-white/40">({tickets.length})</span>
        </h2>
        {tickets.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <div className="mx-auto mb-3 text-4xl">📩</div>
            <p className="text-sm text-white/40">No tickets yet. Submit one if you need help or want to report an issue.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <TicketCard
                key={t.id}
                ticket={t}
                onClick={() => setSelectedTicket(t.id)}
                selectMode={selectMode}
                selected={selectedIds.has(t.id)}
                onToggle={toggleSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        open={showBulkConfirm}
        onClose={() => setShowBulkConfirm(false)}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedIds.size} ticket${selectedIds.size === 1 ? '' : 's'}?`}
        message="Selected tickets and all their replies will be permanently deleted. No transcript emails will be sent."
        confirmLabel="Delete All"
        variant="danger"
      />
    </div>
  );
}
