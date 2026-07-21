import ProbabilityAnalyzer from './ProbabilityAnalyzer';

export const metadata = {
  title: 'Prop Test Pass Probability Analyzer | PropLogAI',
  description:
    'Calculate your probability of passing a prop firm challenge using Monte Carlo simulation on your real trading history.',
};

export default function ProbabilityAnalyzerPage() {
  return <ProbabilityAnalyzer />;
}
