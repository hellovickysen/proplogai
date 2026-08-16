import dynamic from 'next/dynamic';
import Logo from '@/components/Logo';
import LandingNav from '@/components/landing/LandingNav';
import CookieBanner from '@/components/landing/CookieBanner';
import LandingFooter from '@/components/landing/LandingFooter';
import DeferredMotion from '@/components/landing/DeferredMotion';
import HeroSection from '@/components/landing/sections/HeroSection';
import {
  ProblemSection,
  InvisibleLoopSection,
  TradeLoggerSection,
  PatternDetectorSection,
  BlindSpotSection,
} from '@/components/landing/sections/sections-story1';
import {
  DashboardSection,
  DisciplineSection,
  RulebookSection,
  PnLCalendarSection,
  PropJourneySection,
  ROIFlowSection,
} from '@/components/landing/sections/sections-story2';
import {
  VerifiedTraderSection,
  FeatureConstellationSection,
  ManualLoggingSection,
  TransformationSection,
  FinalCTASection,
} from '@/components/landing/sections/sections-story3';
import PricingSection from '@/components/landing/sections/PricingSection';

// Motion + depth layers — lazy, off the critical LCP path
const LandingParticles = dynamic(() => import('@/components/landing/LandingParticles'), { ssr: false });
const ParallaxDepth = dynamic(() => import('@/components/landing/ParallaxDepth'), { ssr: false });
const LandingMotionLayer = dynamic(() => import('@/components/landing/LandingMotionLayer'), { ssr: false });
const PathField = dynamic(() => import('@/components/landing/PathField'), { ssr: false });

export const revalidate = 300;

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050507]">
      <DeferredMotion />
      <LandingMotionLayer />
      <ParallaxDepth />
      <PathField />
      <LandingParticles />

      {/* Nav */}
      <LandingNav logo={<Logo size={32} rounded="rounded-lg" glow wordmarkClassName="font-display text-lg font-bold tracking-tight" />} />

      {/* Content above the fixed path/particle/depth layers */}
      <div className="relative z-10">
        <HeroSection />
        <ProblemSection />
        <InvisibleLoopSection />
        <TradeLoggerSection />
        <PatternDetectorSection />
        <BlindSpotSection />
        <DashboardSection />
        <DisciplineSection />
        <RulebookSection />
        <PnLCalendarSection />
        <PropJourneySection />
        <ROIFlowSection />
        <VerifiedTraderSection />
        <FeatureConstellationSection />
        <ManualLoggingSection />
        <TransformationSection />
        <PricingSection />
        <FinalCTASection />
      </div>

      <LandingFooter />
      <CookieBanner />
    </main>
  );
}
