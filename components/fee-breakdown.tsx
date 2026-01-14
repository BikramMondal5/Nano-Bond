"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { useContentTranslation } from "@/hooks/useContentTranslation"

export function FeeBreakdown() {
  const content = useContentTranslation({
    title: "Fee Logic Explained",
    fee_1_highlight: "10% Protocol Fee",
    fee_1_text: "goes directly to the SponsorVault as rewards for liquidity providers.",
    fee_2_highlight: "90% Yield",
    fee_2_text: "is distributed among bond holders at the time of maturity.",
    fee_3_text_pre: "Rewards are calculated based on your",
    fee_3_highlight: "pro-rata share",
    fee_3_text_post: "of the total sponsored value."
  })

  return (
    <Card className="bg-[#100F14] border-white/5">
      <CardHeader>
        <CardTitle className="text-[#E5E7EB] text-lg font-bold">{content.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              <span className="text-white font-medium">{content.fee_1_highlight}</span> {content.fee_1_text}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              <span className="text-white font-medium">{content.fee_2_highlight}</span> {content.fee_2_text}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              {content.fee_3_text_pre} <span className="text-white font-medium">{content.fee_3_highlight}</span> {content.fee_3_text_post}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
