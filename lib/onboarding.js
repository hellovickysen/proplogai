/**
 * Server-side helper to compute onboarding checklist progress.
 * 4 core steps that "train your AI coach" + 1 bonus step.
 */
export async function getOnboardingProgress(supabase, userId) {
  const [
    { count: customSetupCount },
    { count: tradeCount },
    { count: journalCount },
    { count: analysisCount },
    { data: prefs },
  ] = await Promise.all([
    supabase.from('setups').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_default', false),
    supabase.from('trades').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('ai_insights').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('type', 'trade_analysis'),
    supabase.from('user_preferences').select('avatar_url, full_name, share_code').eq('user_id', userId).maybeSingle(),
  ]);

  const hasProfile = !!(prefs && (prefs.avatar_url || prefs.full_name) && prefs.share_code);

  const milestones = [
    {
      id: 'setup',
      title: 'Teach your AI how you trade',
      desc: 'Add your first setup so your AI understands what "following your plan" means.',
      celebration: 'Your AI now understands your trading strategy.',
      time: '20 sec',
      reward: 'Unlocks Rulebook + Setup Compliance',
      icon: '📖',
      href: '/dashboard/rulebook',
      done: (customSetupCount || 0) > 0,
    },
    {
      id: 'trade',
      title: 'Log your first trade',
      desc: 'Record your first trade so your AI has real trading data to analyze.',
      celebration: 'Your AI learned its first trading pattern.',
      time: '30 sec',
      reward: 'Unlocks Trade Journal',
      icon: '📊',
      href: '/dashboard/trades/new',
      done: (tradeCount || 0) > 0,
    },
    {
      id: 'journal',
      title: 'Tell the story behind your trade',
      desc: 'Add chart, emotion, notes, and lesson learned. This is how your AI understands your psychology — not just your results.',
      celebration: 'Your AI is now learning your trading psychology.',
      time: '45 sec',
      reward: 'Unlocks AI Analysis',
      icon: '📝',
      href: '/dashboard',
      done: (journalCount || 0) > 0,
    },
    {
      id: 'analysis',
      title: 'Meet your AI Coach',
      desc: 'See what your AI discovered from your first trade. It will identify strengths, mistakes, emotional patterns, and one habit to improve.',
      celebration: 'Your AI coach just delivered its first insight.',
      time: '15 sec',
      reward: 'Unlocks AI Coach',
      icon: '🤖',
      href: '/dashboard',
      done: (analysisCount || 0) > 0,
    },
    {
      id: 'celebrate',
      title: 'Celebrate your first trading day',
      desc: 'Create your personalized trading card and share your progress. Your AI-generated statistics are included automatically.',
      celebration: 'You shared your first trading day!',
      time: '30 sec',
      reward: 'First Share Badge',
      icon: '🎁',
      href: '/dashboard',
      done: hasProfile,
      bonus: true,
    },
  ];

  const coreCompleted = milestones.filter((m) => m.done && !m.bonus).length;
  const coreTotal = milestones.filter((m) => !m.bonus).length;
  const completed = milestones.filter((m) => m.done).length;

  return { milestones, completed, total: milestones.length, coreCompleted, coreTotal };
}
