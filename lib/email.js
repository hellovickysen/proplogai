/**
 * Email module — sends emails via Resend.
 * Requires RESEND_API_KEY env var.
 * Falls back gracefully if not configured.
 */

const RESEND_URL = 'https://api.resend.com/emails';

export function isEmailConfigured() {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Send an email via Resend API (no npm package needed — uses fetch).
 * @param {{ to: string, subject: string, html: string }} params
 * @returns {{ ok: boolean, error?: string, id?: string }}
 */
export async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { ok: false, error: 'Email is not configured (missing RESEND_API_KEY).' };
  }

  const from = process.env.RESEND_FROM || 'PropJournal <noreply@propjournal.app>';

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

/**
 * Build the HTML email for a coach report.
 */
export function buildCoachReportEmail(report, stats) {
  const headline = report.headline || 'Your Weekly Trading Report';
  const mistakes = Array.isArray(report.recurring_mistakes) ? report.recurring_mistakes : [];
  const psychology = report.psychology || {};
  const insights = Array.isArray(psychology.insights) ? psychology.insights : [];
  const guardrails = Array.isArray(psychology.guardrails) ? psychology.guardrails : [];

  const mistakeRows = mistakes.map((m) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #222;color:#f0f0f0;">${m.pattern || ''}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #222;color:${m.severity === 'critical' ? '#f87171' : m.severity === 'high' ? '#fb923c' : '#fbbf24'};">${m.severity || ''}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #222;color:#a0a0a0;">${m.frequency || ''}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #222;color:#a0a0a0;">${m.fix || ''}</td>
    </tr>
  `).join('');

  const insightRows = insights.map((i) => `
    <li style="margin-bottom:6px;color:#d0d0d0;">
      <strong style="color:#a78bfa;">${i.emotion || ''}</strong>: ${i.stat || ''} — ${i.observation || ''}
    </li>
  `).join('');

  const guardrailRows = guardrails.map((g) => `
    <li style="margin-bottom:4px;color:#22d3ee;">✓ ${g}</li>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#07070b;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:24px;font-weight:700;background:linear-gradient(120deg,#a78bfa,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">PropJournal</span>
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

    ${psychology.summary || insights.length > 0 ? `
    <div style="background:#12121a;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;margin-bottom:20px;">
      <h2 style="margin:0 0 12px;font-size:16px;color:#f0f0f0;">Psychology</h2>
      ${psychology.summary ? `<p style="margin:0 0 12px;font-size:14px;color:#d0d0d0;line-height:1.5;">${psychology.summary}</p>` : ''}
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
      <a href="https://pipmind-sigma.vercel.app/dashboard/coach" style="display:inline-block;padding:10px 24px;background:linear-gradient(120deg,#a78bfa,#22d3ee);color:#08080f;font-weight:600;font-size:14px;border-radius:10px;text-decoration:none;">View Full Report</a>
    </div>

    <div style="text-align:center;padding:20px 0 0;border-top:1px solid rgba(255,255,255,0.06);">
      <p style="margin:0;font-size:11px;color:#555;">PropJournal is an educational tool and does not provide financial advice.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
