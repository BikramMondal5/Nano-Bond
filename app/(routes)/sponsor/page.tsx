
import { SponsorOverview } from "@/components/sponsor-overview"
import { RewardsChart } from "@/components/rewards-chart"
import { ContributionsTable } from "@/components/contributions-table"
import { SponsorActions } from "@/components/sponsor-actions"
import { FeeBreakdown } from "@/components/fee-breakdown"

export default function SponsorPage() {
  return (
    <div className="container mx-auto px-4 pt-8 pb-20">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Sponsor Dashboard</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Track your contributions, rewards, and performance in the SponsorVault.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <SponsorOverview />
          <RewardsChart />
          <ContributionsTable />
        </div>

        <aside className="space-y-8">
          <SponsorActions />
          <FeeBreakdown />
        </aside>
      </div>
    </div>
  )
}
