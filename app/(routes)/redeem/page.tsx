import { Suspense } from "react"
import RedeemPageContent from "@/components/redeem/redeem-page-content"
import { Loader2 } from "lucide-react"

export default function RedeemPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <RedeemPageContent />
    </Suspense>
  )
}

