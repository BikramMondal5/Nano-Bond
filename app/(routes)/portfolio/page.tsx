import { PortfolioHero } from "@/components/portfolio-hero"
import { PortfolioChart } from "@/components/portfolio-chart"
import { BondBreakdown } from "@/components/bond-breakdown"
import { RecentActivity } from "@/components/recent-activity"
import { QuickActions } from "@/components/quick-actions"

import { MyBondsDropdown } from "@/components/my-bonds-dropdown"

export default function PortfolioPage() {
  return (
    <main className="container mx-auto px-4 pt-8 pb-20 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Portfolio</h1>
        <MyBondsDropdown />
      </div>
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
