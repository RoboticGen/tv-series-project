import type { Metadata } from "next";
import { Marquee } from "@/shared/components/ui/marquee";
import { projectCategory } from "@/lib/db/schema";
import { getPointValues } from "@/features/gamification/services/queries";
import { CategoriesSection } from "@/features/landing/components/categories-section";
import { CtaSection } from "@/features/landing/components/cta-section";
import { HeroSection } from "@/features/landing/components/hero-section";
import { HowItWorksSection } from "@/features/landing/components/how-it-works-section";
import { LandingFooter } from "@/features/landing/components/landing-footer";
import { LandingHeader } from "@/features/landing/components/landing-header";
import { LevelsSection } from "@/features/landing/components/levels-section";
import { SafetySection } from "@/features/landing/components/safety-section";
import { CATEGORY_LABELS } from "@/features/projects/categories";
import { FeaturedSpotlight } from "@/features/projects/components/featured-spotlight";
import { getCommunityCounts } from "@/features/projects/services/queries";
import { SITE_NAME } from "@/lib/config/site";

export const revalidate = 60;

export const metadata: Metadata = {
  title: `${SITE_NAME} · Build it. Share it. Level up!`,
  description:
    "A place for young makers to share robotics, coding and electronics projects, try featured builds and earn builder points.",
};

export default async function LandingPage() {
  const [counts, pointValues] = await Promise.all([getCommunityCounts(), getPointValues()]);

  return (
    <div className="min-h-full bg-background">
      <a
        href="#main"
        className="sr-only z-[60] rounded-md bg-brand-yellow px-3 py-2 font-bold text-brand-navy focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <LandingHeader />

      <main id="main">
        <HeroSection counts={counts} pointValues={pointValues} />
        <Marquee items={projectCategory.enumValues.map((value) => CATEGORY_LABELS[value])} />
        <HowItWorksSection />

        {/* Same spotlight kids see on their dashboard */}
        <div className="border-b-2 border-edge bg-brand-yellow/10 py-16 sm:py-20 dark:bg-card">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <FeaturedSpotlight className="scroll-mt-24" />
          </div>
        </div>

        <CategoriesSection />
        <LevelsSection pointValues={pointValues} />
        <SafetySection />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}
