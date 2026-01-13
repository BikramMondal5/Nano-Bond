"use client"

import { Card } from "@/components/ui/card"
import { useContentTranslation } from "@/hooks/useContentTranslation"

interface BondStatsProps {
  currentPrice: number
  totalSupply: string
  totalVault: string
  yieldRate: string
  maturityDays: number
}

export function BondStats({ currentPrice, totalSupply, totalVault, yieldRate, maturityDays }: BondStatsProps) {
  const content = useContentTranslation({
    lbl_price: "Price per GBOND",
    lbl_supply: "Total Supply",
    lbl_vault: "USDT in Vault",
    lbl_yield: "Yield Rate",
    lbl_days: "Days to Maturity"
  })

  const stats = [
    { label: content.lbl_price, value: `${currentPrice} USDT` },
    { label: content.lbl_supply, value: `${totalSupply} GBOND` },
    { label: content.lbl_vault, value: `${totalVault} USDT` },
    { label: content.lbl_yield, value: yieldRate, highlight: true },
    { label: content.lbl_days, value: maturityDays.toString() },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="bg-[#100F14] border-white/5 p-4 flex flex-col gap-2 relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-[#6B7280] text-xs font-medium uppercase tracking-wider">{stat.label}</span>
          <span className={`text-xl md:text-2xl font-bold ${stat.highlight ? "text-primary" : "text-[#E5E7EB]"}`}>
            {stat.value}
          </span>
          <div className="absolute bottom-0 left-0 h-0.5 bg-primary/20 w-0 group-hover:w-full transition-all duration-500" />
        </Card>
      ))}
    </div>
  )
}
