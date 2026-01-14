"use client"

import { Card } from "@/components/ui/card"
import { useRecentActivity } from "@/hooks/useRecentActivity"
import { Loader2, ExternalLink } from "lucide-react"
import { useContentTranslation } from "@/hooks/useContentTranslation"

export function RecentActivity() {
  const content = useContentTranslation({
    recent_activity: "Recent Activity",
    loading: "Loading history...",
    no_activity: "No recent activity found.",
    no_activity_sub: "Your buys and redemptions will appear here.",
    view_explorer: "View on Explorer"
  })

  const { activities, isLoading } = useRecentActivity()

  return (
    <Card className="bg-[#100F14] border-white/5 p-6 h-[400px] flex flex-col">
      <h3 className="text-lg font-bold text-[#E5E7EB] mb-6">{content.recent_activity}</h3>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">{content.loading}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-2 text-center">
            <p className="text-sm text-muted-foreground">{content.no_activity}</p>
            <p className="text-xs text-[#6B7280]">{content.no_activity_sub}</p>
          </div>
        ) : (
          activities.map((activity, i) => (
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
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-[#6B7280] uppercase tracking-wide font-medium">{activity.sub}</p>
                  {activity.txHash && (
                    <a
                      href={`https://explorer.sepolia.mantle.xyz/tx/${activity.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      title={content.view_explorer}
                    >
                      <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
