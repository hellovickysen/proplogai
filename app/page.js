import { createClient } from '@/lib/supabase/server';
import Logo from '@/components/Logo';
import LandingNav from '@/components/landing/LandingNav';
import CookieBanner from '@/components/landing/CookieBanner';
import LandingFooter from '@/components/landing/LandingFooter';
import DeferredMotion from '@/components/landing/DeferredMotion';
import HeroSection from '@/components/landing/sections/HeroSection';
import ProblemSection from '@/components/landing/sections/ProblemSection';
import ShiftSection from '@/components/landing/sections/ShiftSection';
import EvidenceSection from '@/components/landing/sections/EvidenceSection';
import PhilosophySection from '@/components/landing/sections/PhilosophySection';
import FeaturesSection from '@/components/landing/sections/FeaturesSection';
import PricingSection from '@/components/landing/sections/PricingSection';
import BottomSection from '@/components/landing/sections/BottomSection';

export const revalidate = 300;

export default async function Home() {
  let betaCount = 15;
  try {
    const supabase = createClient();
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'beta_count').maybeSingle();
    if (data && data.value) betaCount = parseInt(data.value, 10) || 15;
  } catch (e) {}

  return (
    <main className="min-h-screen overflow-hidden">
      <DeferredMotion />

      {/* Nav */}
      <LandingNav logo={<Logo size={32} rounded="rounded-lg" glow wordmarkClassName="font-display text-lg font-bold tracking-tight" />} />

      {/* One continuous story */}
      <HeroSection betaCount={betaCount} />
      <ProblemSection />
      <ShiftSection />
      <EvidenceSection />
      <PhilosophySection />
      <FeaturesSection />
      <PricingSection />
      <BottomSection betaCount={betaCount} />

      <LandingFooter />

      <CookieBanner />
    </main>
  );
}
