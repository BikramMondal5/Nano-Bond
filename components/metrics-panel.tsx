import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, Calendar, BarChart3 } from "lucide-react"

export function MetricsPanel() {
  const metrics = [
    {
      label: "Live Price",
      value: "1.08 USDT",
      subValue: "+2.4% last 7d",
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      label: "Vault Liquidity",
      value: "$42.5M",
      subValue: "Total Value Locked",
      icon: BarChart3,
      color: "text-primary",
    },
    {
      label: "Days to Maturity",
      value: "187 Days",
      subValue: "Expected Aug 2026",
      icon: Calendar,
      color: "text-primary",
    },
    {
      label: "Active Investors",
      value: "1,248",
      subValue: "On-chain holders",
      icon: Users,
      color: "text-primary",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
      {metrics.map((metric, idx) => (
        <Card
          key={idx}
          className="bg-[#100F14] border-white/5 overflow-hidden group hover:border-primary/20 transition-all"
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:bg-primary/10 transition-colors">
              <metric.icon className={`w-5 h-5 ${metric.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{metric.label}</p>
              <h4 className="text-lg font-bold text-white">{metric.value}</h4>
              <p className="text-[11px] text-muted-foreground/60">{metric.subValue}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
