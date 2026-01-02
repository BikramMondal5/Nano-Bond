import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { VerificationHeader } from "@/components/verification-header"
import { CoreVerificationPanel } from "@/components/core-verification-panel"
import { VerificationMetadata } from "@/components/verification-metadata"
import { VerificationGuide } from "@/components/verification-guide"
import { TrustNotes } from "@/components/trust-notes"

export default function VerificationPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <VerificationHeader />
          <div className="mt-12 space-y-16">
            <CoreVerificationPanel />
            <VerificationMetadata />
            <VerificationGuide />
            <TrustNotes />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
