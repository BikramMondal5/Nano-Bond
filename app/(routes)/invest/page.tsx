
import { InvestmentCard } from "@/components/investment-card"
import { MetricsPanel } from "@/components/metrics-panel"
import { InvestmentRules } from "@/components/investment-rules"


export default function InvestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Breadcrumbs & Header */}
        <div className="space-y-4">


          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Invest in GBOND Tokens</h1>
            <p className="text-lg text-muted-foreground">
              Buy fractional Government Bonds using USDT with instant settlement.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Core Action Zone */}
          <div className="lg:col-span-7">
            <InvestmentCard />
          </div>

          {/* Supplemental Info */}
          <div className="lg:col-span-5 space-y-8">
            <MetricsPanel />

          </div>
        </div>
        <InvestmentRules />
      </div>
    </div>
  )
}
