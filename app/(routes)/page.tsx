import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { ValuePropositionCards } from "@/components/value-proposition-cards"
import { EcosystemSection } from "@/components/ecosystem-section"
import { HowItWorks } from "@/components/how-it-works"
import { RoadmapSection } from "@/components/roadmap-section"
import { StatsSection } from "@/components/stats-section"
import { FaqSection } from "@/components/faq-section"
import { CtaBanner } from "@/components/cta-banner"
import { PricingSection } from "@/components/pricing-section"
import TestimonialCarousel from "@/components/testimonial-carousel"
import { MobileAppSection } from "@/components/mobile-app-section"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      <HeroSection />
      <div className="hidden md:block">
        <EcosystemSection />
      </div>
      <ValuePropositionCards />
      <MobileAppSection />
      <HowItWorks />
      {/* <RoadmapSection /> */}
      {/* <StatsSection /> */}
      {/* <PricingSection /> */}
      <FaqSection />
      <TestimonialCarousel />
      <div className="hidden md:block">
        <CtaBanner />
      </div>
    </main>
  )
}
