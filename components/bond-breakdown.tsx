import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowUpRight, ShieldCheck } from "lucide-react"

export function BondBreakdown() {
  const bonds = [
    {
      name: "US Treasury Bill – 365D",
      gbond: "9,500",
      usdt: "10,350",
      yield: "650",
      maturity: "145 Days",
      progress: 65,
    },
    {
      name: "T-Bond Series A-2025",
      gbond: "1,200",
      usdt: "1,245",
      yield: "45",
      maturity: "12 Days",
      progress: 95,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-[#E5E7EB]">Bond Breakdown</h3>
        <span className="text-xs text-[#6B7280] font-medium uppercase tracking-widest">
          Active Holdings ({bonds.length})
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
                    <p className="text-[10px] text-[#6B7280] uppercase font-bold mb-1">GBOND Balance</p>
                    <p className="font-bold text-white">{bond.gbond}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6B7280] uppercase font-bold mb-1">Value (USDT)</p>
                    <p className="font-bold text-white">{bond.usdt}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6B7280] uppercase font-bold mb-1">Yield Earned</p>
                    <p className="font-bold text-primary">+{bond.yield} USDT</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6B7280] uppercase font-bold mb-1">Maturity</p>
                    <p className="font-bold text-[#9CA3AF]">{bond.maturity}</p>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-48 space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-[#6B7280]">Progress</span>
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
