import Logo from '@/components/Logo';
import LandingNav from '@/components/landing/LandingNav';
import CookieBanner from '@/components/landing/CookieBanner';
import LandingFooter from '@/components/landing/LandingFooter';
import DeferredMotion from '@/components/landing/DeferredMotion';
import HeroSection from '@/components/landing/sections/HeroSection';
import ThirtyDaySystemSection from '@/components/landing/sections/ThirtyDaySystemSection';
import PainSection from '@/components/landing/sections/PainSection';
import SolutionSection from '@/components/landing/sections/SolutionSection';
import ShowcaseSection from '@/components/landing/sections/ShowcaseSection';
import FeaturesSection from '@/components/landing/sections/FeaturesSection';
import PricingSection from '@/components/landing/sections/PricingSection';
import BottomSection from '@/components/landing/sections/BottomSection';

export const revalidate = 300;

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <DeferredMotion />

      {/* Nav */}
      <LandingNav logo={<Logo size={32} rounded="rounded-lg" glow wordmarkClassName="font-display text-lg font-bold tracking-tight" />} />

      <HeroSection />
      <ThirtyDaySystemSection />
      <PainSection />
      <SolutionSection />
      <ShowcaseSection />
      <FeaturesSection />
      <PricingSection />
      <BottomSection />

      <LandingFooter />

      <CookieBanner />
    </main>
  );
}
