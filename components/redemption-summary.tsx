"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Info } from "lucide-react"
import { useContentTranslation } from "@/hooks/useContentTranslation"

export function RedemptionSummary() {
  const content = useContentTranslation({
    title: "Redemption Summary",
    price_gbond: "Price per GBOND",
    platform_fee: "Platform Fee",
    process_time: "Processing Time",
    process_time_val: "Instant",
    final_amount: "Final Amount",
    info_msg: "Funds will be deposited directly to your connected wallet upon confirmation."
  })

  return (
    <Card className="bg-[#100F14] border-white/5 overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          {content.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{content.price_gbond}</span>
            <span className="text-white font-medium">1.12 USDT</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{content.platform_fee}</span>
            <span className="text-white font-medium">0.00 USDT</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{content.process_time}</span>
            <span className="text-white font-medium">{content.process_time_val}</span>
          </div>
          <div className="pt-3 border-t border-white/5 flex justify-between items-end">
            <span className="text-sm font-semibold text-white">{content.final_amount}</span>
            <div className="text-right">
              <span className="text-xl font-bold text-primary block">--- USDT</span>
            </div>
          </div>
        </div>
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
          <p className="text-[11px] text-primary leading-relaxed uppercase font-bold tracking-wider">
            {content.info_msg}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
