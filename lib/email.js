/**
 * Email module — sends emails via Resend.
 * Requires RESEND_API_KEY env var.
 * Falls back gracefully if not configured.
 */

const RESEND_URL = 'https://api.resend.com/emails';

function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function isEmailConfigured() {
  return !!process.env.RESEND_API_KEY;
}

export async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { ok: false, error: 'Email is not configured (missing RESEND_API_KEY).' };
  }

  const from = process.env.RESEND_FROM || 'PropLogAI <noreply@proplogai.com>';

  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });

    if (!res.ok) {
      const t = await res.text();
      return { ok: false, error: 'Email send failed (' + res.status + '): ' + t.slice(0, 200) };
    }

    const data = await res.json();
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: (e && e.message) || 'Email send failed.' };
  }
}

/* ── Ticket Transcript Email ──────────────────────────────── */

function fmtDateEmail(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return ''; }
}

const CATEGORY_LABELS = {
  bug: 'Bug Report',
  platform_issue: 'Platform Issue',
  feature_request: 'Feature Request',
  general_support: 'General Support',
  account_billing: 'Account / Billing',
};

export async function sendTicketTranscript(toEmail, ticket, replies) {
  if (!toEmail) return { ok: false, error: 'No email address.' };

  const subjectLine = `Ticket Closed: ${ticket.subject}`;
  const catLabel = CATEGORY_LABELS[ticket.category] || ticket.category;

  // Build reply rows
  const replyRows = replies.map((r) => {
    const isAdmin = r.sender_role === 'admin';
    const senderLabel = isAdmin ? 'Support' : 'You';
    const bgColor = isAdmin ? '#0d1b2a' : '#12121a';
    const borderColor = isAdmin ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.1)';
    const labelColor = isAdmin ? '#22d3ee' : '#a78bfa';

    return `
      <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:12px;padding:16px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:12px;font-weight:600;color:${labelColor};text-transform:uppercase;letter-spacing:0.5px;">${senderLabel}</span>
          <span style="font-size:11px;color:#666;">${fmtDateEmail(r.created_at)}</span>
        </div>
        <p style="margin:0;font-size:14px;color:#d0d0d0;line-height:1.6;white-space:pre-wrap;">${escHtml(r.message)}</p>
      </div>
    `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#07070b;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:24px;font-weight:700;background:linear-gradient(120deg,#a78bfa,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">PropLogAI</span>
    </div>

    <div style="background:#12121a;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="font-size:18px;">✅</span>
        <h1 style="margin:0;font-size:18px;color:#f0f0f0;">Ticket Closed</h1>
      </div>
      <div style="margin-bottom:8px;">
        <span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;">Subject</span>
        <p style="margin:4px 0 0;font-size:15px;color:#f0f0f0;font-weight:600;">${escHtml(ticket.subject)}</p>
      </div>
      <div style="display:flex;gap:16px;margin-top:12px;">
        <div>
          <span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;">Category</span>
          <p style="margin:4px 0 0;font-size:13px;color:#d0d0d0;">${escHtml(catLabel)}</p>
        </div>
        <div>
          <span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;">Opened</span>
          <p style="margin:4px 0 0;font-size:13px;color:#d0d0d0;">${fmtDateEmail(ticket.created_at)}</p>
        </div>
      </div>
    </div>

    <!-- Original Description -->
    <div style="background:#12121a;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-size:12px;font-weight:600;color:#a78bfa;text-transform:uppercase;letter-spacing:0.5px;">Original Message</span>
        <span style="font-size:11px;color:#666;">${fmtDateEmail(ticket.created_at)}</span>
      </div>
      <p style="margin:0;font-size:14px;color:#d0d0d0;line-height:1.6;white-space:pre-wrap;">${escHtml(ticket.description)}</p>
    </div>

    ${replies.length > 0 ? `
    <!-- Conversation Thread -->
    <div style="margin-bottom:20px;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:12px;padding-left:4px;">Conversation (${replies.length} ${replies.length === 1 ? 'reply' : 'replies'})</div>
      ${replyRows}
    </div>
    ` : ''}

    <div style="text-align:center;padding:16px 0;">
      <a href="https://proplogai.com/dashboard/support" style="display:inline-block;padding:10px 24px;background:linear-gradient(120deg,#a78bfa,#22d3ee);color:#08080f;font-weight:600;font-size:14px;border-radius:10px;text-decoration:none;">Open Support</a>
    </div>

    <div style="text-align:center;padding:20px 0 0;border-top:1px solid rgba(255,255,255,0.06);">
      <p style="margin:0;font-size:11px;color:#555;">This is a copy of your support ticket conversation. No further action is needed.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: toEmail, subject: subjectLine, html });
}

