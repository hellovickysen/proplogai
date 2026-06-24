import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { LogoMark } from '@/components/Logo';

export const dynamic = 'force-dynamic';

const CATEGORY_LABELS = {
  payout: 'Payout Certificate',
  challenge_pass: 'Challenge Pass',
  funded: 'Funded Account',
  other: 'Achievement',
};

export default async function PublicTrophyPage({ params }) {
  const shareId = params.id;
  const supabase = createClient();

  const { data: trophy } = await supabase
    .from('trophies')
    .select('*')
    .eq('share_id', shareId)
    .eq('is_public', true)
    .maybeSingle();

  if (!trophy) notFound();

  const catLabel = CATEGORY_LABELS[trophy.category] || 'Achievement';

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <LogoMark size={56} rounded="rounded-2xl" glow className="mx-auto mb-5" />
          <div className="mb-3 inline-block rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 font-mono text-xs uppercase tracking-wider text-white/50">
            {catLabel}
          </div>
          <h1 className="font-display text-3xl font-bold">{trophy.title}</h1>
          {trophy.description && (
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/60">{trophy.description}</p>
          )}
          <p className="mt-2 font-mono text-xs text-white/30">
            {new Date(trophy.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Image */}
        <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
          <img src={trophy.file_url} alt={trophy.title} className="w-full" />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="font-mono text-xs text-white/30">Shared via PropLogAI</p>
          <Link href="/" className="mt-2 inline-block font-mono text-xs text-cyan-400 hover:underline">
            proplogai.com
          </Link>
        </div>
      </div>
    </div>
  );
}
