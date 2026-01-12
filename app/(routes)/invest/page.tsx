
"use client"

import { useState, useEffect } from "react"
import { InvestmentCard } from "@/components/investment-card"
import { MetricsPanel } from "@/components/metrics-panel"
import { InvestmentRules } from "@/components/investment-rules"
import { BondSelector, BondOption } from "@/components/bond-selector"
import { Loader2 } from "lucide-react"
import type { IBond } from "@/lib/models/Bond"

export default function InvestPage() {
  const [bonds, setBonds] = useState<IBond[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBondId, setSelectedBondId] = useState<string>("")

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

  const selectedBond = bonds.find(b => b.bondId === selectedBondId) || bonds[0]

  const bondOptions: BondOption[] = bonds.map(b => ({
    bondId: b.bondId,
    bondName: b.bondName,
    description: b.description
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header & Selector */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Invest in Government Bonds</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Purchase fractional bonds with instant settlement and zero gas fees.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-muted-foreground">Select Bond Product</span>
            <BondSelector
              bonds={bondOptions}
              selectedBondId={selectedBondId}
              onSelect={setSelectedBondId}
              loading={loading}
            />
          </div>
        </div>

        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : !selectedBond ? (
          <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground border border-dashed border-white/10 rounded-xl">
            <p>No bonds available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Core Action Zone */}
            <div className="lg:col-span-7">
              <InvestmentCard bond={selectedBond} />
            </div>

            {/* Supplemental Info */}
            <div className="lg:col-span-5 space-y-8">
              <MetricsPanel bond={selectedBond} />
            </div>
          </div>
        )}

        <InvestmentRules />
      </div>
    </div>
  )
}