/* ── Ticket Resolved Email ────────────────────────────────── */

export async function sendTicketResolvedEmail(toEmail, ticket) {
  if (!toEmail) return { ok: false, error: 'No email address.' };

  const ticketNum = ticket.ticket_number ? `#${String(ticket.ticket_number).padStart(3, '0')}` : '';
  const subjectLine = `Ticket ${ticketNum} Resolved: ${ticket.subject}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#07070b;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:24px;font-weight:700;background:linear-gradient(120deg,#a78bfa,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">PropLogAI</span>
    </div>

    <div style="background:#12121a;border:1px solid rgba(52,211,153,0.2);border-radius:16px;padding:24px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
        <span style="font-size:20px;">✔️</span>
        <h1 style="margin:0;font-size:18px;color:#34d399;">Ticket Resolved</h1>
      </div>
      <div style="margin-bottom:8px;">
        <span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;">Ticket</span>
        <p style="margin:4px 0 0;font-size:15px;color:#f0f0f0;font-weight:600;">${ticketNum} ${escHtml(ticket.subject)}</p>
      </div>
      <p style="margin:16px 0 0;font-size:14px;color:#d0d0d0;line-height:1.6;">Your support ticket has been marked as resolved by our team. If you believe the issue is not fully resolved, you can re-open this ticket by replying to it in your dashboard.</p>
    </div>

    <div style="background:#12121a;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;margin-bottom:20px;">
      <h2 style="margin:0 0 12px;font-size:15px;color:#f0f0f0;">What happens next?</h2>
      <ul style="margin:0;padding-left:20px;font-size:14px;color:#d0d0d0;line-height:1.8;">
        <li><strong style="color:#a78bfa;">Re-open:</strong> Reply to your ticket in the dashboard to re-open it if you need further help.</li>
        <li><strong style="color:#fbbf24;">Auto-delete:</strong> If no action is taken, this ticket will be automatically deleted in <strong>7 days</strong>.</li>
        <li><strong style="color:#22d3ee;">New ticket:</strong> You can also create a new ticket for a different issue.</li>
      </ul>
    </div>

    <div style="text-align:center;padding:16px 0;">
      <a href="https://proplogai.com/dashboard/support" style="display:inline-block;padding:10px 24px;background:linear-gradient(120deg,#a78bfa,#22d3ee);color:#08080f;font-weight:600;font-size:14px;border-radius:10px;text-decoration:none;">Open My Tickets</a>
    </div>

    <div style="text-align:center;padding:20px 0 0;border-top:1px solid rgba(255,255,255,0.06);">
      <p style="margin:0;font-size:11px;color:#555;">PropLogAI Support — This is an automated message.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: toEmail, subject: subjectLine, html });
}

export function buildCoachReportEmail(report, stats) {
  const headline = escHtml(report.headline) || 'Your Weekly Trading Report';
  const mistakes = Array.isArray(report.recurring_mistakes) ? report.recurring_mistakes : [];
  const psychology = report.psychology || {};
  const insights = Array.isArray(psychology.insights) ? psychology.insights : [];
  const guardrails = Array.isArray(psychology.guardrails) ? psychology.guardrails : [];

  const mistakeRows = mistakes.map((m) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #222;color:#f0f0f0;">${escHtml(m.pattern)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #222;color:${m.severity === 'critical' ? '#f87171' : m.severity === 'high' ? '#fb923c' : '#fbbf24'};">${escHtml(m.severity)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #222;color:#a0a0a0;">${escHtml(m.frequency)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #222;color:#a0a0a0;">${escHtml(m.fix)}</td>
    </tr>
  `).join('');

  const insightRows = insights.map((i) => `
    <li style="margin-bottom:6px;color:#d0d0d0;">
      <strong style="color:#a78bfa;">${escHtml(i.emotion)}</strong>: ${escHtml(i.stat)} — ${escHtml(i.observation)}
    </li>
  `).join('');

  const guardrailRows = guardrails.map((g) => `
    <li style="margin-bottom:4px;color:#22d3ee;">${escHtml(g)}</li>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#07070b;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:24px;font-weight:700;background:linear-gradient(120deg,#a78bfa,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">PropLogAI</span>
    </div>

    <div style="background:#12121a;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;margin-bottom:20px;">
      <h1 style="margin:0 0 8px;font-size:20px;color:#f0f0f0;">✦ AI Coach Report</h1>
      <p style="margin:0;font-size:15px;color:#d0d0d0;line-height:1.5;">${headline}</p>
      ${stats ? `
      <div style="margin-top:16px;display:flex;gap:12px;">
        <div style="background:#0b0b14;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px 16px;flex:1;text-align:center;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;">Trades</div>
          <div style="font-size:22px;font-weight:700;color:#f0f0f0;margin-top:4px;">${stats.trades || 0}</div>
        </div>
        <div style="background:#0b0b14;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px 16px;flex:1;text-align:center;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;">Win Rate</div>
          <div style="font-size:22px;font-weight:700;color:#f0f0f0;margin-top:4px;">${stats.winRate || 0}%</div>
        </div>
        <div style="background:#0b0b14;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px 16px;flex:1;text-align:center;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;">Net P&L</div>
          <div style="font-size:22px;font-weight:700;color:${(stats.net || 0) >= 0 ? '#34d399' : '#f87171'};margin-top:4px;">${(stats.net || 0) >= 0 ? '+' : ''}$${Math.abs(stats.net || 0).toFixed(2)}</div>
        </div>
      </div>
      ` : ''}
    </div>

    ${mistakes.length > 0 ? `
    <div style="background:#12121a;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;margin-bottom:20px;">
      <h2 style="margin:0 0 12px;font-size:16px;color:#f0f0f0;">Recurring Mistakes</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr>
          <th style="padding:8px 12px;border-bottom:1px solid #333;text-align:left;color:#888;font-weight:600;">Pattern</th>
          <th style="padding:8px 12px;border-bottom:1px solid #333;text-align:left;color:#888;font-weight:600;">Severity</th>
          <th style="padding:8px 12px;border-bottom:1px solid #333;text-align:left;color:#888;font-weight:600;">Frequency</th>
          <th style="padding:8px 12px;border-bottom:1px solid #333;text-align:left;color:#888;font-weight:600;">Fix</th>
        </tr>
        ${mistakeRows}
      </table>
    </div>
    ` : ''}

    ${escHtml(psychology.summary) || insights.length > 0 ? `
    <div style="background:#12121a;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;margin-bottom:20px;">
      <h2 style="margin:0 0 12px;font-size:16px;color:#f0f0f0;">Psychology</h2>
      ${psychology.summary ? `<p style="margin:0 0 12px;font-size:14px;color:#d0d0d0;line-height:1.5;">${escHtml(psychology.summary)}</p>` : ''}
      ${insights.length > 0 ? `<ul style="margin:0;padding-left:20px;">${insightRows}</ul>` : ''}
      ${guardrails.length > 0 ? `
      <div style="margin-top:16px;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px;">Guardrails</div>
        <ul style="margin:0;padding-left:20px;">${guardrailRows}</ul>
      </div>
      ` : ''}
    </div>
    ` : ''}

    <div style="text-align:center;padding:16px 0;">
      <a href="https://proplogai.com/dashboard/coach" style="display:inline-block;padding:10px 24px;background:linear-gradient(120deg,#a78bfa,#22d3ee);color:#08080f;font-weight:600;font-size:14px;border-radius:10px;text-decoration:none;">View Full Report</a>
    </div>

    <div style="text-align:center;padding:20px 0 0;border-top:1px solid rgba(255,255,255,0.06);">
      <p style="margin:0;font-size:11px;color:#555;">PropLogAI is an educational tool and does not provide financial advice.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
