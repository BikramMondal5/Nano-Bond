import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Award, PieChart, Landmark } from "lucide-react"

const metrics = [
  {
    label: "Total Sponsored Value",
    value: "13,500 USDT",
    icon: Landmark,
    trend: "+12.5%",
  },
  {
    label: "Total Rewards Earned",
    value: "1,350 USDT",
    icon: Award,
    trend: "+8.2%",
  },
  {
    label: "Current Share %",
    value: "5.4%",
    icon: PieChart,
    trend: "Stable",
  },
  {
    label: "Fee Split Ratio",
    value: "10% / 90%",
    icon: TrendingUp,
    subtext: "Sponsor / Investors",
  },
]

export function SponsorOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {metrics.map((metric, i) => (
        <Card
          key={i}
          className="bg-[#100F14] border-white/5 relative overflow-hidden group hover:border-primary/30 transition-all"
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <metric.icon className="w-5 h-5" />
              </div>
              {metric.trend && (
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    metric.trend.startsWith("+") ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {metric.trend}
                </span>
              )}
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">{metric.label}</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">{metric.value}</h3>
              {metric.subtext && (
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{metric.subtext}</p>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
