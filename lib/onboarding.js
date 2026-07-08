/**
 * Server-side helper to compute onboarding checklist progress.
 * Queries multiple tables in parallel to check milestone completion.
 */
export async function getOnboardingProgress(supabase, userId) {
  const [
    { count: tradeCount },
    { count: journalCount },
    { count: analysisCount },
    { count: coachCount },
    { count: expenseCount },
    { count: payoutCount },
    { count: trophyCount },
    { data: prefs },
  ] = await Promise.all([
    supabase.from('trades').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('ai_insights').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('type', 'trade_analysis'),
    supabase.from('ai_insights').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('type', 'coach_report'),
    supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('payouts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('trophies').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('user_preferences').select('avatar_url, share_code, show_calendar, show_trades, show_payouts, show_trophies').eq('user_id', userId).maybeSingle(),
  ]);

  const hasProfile = !!(prefs && prefs.share_code && (prefs.show_calendar || prefs.show_trades || prefs.show_payouts || prefs.show_trophies));
  const hasAvatar = !!(prefs && prefs.avatar_url);

  const milestones = [
    { id: 'trade', title: 'Log your first trade', desc: 'Enter a pair, direction, and P&L to get started.', href: '/dashboard', done: (tradeCount || 0) > 0, icon: '📊' },
    { id: 'journal', title: 'Write a journal entry', desc: 'Add emotions, notes, and a screenshot to any trade.', href: '/dashboard', done: (journalCount || 0) > 0, icon: '📝' },
    { id: 'analysis', title: 'Get your first AI analysis', desc: 'Click "Analyze" on any trade for instant feedback.', href: '/dashboard', done: (analysisCount || 0) > 0, icon: '✦' },
    { id: 'coach', title: 'Generate a coach report', desc: 'Open the AI Coach to get your full performance review.', href: '/dashboard/coach', done: (coachCount || 0) > 0, icon: '🧠' },
    { id: 'expense', title: 'Track a prop firm expense', desc: 'Log a challenge fee, renewal, or payout.', href: '/dashboard/expenses', done: (expenseCount || 0) > 0 || (payoutCount || 0) > 0, icon: '💰' },
    { id: 'trophy', title: 'Upload a trophy', desc: 'Celebrate a funded account, payout, or milestone.', href: '/dashboard/trophies', done: (trophyCount || 0) > 0, icon: '🏆' },
    { id: 'profile', title: 'Set up your public profile', desc: 'Toggle what to share and get your unique profile link.', href: '/dashboard/settings', done: hasProfile, icon: '👤' },
    { id: 'avatar', title: 'Upload your avatar', desc: 'Add a profile picture to personalize your account.', href: '/dashboard/settings', done: hasAvatar, icon: '📷' },
  ];

  const completed = milestones.filter((m) => m.done).length;

  return { milestones, completed, total: milestones.length };
}
