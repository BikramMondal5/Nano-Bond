"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowUpRight, ShieldCheck } from "lucide-react"
import { useContentTranslation } from "@/hooks/useContentTranslation"

export function BondBreakdown() {
  const content = useContentTranslation({
    title: "Bond Breakdown",
    active_holdings: "Active Holdings",
    lbl_gbond_bal: "GBOND Balance",
    lbl_value_usdt: "Value (USDT)",
    lbl_yield_earned: "Yield Earned",
    lbl_maturity: "Maturity",
    lbl_progress: "Progress",
    unit_days: "Days"
  })

  const bonds = [
    {
      name: "US Treasury Bill – 365D",
      gbond: "9,500",
      usdt: "10,350",
      yield: "650",
      maturity: `145 ${content.unit_days}`,
      progress: 65,
    },
    {
      name: "T-Bond Series A-2025",
      gbond: "1,200",
      usdt: "1,245",
      yield: "45",
      maturity: `12 ${content.unit_days}`,
      progress: 95,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-[#E5E7EB]">{content.title}</h3>
        <span className="text-xs text-[#6B7280] font-medium uppercase tracking-widest">
          {content.active_holdings} ({bonds.length})
        </span>
      </div>

      <div className="grid gap-4">
        {bonds.map((bond, i) => (
          <Card key={i} className="bg-[#100F14] border-white/5 p-6 hover:border-primary/20 transition-all group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-lg text-[#E5E7EB]">{bond.name}</h4>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] text-[#6B7280] uppercase font-bold mb-1">{content.lbl_gbond_bal}</p>
                    <p className="font-bold text-white">{bond.gbond}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6B7280] uppercase font-bold mb-1">{content.lbl_value_usdt}</p>
                    <p className="font-bold text-white">{bond.usdt}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6B7280] uppercase font-bold mb-1">{content.lbl_yield_earned}</p>
                    <p className="font-bold text-primary">+{bond.yield} USDT</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6B7280] uppercase font-bold mb-1">{content.lbl_maturity}</p>
                    <p className="font-bold text-[#9CA3AF]">{bond.maturity}</p>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-48 space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-[#6B7280]">{content.lbl_progress}</span>
                  <span className="text-primary">{bond.progress}%</span>
                </div>
                <Progress value={bond.progress} className="h-1.5 bg-white/5" indicatorClassName="bg-primary" />
              </div>

              <div className="flex items-center">
                <button className="p-3 rounded-xl bg-white/5 hover:bg-primary transition-all group/btn">
                  <ArrowUpRight className="w-5 h-5 text-[#6B7280] group-hover/btn:text-white" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
