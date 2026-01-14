"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, Calendar, BarChart3, Receipt } from "lucide-react"
import type { IBond } from "@/lib/models/Bond"
import { useContentTranslation } from "@/hooks/useContentTranslation"

interface MetricsPanelProps {
  bond: IBond;
}

export function MetricsPanel({ bond }: MetricsPanelProps) {
  const content = useContentTranslation({
    lbl_coupon: "Coupon Rate",
    sub_coupon: "Annual Yield",
    lbl_min_invest: "Min Investment",
    sub_min_invest: "Low Barrier to Entry",
    lbl_days: "Days to Maturity",
    sub_days_prefix: "Matures",
    lbl_bond_id: "Bond ID",
    sub_bond_id: "Government Security",
    unit_days: "Days"
  })

  // Calculate days to maturity
  const today = new Date();
  const maturity = new Date(bond.maturityDate);
  const diffTime = Math.abs(maturity.getTime() - today.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const metrics = [
    {
      label: content.lbl_coupon,
      value: `${bond.couponRate}%`,
      subValue: content.sub_coupon,
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      label: content.lbl_min_invest,
      value: `${bond.minInvestment} USDT`,
      subValue: content.sub_min_invest,
      icon: Receipt,
      color: "text-blue-500",
    },
    {
      label: content.lbl_days,
      value: `${diffDays} ${content.unit_days}`,
      subValue: `${content.sub_days_prefix} ${maturity.toLocaleDateString()}`,
      icon: Calendar,
      color: "text-orange-500",
    },
    {
      label: content.lbl_bond_id,
      value: bond.bondId,
      subValue: content.sub_bond_id,
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

