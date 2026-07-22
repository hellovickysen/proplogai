import ToolCard from '@/components/tools/ToolCard';

export const metadata = { title: 'Tools | PropLogAI' };

const TOOLS = [
  {
    title: 'Prop Test Pass Probability',
    subtitle:
      'Find out your realistic probability of passing a prop firm challenge based on your real trading data',
    icon: '🎯',
    href: '/dashboard/tools/probability-analyzer',
    color: 'linear-gradient(120deg, #a78bfa, #22d3ee)',
    tag: 'Free',
  },
  {
    title: 'Consistency Calculator',
    subtitle:
      'Check if your largest winning trade satisfies the consistency rule before requesting a payout',
    icon: '📐',
    href: '/dashboard/tools/consistency-calculator',
    color: 'linear-gradient(120deg, #a78bfa, #22d3ee)',
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="font-display text-2xl font-bold text-white md:text-3xl">
            Tools
          </h1>
          <p className="mt-2 text-sm text-white/55 md:text-base">
            Prop firm calculators &amp; utilities
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.href} {...tool} />
          ))}
        </div>
      </div>
    </div>
  );
}
