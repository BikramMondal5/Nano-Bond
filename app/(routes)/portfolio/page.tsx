"use client"

import { useState, useEffect } from "react"
import { usePortfolioData } from "@/hooks/usePortfolioData"
import { PortfolioHero } from "@/components/portfolio-hero"
import { PortfolioChart } from "@/components/portfolio-chart"
import { BondBreakdown } from "@/components/bond-breakdown"
import { RecentActivity } from "@/components/recent-activity"
import { QuickActions } from "@/components/quick-actions"
import { BondSelector, BondOption } from "@/components/bond-selector" // Reusing the selector
import type { IBond } from "@/lib/models/Bond"
import { Loader2 } from "lucide-react"

export default function PortfolioPage() {
  const { address } = usePortfolioData()
  const [bonds, setBonds] = useState<IBond[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBondId, setSelectedBondId] = useState<string>("")

  useEffect(() => {
    if (address) {
      console.log("Logged In User Wallet Address:", address)
    }
  }, [address])

  useEffect(() => {
    const fetchBonds = async () => {
      try {
        const res = await fetch('/api/bonds')
        if (!res.ok) throw new Error('Failed to fetch bonds')
        const data = await res.json()
        setBonds(data)
        if (data.length > 0) {
          // Default to first bond if none selected
          setSelectedBondId(data[0].bondId)
        }
      } catch (error) {
        console.error("Failed to load bonds:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchBonds()
  }, [])

  const selectedBond = bonds.find(b => b.bondId === selectedBondId)

  const bondOptions: BondOption[] = bonds.map(b => ({
    bondId: b.bondId,
    bondName: b.bondName,
    description: b.description
  }))

  return (
    <main className="container mx-auto px-4 pt-8 pb-20 space-y-8">
      {/* Header with Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Portfolio</h1>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading bonds...</span>
          </div>
        ) : (
          <BondSelector
            bonds={bondOptions}
            selectedBondId={selectedBondId}
            onSelect={setSelectedBondId}
          />
        )}
      </div>

      {/* Pass selected bond to Hero for dynamic data */}
      <PortfolioHero bond={selectedBond} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PortfolioChart />
          {/* We might want to pass all bonds to breakdown to show list, or just selected? 
              For now keeping it as is or passing bonds if intended to be dynamic list. 
              Request was to "fetch token holded for particular bonds" which is covered by Hero + Selector.
          */}
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
