import { Card } from "@/components/ui/card"
import { ShoppingCart, RefreshCw, CheckCircle2 } from "lucide-react"

export function RecentActivity() {
  const activities = [
    {
      type: "Bought GBOND",
      amount: "+1,200 GBOND",
      sub: "1,195 USDT",
      time: "2 hours ago",
      icon: ShoppingCart,
      color: "text-primary",
    },
    {
      type: "Yield Added",
      amount: "+12.45 USDT",
      sub: "Auto-compounding",
      time: "12 hours ago",
      icon: RefreshCw,
      color: "text-green-500",
    },
    {
      type: "Redemption Processed",
      amount: "-500 GBOND",
      sub: "502 USDT",
      time: "2 days ago",
      icon: CheckCircle2,
      color: "text-[#9CA3AF]",
    },
  ]

  return (
    <Card className="bg-[#100F14] border-white/5 p-6">
      <h3 className="text-lg font-bold text-[#E5E7EB] mb-6">Recent Activity</h3>
      <div className="space-y-6">
        {activities.map((activity, i) => (
          <div key={i} className="flex gap-4 group">
            <div className={`p-2 rounded-lg bg-white/5 h-fit ${activity.color}`}>
              <activity.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-bold text-[#E5E7EB]">{activity.type}</h4>
                <span className="text-[10px] text-[#6B7280] font-medium">{activity.time}</span>
              </div>
              <p className={`text-sm font-bold ${activity.color}`}>{activity.amount}</p>
              <p className="text-[10px] text-[#6B7280] uppercase tracking-wide font-medium">{activity.sub}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-6 py-2 text-xs font-bold text-[#6B7280] hover:text-primary transition-colors border-t border-white/5">
        View All History
      </button>
    </Card>
  )
}
