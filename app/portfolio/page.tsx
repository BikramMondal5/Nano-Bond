import { PortfolioHero } from "@/components/portfolio-hero"
import { PortfolioChart } from "@/components/portfolio-chart"
import { BondBreakdown } from "@/components/bond-breakdown"
import { RecentActivity } from "@/components/recent-activity"
import { QuickActions } from "@/components/quick-actions"

export default function PortfolioPage() {
  return (
    <main className="container mx-auto px-4 pt-8 pb-20 space-y-8">
      <PortfolioHero />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PortfolioChart />
          <BondBreakdown />
        </div>
        <div className="space-y-8">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
    </main>
  )
}
