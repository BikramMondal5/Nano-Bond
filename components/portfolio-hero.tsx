import { Card } from "@/components/ui/card"
import { TrendingUp, Wallet, Clock, Coins } from "lucide-react"

export function PortfolioHero() {
  const stats = [
    {
      label: "Total Portfolio Value",
      value: "10,500 USDT",
      icon: TrendingUp,
      trend: "+12.5%",
      highlight: true,
    },
    {
      label: "Total GBOND Balance",
      value: "9,500 GBOND",
      icon: Wallet,
    },
    {
      label: "Unrealized Yield",
      value: "+ 650 USDT",
      icon: Coins,
      color: "text-primary",
    },
    {
      label: "Days to Maturity",
      value: "145 Days",
      icon: Clock,
      sub: "Nearest Bond",
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
            <p className="text-sm text-[#9CA3AF] font-medium">{stat.label}</p>
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
