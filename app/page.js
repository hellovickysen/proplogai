import dynamic from 'next/dynamic';
import Logo from '@/components/Logo';
import LandingNav from '@/components/landing/LandingNav';
import CookieBanner from '@/components/landing/CookieBanner';
import LandingFooter from '@/components/landing/LandingFooter';
import DeferredMotion from '@/components/landing/DeferredMotion';
import HeroSection from '@/components/landing/sections/HeroSection';
import JourneySection from '@/components/landing/sections/JourneySection';
import LoopSection from '@/components/landing/sections/LoopSection';
import SystemSection from '@/components/landing/sections/SystemSection';
import ShowcaseSection from '@/components/landing/sections/ShowcaseSection';
import ShowcaseStrip from '@/components/landing/sections/ShowcaseStrip';
import FeaturesSection from '@/components/landing/sections/FeaturesSection';
import PricingSection from '@/components/landing/sections/PricingSection';
import BottomSection from '@/components/landing/sections/BottomSection';

// Full-page particle field — lazy, off the critical LCP path
const LandingParticles = dynamic(() => import('@/components/landing/LandingParticles'), { ssr: false });

export const revalidate = 300;

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <DeferredMotion />
      <LandingParticles />

      {/* Nav */}
      <LandingNav logo={<Logo size={32} rounded="rounded-lg" glow wordmarkClassName="font-display text-lg font-bold tracking-tight" />} />

      {/* Content sits above the fixed particle canvas */}
      <div className="relative z-10">
        <HeroSection />
        <JourneySection />
        <LoopSection />
        <SystemSection />
        <ShowcaseSection />
        <ShowcaseStrip />
        <FeaturesSection />
        <PricingSection />
        <BottomSection />
      </div>

      <LandingFooter />

      <CookieBanner />
    </main>
  );
}
