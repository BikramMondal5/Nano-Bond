"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, Wallet, Clock, Coins, RefreshCw, Info } from "lucide-react"
import { usePortfolioData } from "@/hooks/usePortfolioData"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import type { IBond } from "@/lib/models/Bond"
import { useBondStats } from "@/hooks/useStats"
import { useContentTranslation } from "@/hooks/useContentTranslation"

interface PortfolioHeroProps {
  bond?: IBond;
}

export function PortfolioHero({ bond }: PortfolioHeroProps) {
  const content = useContentTranslation({
    total_val: "Total Portfolio Value",
    total_bal: "Total GBOND Balance",
    int_rate: "Interest Rate",
    days_maturity: "Days to Maturity",
    annual_yield: "Annualized Yield",
    current_bond: "Current Bond",
    select_bond: "Select Bond",
    refresh: "Refresh"
  })

  // Pass dynamic addresses if bond is selected
  const { balance, claimable, isLoading, refetch } = usePortfolioData(bond?.contractAddress, bond?.distributorAddress)
  const { maturityDate } = useBondStats(bond?.contractAddress)

  // Fixed Annualized Yield from Bond Terms (fallback to 8.5% if not present)
  const INTEREST_RATE = bond?.couponRate ? (bond.couponRate / 100) : 0.085

  // Calculate "Total Portfolio Value" = Balance + (Balance * Rate)
  const numericBalance = Number(balance || 0)
  const projectedYield = numericBalance * INTEREST_RATE
  const totalValue = (numericBalance + projectedYield).toLocaleString(undefined, { maximumFractionDigits: 2 })

  // Calculate days to maturity for display
  const maturityDisplay = maturityDate
    ? Math.ceil((Number(maturityDate) * 1000 - Date.now()) / (1000 * 60 * 60 * 24)) + " Days"
    : bond?.maturityDate
      ? Math.ceil((new Date(bond.maturityDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) + " Days"
      : "---"

  const stats = [
    {
      label: content.total_val,
      value: isLoading ? "..." : `$${totalValue} USDT`,
      icon: TrendingUp,
      trend: `+${(INTEREST_RATE * 100).toFixed(2)}% APY`,
      highlight: true,
    },
    {
      label: content.total_bal,
      value: isLoading ? "..." : `${numericBalance.toLocaleString()} GBOND`,
      icon: Wallet,
      action: refetch,
      debug: `Bond: ${bond?.bondName || 'All'}`
    },
    {
      label: content.int_rate,
      value: `${(INTEREST_RATE * 100).toFixed(2)}%`,
      icon: Coins,
      color: "text-primary",
      sub: content.annual_yield,
    },
    {
      label: content.days_maturity,
      value: maturityDisplay,
      icon: Clock,
      sub: bond ? content.current_bond : content.select_bond,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="bg-[#100F14] border-white/5 p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-white/5">
              <stat.icon className="w-5 h-5 text-primary" />
            </div>
            {stat.trend && (
              <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                {stat.trend}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm text-[#9CA3AF] font-medium flex items-center gap-2">
              {stat.action && (
                <>
                  <button
                    onClick={stat.action}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    title={content.refresh}
                  >
                    <RefreshCw className="w-3 h-3 text-muted-foreground" />
                  </button>
                </>
              )}
            </p>
            <h3
              className={`text-2xl font-bold tracking-tight ${stat.highlight ? "text-white" : stat.color || "text-[#E5E7EB]"}`}
            >
              {stat.value}
            </h3>
            {stat.sub && <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-bold">{stat.sub}</p>}
          </div>

          <div className="absolute bottom-0 left-0 h-[2px] bg-primary/20 w-0 group-hover:w-full transition-all duration-500" />
        </Card>
      ))}
    </div>
  )
}
