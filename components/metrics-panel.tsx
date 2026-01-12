import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, Calendar, BarChart3, Receipt } from "lucide-react"
import type { IBond } from "@/lib/models/Bond"

interface MetricsPanelProps {
  bond: IBond;
}

export function MetricsPanel({ bond }: MetricsPanelProps) {
  // Calculate days to maturity
  const today = new Date();
  const maturity = new Date(bond.maturityDate);
  const diffTime = Math.abs(maturity.getTime() - today.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const metrics = [
    {
      label: "Coupon Rate",
      value: `${bond.couponRate}%`,
      subValue: "Annual Yield",
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      label: "Min Investment",
      value: `${bond.minInvestment} USDT`,
      subValue: "Low Barrier to Entry",
      icon: Receipt,
      color: "text-blue-500",
    },
    {
      label: "Days to Maturity",
      value: `${diffDays} Days`,
      subValue: `Matures ${maturity.toLocaleDateString()}`,
      icon: Calendar,
      color: "text-orange-500",
    },
    {
      label: "Bond ID",
      value: bond.bondId,
      subValue: "Government Security",
      icon: BarChart3,
      color: "text-purple-500",
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
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-primary/10 transition-colors">
              <metric.icon className={`w-5 h-5 ${metric.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{metric.label}</p>
              <h4 className="text-lg font-bold text-white transition-all group-hover:text-primary">{metric.value}</h4>
              <p className="text-[11px] text-muted-foreground/60">{metric.subValue}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

