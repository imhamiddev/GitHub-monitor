import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { HeroPreview } from "@/components/landing/hero-preview";
import { FeatureGrid } from "@/components/landing/feature-grid";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <LandingHeader />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-24 px-6 py-16 md:py-24">
        <section className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
          <HeroSection />
          <HeroPreview />
        </section>
        <FeatureGrid />
      </main>

      <footer className="text-muted-foreground border-t px-6 py-6 text-center text-sm">
        GitHub Monitor connects through a GitHub App and never asks for your GitHub password
      </footer>
    </div>
  );
}
