import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { BondHero } from "@/components/bond-hero"
import { BondStats } from "@/components/bond-stats"
import { YieldChart } from "@/components/yield-chart"
import { ActionPanel } from "@/components/action-panel"
import { AssetVerification } from "@/components/asset-verification"
import { BondDetailedInfo } from "@/components/bond-detailed-info"

export default async function BondDetailsPage({
  params,
}: {
  params: Promise<{ bondId: string }>
}) {
  const { bondId } = await params

  // In a real app, we would fetch bond data here based on bondId
  const bondData = {
    id: bondId,
    name: "US Treasury Bill – 365 Days",
    status: "verified",
    yieldRate: "8.50%",
    maturityDays: 187,
    currentPrice: 1.1,
    totalSupply: "125,000",
    totalVault: "137,500",
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-foreground">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12 lg:pt-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            <BondHero
              name={bondData.name}
              status={bondData.status}
              yieldRate={bondData.yieldRate}
              maturityDays={bondData.maturityDays}
            />

            <BondStats
              currentPrice={bondData.currentPrice}
              totalSupply={bondData.totalSupply}
              totalVault={bondData.totalVault}
              yieldRate={bondData.yieldRate}
              maturityDays={bondData.maturityDays}
            />

            <YieldChart />

            <AssetVerification />

            <BondDetailedInfo />
          </div>

          {/* Sidebar / Action Panel */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <ActionPanel bondStatus={bondData.status} />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
