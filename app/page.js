import { createClient } from '@/lib/supabase/server';
import Logo from '@/components/Logo';
import LandingNav from '@/components/landing/LandingNav';
import CookieBanner from '@/components/landing/CookieBanner';
import LandingFooter from '@/components/landing/LandingFooter';
import DeferredMotion from '@/components/landing/DeferredMotion';
import HeroSection from '@/components/landing/sections/HeroSection';
import TrustStripSection from '@/components/landing/sections/TrustStripSection';
import ProblemSection from '@/components/landing/sections/ProblemSection';
import CoreStorySection from '@/components/landing/sections/CoreStorySection';
import DisciplineScoreSection from '@/components/landing/sections/DisciplineScoreSection';
import RulebookSection from '@/components/landing/sections/RulebookSection';
import AICoachSection from '@/components/landing/sections/AICoachSection';
import AnalyticsSection from '@/components/landing/sections/AnalyticsSection';
import ChaosClaritySection from '@/components/landing/sections/ChaosClaritySection';
import TraderJourneySection from '@/components/landing/sections/TraderJourneySection';
import ProgressionSection from '@/components/landing/sections/ProgressionSection';
import FeaturesSection from '@/components/landing/sections/FeaturesSection';
import ShowcaseSection from '@/components/landing/sections/ShowcaseSection';
import DifferentiationSection from '@/components/landing/sections/DifferentiationSection';
import TraderTypesSection from '@/components/landing/sections/TraderTypesSection';
import TestimonialsSection from '@/components/landing/sections/TestimonialsSection';
import FAQSection from '@/components/landing/sections/FAQSection';
import PricingSection from '@/components/landing/sections/PricingSection';
import FinalCTASection from '@/components/landing/sections/FinalCTASection';

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

      {/* One continuous journey: a trade enters, intelligence emerges, the trader improves */}
      <HeroSection betaCount={betaCount} />
      <TrustStripSection />
      <ProblemSection />
      <CoreStorySection />
      <DisciplineScoreSection />
      <RulebookSection />
      <AICoachSection />
      <AnalyticsSection />
      <ChaosClaritySection />
      <TraderJourneySection />
      <ProgressionSection />
      <FeaturesSection />
      <ShowcaseSection />
      <DifferentiationSection />
      <TraderTypesSection />
      <TestimonialsSection />
      <FAQSection />
      <PricingSection />
      <FinalCTASection betaCount={betaCount} />

      <LandingFooter />

      <CookieBanner />
    </main>
  );
}
