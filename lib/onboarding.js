/**
 * Server-side helper to compute onboarding checklist progress.
 * 4 core steps that "train your AI coach" + 1 bonus step.
 * Steps unlock sequentially — each requires the previous to be done.
 * Progress only counts steps that are done AND unlocked (not locked with stale data).
 */

const DEFAULT_SETUP_NAMES = [
  'Breakout', 'Pullback', 'Liquidity Sweep', 'Support / Resistance',
  'Trend Continuation', 'Reversal', 'Good SL', 'No Setup', 'Bad SL',
];

export async function getOnboardingProgress(supabase, userId) {
  const [
    { count: customSetupCount },
    { count: tradeCount },
    { count: journalCount },
    { count: analysisCount },
    { data: prefs },
    { data: recentTrade },
  ] = await Promise.all([
    supabase.from('setups').select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('name', 'in', '(' + DEFAULT_SETUP_NAMES.map(n => '"' + n + '"').join(',') + ')'),
    supabase.from('trades').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('ai_insights').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('type', 'trade_analysis'),
    supabase.from('user_preferences').select('avatar_url, full_name, share_code').eq('user_id', userId).maybeSingle(),
    // Fetch most recent trade ID for journal step linking
    supabase.from('trades').select('id').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  const hasProfile = !!(prefs && (prefs.avatar_url || prefs.full_name) && prefs.share_code);
  const recentTradeId = recentTrade?.id || null;

  const rawDone = [
    (customSetupCount || 0) > 0,
    (tradeCount || 0) > 0,
    (journalCount || 0) > 0,
    (analysisCount || 0) > 0,
    hasProfile,
  ];

  // Sequential unlock: each step requires all previous steps to be done
  // A step is only truly "done" if it AND all previous steps are done
  const sequentialDone = rawDone.map((done, i) => {
    if (!done) return false;
    // Check all previous steps are also done
    for (let j = 0; j < i; j++) {
      if (!rawDone[j]) return false;
    }
    return true;
  });

  const milestones = [
    {
      id: 'setup',
      step: 1,
      title: 'Teach your AI how you trade',
      desc: 'Add your first setup so your AI understands what "following your plan" means.',
      celebration: 'Your AI now understands your trading strategy.',
      time: '20 sec',
      reward: 'Unlocks Rulebook + Setup Compliance',
      href: '/dashboard/rulebook',
      done: sequentialDone[0],
      locked: false,
    },
    {
      id: 'trade',
      step: 2,
      title: 'Log your first trade',
      desc: 'Record your first trade so your AI has real trading data to analyze.',
      celebration: 'Your AI learned its first trading pattern.',
      time: '30 sec',
      reward: 'Unlocks Trade Journal',
      href: '/dashboard/trades/new',
      done: sequentialDone[1],
      locked: !sequentialDone[0],
    },
    {
      id: 'journal',
      step: 3,
      title: 'Tell the story behind your trade',
      desc: 'Add chart, emotion, notes, and lesson learned. This is how your AI understands your psychology — not just your results.',
      celebration: 'Your AI is now learning your trading psychology.',
      time: '45 sec',
      reward: 'Unlocks AI Analysis',
      // Link to most recent trade detail page for journal editing
      href: recentTradeId ? '/dashboard/trades/' + recentTradeId : '/dashboard',
      done: sequentialDone[2],
      locked: !sequentialDone[1],
    },
    {
      id: 'analysis',
      step: 4,
      title: 'Meet your AI Coach',
      desc: 'Open your trade and click "Analyze this trade." Your AI coach will grade your execution and find what to improve.',
      celebration: 'Your AI coach just delivered its first insight.',
      time: '15 sec',
      reward: 'Unlocks AI Coach',
      href: recentTradeId ? '/dashboard/trades/' + recentTradeId : '/dashboard/trades',
      done: sequentialDone[3],
      locked: !sequentialDone[2],
    },
    {
      id: 'celebrate',
      step: 5,
      title: 'Celebrate your first trading day',
      desc: 'Create your personalized trading card and share your progress. Your AI-generated statistics are included automatically.',
      celebration: 'You shared your first trading day!',
      time: '30 sec',
      reward: 'First Share Badge',
      href: '/dashboard',
      done: sequentialDone[4],
      locked: !sequentialDone[3],
      bonus: true,
    },
  ];

  const coreCompleted = milestones.filter((m) => m.done && !m.bonus).length;
  const coreTotal = milestones.filter((m) => !m.bonus).length;
  const completed = milestones.filter((m) => m.done).length;

  return { milestones, completed, total: milestones.length, coreCompleted, coreTotal };
}
