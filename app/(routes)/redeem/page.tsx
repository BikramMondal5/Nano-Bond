
import { RedemptionCard } from "@/components/redemption-card"
import { RedemptionSummary } from "@/components/redemption-summary"
import { RedemptionRules } from "@/components/redemption-rules"


export default function RedeemPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="space-y-4">


          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight italic font-serif">
              Redeem Your GBOND
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Exchange your GBOND tokens for USDT once the bond reaches maturity. Safe, instant, and transparent.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Core Action Zone */}
          <div className="lg:col-span-7">
            <RedemptionCard />
          </div>

          {/* Supplemental Info */}
          <div className="lg:col-span-5 space-y-8">
            <RedemptionSummary />
            <RedemptionRules />
          </div>
        </div>
      </div>
    </div>



  )
}
