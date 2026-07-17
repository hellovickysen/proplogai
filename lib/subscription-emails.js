/**
 * Subscription lifecycle email templates for PropLogAI.
 *
 * Exports builder functions that return { subject, html } for Resend.
 * All user-facing content is HTML-escaped.
 */

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function wrap(title, body) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#07070b;color:#e5e5e5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
<div style="text-align:center;margin-bottom:32px;">
<span style="font-size:20px;font-weight:700;background:linear-gradient(120deg,#a78bfa,#22d3ee);-webkit-background-clip:text;background-clip:text;color:transparent;">PropLogAI</span>
</div>
<h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 16px;">${esc(title)}</h1>
${body}
<div style="margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);text-align:center;">
<p style="font-size:12px;color:rgba(255,255,255,0.3);margin:0;">PropLogAI — AI Trading Performance Coach</p>
<p style="font-size:11px;color:rgba(255,255,255,0.2);margin:4px 0 0;">This is a transactional email about your subscription.</p>
</div>
</div>
</body>
</html>`;
}

const btnStyle = 'display:inline-block;padding:12px 28px;background:linear-gradient(120deg,#a78bfa,#22d3ee);color:#08080f;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;';

/**
 * Trial ending reminder (sent 3 days before trial ends).
 */
export function buildTrialEndingEmail({ trialEndsAt }) {
  const endDate = new Date(trialEndsAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const body = `
<p style="font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 20px;">
Your 14-day free trial ends on <strong style="color:#fff;">${esc(endDate)}</strong>.
</p>
<p style="font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 24px;">
After that, your plan will switch to Basic and you'll lose access to unlimited AI coaching, calendar insights, CSV exports, and other Elite features.
</p>
<p style="font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 24px;">
If you're finding PropLogAI helpful, no action is needed — your subscription will start automatically at $9.99/mo.
</p>
<p style="font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 24px;">
If you'd rather not continue, you can cancel anytime from <strong>Settings → Billing</strong>.
</p>
<div style="text-align:center;margin:32px 0;">
<a href="https://proplogai.com/dashboard/settings?tab=billing" style="${btnStyle}">Manage subscription</a>
</div>`;
  return {
    subject: 'Your PropLogAI trial ends in 3 days',
    html: wrap('Your trial is ending soon', body),
  };
}

/**
 * Payment receipt (sent after each successful charge).
 */
export function buildPaymentReceiptEmail({ amount, billingCycle, nextBillingDate }) {
  const fmtAmount = typeof amount === 'number' ? `$${(amount / 100).toFixed(2)}` : amount;
  const nextDate = nextBillingDate ? new Date(nextBillingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null;
  const body = `
<p style="font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 20px;">
Your Elite subscription payment of <strong style="color:#34d399;">${esc(fmtAmount)}</strong> was successful.
</p>
<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px;margin:0 0 24px;">
<table style="width:100%;font-size:14px;color:rgba(255,255,255,0.6);">
<tr><td style="padding:4px 0;">Plan</td><td style="padding:4px 0;text-align:right;color:#fff;">Elite (${esc(billingCycle)})</td></tr>
<tr><td style="padding:4px 0;">Amount</td><td style="padding:4px 0;text-align:right;color:#34d399;">${esc(fmtAmount)}</td></tr>
${nextDate ? `<tr><td style="padding:4px 0;">Next billing</td><td style="padding:4px 0;text-align:right;color:#fff;">${esc(nextDate)}</td></tr>` : ''}
</table>
</div>
<p style="font-size:14px;color:rgba(255,255,255,0.5);margin:0;">
Thank you for being an Elite trader. Keep journaling, keep improving.
</p>`;
  return {
    subject: 'Payment received — PropLogAI Elite',
    html: wrap('Payment confirmed', body),
  };
}

/**
 * Cancellation confirmation.
 */
export function buildCancellationEmail({ accessUntil }) {
  const endDate = accessUntil ? new Date(accessUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'the end of your billing period';
  const body = `
<p style="font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 20px;">
Your Elite subscription has been cancelled.
</p>
<p style="font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 24px;">
You'll keep full Elite access until <strong style="color:#fff;">${esc(endDate)}</strong>. After that, your account moves to the Basic plan.
</p>
<p style="font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 24px;">
Changed your mind? You can resubscribe anytime from Settings → Billing.
</p>
<div style="text-align:center;margin:32px 0;">
<a href="https://proplogai.com/dashboard/settings?tab=billing" style="${btnStyle}">Resubscribe</a>
</div>`;
  return {
    subject: 'Subscription cancelled — PropLogAI',
    html: wrap('Subscription cancelled', body),
  };
}

/**
 * Payment failed notice.
 */
export function buildPaymentFailedEmail({ errorMessage }) {
  const body = `
<p style="font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 20px;">
We weren't able to process your Elite subscription payment.
</p>
${errorMessage ? `<p style="font-size:14px;color:rgba(248,113,113,0.8);margin:0 0 20px;">Error: ${esc(errorMessage)}</p>` : ''}
<p style="font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 24px;">
We'll retry the payment automatically. If the issue persists, please update your payment method to avoid losing Elite access.
</p>
<div style="text-align:center;margin:32px 0;">
<a href="https://proplogai.com/dashboard/settings?tab=billing" style="${btnStyle}">Update payment</a>
</div>`;
  return {
    subject: 'Payment failed — PropLogAI Elite',
    html: wrap('Payment failed', body),
  };
}

/**
 * Affiliate approval notification. Sent when an admin approves a partner
 * application. Affiliates log into the portal with their existing PropLogAI
 * account — no password reset is performed.
 */
export function buildAffiliateApprovedEmail({ name, referralUsername, commissionPct } = {}) {
  const greeting = name ? `Hi ${esc(name.split(' ')[0])},` : 'Hi there,';
  const pct = Number.isFinite(commissionPct) ? commissionPct : 40;
  const link = referralUsername ? `https://proplogai.com/ref/${esc(referralUsername)}` : null;
  const body = `
<p style="font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 16px;">${greeting}</p>
<p style="font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 20px;">
Great news — your PropLogAI partner application has been <strong style="color:#34d399;">approved</strong>! You'll earn
<strong style="color:#fff;">${esc(String(pct))}% lifetime recurring commission</strong> on every trader you refer.
</p>
<p style="font-size:15px;color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 20px;">
Log in to your partner portal with your existing PropLogAI email and password to grab your referral link and coupon, and to track clicks, referrals, and earnings.
</p>
${link ? `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px 20px;margin:0 0 24px;">
<p style="font-size:12px;color:rgba(255,255,255,0.45);margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Your referral link</p>
<p style="font-size:14px;color:#22d3ee;margin:0;word-break:break-all;">${link}</p>
</div>` : ''}
<div style="text-align:center;margin:32px 0;">
<a href="https://partner.proplogai.com/dashboard" style="${btnStyle}">Open partner portal</a>
</div>
<p style="font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;margin:0;">
Tip: you already have a login — it's the same email and password you use for PropLogAI. If you ever forget it, use "Forgot password" on the login page.
</p>`;
  return {
    subject: "You're approved — welcome to the PropLogAI Partner Program 🎉",
    html: wrap("You're approved!", body),
  };
}
