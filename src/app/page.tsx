import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { DemoCta } from "@/components/landing/demo-cta";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <LandingHeader />

      <main className="flex flex-1 flex-col items-center px-6 py-16 md:py-24">
        <HeroSection />
        <FeatureGrid />
        <DemoCta />
      </main>

      <footer className="text-muted-foreground border-t px-6 py-6 text-center text-sm">
        GitHub Monitor — connects via a GitHub App, never stores your
        password on GitHub&apos;s behalf.
      </footer>
    </div>
  );
}
