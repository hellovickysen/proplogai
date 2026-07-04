"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateTicketStatus, replyToTicket, closeTicket, bulkDeleteTickets } from '@/app/admin/tickets/actions';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const CATEGORIES = {
  bug: { label: 'Bug Report', icon: '🐛', color: 'border-red-400/30 bg-red-500/15 text-red-300' },
  platform_issue: { label: 'Platform Issue', icon: '⚠️', color: 'border-amber-400/30 bg-amber-500/15 text-amber-300' },
  feature_request: { label: 'Feature Request', icon: '💡', color: 'border-cyan-400/30 bg-cyan-500/15 text-cyan-300' },
  general_support: { label: 'General Support', icon: '💬', color: 'border-violet-400/30 bg-violet-500/15 text-violet-300' },
  account_billing: { label: 'Account / Billing', icon: '💳', color: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300' },
};

const FILTER_STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open', dot: '#fbbf24' },
  { value: 'in_progress', label: 'In Progress', dot: '#22d3ee' },
  { value: 'resolved', label: 'Resolved', dot: '#34d399' },
];

const STATUS_STYLES = {
  open: 'border-amber-400/30 bg-amber-500/15 text-amber-300',
  in_progress: 'border-cyan-400/30 bg-cyan-500/15 text-cyan-300',
  resolved: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300',
};
const STATUS_LABELS = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' };

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

function fmtTicketNum(n) {
  return n ? `#${String(n).padStart(3, '0')}` : '';
}

function getScreenshots(ticket) {
  const urls = [];
  if (ticket.screenshot_urls && Array.isArray(ticket.screenshot_urls)) urls.push(...ticket.screenshot_urls);
  if (ticket.screenshot_url && !urls.includes(ticket.screenshot_url)) urls.push(ticket.screenshot_url);
  return urls;
}

/* ─── Custom Status Dropdown ─────────────────────────────────── */

