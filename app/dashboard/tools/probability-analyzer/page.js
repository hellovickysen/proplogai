import { createClient } from '@/lib/supabase/server';
import AnalyzerPage from './AnalyzerPage';

export const metadata = {
  title: 'Prop Test Pass Probability | PropLogAI',
  description:
    'Calculate your probability of passing a prop firm challenge using Monte Carlo simulation on your real trading history.',
};

export default async function ProbabilityAnalyzerPage() {
  let isLoggedIn = false;
  let tradeCount = 0;
  let userId = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      isLoggedIn = true;
      userId = user.id;

      // Count closed trades
      const { count } = await supabase
        .from('trades')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      tradeCount = count || 0;
    }
  } catch {
    // Not logged in — continue as guest
  }

  return (
    <AnalyzerPage
      isLoggedIn={isLoggedIn}
      tradeCount={tradeCount}
      userId={userId}
    />
  );
}
