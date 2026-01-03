
import { VerificationHeader } from "@/components/verification-header"
import { CoreVerificationPanel } from "@/components/core-verification-panel"
import { VerificationMetadata } from "@/components/verification-metadata"
import { VerificationGuide } from "@/components/verification-guide"
import { TrustNotes } from "@/components/trust-notes"

export default function VerificationPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <VerificationHeader />
      <div className="mt-12 space-y-16">
        <CoreVerificationPanel />
        <VerificationMetadata />
        <VerificationGuide />
        <TrustNotes />
      </div>
    </div>

  )
}