function StatusDropdown({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = STATUS_OPTIONS.find((s) => s.value === value) || STATUS_OPTIONS[0];

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70 transition-colors hover:border-white/20 disabled:opacity-50"
      >
        <span className="h-2 w-2 rounded-full" style={{ background: current.dot }} />
        <span>{current.label}</span>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className={'ml-1 transition-transform ' + (open ? 'rotate-180' : '')}>
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#12121a] py-1 shadow-xl">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={'flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-white/[0.06] ' + (opt.value === value ? 'text-white font-semibold' : 'text-white/60')}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: opt.dot }} />
              <span>{opt.label}</span>
              {opt.value === value && <span className="ml-auto text-[10px] text-white/30">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Conversation Message Bubble ───────────────────────────── */

function MessageBubble({ reply }) {
  const isAdmin = reply.sender_role === 'admin';
  const screenshots = reply.screenshot_urls && Array.isArray(reply.screenshot_urls) ? reply.screenshot_urls : [];

  return (
    <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
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
            {isAdmin ? 'You (Admin)' : 'User'}
          </span>
          <span className="font-mono text-[10px] text-white/40">{fmtDate(reply.created_at)}</span>
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
            <div className="text-sm font-medium text-white/80">Send transcript to user&apos;s email</div>
            <div className="text-xs text-white/40">User receives a copy of the conversation before deletion</div>
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

/* ─── Admin Ticket Detail ────────────────────────────────────── */

function AdminTicketDetail({ ticket, onBack, onStatusChange, onReply, onClose }) {
  const cat = CATEGORIES[ticket.category] || CATEGORIES.general_support;
  const screenshots = getScreenshots(ticket);
  const replies = ticket.replies || [];
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const ticketNum = fmtTicketNum(ticket.ticket_number);

  async function handleReply(e) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSaving(true);
    await onReply(ticket.id, replyText);
    setReplyText('');
    setSaving(false);
  }

  async function handleStatus(status) {
    setStatusSaving(true);
    await onStatusChange(ticket.id, status);
    setStatusSaving(false);
  }

  async function handleClose(sendTranscript) {
    setClosing(true);
    await onClose(ticket.id, sendTranscript);
    setClosing(false);
    setShowCloseModal(false);
  }

  return (
    <div>
      <button onClick={onBack} className="mb-6 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/50 transition-colors hover:bg-white/[0.05] hover:text-white/80">
        <span className="text-lg">&larr;</span> Back to Tickets
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {ticketNum && <span className="font-mono text-xs text-white/30">{ticketNum}</span>}
            <span className={'rounded-full border px-2.5 py-1 text-xs font-semibold ' + cat.color}>{cat.icon} {cat.label}</span>
            <span className={'rounded-full border px-2.5 py-1 text-xs font-semibold ' + (STATUS_STYLES[ticket.status] || '')}>{STATUS_LABELS[ticket.status] || ticket.status}</span>
          </div>
          <h1 className="font-display text-xl font-bold sm:text-2xl">{ticket.subject}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-xs text-white/40">
            <span>{ticket.user_email || 'Unknown user'}</span>
            <span>&middot;</span>
            <span>{fmtDate(ticket.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/35">Status</span>
            <StatusDropdown value={ticket.status} onChange={handleStatus} disabled={statusSaving} />
          </div>
          <button
            onClick={() => setShowCloseModal(true)}
            disabled={closing}
            className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
          >
            Close Ticket
          </button>
        </div>
      </div>

      {/* Resolved info */}
      {ticket.status === 'resolved' && ticket.resolved_at && (
        <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] p-4 flex items-start gap-3">
          <span className="text-emerald-400 text-lg mt-0.5">✔️</span>
          <div>
            <p className="text-sm font-medium text-emerald-300">Ticket marked as resolved</p>
            <p className="mt-1 text-xs text-white/40">
              Resolution email sent to user. Will auto-delete after 7 days if not re-opened.
            </p>
          </div>
        </div>
      )}

      {/* Original Description */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="grid h-5 w-5 place-items-center rounded bg-violet-500/20 text-[10px] text-violet-300">U</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-violet-400/70">User</span>
          <span className="font-mono text-[10px] text-white/40">{fmtDate(ticket.created_at)}</span>
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
          <textarea
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400/60"
            rows={3}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply to the user..."
            maxLength={5000}
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="font-mono text-[10px] text-white/40">{replyText.length}/5000</p>
            <button type="submit" disabled={saving || !replyText.trim()} className="rounded-lg px-5 py-2 text-xs font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
              {saving ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </form>
      </div>

      <CloseTicketModal open={showCloseModal} onClose={() => setShowCloseModal(false)} onConfirm={handleClose} closing={closing} />
    </div>
  );
}

/* ─── Ticket List Card ───────────────────────────────────────── */

function TicketListCard({ ticket, onClick, selectMode, selected, onToggle }) {
  const cat = CATEGORIES[ticket.category] || CATEGORIES.general_support;
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
              {ticketNum && <span className="font-mono text-[10px] text-white/40">{ticketNum}</span>}
              <h3 className="font-display text-sm font-semibold">{ticket.subject}</h3>
              <span className={'rounded-full border px-2 py-0.5 text-[10px] font-semibold ' + cat.color}>{cat.icon} {cat.label}</span>
              <span className={'rounded-full border px-2 py-0.5 text-[10px] font-semibold ' + (STATUS_STYLES[ticket.status] || '')}>{STATUS_LABELS[ticket.status] || ticket.status}</span>
            </div>
            <div className="mt-1 font-mono text-[11px] text-white/35">{ticket.user_email}</div>
            <p className="mt-1 text-xs text-white/40 line-clamp-1">{ticket.description}</p>
            <div className="mt-2 flex items-center gap-3">
              {replies.length > 0 && (
                <span className="font-mono text-[10px] text-white/30">💬 {replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
              )}
              {lastReply && (
                <span className={`font-mono text-[10px] ${lastReply.sender_role === 'user' ? 'text-amber-400/60' : 'text-cyan-400/50'}`}>
                  {lastReply.sender_role === 'user' ? '⚠ User replied' : 'Admin replied'}
                </span>
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

export default function AdminTickets({ tickets }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const filtered = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  const openCount = tickets.filter((t) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const filteredIds = filtered.map((t) => t.id);
    if (filteredIds.every((id) => selectedIds.has(id))) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredIds));
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  async function handleStatusChange(id, status) {
    const res = await updateTicketStatus(id, status);
    if (res.error) alert(res.error);
    else router.refresh();
  }

  async function handleReply(id, reply) {
    const res = await replyToTicket(id, reply);
    if (res.error) alert(res.error);
    else router.refresh();
  }

  async function handleClose(id, sendTranscript) {
    const res = await closeTicket(id, sendTranscript);
    if (res.error) alert(res.error);
    else {
      setSelectedTicketId(null);
      router.refresh();
    }
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    const res = await bulkDeleteTickets([...selectedIds]);
    if (res.error) alert(res.error);
    else {
      exitSelectMode();
      router.refresh();
    }
    setBulkDeleting(false);
    setShowBulkConfirm(false);
  }

  // Detail view
  if (selectedTicketId) {
    const ticket = tickets.find((t) => t.id === selectedTicketId);
    if (ticket) {
      return (
        <AdminTicketDetail
          ticket={ticket}
          onBack={() => setSelectedTicketId(null)}
          onStatusChange={handleStatusChange}
          onReply={handleReply}
          onClose={handleClose}
        />
      );
    }
    setSelectedTicketId(null);
  }

  // List view
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Support Tickets</h1>
          <p className="mt-1 text-sm text-white/50">
            {tickets.length} total &middot; <span className="text-amber-300">{openCount} open</span> &middot; <span className="text-cyan-300">{inProgressCount} in progress</span>{resolvedCount > 0 && <> &middot; <span className="text-emerald-300">{resolvedCount} resolved</span></>}
          </p>
        </div>
        {tickets.length > 0 && (
          <button
            onClick={selectMode ? exitSelectMode : () => setSelectMode(true)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${selectMode ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300' : 'border-white/15 bg-white/5 text-white/70'}`}
          >
            {selectMode ? 'Cancel' : 'Select'}
          </button>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-red-400/20 bg-red-500/[0.05] p-4">
          <div className="flex items-center gap-3">
            <button onClick={toggleSelectAll} className="text-xs font-semibold text-white/60 hover:text-white/80">
              {filtered.every((t) => selectedIds.has(t.id)) ? 'Deselect All' : 'Select All'}
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

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-white/35">Status</span>
          {FILTER_STATUSES.map((s) => (
            <button key={s.value} onClick={() => setStatusFilter(s.value)}
              className={'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ' + (statusFilter === s.value ? 'bg-white/[0.08] text-white' : 'text-white/35 hover:text-white/60')}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-white/35">Category</span>
          <button onClick={() => setCategoryFilter('all')}
            className={'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ' + (categoryFilter === 'all' ? 'bg-white/[0.08] text-white' : 'text-white/35 hover:text-white/60')}>
            All
          </button>
          {Object.entries(CATEGORIES).map(([key, c]) => (
            <button key={key} onClick={() => setCategoryFilter(key)}
              className={'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ' + (categoryFilter === key ? 'bg-white/[0.08] text-white' : 'text-white/35 hover:text-white/60')}>
              {c.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <p className="text-sm text-white/40">No tickets match the current filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <TicketListCard
              key={t.id}
              ticket={t}
              onClick={() => setSelectedTicketId(t.id)}
              selectMode={selectMode}
              selected={selectedIds.has(t.id)}
              onToggle={toggleSelect}
            />
          ))}
        </div>
      )}

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
