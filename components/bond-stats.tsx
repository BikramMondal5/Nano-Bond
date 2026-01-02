import { Card } from "@/components/ui/card"

interface BondStatsProps {
  currentPrice: number
  totalSupply: string
  totalVault: string
  yieldRate: string
  maturityDays: number
}

export function BondStats({ currentPrice, totalSupply, totalVault, yieldRate, maturityDays }: BondStatsProps) {
  const stats = [
    { label: "Price per GBOND", value: `${currentPrice} USDT` },
    { label: "Total Supply", value: `${totalSupply} GBOND` },
    { label: "USDT in Vault", value: `${totalVault} USDT` },
    { label: "Yield Rate", value: yieldRate, highlight: true },
    { label: "Days to Maturity", value: maturityDays.toString() },
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
