import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { TrustStrip } from "@/components/trust-strip"
import { ValuePropositionCards } from "@/components/value-proposition-cards"
import { HowItWorks } from "@/components/how-it-works"
import { RoadmapSection } from "@/components/roadmap-section"
import { StatsSection } from "@/components/stats-section"
import { FaqSection } from "@/components/faq-section"
import { CtaBanner } from "@/components/cta-banner"
import { PricingSection } from "@/components/pricing-section"
import TestimonialCarousel from "@/components/testimonial-carousel"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      <HeroSection />
      <TrustStrip />
      <ValuePropositionCards />
      <HowItWorks />
      <RoadmapSection />
      <StatsSection />
      <PricingSection />
      <TestimonialCarousel />
      <FaqSection />
      <CtaBanner />
    </main>
  )
}
