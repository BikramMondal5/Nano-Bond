"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ArrowDownCircle, Info } from "lucide-react"
import { useContentTranslation } from "@/hooks/useContentTranslation"

export function SponsorActions() {
  const content = useContentTranslation({
    title: "Manage Stakes",
    btn_add_funds: "Add More Funds",
    btn_withdraw: "Withdraw Rewards",
    btn_details: "View Fee Split Details"
  })

  return (
    <Card className="bg-[#100F14] border-white/5">
      <CardHeader>
        <CardTitle className="text-[#E5E7EB] text-lg font-bold">{content.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-bold shadow-[0_0_20px_rgba(253,140,0,0.2)] hover:shadow-[0_0_25px_rgba(253,140,0,0.3)] transition-all">
          <Plus className="w-5 h-5 mr-2" />
          {content.btn_add_funds}
        </Button>
        <Button
          variant="outline"
          className="w-full border-primary/20 hover:border-primary/50 text-primary hover:bg-primary/5 h-12 text-base font-bold bg-transparent"
        >
          <ArrowDownCircle className="w-5 h-5 mr-2" />
          {content.btn_withdraw}
        </Button>
        <Button variant="ghost" className="w-full text-[#9CA3AF] hover:text-white hover:bg-white/5 h-10 text-sm">
          <Info className="w-4 h-4 mr-2" />
          {content.btn_details}
        </Button>
      </CardContent>
    </Card>
  )
}
