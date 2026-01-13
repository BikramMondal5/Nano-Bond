"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, History, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useContentTranslation } from "@/hooks/useContentTranslation"

export function QuickActions() {
  const content = useContentTranslation({
    title: "Quick Actions",
    invest_more: "Invest More",
    view_reports: "View Reports",
    redeem: "Redeem Matured",
    kyc_status: "KYC Status",
    verified: "Verified & Ready"
  })

  return (
    <Card className="bg-[#100F14] border-white/5 p-6 space-y-4">
      <h3 className="text-lg font-bold text-[#E5E7EB]">{content.title}</h3>

      <div className="grid gap-3">
        <Link href="/invest" className="w-full">
          <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-[0_0_20px_rgba(253,140,0,0.2)]">
            <Plus className="w-4 h-4 mr-2" />
            {content.invest_more}
          </Button>
        </Link>

        <Link href="/bond/us-treasury" className="w-full">
          <Button
            variant="outline"
            className="w-full border-white/10 hover:bg-white/5 text-[#E5E7EB] font-bold h-12 bg-transparent"
          >
            <History className="w-4 h-4 mr-2" />
            {content.view_reports}
          </Button>
        </Link>

        <Link href="/redeem" className="w-full">
          <Button variant="ghost" className="w-full text-primary hover:text-primary hover:bg-primary/5 font-bold h-12">
            <ExternalLink className="w-4 h-4 mr-2" />
            {content.redeem}
          </Button>
        </Link>
      </div>

      <div className="pt-2">
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">{content.kyc_status}</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-white">{content.verified}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
