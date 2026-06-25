"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateTicketStatus, replyToTicket } from '@/app/admin/tickets/actions';

const CATEGORIES = {
  bug: { label: 'Bug Report', icon: '🐛', color: 'border-red-400/30 bg-red-500/15 text-red-300' },
  platform_issue: { label: 'Platform Issue', icon: '⚠️', color: 'border-amber-400/30 bg-amber-500/15 text-amber-300' },
  feature_request: { label: 'Feature Request', icon: '💡', color: 'border-cyan-400/30 bg-cyan-500/15 text-cyan-300' },
  general_support: { label: 'General Support', icon: '💬', color: 'border-violet-400/30 bg-violet-500/15 text-violet-300' },
  account_billing: { label: 'Account / Billing', icon: '💳', color: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300' },
};

const STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const STATUS_STYLES = {
  open: 'border-amber-400/30 bg-amber-500/15 text-amber-300',
  in_progress: 'border-cyan-400/30 bg-cyan-500/15 text-cyan-300',
  resolved: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300',
  closed: 'border-white/10 bg-white/5 text-white/50',
};
const STATUS_LABELS = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };

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

/* ─── Admin Ticket Detail ────────────────────────────────────── */

function AdminTicketDetail({ ticket, onBack, onStatusChange, onReply }) {
  const cat = CATEGORIES[ticket.category] || CATEGORIES.general_support;
  const screenshots = getScreenshots(ticket);
  const [replyText, setReplyText] = useState(ticket.admin_reply || '');
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  async function handleReply() {
    setSaving(true);
    await onReply(ticket.id, replyText);
    setSaving(false);
  }

  async function handleStatus(status) {
    setStatusSaving(true);
    await onStatusChange(ticket.id, status);
    setStatusSaving(false);
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
            <span className={'rounded-full border px-2.5 py-1 text-xs font-semibold ' + cat.color}>{cat.icon} {cat.label}</span>
            <span className={'rounded-full border px-2.5 py-1 text-xs font-semibold ' + (STATUS_STYLES[ticket.status] || '')}>{STATUS_LABELS[ticket.status]}</span>
          </div>
          <h1 className="font-display text-xl font-bold sm:text-2xl">{ticket.subject}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-xs text-white/40">
            <span>{ticket.user_email || 'Unknown user'}</span>
            <span>&middot;</span>
            <span>{fmtDate(ticket.created_at)}</span>
          </div>
        </div>

        {/* Status control */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/35">Status</span>
          <select
            value={ticket.status}
            onChange={(e) => handleStatus(e.target.value)}
            disabled={statusSaving}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70 outline-none disabled:opacity-50"
            style={{ colorScheme: 'dark' }}
          >
            {STATUSES.filter((s) => s.value !== 'all').map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-white/40">Description</div>
        <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
      </div>

      {/* Screenshots */}
      {screenshots.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/40">Screenshots ({screenshots.length})</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {screenshots.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-xl border border-white/10 transition-all hover:border-white/20">
                <img src={url} alt={'Screenshot ' + (i + 1)} className="w-full object-cover transition-transform group-hover:scale-105" style={{ maxHeight: 240 }} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Reply section */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/40">
          {ticket.admin_reply ? 'Edit Reply' : 'Write Reply'}
        </div>
        <textarea
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400/60"
          rows={4}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Write your reply to the user..."
        />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[10px] text-white/30">The user will see this reply on their ticket.</p>
          <button
            onClick={handleReply}
            disabled={saving || !replyText.trim()}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-[#08080f] disabled:opacity-60"
            style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
          >
            {saving ? 'Sending...' : ticket.admin_reply ? 'Update Reply' : 'Send Reply'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Ticket List Card ───────────────────────────────────────── */

function TicketListCard({ ticket, onClick }) {
  const cat = CATEGORIES[ticket.category] || CATEGORIES.general_support;
  const screenshots = getScreenshots(ticket);

  return (
    <button onClick={onClick} className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition-all hover:border-cyan-400/20 hover:bg-white/[0.05]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-sm font-semibold">{ticket.subject}</h3>
            <span className={'rounded-full border px-2 py-0.5 text-[10px] font-semibold ' + cat.color}>{cat.icon} {cat.label}</span>
            <span className={'rounded-full border px-2 py-0.5 text-[10px] font-semibold ' + (STATUS_STYLES[ticket.status] || '')}>{STATUS_LABELS[ticket.status]}</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-white/35">{ticket.user_email}</div>
          <p className="mt-1 text-xs text-white/40 line-clamp-1">{ticket.description}</p>
          <div className="mt-2 flex items-center gap-3">
            {screenshots.length > 0 && <span className="font-mono text-[10px] text-white/30">📎 {screenshots.length}</span>}
            {ticket.admin_reply && <span className="font-mono text-[10px] text-cyan-400/50">💬 Replied</span>}
          </div>
        </div>
        <div className="font-mono text-[11px] text-white/30">{fmtDate(ticket.created_at)}</div>
      </div>
    </button>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */

export default function AdminTickets({ tickets }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const filtered = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  const openCount = tickets.filter((t) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;

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
            {tickets.length} total &middot; <span className="text-amber-300">{openCount} open</span> &middot; <span className="text-cyan-300">{inProgressCount} in progress</span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-white/35">Status</span>
          {STATUSES.map((s) => (
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
            <TicketListCard key={t.id} ticket={t} onClick={() => setSelectedTicketId(t.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
