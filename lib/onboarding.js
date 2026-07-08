/**
 * Server-side helper to compute onboarding checklist progress.
 * 5 core milestones that "train your AI coach."
 */
export async function getOnboardingProgress(supabase, userId) {
  const [
    { count: tradeCount },
    { count: journalCount },
    { count: customSetupCount },
    { count: analysisCount },
    { data: prefs },
  ] = await Promise.all([
    supabase.from('trades').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('setups').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_default', false),
    supabase.from('ai_insights').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('type', 'trade_analysis'),
    supabase.from('user_preferences').select('avatar_url, full_name, share_code, show_calendar, show_trades, show_payouts, show_trophies').eq('user_id', userId).maybeSingle(),
  ]);

  const hasProfile = !!(prefs && (prefs.avatar_url || prefs.full_name) && prefs.share_code);

  const milestones = [
    {
      id: 'trade',
      title: 'Log your first trade',
      desc: 'Your AI coach has no trading history yet. Log a trade so it can start learning your patterns.',
      celebration: 'Your AI learned its first trading pattern.',
      time: '30 sec',
      reward: 'Unlocks Journal',
      icon: '📊',
      href: '/dashboard/trades/new',
      done: (tradeCount || 0) > 0,
    },
    {
      id: 'journal',
      title: 'Teach your AI your emotions',
      desc: 'Your AI cannot understand your psychology without notes. Tag emotions and add what happened.',
      celebration: 'Your AI is now learning your trading psychology.',
      time: '45 sec',
      reward: 'Unlocks AI Analysis',
      icon: '📝',
      href: '/dashboard',
      done: (journalCount || 0) > 0,
    },
    {
      id: 'setup',
      title: 'Create your first trading rule',
      desc: 'Your AI doesn\'t know your strategy yet. Tell it how you normally trade — Breakout, ICT, Scalping, Swing, or your own style.',
      celebration: 'Your AI now understands your trading strategy.',
      time: '20 sec',
      reward: 'Unlocks Discipline Tracking',
      icon: '📖',
      href: '/dashboard/rulebook',
      done: (customSetupCount || 0) > 0,
    },
    {
      id: 'analysis',
      title: 'Get your first AI coaching report',
      desc: 'Click "Analyze" on any trade. Your AI coach will grade your execution and find what to improve.',
      celebration: 'Your AI coach just delivered its first insight.',
      time: '15 sec',
      reward: 'Unlocks AI Coach',
      icon: '🤖',
      href: '/dashboard',
      done: (analysisCount || 0) > 0,
    },
    {
      id: 'profile',
      title: 'Personalize your AI Coach',
      desc: 'Add your name and avatar so your reports and share cards feel personal.',
      celebration: 'Your AI coach is fully personalized.',
      time: '1 min',
      reward: 'Unlocks Public Profile',
      icon: '👤',
      href: '/dashboard/settings',
      done: hasProfile,
    },
  ];

  const completed = milestones.filter((m) => m.done).length;

  return { milestones, completed, total: milestones.length };
}
